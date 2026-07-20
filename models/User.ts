import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Omit<Document, '_id'> {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string;
  role: 'user' | 'admin';
  preferences: {
    categories: mongoose.Types.ObjectId[];
    priceRange: { min: number; max: number };
  };
}

const userSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  emailVerified: { type: Boolean, default: false },
  image: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  preferences: {
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    priceRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 10000 } },
  },
}, { timestamps: true, collection: 'users', _id: false });

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);

