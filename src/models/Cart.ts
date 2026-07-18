import mongoose, { Schema, Document } from "mongoose";
import { ICart } from "../types";

export interface CartDocument extends ICart, Document {}

const cartSchema = new Schema<CartDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    items: [
      {
        item: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
          default: 1,
        },
      },
    ],
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

export const Cart = mongoose.model<CartDocument>("Cart", cartSchema);
