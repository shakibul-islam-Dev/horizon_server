const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
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

module.exports = mongoose.model('User', userSchema);
