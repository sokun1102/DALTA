// models/PaymentMethod.js
import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit_card", "debit_card", "bank_account", "e_wallet", "cod"],
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    // Thông tin thẻ (masked)
    card_number: {
      type: String,
      default: null,
    },
    card_holder_name: {
      type: String,
      default: null,
    },
    expiry_date: {
      type: String,
      default: null,
    },
    // Thông tin tài khoản ngân hàng
    bank_name: {
      type: String,
      default: null,
    },
    account_number: {
      type: String,
      default: null,
    },
    account_holder_name: {
      type: String,
      default: null,
    },
    // Thông tin ví điện tử
    wallet_id: {
      type: String,
      default: null,
    },
    // Trạng thái
    is_default: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Indexes để tối ưu queries
paymentMethodSchema.index({ user_id: 1 }); // Tìm payment methods của user
// Compound index cho query phổ biến: active payment methods của user
paymentMethodSchema.index({ user_id: 1, is_active: 1 });
// Compound index để tìm default payment method
paymentMethodSchema.index({ user_id: 1, is_default: 1, is_active: 1 });

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
export default PaymentMethod;

