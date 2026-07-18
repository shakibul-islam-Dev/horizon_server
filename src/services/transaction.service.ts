import { Transaction, TransactionDocument } from "../models/Transaction";
import { Payment } from "../models/Payment";
import { Item } from "../models/Item";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";

export class TransactionService {
  static async getTransactionsByBuyer(buyerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find({ buyer: buyerId }).populate("seller", "name image").populate("item", "title price images").populate("payment", "status paymentMethod").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments({ buyer: buyerId }),
    ]);
    return { transactions, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async getTransactionsBySeller(sellerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find({ seller: sellerId }).populate("buyer", "name image").populate("item", "title price images").populate("payment", "status paymentMethod").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments({ seller: sellerId }),
    ]);
    return { transactions, pagination: buildPaginationMeta(page, limit, total) };
  }

  static async getTransactionById(transactionId: string, userId: string): Promise<TransactionDocument> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) throw new NotFoundError("Transaction not found");
    if (transaction.buyer.toString() !== userId && transaction.seller.toString() !== userId) throw new ForbiddenError("You can only view your own transactions");
    await transaction.populate([{ path: "buyer", select: "name image" }, { path: "seller", select: "name image" }, { path: "item", select: "title price images" }, { path: "payment", select: "status paymentMethod amount" }]);
    return transaction;
  }

  static async createTransaction(data: { item: string; payment: string; amount: number }, buyerId: string): Promise<TransactionDocument> {
    const item = await Item.findById(data.item);
    if (!item) throw new NotFoundError("Item not found");
    if (item.author.toString() === buyerId) throw new BadRequestError("You cannot buy your own item");

    const payment = await Payment.findById(data.payment);
    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.user.toString() !== buyerId) throw new ForbiddenError("Payment does not belong to you");

    const transaction = await Transaction.create({ buyer: buyerId, seller: item.author, item: data.item, payment: data.payment, amount: data.amount });
    return transaction.populate([{ path: "seller", select: "name image" }, { path: "item", select: "title price images" }, { path: "payment", select: "status paymentMethod" }]);
  }

  static async updateTransactionStatus(transactionId: string, status: "pending" | "completed" | "cancelled" | "refunded", userId: string): Promise<TransactionDocument> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) throw new NotFoundError("Transaction not found");
    if (transaction.buyer.toString() !== userId && transaction.seller.toString() !== userId) throw new ForbiddenError("You can only update your own transactions");
    transaction.status = status;
    await transaction.save();
    return transaction.populate([{ path: "buyer", select: "name image" }, { path: "seller", select: "name image" }, { path: "item", select: "title price images" }, { path: "payment", select: "status paymentMethod" }]);
  }
}
