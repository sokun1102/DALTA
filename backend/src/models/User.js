// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: String, required: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: null }, // URL hoặc path đến ảnh đại diện
    addresses: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: { type: String, required: true }, // Tên người nhận
      phone: { type: String, required: true }, // Số điện thoại
      street: { type: String, required: true }, // Địa chỉ chi tiết
      ward: { type: String, default: "" }, // Phường/Xã
      district: { type: String, default: "" }, // Quận/Huyện
      city: { type: String, required: true }, // Tỉnh/Thành phố
      zip: { type: String, default: "" }, // Mã bưu điện
      is_default: { type: Boolean, default: false } // Địa chỉ mặc định
    }]
  },
  { timestamps: true, versionKey: false }
);

// Indexes để tối ưu queries
userSchema.index({ email: 1 }); // Unique index đã có trong schema
userSchema.index({ role: 1 }); // Để query admin/users nhanh hơn

const User = mongoose.model("User", userSchema);
export default User;