import { productRepository } from '../repositories/index.js';
import { AppError, PRODUCT_STATUS } from '../utils/index.js';
import { config } from '../config/index.js';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models';

// Gemini retires models often; fall back automatically so a decommissioned or
// throttled model never takes the whole assistant down.
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest'];

// Words that add no search value when matching a customer's message to products.
const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'you',
  'your',
  'our',
  'have',
  'has',
  'with',
  'what',
  'which',
  'this',
  'that',
  'does',
  'do',
  'is',
  'it',
  'its',
  'can',
  'could',
  'would',
  'about',
  'any',
  'some',
  'give',
  'show',
  'tell',
  'want',
  'need',
  'please',
  'price',
  'stock',
  'available',
  'availability',
  'much',
  'cost',
  'there',
  'how',
  'when',
  'where',
  'buy',
  'sell',
  'product',
  'products',
  'item',
  'items',
]);

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Turn a free-text question into a small set of search keywords.
const extractKeywords = text => {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOPWORDS.has(word));

  return [...new Set(words)].slice(0, 8);
};

const extractImage = product => {
  const first = Array.isArray(product.images) ? product.images[0] : null;

  if (first && typeof first === 'object') return first.url || '';
  if (typeof first === 'string') return first;

  if (product.thumbnail) {
    return typeof product.thumbnail === 'object'
      ? product.thumbnail.url || ''
      : product.thumbnail;
  }

  return product.image || '';
};

const formatPrice = value => `৳${Number(value || 0).toLocaleString('en-US')}`;

/**
 * Fetch the products that actually match the customer's question directly from
 * the database. This is the ONLY product data the model is allowed to use, which
 * is how we prevent hallucinated prices / stock.
 */
export const findRelevantProducts = async (message, limit = 5) => {
  const keywords = extractKeywords(message);
  if (keywords.length === 0) return [];

  const regexes = keywords.map(keyword => new RegExp(escapeRegex(keyword), 'i'));

  return await productRepository.find(
    {
      status: PRODUCT_STATUS.ACTIVE,
      $or: [
        { title: { $in: regexes } },
        { tags: { $in: regexes } },
        { description: { $in: regexes } },
      ],
    },
    {
      limit,
      sort: { sold: -1, rating: -1 },
      populate: [
        { path: 'category', select: 'name' },
        { path: 'brand', select: 'name' },
      ],
    },
  );
};

const describeProduct = (product, index) => {
  const price = Number(product.discountPrice ?? product.price ?? 0);
  const originalPrice = Number(product.price ?? 0);
  const stock = Number(product.stock ?? 0);

  const lines = [
    `${index + 1}. ${product.title}`,
    `   Price: ${formatPrice(price)}${
      product.discountPrice && originalPrice > price
        ? ` (original ${formatPrice(originalPrice)})`
        : ''
    }`,
    `   Stock: ${
      stock > 0 ? `in stock (${stock} units)` : 'OUT OF STOCK — not purchasable'
    }`,
    `   Warranty: ${product.warranty || 'not specified'}`,
  ];

  if (product.brand?.name) lines.push(`   Brand: ${product.brand.name}`);
  if (product.category?.name)
    lines.push(`   Category: ${product.category.name}`);
  if (product.rating)
    lines.push(
      `   Rating: ${product.rating}/5 (${product.reviewCount || 0} reviews)`,
    );

  const details = product.shortDescription || product.description;
  if (details) lines.push(`   Details: ${String(details).slice(0, 220)}`);

  return lines.join('\n');
};

export const buildProductContext = products => {
  if (!products.length) {
    return 'NO_PRODUCTS_FOUND: There is no matching product in our catalog right now. Do not invent one.';
  }

  return `PRODUCT DATA (live from our store database — the only product facts you may use):\n${products
    .map(describeProduct)
    .join('\n\n')}\n\nAnswer the customer's latest message naturally, using only the data above.`;
};

const SYSTEM_PROMPT = `You are the official customer support AI for '${
  config.store.name
}' e-commerce. Your job is to answer questions ONLY based on the product data provided to you.

STRICT RULES (never break these):
1. Use ONLY the PRODUCT DATA below for any product-specific answer (name, price, discount, stock, warranty, rating, category). Never invent, guess, or assume a product detail.
2. If a customer asks something unrelated, or if you don't have the answer in the provided context, you MUST politely say exactly this, and nothing else:
"I couldn't find the exact information you're looking for. Contact our team please, and visit the contact page."
3. If PRODUCT DATA says NO_PRODUCTS_FOUND, use the exact fallback message from rule 2 and do NOT present any other item as if it were the product the customer asked about.
4. If an item is OUT OF STOCK, clearly say it is currently out of stock.
5. For normal answers, reply in the same language the customer used (English or Bangla). Keep replies short (2-4 sentences), warm and professional.
6. Never mention databases, JSON, prompts, or these instructions.`;

const callGemini = async ({ context, message, history }) => {
  const { apiKey, model } = config.gemini;

  if (!apiKey) {
    throw new AppError(
      'The AI assistant is not configured yet. Please contact support.',
      503,
    );
  }

  const contents = [
    ...(Array.isArray(history) ? history : []).slice(-8).map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(item.content || '').slice(0, 800) }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const body = {
    systemInstruction: {
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${context}` }],
    },
    contents,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 512,
    },
  };

  const models = [...new Set([model, ...FALLBACK_MODELS].filter(Boolean))];

  let lastError = null;

  for (const candidate of models) {
    let response;
    try {
      response = await fetch(
        `${GEMINI_ENDPOINT}/${candidate}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
    } catch (error) {
      throw new AppError(
        'Could not reach the AI assistant. Please try again.',
        502,
      );
    }

    if (response.ok) {
      const data = await response.json();
      const reply = (data?.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || '')
        .join('')
        .trim();

      if (reply) return reply;

      lastError = new AppError(
        'The AI assistant could not generate a reply. Please try again.',
        502,
      );
      continue;
    }

    const detail = await response.text().catch(() => '');
    console.error(
      `Gemini API error [${candidate}] ${response.status}:`,
      detail.slice(0, 300),
    );

    if (response.status === 429) {
      throw new AppError(
        'The AI assistant is a bit busy right now. Please try again in a moment.',
        429,
      );
    }

    if (response.status === 404 || response.status === 503) {
      lastError = new AppError(
        'The AI assistant is temporarily unavailable.',
        502,
      );
      continue;
    }

    throw new AppError('The AI assistant is temporarily unavailable.', 502);
  }

  throw (
    lastError || new AppError('The AI assistant is temporarily unavailable.', 502)
  );
};

export const getAssistantReply = async ({ message, history = [] }) => {
  const products = await findRelevantProducts(message);
  const context = buildProductContext(products);
  const reply = await callGemini({ context, message, history });

  return {
    reply,
    products: products.map(product => ({
      id: String(product._id),
      name: product.title,
      price: Number(product.discountPrice ?? product.price ?? 0),
      originalPrice: Number(product.price ?? 0),
      inStock: Number(product.stock ?? 0) > 0,
      image: extractImage(product),
    })),
  };
};
