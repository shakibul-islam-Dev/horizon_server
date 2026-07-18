import mongoose, { Schema, Document } from "mongoose";
import { IPayment } from "../types";

export interface PaymentDocument extends IPayment, Document {}

const paymentSchema = new Schema<PaymentDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: [true, "Item reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      trim: true,
    },
    stripePaymentId: {
      type: String,
      sparse: true,
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

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ item: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model<PaymentDocument>("Payment", paymentSchema);
