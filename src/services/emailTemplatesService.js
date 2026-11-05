import { config } from '../config/index.js';

const BRAND = '#DB4444';

const escapeHtml = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

const money = value => `$${Number(value || 0).toFixed(2)}`;

const formatDate = value =>
  value ? new Date(value).toLocaleDateString('en-US') : '-';

/**
 * Wrap content in a consistent, responsive email shell (brand header + card
 * + footer) so every message looks professional.
 */
const layout = (heading, bodyHtml, { intro = '' } = {}) => `
  <div style="background:#F3F4F6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="background:${BRAND};padding:20px 28px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:1px;">Exclusive</span>
      </div>
      <div style="padding:28px;color:#374151;font-size:14px;line-height:1.6;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">${heading}</h2>
        ${intro ? `<p style="margin:0 0 18px;">${intro}</p>` : ''}
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px;background:#F9FAFB;color:#9CA3AF;font-size:12px;text-align:center;">
        Thank you for shopping with Exclusive.<br />
        Need help? Visit <a href="${config.frontendUrl}/contact" style="color:${BRAND};text-decoration:none;">our support page</a>.
      </div>
    </div>
  </div>
`;

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">${label}</a>`;

const itemsTable = order => {
  const rows = (order.items || [])
    .map(item => {
      const title = escapeHtml(
        item?.product?.title || item?.product?.name || 'Product',
      );
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #E5E7EB;">${title}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:center;">${qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #E5E7EB;text-align:right;">${money(price * qty)}</td>
        </tr>`;
    })
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;margin:8px 0 12px;">
      <thead>
        <tr style="color:#6B7280;font-size:12px;text-transform:uppercase;">
          <th style="text-align:left;padding-bottom:6px;">Item</th>
          <th style="text-align:center;padding-bottom:6px;">Qty</th>
          <th style="text-align:right;padding-bottom:6px;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="text-align:right;padding:2px 0;color:#6B7280;">Subtotal</td><td style="text-align:right;width:110px;">${money(order.subtotal)}</td></tr>
      ${order.discount ? `<tr><td style="text-align:right;padding:2px 0;color:#6B7280;">Discount</td><td style="text-align:right;">- ${money(order.discount)}</td></tr>` : ''}
      <tr><td style="text-align:right;padding:2px 0;color:#6B7280;">Shipping</td><td style="text-align:right;">${money(order.shippingCost)}</td></tr>
      <tr><td style="text-align:right;padding:6px 0;font-weight:bold;font-size:16px;color:#111827;">Total</td><td style="text-align:right;font-weight:bold;font-size:16px;color:#111827;">${money(order.total)}</td></tr>
    </table>
  `;
};

const STATUS_CONTENT = {
  pending: {
    label: 'Pending',
    color: '#B45309',
    message: 'We have received your order and it is awaiting confirmation.',
  },
  processing: {
    label: 'Processing',
    color: '#1D4ED8',
    message: 'Good news — your order is now being prepared for shipment.',
  },
  shipped: {
    label: 'Shipped',
    color: '#7C3AED',
    message: 'Your order is on its way! It should arrive very soon.',
  },
  delivered: {
    label: 'Delivered',
    color: '#15803D',
    message: 'Your order has been delivered. We hope you love it!',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#B91C1C',
    message: 'Your order has been cancelled. Any payment will be refunded.',
  },
};

export const emailTemplates = {
  emailVerification: (user, verificationLink) => ({
    subject: 'Verify your Exclusive email',
    html: layout(
      `Welcome, ${escapeHtml(user.name)}!`,
      `${button(verificationLink, 'Verify Email')}
       <p style="margin:18px 0 0;color:#6B7280;font-size:13px;">If you did not create this account, you can safely ignore this email.</p>`,
      {
        intro:
          'Please confirm your email address to activate your account and start shopping.',
      },
    ),
  }),

  welcome: user => ({
    subject: 'Welcome to Exclusive!',
    html: layout(
      `Welcome to Exclusive, ${escapeHtml(user.name)}!`,
      `<p style="margin:18px 0 0;">${button(`${config.frontendUrl}/shop`, 'Start Shopping')}</p>`,
      {
        intro:
          "Thank you for joining us. We're excited to have you as a customer — discover amazing products today.",
      },
    ),
  }),

  passwordReset: resetLink => ({
    subject: 'Reset your Exclusive password',
    html: layout(
      'Password Reset Request',
      `${button(resetLink, 'Reset Password')}
       <p style="margin:18px 0 0;color:#6B7280;font-size:13px;">This link will expire in 15 minutes. If you didn't request a reset, you can ignore this email — your password stays unchanged.</p>`,
      {
        intro:
          'We received a request to reset your password. Click the button below to choose a new one.',
      },
    ),
  }),

  orderConfirmation: order => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: layout(
      'Thank you for your order!',
      `${itemsTable(order)}
       <p style="margin:14px 0 0;color:#6B7280;font-size:13px;">Your invoice is attached to this email as a PDF. We'll notify you as soon as the status changes.</p>`,
      {
        intro: `Order <strong>${escapeHtml(order.orderNumber)}</strong> was placed on ${formatDate(order.createdAt)}.`,
      },
    ),
  }),

  orderStatusUpdate: order => {
    const status =
      STATUS_CONTENT[String(order.orderStatus || '').toLowerCase()] ||
      STATUS_CONTENT.pending;

    return {
      subject: `Order ${status.label} - ${order.orderNumber}`,
      html: layout(
        `Your order is now ${status.label}`,
        `<p style="display:inline-block;background:${status.color};color:#ffffff;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:bold;margin:0 0 16px;">${status.label}</p>
         ${itemsTable(order)}`,
        {
          intro: `${status.message}<br />Order <strong>${escapeHtml(order.orderNumber)}</strong>.`,
        },
      ),
    };
  },

  // ================= Admin alerts =================
  adminNewOrder: order => ({
    subject: `New Order - ${order.orderNumber} (${money(order.total)})`,
    html: layout(
      'New order received',
      `${itemsTable(order)}
       <p style="margin:14px 0 0;color:#6B7280;font-size:13px;">
         Customer: <strong>${escapeHtml(order.user?.name || '-')}</strong>
         (${escapeHtml(order.user?.email || '-')})
       </p>`,
      {
        intro: `Order <strong>${escapeHtml(order.orderNumber)}</strong> was placed on ${formatDate(order.createdAt)}.`,
      },
    ),
  }),

  adminBigOrder: order => ({
    subject: `🔥 Big Order - ${order.orderNumber} (${money(order.total)})`,
    html: layout(
      'Big order alert!',
      `${itemsTable(order)}
       <p style="margin:14px 0 0;color:#6B7280;font-size:13px;">
         Customer: <strong>${escapeHtml(order.user?.name || '-')}</strong>
         (${escapeHtml(order.user?.email || '-')})
       </p>`,
      {
        intro: `A high-value order (<strong>${money(order.total)}</strong>) just came in — order <strong>${escapeHtml(order.orderNumber)}</strong>.`,
      },
    ),
  }),

  adminLowStock: product => {
    const isOut = Number(product.stock) <= 0;
    return {
      subject: isOut
        ? `Out of Stock - ${product.title}`
        : `Low Stock - ${product.title} (${product.stock} left)`,
      html: layout(
        isOut ? 'Out of stock alert' : 'Low stock alert',
        `<p style="margin:0;"><strong>${escapeHtml(product.title)}</strong></p>
         <p style="margin:6px 0 0;">Remaining stock: <strong>${Number(product.stock || 0)}</strong></p>`,
        {
          intro: isOut
            ? 'This product has run out of stock and needs restocking.'
            : 'This product is running low and may need restocking soon.',
        },
      ),
    };
  },

  adminNewUser: user => ({
    subject: `New Customer - ${user.name}`,
    html: layout(
      'New customer registered',
      `<p style="margin:0;"><strong>${escapeHtml(user.name)}</strong></p>
       <p style="margin:6px 0 0;">${escapeHtml(user.email)}</p>
       <p style="margin:6px 0 0;color:#6B7280;font-size:13px;">Joined ${formatDate(user.createdAt)}</p>`,
      { intro: 'A new customer just created an account.' },
    ),
  }),
};
