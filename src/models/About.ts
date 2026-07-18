import mongoose, { Schema, Document } from "mongoose";

export interface AboutDocument extends Document {
  key: string;
  value: unknown;
}

const aboutSchema = new Schema<AboutDocument>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const About = mongoose.model<AboutDocument>("About", aboutSchema);
