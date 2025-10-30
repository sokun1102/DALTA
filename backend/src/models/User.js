// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: String, required: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: [{
      street: { type: String, required: true },
      city: { type: String, required: true },
      zip: { type: String, required: true }
    }],
    payment_methods: [{
      type: { type: String, enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'], required: true },
      provider: { type: String, required: true },
      token: { type: String, required: true }
    }]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;