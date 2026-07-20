import mongoose, { Schema } from 'mongoose';

const aboutSchema = new Schema({
  title: { type: String, default: 'Horizon' },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  mission: { type: String, default: '' },
  vision: { type: String, default: '' },
  values: [{ title: { type: String }, description: { type: String } }],
  timeline: [{ year: { type: String }, event: { type: String } }],
  statistics: [{
    label: { type: String },
    value: { type: String },
    suffix: { type: String, default: '' },
  }],
  team: [{ name: { type: String }, role: { type: String }, image: { type: String } }],
  socialLinks: [{ platform: { type: String }, url: { type: String } }],
  contact: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    hours: { type: String, default: '' },
  },
  images: {
    hero: { type: String, default: '' },
    team: [{ type: String }],
  },
  heroSlides: [{
    title: { type: String },
    subtitle: { type: String },
    cta: { type: String },
    href: { type: String },
  }],
  features: [{
    icon: { type: String },
    title: { type: String },
    description: { type: String },
  }],
  highlights: [{
    icon: { type: String },
    title: { type: String },
    description: { type: String },
    stat: { type: String },
    statLabel: { type: String },
  }],
  testimonials: [{
    name: { type: String },
    role: { type: String },
    quote: { type: String },
    avatar: { type: String },
  }],
  partners: [{ name: { type: String }, initials: { type: String } }],
  homepageFaq: [{ question: { type: String }, answer: { type: String } }],
  pricingPlans: [{
    name: { type: String },
    price: { monthly: { type: Number }, yearly: { type: Number } },
    description: { type: String },
    features: [{ text: { type: String }, included: { type: Boolean } }],
    cta: { type: String },
    popular: { type: Boolean },
  }],
  pricingComparisons: [{
    feature: { type: String },
    free: { type: String },
    pro: { type: String },
    business: { type: String },
  }],
  pricingFaq: [{ q: { type: String }, a: { type: String } }],
  helpTopics: [{ title: { type: String }, description: { type: String }, details: [{ type: String }] }],
  helpFaq: [{ question: { type: String }, answer: { type: String } }],
}, { timestamps: true, collection: 'abouts' });

export default mongoose.models.About || mongoose.model('About', aboutSchema);

