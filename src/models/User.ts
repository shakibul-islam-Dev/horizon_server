import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document<unknown, {}, { name: string; email: string; emailVerified: boolean; image?: string; role: "user" | "admin"; preferences: { categories: mongoose.Types.ObjectId[]; priceRange: { min: number; max: number } } }> {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: "user" | "admin";
  preferences: {
    categories: mongoose.Types.ObjectId[];
    priceRange: { min: number; max: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    preferences: {
      categories: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 10000 },
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
    _id: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<UserDocument>("User", userSchema);
