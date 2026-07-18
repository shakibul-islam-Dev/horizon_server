import { About } from "../models/About";

const DEFAULT_ABOUT = {
  title: "About Horizon",
  subtitle: "We believe commerce should be simple, trustworthy, and powered by innovation.",
  description: "Horizon connects people with the products they love through a secure, AI-enhanced marketplace experience.",
  mission: "To create a trusted, AI-powered marketplace that empowers buyers and sellers to connect, trade, and grow.",
  vision: "A world where anyone can buy and sell with confidence.",
  values: [
    { title: "Trust", description: "Every transaction is protected by our secure payment system and buyer protection program." },
    { title: "Innovation", description: "AI-powered tools for smarter buying and selling." },
    { title: "Community", description: "Join thousands of happy users who form a vibrant marketplace community." },
    { title: "Quality", description: "We curate only the best products through our seller verification program." },
  ],
  timeline: [
    { year: "2023", event: "Horizon founded with a vision to revolutionize online marketplace experiences." },
    { year: "2024", event: "Launched AI-powered recommendations and content generation tools." },
    { year: "2025", event: "Reached 50,000 active users and expanded to global markets." },
    { year: "2026", event: "Introduced advanced analytics, smart pricing, and enterprise features." },
  ],
  statistics: [
    { label: "Active Users", value: "50", suffix: "K+" },
    { label: "Products Listed", value: "25", suffix: "K+" },
    { label: "Satisfaction Rate", value: "98", suffix: "%" },
    { label: "Average Rating", value: "4.8", suffix: "" },
  ],
  team: [
    { name: "Alex Morgan", role: "CEO & Founder", image: "https://picsum.photos/seed/team1/400/400" },
    { name: "Jordan Lee", role: "CTO", image: "https://picsum.photos/seed/team2/400/400" },
    { name: "Sam Rivera", role: "Head of Design", image: "https://picsum.photos/seed/team3/400/400" },
    { name: "Casey Kim", role: "Head of Product", image: "https://picsum.photos/seed/team4/400/400" },
  ],
  socialLinks: [
    { platform: "Facebook", url: "#" },
    { platform: "Twitter", url: "#" },
    { platform: "Instagram", url: "#" },
    { platform: "LinkedIn", url: "#" },
  ],
  contact: { email: "support@horizon.com", phone: "+1 (555) 123-4567", address: "123 Marketplace Street, Tech City, TC 12345", hours: "Mon-Fri 9AM-6PM EST" },
  images: { hero: "https://picsum.photos/seed/hero/1920/1080", team: ["https://picsum.photos/seed/team1/400/400", "https://picsum.photos/seed/team2/400/400", "https://picsum.photos/seed/team3/400/400", "https://picsum.photos/seed/team4/400/400"] },
  heroSlides: [
    { title: "Discover Unique Products", subtitle: "Browse thousands of items from trusted sellers worldwide", cta: "Explore Now", href: "/explore" },
    { title: "Sell With Confidence", subtitle: "Join thousands of sellers growing their business on Horizon", cta: "Start Selling", href: "/items/add" },
    { title: "AI-Powered Recommendations", subtitle: "Let our smart AI find the perfect products for you", cta: "Try AI Tools", href: "/ai/recommendations" },
  ],
  features: [
    { icon: "Shield", title: "Secure Trading", description: "Every transaction is protected with our buyer guarantee" },
    { icon: "Truck", title: "Fast Delivery", description: "Lightning-fast shipping with real-time tracking" },
    { icon: "Headphones", title: "24/7 Support", description: "Our team is always here to help you" },
    { icon: "Zap", title: "AI-Powered", description: "Smart recommendations and automated tools" },
  ],
  testimonials: [
    { name: "Sarah Johnson", role: "Frequent Buyer", quote: "Horizon has completely changed how I shop. The AI recommendations are spot on!", avatar: "https://picsum.photos/seed/sarah/100/100" },
    { name: "Michael Chen", role: "Seller", quote: "As a small business owner, Horizon gave me a platform to reach thousands of customers.", avatar: "https://picsum.photos/seed/michael/100/100" },
    { name: "Emily Davis", role: "Power User", quote: "The AI tools save me so much time. I can generate product descriptions in seconds.", avatar: "https://picsum.photos/seed/emily/100/100" },
  ],
  homepageFaq: [
    { question: "What is Horizon?", answer: "Horizon is an AI-powered marketplace that connects buyers and sellers. We use advanced AI to provide smart recommendations, content generation, and data analytics to enhance your buying and selling experience." },
    { question: "How do I start selling?", answer: "Simply create an account, verify your email, and start listing your items. Our AI tools can help you generate compelling product descriptions and optimize your listings." },
    { question: "Is my payment secure?", answer: "Yes, all payments on Horizon are processed through Stripe, a PCI-compliant payment processor. We never store your payment details on our servers." },
    { question: "How do AI recommendations work?", answer: "Our AI analyzes your browsing history, purchase patterns, and preferences to suggest items you might love. The more you use Horizon, the better the recommendations get." },
  ],
  pricingPlans: [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for getting started",
      features: [
        { text: "Up to 10 listings", included: true },
        { text: "Basic AI content generation", included: true },
        { text: "Standard support", included: true },
        { text: "AI recommendations", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: { monthly: 19, yearly: 190 },
      description: "For serious sellers",
      features: [
        { text: "Unlimited listings", included: true },
        { text: "Full AI content generation", included: true },
        { text: "Priority support", included: true },
        { text: "AI recommendations", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Custom branding", included: false },
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Business",
      price: { monthly: 49, yearly: 490 },
      description: "For growing businesses",
      features: [
        { text: "Unlimited listings", included: true },
        { text: "Full AI content generation", included: true },
        { text: "24/7 dedicated support", included: true },
        { text: "AI recommendations", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Custom branding", included: true },
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ],
  pricingComparisons: [
    { feature: "Listings", free: "Up to 10", pro: "Unlimited", business: "Unlimited" },
    { feature: "AI Content Generation", free: "Basic", pro: "Full", business: "Full" },
    { feature: "AI Recommendations", free: "Limited", pro: "Advanced", business: "Advanced" },
    { feature: "Analytics", free: "Basic", pro: "Advanced", business: "Advanced + Custom" },
    { feature: "Support", free: "Community", pro: "Priority", business: "24/7 Dedicated" },
    { feature: "Custom Branding", free: "No", pro: "No", business: "Yes" },
    { feature: "API Access", free: "No", pro: "No", business: "Yes" },
  ],
  pricingFaq: [
    { q: "Can I switch plans anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference." },
    { q: "Is there a free trial for Pro?", a: "Yes, we offer a 14-day free trial for the Pro plan. No credit card required." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards, debit cards, and PayPal through our secure Stripe payment processor." },
    { q: "Do you offer refunds?", a: "We offer a full refund within the first 30 days of any paid plan. Contact our support team for assistance." },
  ],
  helpTopics: [
    {
      title: "Getting Started",
      description: "Learn the basics of using Horizon marketplace",
      details: [
        "Create your account and verify your email",
        "Complete your profile with a photo and bio",
        "Browse the marketplace to discover items",
        "List your first item for sale",
      ],
    },
    {
      title: "Selling on Horizon",
      description: "Tips and tools to maximize your sales",
      details: [
        "Use AI to generate compelling product descriptions",
        "Set competitive pricing with market insights",
        "Respond quickly to buyer inquiries",
        "Build your reputation through excellent service",
      ],
    },
    {
      title: "Buying on Horizon",
      description: "Everything you need to know about purchasing",
      details: [
        "Use filters and search to find exactly what you need",
        "Read reviews and check seller ratings",
        "Make secure payments through our platform",
        "Track your orders and manage returns",
      ],
    },
    {
      title: "AI Tools",
      description: "Leverage our AI-powered features",
      details: [
        "AI Content Generator for product descriptions",
        "Smart Recommendations based on your preferences",
        "AI Chat Assistant for instant help",
        "Data Analytics for business insights",
      ],
    },
  ],
  helpFaq: [
    { question: "How do I reset my password?", answer: "Click on 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox." },
    { question: "How do I contact a seller?", answer: "Navigate to the item listing and use the contact option or leave a comment on the listing." },
    { question: "What if I receive a damaged item?", answer: "Contact our support team within 48 hours of delivery with photos of the damage. We'll help resolve the issue." },
    { question: "How do I delete my account?", answer: "Go to your profile settings and scroll to the bottom. Click 'Delete Account' and confirm your decision." },
    { question: "Can I use Horizon on mobile?", answer: "Yes, Horizon is fully responsive and works great on all mobile devices. Simply visit our website from your mobile browser." },
  ],
};

export class AboutService {
  static async getAbout(): Promise<Record<string, unknown>> {
    const docs = await About.find().lean();
    if (docs.length === 0) {
      const entries = Object.entries(DEFAULT_ABOUT);
      await About.insertMany(entries.map(([key, value]) => ({ key, value })));
      return DEFAULT_ABOUT;
    }
    const result: Record<string, unknown> = {};
    for (const doc of docs) {
      result[doc.key] = doc.value;
    }
    return result;
  }

  static async updateAbout(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    for (const [key, value] of Object.entries(data)) {
      await About.findOneAndUpdate({ key }, { key, value }, { upsert: true });
    }
    return this.getAbout();
  }
}
