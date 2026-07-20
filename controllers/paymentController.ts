const Stripe = require('stripe');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Item = require('../models/Item');
const { sendSuccess, sendError, sendCreated } = require('../helpers/response');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' }) : null;

// ===== PAYMENTS =====
exports.getConfig = async (req: any, res: any) => {
  sendSuccess(res, 'Stripe config', { publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '' });
};

exports.createPaymentIntent = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!stripe) return sendError(res, 500, 'Stripe not configured');
  if (!body || !body.itemId) return sendError(res, 400, 'Item ID is required');
  const item = await Item.findById(body.itemId);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.status !== 'active') return sendError(res, 400, 'Item not available');
  if (item.author.toString() === user.userId) return sendError(res, 400, 'Cannot purchase your own item');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(item.price * 100), currency: 'usd',
    metadata: { itemId: String(item._id), userId: user.userId, itemTitle: item.title },
  });

  await Payment.create({
    user: user.userId, item: body.itemId, amount: item.price, currency: 'usd',
    status: 'pending', paymentMethod: 'stripe', stripePaymentId: paymentIntent.id,
  });

  sendCreated(res, 'Payment intent created', {
    clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: item.price,
  });
};

exports.getMyPayments = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const payments = await Payment.find({ user: user.userId }).populate('item', 'title price images').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Payments fetched', payments);
};

exports.getPaymentById = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const payment = await Payment.findById(params.id).populate('item', 'title price images');
  if (!payment) return sendError(res, 404, 'Payment not found');
  if (payment.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  sendSuccess(res, 'Payment fetched', payment);
};

exports.getPaymentsByItem = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const payments = await Payment.find({ item: params.itemId }).populate('user', 'name image').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Payments fetched', payments);
};

exports.createPayment = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.item || !body.amount || !body.paymentMethod) return sendError(res, 400, 'Missing required fields');
  if (!body.stripePaymentId) return sendError(res, 400, 'Stripe payment ID is required');
  if (body.amount <= 0) return sendError(res, 400, 'Amount must be positive');
  const item = await Item.findById(body.item);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.status !== 'active') return sendError(res, 400, 'Item not available');
  if (item.author.toString() === user.userId) return sendError(res, 400, 'Cannot purchase your own item');
  const allowed = ['item', 'amount', 'currency', 'paymentMethod', 'stripePaymentId'];
  const data: any = { user: user.userId, status: 'pending' };
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  const payment = await Payment.create(data);
  await payment.populate('item', 'title price images');
  sendCreated(res, 'Payment created', payment);
};

exports.updatePaymentStatus = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const payment = await Payment.findById(params.id);
  if (!payment) return sendError(res, 404, 'Payment not found');
  if (payment.user.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  if (!body || !body.status) return sendError(res, 400, 'Status is required');
  const valid: any = { pending: ['completed', 'failed'], completed: ['refunded'], failed: ['pending'], refunded: [] };
  if (!valid[payment.status]?.includes(body.status)) {
    return sendError(res, 400, `Cannot transition from "${payment.status}" to "${body.status}"`);
  }
  payment.status = body.status;
  await payment.save();
  await payment.populate('item', 'title price images');
  sendSuccess(res, 'Payment status updated', payment);
};

exports.webhook = async (req: any, res: any) => {
  if (!stripe) return sendError(res, 500, 'Stripe not configured');
  const signature = req.headers['stripe-signature'];
  if (!signature) return sendError(res, 400, 'Missing stripe-signature header');

  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const p = await Payment.findOne({ stripePaymentId: pi.id });
        if (p) { p.status = 'completed'; await p.save(); } break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const p = await Payment.findOne({ stripePaymentId: pi.id });
        if (p) { p.status = 'failed'; await p.save(); } break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        const p = await Payment.findOne({ stripePaymentId: charge.payment_intent });
        if (p) { p.status = 'refunded'; await p.save(); } break;
      }
    }
    sendSuccess(res, 'Webhook processed');
  } catch (err) {
    sendError(res, 400, `Webhook error: ${(err as any).message}`);
  }
};

// ===== TRANSACTIONS =====
exports.getBuyerTransactions = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const transactions = await Transaction.find({ buyer: user.userId }).populate('seller', 'name image').populate('item', 'title price images').populate('payment', 'status paymentMethod').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Transactions fetched', transactions);
};

exports.getSellerTransactions = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const transactions = await Transaction.find({ seller: user.userId }).populate('buyer', 'name image').populate('item', 'title price images').populate('payment', 'status paymentMethod').sort({ createdAt: -1 }).lean();
  sendSuccess(res, 'Transactions fetched', transactions);
};

exports.getTransactionById = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  const t = await Transaction.findById(params.id);
  if (!t) return sendError(res, 404, 'Transaction not found');
  if (t.buyer.toString() !== user.userId && t.seller.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  await t.populate([{ path: 'buyer', select: 'name image' }, { path: 'seller', select: 'name image' }, { path: 'item', select: 'title price images' }, { path: 'payment', select: 'status paymentMethod amount' }]);
  sendSuccess(res, 'Transaction fetched', t);
};

exports.createTransaction = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.item || !body.payment || !body.amount) return sendError(res, 400, 'Missing required fields');
  const item = await Item.findById(body.item);
  if (!item) return sendError(res, 404, 'Item not found');
  if (item.author.toString() === user.userId) return sendError(res, 400, 'Cannot buy your own item');
  const payment = await Payment.findById(body.payment);
  if (!payment) return sendError(res, 404, 'Payment not found');
  if (payment.user.toString() !== user.userId) return sendError(res, 403, 'Payment does not belong to you');
  const t = await Transaction.create({ buyer: user.userId, seller: item.author, ...body });
  await t.populate([{ path: 'seller', select: 'name image' }, { path: 'item', select: 'title price images' }, { path: 'payment', select: 'status paymentMethod' }]);
  sendCreated(res, 'Transaction created', t);
};

exports.updateTransactionStatus = async (req: any, res: any, params: any, body: any, user: any) => {
  if (!user) return sendError(res, 401, 'Not authenticated');
  if (!body || !body.status) return sendError(res, 400, 'Status is required');
  const t = await Transaction.findById(params.id);
  if (!t) return sendError(res, 404, 'Transaction not found');
  if (t.buyer.toString() !== user.userId && t.seller.toString() !== user.userId) return sendError(res, 403, 'Not authorized');
  t.status = body.status;
  await t.save();
  await t.populate([{ path: 'buyer', select: 'name image' }, { path: 'seller', select: 'name image' }, { path: 'item', select: 'title price images' }, { path: 'payment', select: 'status paymentMethod' }]);
  sendSuccess(res, 'Transaction status updated', t);
};
