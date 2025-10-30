// models/Cart.js
import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    items: [{
      product_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      quantity: { type: Number, required: true, min: 1 },
      price_at_time: { type: Number, required: true }
    }]
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
