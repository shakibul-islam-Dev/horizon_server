const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
  user: { type: String, ref: 'User', required: true, unique: true },
  items: [{
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
