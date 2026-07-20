import { Request, Response } from 'express';
import About from '../models/About';
import { sendSuccess, sendError, sendCreated } from '../helpers/response';

const DEFAULT_ABOUT = {
  title: 'Horizon Marketplace',
  subtitle: 'Your trusted marketplace for unique products',
  description: 'Horizon is a global marketplace connecting buyers and sellers with quality products from around the world.',
  mission: 'To empower creators and sellers by providing a simple, secure platform to reach a global audience.',
  vision: 'A world where anyone can turn their passion into a thriving business.',
  statistics: [
    { label: 'Active Users', value: '50000', suffix: '+' },
    { label: 'Items Listed', value: '120000', suffix: '+' },
    { label: 'Countries', value: '80', suffix: '+' },
    { label: 'Happy Sellers', value: '15000', suffix: '+' },
  ],
  socialLinks: [
    { platform: 'Facebook', url: 'https://facebook.com' },
    { platform: 'Twitter', url: 'https://twitter.com' },
    { platform: 'Instagram', url: 'https://instagram.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
  ],
  contact: {
    email: 'support@horizon.com',
    phone: '+1 (555) 123-4567',
    address: '123 Market Street, San Francisco, CA',
    hours: 'Mon - Fri: 9AM - 6PM',
  },
  heroSlides: [
    { title: 'Discover Unique Products', subtitle: 'Shop from creators worldwide', cta: 'Start Exploring', href: '/explore' },
    { title: 'Sell What You Love', subtitle: 'Reach millions of buyers', cta: 'List an Item', href: '/items/add' },
  ],
  features: [
    { icon: 'sparkles', title: 'AI Powered', description: 'Smart recommendations and content generation.' },
    { icon: 'shield', title: 'Secure Payments', description: 'Safe and encrypted transactions.' },
    { icon: 'globe', title: 'Global Reach', description: 'Connect with buyers everywhere.' },
  ],
  highlights: [
    { icon: 'truck', title: 'Fast Delivery', description: 'Quick shipping worldwide.', stat: '2-4 days', statLabel: 'Avg delivery' },
    { icon: 'badge-check', title: 'Verified Sellers', description: 'Trustworthy community.', stat: '98%', statLabel: 'Positive rating' },
  ],
  testimonials: [
    { name: 'Jane Doe', role: 'Seller', quote: 'Horizon helped me grow my small business beyond expectations.', avatar: '' },
    { name: 'John Smith', role: 'Buyer', quote: 'I find the most unique items here. Love the experience.', avatar: '' },
  ],
  partners: [
    { name: 'Partner A', initials: 'PA' },
    { name: 'Partner B', initials: 'PB' },
  ],
  homepageFaq: [
    { question: 'How do I sell?', answer: 'Create an account and list your item in minutes.' },
    { question: 'Is payment secure?', answer: 'Yes, all payments are encrypted and protected.' },
  ],
  pricingPlans: [
    { name: 'Free', price: { monthly: 0, yearly: 0 }, description: 'Get started for free.', features: [{ text: 'List up to 5 items', included: true }], cta: 'Get Started', popular: false },
    { name: 'Pro', price: { monthly: 19, yearly: 190 }, description: 'For growing sellers.', features: [{ text: 'Unlimited listings', included: true }], cta: 'Choose Pro', popular: true },
    { name: 'Business', price: { monthly: 49, yearly: 490 }, description: 'For businesses.', features: [{ text: 'Priority support', included: true }], cta: 'Choose Business', popular: false },
  ],
  pricingComparisons: [
    { feature: 'Listings', free: '5', pro: 'Unlimited', business: 'Unlimited' },
    { feature: 'Support', free: 'Email', pro: 'Priority', business: 'Dedicated' },
  ],
  pricingFaq: [
    { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime from your dashboard.' },
  ],
  helpTopics: [
    { title: 'Getting Started', description: 'Learn the basics.', details: ['Create an account', 'List your first item'] },
  ],
  helpFaq: [
    { question: 'How do I reset my password?', answer: 'Use the forgot password link on the login page.' },
  ],
};

async function getOrCreateAbout() {
  let about = await About.findOne().lean();
  if (!about) {
    about = await About.create(DEFAULT_ABOUT);
    about = about.toObject();
  }
  return about;
}

export const get = async (req: Request, res: Response) => {
  const about = await getOrCreateAbout();
  sendSuccess(res, 'About fetched', about);
};

export const update = async (req: Request, res: Response, params: any, body: any, user: any) => {
  if (!user || user.role !== 'admin') return sendError(res, 403, 'Not authorized');
  if (!body) return sendError(res, 400, 'Invalid request body');
  let about = await About.findOne();
  if (!about) about = await About.create(DEFAULT_ABOUT);
  Object.assign(about, body);
  await about.save();
  sendCreated(res, 'About updated', about);
};
