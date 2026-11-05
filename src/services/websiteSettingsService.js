import { websiteSettingsRepository } from '../repositories/index.js';

// Seeded on first read so the public pages never render empty.
const DEFAULT_SETTINGS = {
  websiteName: 'Exclusive',
  email: 'exclusive@gmail.com',
  phone: '+88015-88888-9999',
  address: '111 Bijoy sarani, Dhaka, DH 1515, Bangladesh.',
  supportHours: 'We are available 24/7, 7 days a week.',
  privacyPolicy: {
    title: 'Privacy Policy',
    content:
      'We respect your privacy. This policy explains what information we collect, how we use it and how we keep it safe.',
  },
  termsOfUse: {
    title: 'Terms of Use',
    content:
      'By using this website you agree to these terms. Please read them carefully before placing an order.',
  },
  faqs: [],
};

export const getWebsiteSettings = async () => {
  const existing = await websiteSettingsRepository.findOne({});
  if (existing) return existing;

  return await websiteSettingsRepository.create(DEFAULT_SETTINGS);
};

const mergePageContent = (current, incoming) => ({
  title: incoming.title ?? current?.title ?? '',
  content: incoming.content ?? current?.content ?? '',
});

export const updateWebsiteSettings = async payload => {
  const settings = await getWebsiteSettings();

  const simpleFields = [
    'websiteName',
    'email',
    'phone',
    'address',
    'supportHours',
  ];

  simpleFields.forEach(field => {
    if (payload[field] !== undefined) {
      settings[field] = payload[field];
    }
  });

  if (payload.privacyPolicy) {
    settings.privacyPolicy = mergePageContent(
      settings.privacyPolicy,
      payload.privacyPolicy,
    );
  }

  if (payload.termsOfUse) {
    settings.termsOfUse = mergePageContent(
      settings.termsOfUse,
      payload.termsOfUse,
    );
  }

  if (Array.isArray(payload.faqs)) {
    settings.faqs = payload.faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer,
    }));
  }

  await settings.save();
  return settings;
};
