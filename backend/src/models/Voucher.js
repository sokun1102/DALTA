// models/Voucher.js
import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true 
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    discount_type: { 
      type: String, 
      enum: ['percentage', 'fixed_amount'], 
      required: true 
    },
    discount_value: { type: Number, required: true },
    min_order_value: { type: Number, default: 0 }, // Giá trị đơn hàng tối thiểu
    max_discount: { type: Number, default: null }, // Giảm giá tối đa (cho percentage)
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    usage_limit: { type: Number, default: 1 }, // Số lần có thể sử dụng
    used_count: { type: Number, default: 0 }, // Số lần đã sử dụng
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    is_used: { type: Boolean, default: false },
    used_at: { type: Date, default: null },
    order_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order',
      default: null 
    }, // Đơn hàng đã sử dụng voucher
    category_ids: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Category' 
    }], // Áp dụng cho danh mục nào (null = tất cả)
    product_ids: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    }] // Áp dụng cho sản phẩm nào (null = tất cả)
  },
  { timestamps: true, versionKey: false }
);

// Index for faster queries
voucherSchema.index({ user_id: 1, is_used: 1 });
voucherSchema.index({ code: 1 });

const Voucher = mongoose.model("Voucher", voucherSchema);
export default Voucher;

