// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Cho phép null để hỗ trợ khách vãng lai
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: false 
    },
    order_number: { type: String, unique: true, required: false },
    order_date: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
      default: 'pending' 
    },
    items: [{
      product_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }
    }],
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
    },
    payment_method: { 
      type: String, 
      enum: ['cod', 'bank_transfer', 'credit_card'], 
      default: 'cod' 
    },
    notes: { type: String, default: "" },
    total_amount: { type: Number, required: true }
  },
  { timestamps: true }
);


const Order = mongoose.model("Order", orderSchema);
export default Order;
