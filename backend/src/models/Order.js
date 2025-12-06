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
      price: { type: Number, required: true },
      variation: {
        color: { type: String },
        size: { type: String },
        ram: { type: String }
      }
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
    total_amount: { type: Number, required: true },
    voucher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null
    },
    voucher_code: { type: String, default: null },
    discount_amount: { type: Number, default: 0 } // Số tiền đã giảm từ voucher
  },
  { timestamps: true, versionKey: false }
);

// Indexes để tối ưu queries
orderSchema.index({ user_id: 1 }); // Tìm đơn hàng theo user
orderSchema.index({ status: 1 }); // Filter theo status
orderSchema.index({ order_date: -1 }); // Sort theo ngày (mới nhất trước)
orderSchema.index({ order_number: 1 }); // Unique index đã có trong schema
// Compound index cho query phổ biến: user orders theo status
orderSchema.index({ user_id: 1, status: 1 });
// Compound index cho revenue stats
orderSchema.index({ status: 1, order_date: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
