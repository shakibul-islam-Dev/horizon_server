const { GoogleGenerativeAI } = require('@google/generative-ai');
const Item = require('../models/Item');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Recommendation = require('../models/Recommendation');
const AnalyticsData = require('../models/AnalyticsData');
const { sendSuccess, sendError, sendCreated } = require('../helpers/response');
const { paginate, buildMeta } = require('../helpers/request');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function llmChat(messages, options = {}) {
  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMsgs = messages.filter(m => m.role !== 'system');
  const contents = conversationMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    systemInstruction: systemMsg?.content || undefined,
    generationConfig: { maxOutputTokens: options.maxTokens ?? 500, temperature: options.temperature ?? 0.7 },
  });
  const result = await model.generateContent({ contents });
  return result.response.text() || 'Could not generate a response.';
}

// ===== CONTENT GENERATION =====
exports.generateContent = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!genAI) return sendError(res, 500, 'AI not configured');
  if (!body || !body.type || !body.topic || !body.length) return sendError(res, 400, 'type, topic, and length are required');

  const templates = {
    blog: 'You are an expert blog writer. Write a high-quality, engaging blog article.',
    product_desc: 'You are a professional copywriter. Write a compelling product description.',
    social_post: 'You are a social media expert. Create an engaging social media post.',
    documentation: 'You are a technical documentation writer. Create clear, comprehensive documentation.',
  };
  if (!templates[body.type]) return sendError(res, 400, 'Invalid content type');

  const maxTokens = { short: 300, medium: 600, long: 1200 }[body.length] || 600;
  const prompt = `${templates[body.type]}
Tone: ${body.tone || 'professional'}
Keywords: ${(body.keywords || []).join(', ')}
Context: ${body.additionalContext || 'No additional context.'}`;

  const content = await llmChat([
    { role: 'system', content: `You are a skilled content creator. Generate content about "${body.topic}". Respond only with the content.` },
    { role: 'user', content: prompt },
  ], { maxTokens, temperature: 0.7 });

  sendSuccess(res, 'Content generated', { content, type: body.type, topic: body.topic, tone: body.tone || 'professional' });
};

exports.regenerateContent = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!genAI) return sendError(res, 500, 'AI not configured');
  if (!body || !body.type || !body.topic || !body.length) return sendError(res, 400, 'type, topic, and length are required');

  const prevContext = body.previousContent
    ? `Previous version was: "${body.previousContent.slice(0, 500)}". Please generate a completely different version.`
    : '';

  const templates = {
    blog: 'You are an expert blog writer. Write a high-quality, engaging blog article.',
    product_desc: 'You are a professional copywriter. Write a compelling product description.',
    social_post: 'You are a social media expert. Create an engaging social media post.',
    documentation: 'You are a technical documentation writer. Create clear, comprehensive documentation.',
  };
  if (!templates[body.type]) return sendError(res, 400, 'Invalid content type');

  const maxTokens = { short: 300, medium: 600, long: 1200 }[body.length] || 600;
  const prompt = `${templates[body.type]}
Tone: ${body.tone || 'professional'}
Keywords: ${(body.keywords || []).join(', ')}
Context: ${body.additionalContext || ''} ${prevContext}`;

  const content = await llmChat([
    { role: 'system', content: `You are a skilled content creator. Generate content about "${body.topic}". Respond only with the content.` },
    { role: 'user', content: prompt },
  ], { maxTokens, temperature: 0.7 });

  sendSuccess(res, 'Content regenerated', { content, type: body.type, topic: body.topic, tone: body.tone || 'professional' });
};

exports.classify = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!genAI) return sendError(res, 500, 'AI not configured');
  if (!body || !body.title || !body.description) return sendError(res, 400, 'Title and description are required');

  const response = await llmChat([
    { role: 'system', content: 'You are a classification AI. Return a JSON object with: {"suggestedCategory": "string", "tags": ["array"], "keywords": ["array"], "confidence": number}. Return ONLY valid JSON.' },
    { role: 'user', content: `Title: ${body.title}\nDescription: ${body.description}` },
  ], { maxTokens: 200, temperature: 0.3 });

  let classification;
  try {
    const match = response.match(/\{[\s\S]*\}/);
    classification = match ? JSON.parse(match[0]) : {};
  } catch {
    classification = { suggestedCategory: '', tags: [], keywords: [], confidence: 0 };
  }
  sendSuccess(res, 'Classification generated', classification);
};

// ===== RECOMMENDATIONS =====
exports.getRecommendations = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!genAI) return sendError(res, 500, 'AI not configured');

  const { categoryId, priceRange, limit = 6 } = body || {};
  const interactions = await Recommendation.find({ user: user.userId })
    .populate({ path: 'item', select: 'title category price tags rating' })
    .sort({ createdAt: -1 }).limit(50).lean();

  const userPrefs = await User.findById(user.userId).select('preferences').lean();
  const viewed = [...new Set(interactions.filter(i => i.item?.category).map(i => i.item.category || '').filter(Boolean))];
  const avgPrice = interactions.length > 0 ? interactions.reduce((s, i) => s + (i.item?.price || 0), 0) / interactions.length : 100;
  const interactedIds = interactions.map(i => i.item._id.toString());

  const filter = { status: 'active', _id: { $nin: interactedIds } };
  if (categoryId) filter.category = categoryId;
  if (priceRange) { filter.price = {}; if (priceRange.min) filter.price.$gte = priceRange.min; if (priceRange.max) filter.price.$lte = priceRange.max; }

  let items = await Item.find(filter).populate('author', 'name image').limit(30).lean();
  if (items.length === 0) {
    items = await Item.find({ status: 'active' }).populate('author', 'name image').sort({ rating: -1 }).limit(limit).lean();
    return sendSuccess(res, 'Recommendations generated', items, { reason: 'Showing top-rated items.', userProfile: { preferredCategories: viewed, avgPrice } });
  }

  let recommendedIds = [];
  try {
    const response = await llmChat([
      { role: 'system', content: `Return a JSON array of item IDs ranked by relevance. Return ONLY a JSON array. At most ${limit} IDs.` },
      { role: 'user', content: `User: categories ${viewed.join(', ') || 'None'}, avg price $${avgPrice.toFixed(2)}. Items:\n${items.map(i => `ID: ${i._id}, Title: ${i.title}, Price: $${i.price}, Rating: ${i.rating}`).join('\n')}` },
    ], { maxTokens: 300, temperature: 0.3 });
    const m = response.match(/\[[\s\S]*?\]/);
    if (m) recommendedIds = JSON.parse(m[0]);
  } catch { /* fallback */ }

  if (recommendedIds.length === 0) recommendedIds = items.slice(0, limit).map(i => i._id.toString());
  const recommended = await Item.find({ _id: { $in: recommendedIds } }).populate('author', 'name image').lean();
  const sorted = recommendedIds.map(id => recommended.find(i => i._id.toString() === id)).filter(Boolean);
  sendSuccess(res, 'Recommendations generated', sorted, { reason: `Based on your interest in ${viewed.join(', ') || 'browsing history'}.`, userProfile: { preferredCategories: viewed, avgPrice } });
};

exports.trackInteraction = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.itemId || !body.interactionType) return sendError(res, 400, 'itemId and interactionType required');
  const result = await Recommendation.findOneAndUpdate(
    { user: user.userId, item: body.itemId, interactionType: body.interactionType },
    { user: user.userId, item: body.itemId, interactionType: body.interactionType, rating: body.rating },
    { upsert: true, new: true }
  );
  sendSuccess(res, 'Interaction tracked', result);
};

exports.recommend = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const { categoryId, priceRange, limit = 6 } = body || {};
  const filter = { status: 'active' };
  if (categoryId) filter.category = categoryId;
  if (priceRange) { filter.price = {}; if (priceRange.min) filter.price.$gte = priceRange.min; if (priceRange.max) filter.price.$lte = priceRange.max; }
  let items = await Item.find(filter).populate('author', 'name image').sort({ rating: -1 }).limit(limit).lean();
  if (items.length === 0) items = await Item.find({ status: 'active' }).populate('author', 'name image').sort({ rating: -1 }).limit(limit).lean();
  sendSuccess(res, 'Recommendations', items, { reason: 'Top-rated items based on your filters.' });
};

// ===== DATA ANALYSIS =====
exports.analyzeData = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!genAI) return sendError(res, 500, 'AI not configured');
  if (!body || !body.fileName || !body.fileType || !body.data || body.data.length === 0) {
    return sendError(res, 400, 'fileName, fileType, and data array are required');
  }

  const sample = body.data.slice(0, 20);
  const columns = Object.keys(body.data[0]);
  const response = await llmChat([
    { role: 'system', content: 'You are a data analyst. Return JSON: {"summary":"string","trends":["string"],"insights":["string"],"kpis":{},"risks":["string"],"recommendations":["string"]}. Return ONLY valid JSON.' },
    { role: 'user', content: `Dataset (${body.data.length} rows, columns: ${columns.join(', ')}).\nSample: ${JSON.stringify(sample)}` },
  ], { maxTokens: 1500, temperature: 0.3 });

  let analysis;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    analysis = m ? JSON.parse(m[0]) : { summary: 'Could not parse.', trends: [], insights: [], kpis: {}, risks: [], recommendations: [] };
  } catch {
    analysis = { summary: 'Could not parse.', trends: [], insights: [], kpis: {}, risks: [], recommendations: [] };
  }

  const record = await AnalyticsData.create({ user: user.userId, fileName: body.fileName, fileType: body.fileType, rawData: { rows: body.data, columns }, analysis });
  sendCreated(res, 'Analysis created', record);
};

exports.getAnalyses = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const [analyses, total] = await Promise.all([
    AnalyticsData.find({ user: user.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AnalyticsData.countDocuments({ user: user.userId }),
  ]);
  sendSuccess(res, 'Analyses fetched', analyses, buildMeta(page, limit, total));
};

exports.getAnalysisSummary = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!genAI) return sendError(res, 500, 'AI not configured');
  const analyses = await AnalyticsData.find({ user: user.userId }).sort({ createdAt: -1 }).limit(10).lean();
  if (analyses.length === 0) return sendSuccess(res, 'Summary', { summary: 'No analyses found.', totalAnalyses: 0 });
  const summaryText = await llmChat([
    { role: 'system', content: 'Create an overarching executive summary from multiple analysis summaries.' },
    { role: 'user', content: `Analyses:\n${analyses.map((a, i) => `${i + 1}. ${a.fileName} - ${a.analysis?.summary}`).join('\n')}` },
  ], { maxTokens: 500, temperature: 0.5 });
  sendSuccess(res, 'Summary generated', { summary: summaryText, totalAnalyses: analyses.length, recentAnalyses: analyses.map(a => ({ fileName: a.fileName, createdAt: a.createdAt, summary: a.analysis?.summary })) });
};

exports.getAnalysisById = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const record = await AnalyticsData.findOne({ _id: params.id, user: user.userId });
  if (!record) return sendError(res, 404, 'Analysis not found');
  sendSuccess(res, 'Analysis fetched', record);
};

// ===== CHAT =====
exports.chat = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!genAI) return sendError(res, 500, 'AI not configured');
  if (!body || !body.messages || body.messages.length === 0) return sendError(res, 400, 'Messages array is required');

  let conversationId = body.conversationId;
  let conversation = conversationId ? await Conversation.findOne({ _id: conversationId, user: user.userId }) : null;

  if (!conversation) {
    conversation = await Conversation.create({ user: user.userId, title: 'New Chat', aiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash', status: 'active', messages: [] });
    conversationId = String(conversation._id);
  }

  const isFirst = conversation.messages.length === 0;
  const userMsgs = body.messages.map(m => ({ role: m.role, content: m.content, createdAt: new Date() }));
  const context = [...conversation.messages, ...userMsgs];

  const reply = await llmChat([
    { role: 'system', content: 'You are Horizon AI, a helpful assistant for the Horizon Marketplace. Be friendly, concise, and knowledgeable. Keep responses under 200 words.' },
    { role: 'system', content: 'Never make up information. For disputes, advise contacting support.' },
    ...context.map(m => ({ role: m.role, content: m.content })),
  ], { maxTokens: 500, temperature: 0.7 });

  const assistantMsg = { role: 'assistant', content: reply, createdAt: new Date() };
  const all = [...context, assistantMsg];
  const update = { messages: all, messageCount: all.length, lastMessage: userMsgs[userMsgs.length - 1]?.content || conversation.lastMessage };

  if (isFirst) {
    try {
      const title = await llmChat([
        { role: 'system', content: 'Generate a short title (max 6 words) for this chat. Return ONLY the title text.' },
        { role: 'user', content: body.messages[0].content },
      ], { maxTokens: 20, temperature: 0.3 });
      update.title = title.trim();
    } catch {
      update.title = body.messages[0].content.split('\n')[0].trim().slice(0, 50) || 'New Conversation';
    }
  }

  await Conversation.findOneAndUpdate({ _id: conversation._id, user: user.userId }, update, { new: true });
  sendSuccess(res, 'Chat response', { reply, conversationId });
};

exports.getConversations = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { page, limit, skip } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
  const status = url.searchParams.get('status') || 'active';
  const filter = { user: user.userId };
  if (status !== 'all') filter.status = status;
  const [conversations, total] = await Promise.all([
    Conversation.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Conversation.countDocuments(filter),
  ]);
  const pages = Math.ceil(total / limit);
  sendSuccess(res, 'Conversations fetched', conversations, { page, limit, total, pages, hasNext: page * limit < total, hasPrev: page > 1 });
};

exports.getConversationById = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const conversation = await Conversation.findOne({ _id: params.id, user: user.userId }).lean();
  if (!conversation) return sendError(res, 404, 'Conversation not found');
  sendSuccess(res, 'Conversation fetched', conversation);
};

exports.renameConversation = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.title) return sendError(res, 400, 'Title is required');
  const conversation = await Conversation.findOneAndUpdate({ _id: params.id, user: user.userId }, { title: body.title }, { new: true });
  if (!conversation) return sendError(res, 404, 'Conversation not found');
  sendSuccess(res, 'Conversation renamed', conversation);
};

exports.updateConversationStatus = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.status) return sendError(res, 400, 'Status is required');
  const conversation = await Conversation.findOneAndUpdate({ _id: params.id, user: user.userId }, { status: body.status }, { new: true });
  if (!conversation) return sendError(res, 404, 'Conversation not found');
  sendSuccess(res, 'Status updated', conversation);
};

exports.deleteConversation = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const conversation = await Conversation.findOneAndDelete({ _id: params.id, user: user.userId });
  if (!conversation) return sendError(res, 404, 'Conversation not found');
  sendSuccess(res, 'Conversation deleted');
};

exports.deleteAllConversations = async (req, res, params, body, user) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const result = await Conversation.deleteMany({ user: user.userId });
  sendSuccess(res, 'Conversations deleted', { deleted: result.deletedCount });
};
