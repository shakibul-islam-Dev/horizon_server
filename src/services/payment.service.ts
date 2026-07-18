import { Payment, PaymentDocument } from "../models/Payment";
import { Item } from "../models/Item";
import { NotFoundError, ForbiddenError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

export class PaymentService {
  static async getPaymentsByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ user: userId }).populate("item", "title price images").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments({ user: userId }),
    ]);
    return { payments, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async getPaymentById(paymentId: string, userId: string): Promise<PaymentDocument> {
    const payment = await Payment.findById(paymentId).populate("item", "title price images");
    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.user.toString() !== userId) throw new ForbiddenError("You can only view your own payments");
    return payment;
  }

  static async createPayment(data: { item: string; amount: number; currency?: string; paymentMethod: string; stripePaymentId?: string }, userId: string): Promise<PaymentDocument> {
    const item = await Item.findById(data.item);
    if (!item) throw new NotFoundError("Item not found");
    const payment = await Payment.create({ ...data, user: userId });
    return payment.populate("item", "title price images");
  }

  static async updatePaymentStatus(paymentId: string, status: "pending" | "completed" | "failed" | "refunded", userId: string): Promise<PaymentDocument> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.user.toString() !== userId) throw new ForbiddenError("You can only update your own payments");
    payment.status = status;
    await payment.save();
    return payment.populate("item", "title price images");
  }

  static async getPaymentsByItem(itemId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ item: itemId }).populate("user", "name image").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments({ item: itemId }),
    ]);
    return { payments, pagination: buildPaginationMeta(page, limit, total) };
  }
}
