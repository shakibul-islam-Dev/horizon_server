import mongoose, { Schema, Document } from "mongoose";
import { ITransaction } from "../types";

export interface TransactionDocument extends ITransaction, Document {}

const transactionSchema = new Schema<TransactionDocument>(
  {
    buyer: {
      type: String,
      ref: "User",
      required: [true, "Buyer reference is required"],
    },
    seller: {
      type: String,
      ref: "User",
      required: [true, "Seller reference is required"],
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: [true, "Payment reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });
transactionSchema.index({ item: 1 });
transactionSchema.index({ status: 1 });

export const Transaction = mongoose.model<TransactionDocument>("Transaction", transactionSchema);
