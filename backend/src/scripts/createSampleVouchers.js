// scripts/createSampleVouchers.js
// Script để tạo voucher mẫu cho user
// Chạy: node backend/src/scripts/createSampleVouchers.js <userId>

import mongoose from "mongoose";
import dotenv from "dotenv";
import Voucher from "../models/Voucher.js";

dotenv.config();

const createSampleVouchers = async (userId) => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    if (!userId) {
      console.log("❌ Vui lòng cung cấp user ID");
      console.log("Usage: node backend/src/scripts/createSampleVouchers.js <userId>");
      process.exit(1);
    }

    // Kiểm tra user có tồn tại không
    const User = mongoose.model("User");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User không tồn tại");
      process.exit(1);
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const next3Months = new Date(now);
    next3Months.setMonth(next3Months.getMonth() + 3);

    const sampleVouchers = [
      {
        code: "WELCOME10",
        name: "Chào mừng - Giảm 10%",
        description: "Voucher chào mừng khách hàng mới",
        discount_type: "percentage",
        discount_value: 10,
        min_order_value: 100000,
        max_discount: 50000,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "SUMMER2024",
        name: "Mùa hè 2024 - Giảm 50k",
        description: "Giảm 50.000đ cho đơn hàng từ 200.000đ",
        discount_type: "fixed_amount",
        discount_value: 50000,
        min_order_value: 200000,
        start_date: now,
        end_date: next3Months,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "VIP20",
        name: "VIP - Giảm 20%",
        description: "Voucher dành cho khách hàng VIP",
        discount_type: "percentage",
        discount_value: 20,
        min_order_value: 500000,
        max_discount: 200000,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "FREESHIP",
        name: "Miễn phí vận chuyển",
        description: "Giảm 30.000đ (tương đương phí ship)",
        discount_type: "fixed_amount",
        discount_value: 30000,
        min_order_value: 150000,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "BIG30",
        name: "Giảm lớn 30%",
        description: "Giảm 30% cho đơn hàng lớn",
        discount_type: "percentage",
        discount_value: 30,
        min_order_value: 1000000,
        max_discount: 300000,
        start_date: now,
        end_date: next3Months,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "NEWUSER",
        name: "Khách hàng mới - Giảm 15%",
        description: "Chào mừng khách hàng mới đến với cửa hàng",
        discount_type: "percentage",
        discount_value: 15,
        min_order_value: 150000,
        max_discount: 75000,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "HAPPY100K",
        name: "Ưu đãi 100k",
        description: "Giảm 100.000đ cho đơn hàng từ 500.000đ",
        discount_type: "fixed_amount",
        discount_value: 100000,
        min_order_value: 500000,
        start_date: now,
        end_date: next3Months,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "WEEKEND",
        name: "Cuối tuần vui vẻ - Giảm 25%",
        description: "Giảm giá đặc biệt cuối tuần",
        discount_type: "percentage",
        discount_value: 25,
        min_order_value: 300000,
        max_discount: 150000,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "FLASH50K",
        name: "Flash Sale - Giảm 50k",
        description: "Khuyến mãi nhanh giảm 50.000đ",
        discount_type: "fixed_amount",
        discount_value: 50000,
        min_order_value: 250000,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "LOYAL25",
        name: "Khách hàng thân thiết - Giảm 25%",
        description: "Cảm ơn bạn đã đồng hành cùng chúng tôi",
        discount_type: "percentage",
        discount_value: 25,
        min_order_value: 400000,
        max_discount: 200000,
        start_date: now,
        end_date: next3Months,
        usage_limit: 1,
        user_id: userId,
      },
      {
        code: "SPECIAL75K",
        name: "Đặc biệt - Giảm 75k",
        description: "Ưu đãi đặc biệt dành cho bạn",
        discount_type: "fixed_amount",
        discount_value: 75000,
        min_order_value: 350000,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 1,
        user_id: userId,
      },
    ];

    // Xóa voucher cũ nếu có (theo code)
    for (const voucherData of sampleVouchers) {
      await Voucher.deleteMany({
        code: voucherData.code,
        user_id: userId,
      });
    }

    // Tạo voucher mới
    const createdVouchers = [];
    for (const voucherData of sampleVouchers) {
      const voucher = new Voucher(voucherData);
      await voucher.save();
      createdVouchers.push(voucher);
      console.log(`✅ Created voucher: ${voucher.code} - ${voucher.name}`);
    }

    console.log(`\n🎉 Đã tạo ${createdVouchers.length} voucher mẫu cho user ${userId}`);
    console.log("\nDanh sách voucher:");
    createdVouchers.forEach((v) => {
      console.log(`  - ${v.code}: ${v.name}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Lấy userId từ command line argument
const userId = process.argv[2];
createSampleVouchers(userId);

