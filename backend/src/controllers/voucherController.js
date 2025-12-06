// controllers/voucherController.js
import Voucher from "../models/Voucher.js";

// Lấy tất cả voucher của user
export const getUserVouchers = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    
    console.log("🔍 getUserVouchers - userId:", userId);
    console.log("🔍 getUserVouchers - req.userId:", req.userId);
    console.log("🔍 getUserVouchers - req.user:", req.user);

    if (!userId) {
      console.error("❌ getUserVouchers - No userId found");
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xem voucher",
      });
    }

    // Query vouchers từ database
    const vouchers = await Voucher.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .populate('order_id', 'order_number total_amount')
      .lean(); // Sử dụng lean() để trả về plain objects

    console.log(`✅ getUserVouchers - Found ${vouchers.length} vouchers for user ${userId}`);
    
    if (vouchers.length > 0) {
      console.log("📋 Sample voucher:", {
        code: vouchers[0].code,
        name: vouchers[0].name,
        user_id: vouchers[0].user_id,
      });
    }

    // Tính toán trạng thái voucher
    const now = new Date();
    const vouchersWithStatus = vouchers.map(voucher => {
      const voucherData = { ...voucher }; // Copy voucher data
      
      // Kiểm tra trạng thái
      if (voucher.is_used) {
        voucherData.status = 'used';
        voucherData.statusText = 'Đã sử dụng';
      } else if (new Date(voucher.end_date) < now) {
        voucherData.status = 'expired';
        voucherData.statusText = 'Đã hết hạn';
      } else if (new Date(voucher.start_date) > now) {
        voucherData.status = 'pending';
        voucherData.statusText = 'Chưa đến hạn';
      } else if (voucher.used_count >= voucher.usage_limit) {
        voucherData.status = 'exhausted';
        voucherData.statusText = 'Đã hết lượt sử dụng';
      } else {
        voucherData.status = 'active';
        voucherData.statusText = 'Có thể sử dụng';
      }

      // Tính giá trị giảm giá hiển thị
      if (voucher.discount_type === 'percentage') {
        voucherData.discountDisplay = `${voucher.discount_value}%`;
        if (voucher.max_discount) {
          voucherData.discountDisplay += ` (tối đa ${voucher.max_discount.toLocaleString('vi-VN')}đ)`;
        }
      } else {
        voucherData.discountDisplay = `${voucher.discount_value.toLocaleString('vi-VN')}đ`;
      }

      return voucherData;
    });

    console.log(`✅ getUserVouchers - Returning ${vouchersWithStatus.length} vouchers with status`);

    res.json({
      success: true,
      data: vouchersWithStatus,
    });
  } catch (error) {
    console.error("❌ Error getting user vouchers:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách voucher",
      error: error.message,
    });
  }
};

// Lấy voucher theo ID
export const getVoucherById = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.userId;

    const voucher = await Voucher.findOne({
      _id: voucherId,
      user_id: userId,
    }).populate('order_id', 'order_number total_amount');

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher",
      });
    }

    const now = new Date();
    const voucherData = voucher.toObject();
    
    if (voucher.is_used) {
      voucherData.status = 'used';
      voucherData.statusText = 'Đã sử dụng';
    } else if (new Date(voucher.end_date) < now) {
      voucherData.status = 'expired';
      voucherData.statusText = 'Đã hết hạn';
    } else if (new Date(voucher.start_date) > now) {
      voucherData.status = 'pending';
      voucherData.statusText = 'Chưa đến hạn';
    } else {
      voucherData.status = 'active';
      voucherData.statusText = 'Có thể sử dụng';
    }

    res.json({
      success: true,
      data: voucherData,
    });
  } catch (error) {
    console.error("Error getting voucher:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin voucher",
    });
  }
};

// Tạo voucher mới (dành cho admin, nhưng có thể dùng để phát voucher cho user)
export const createVoucher = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      start_date,
      end_date,
      usage_limit,
      user_id,
      category_ids,
      product_ids,
    } = req.body;

    // Validation
    if (!code || !name || !discount_type || !discount_value || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
      return res.status(400).json({
        success: false,
        message: "Phần trăm giảm giá phải từ 0-100%",
      });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    const voucher = new Voucher({
      code: code.toUpperCase(),
      name,
      description: description || "",
      discount_type,
      discount_value,
      min_order_value: min_order_value || 0,
      max_discount: max_discount || null,
      start_date,
      end_date,
      usage_limit: usage_limit || 1,
      user_id: user_id || req.userId,
      category_ids: category_ids || [],
      product_ids: product_ids || [],
    });

    await voucher.save();

    res.status(201).json({
      success: true,
      data: voucher,
      message: "Tạo voucher thành công",
    });
  } catch (error) {
    console.error("Error creating voucher:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mã voucher đã tồn tại",
      });
    }
    res.status(500).json({
      success: false,
      message: "Không thể tạo voucher",
    });
  }
};

// Validate voucher theo code và order total
export const validateVoucherByCode = async (req, res) => {
  try {
    const { code, order_total } = req.body;
    const userId = req.userId;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã voucher",
      });
    }

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      user_id: userId,
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Mã voucher không hợp lệ",
      });
    }

    const now = new Date();
    const errors = [];

    // Kiểm tra trạng thái
    if (voucher.is_used) {
      errors.push("Voucher đã được sử dụng");
    }
    if (new Date(voucher.end_date) < now) {
      errors.push("Voucher đã hết hạn");
    }
    if (new Date(voucher.start_date) > now) {
      errors.push("Voucher chưa đến thời gian áp dụng");
    }
    if (voucher.used_count >= voucher.usage_limit) {
      errors.push("Voucher đã hết lượt sử dụng");
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (order_total && voucher.min_order_value > 0) {
      if (order_total < voucher.min_order_value) {
        errors.push(
          `Đơn hàng phải có giá trị tối thiểu ${voucher.min_order_value.toLocaleString("vi-VN")}đ`
        );
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(". "),
      });
    }

    // Tính toán giá trị giảm giá
    let discountAmount = 0;
    if (order_total) {
      if (voucher.discount_type === "percentage") {
        discountAmount = (order_total * voucher.discount_value) / 100;
        if (voucher.max_discount && discountAmount > voucher.max_discount) {
          discountAmount = voucher.max_discount;
        }
      } else {
        discountAmount = voucher.discount_value;
      }
    }

    const voucherData = voucher.toObject();
    voucherData.status = "active";
    voucherData.statusText = "Có thể sử dụng";
    voucherData.discountAmount = discountAmount;

    res.json({
      success: true,
      data: voucherData,
      discountAmount,
    });
  } catch (error) {
    console.error("Error validating voucher:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xác thực voucher",
    });
  }
};

// Tạo voucher mẫu cho user hiện tại
export const createSampleVouchers = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để tạo voucher",
      });
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
    ];

    console.log("Creating sample vouchers for user:", userId);
    
    // Xóa TẤT CẢ voucher cũ của user này trước
    const deleteAllResult = await Voucher.deleteMany({ user_id: userId });
    console.log(`Deleted ${deleteAllResult.deletedCount} old vouchers for user ${userId}`);
    
    // Tạo voucher mới
    const createdVouchers = [];
    const errors = [];
    
    for (const originalVoucherData of sampleVouchers) {
      try {
        // Tạo copy để không modify original object
        const voucherData = { ...originalVoucherData };
        let finalCode = voucherData.code.toUpperCase(); // Đảm bảo uppercase
        
        // Kiểm tra xem code đã tồn tại chưa (trong toàn bộ database)
        let existingVoucher = await Voucher.findOne({ code: finalCode });
        let attemptCount = 0;
        const maxAttempts = 10;
        
        // Nếu code đã tồn tại, tạo code mới với userId và timestamp
        while (existingVoucher && attemptCount < maxAttempts) {
          const userIdSuffix = userId.toString().slice(-6);
          const timestampSuffix = Date.now().toString().slice(-4);
          finalCode = `${voucherData.code}_${userIdSuffix}_${timestampSuffix}`.toUpperCase();
          existingVoucher = await Voucher.findOne({ code: finalCode });
          attemptCount++;
        }
        
        if (existingVoucher) {
          throw new Error(`Cannot generate unique code for ${originalVoucherData.code} after ${maxAttempts} attempts`);
        }
        
        voucherData.code = finalCode;
        
        const voucher = new Voucher(voucherData);
        await voucher.save();
        createdVouchers.push(voucher);
        console.log(`✅ Successfully created voucher: ${finalCode} for user: ${userId}`);
      } catch (error) {
        console.error(`❌ Error creating voucher ${originalVoucherData.code}:`, error.message);
        console.error("Error details:", error);
        if (error.code === 11000) {
          // Duplicate key error - should not happen with new logic
          console.error(`Duplicate key error for code: ${originalVoucherData.code}`);
        }
        errors.push({ code: originalVoucherData.code, error: error.message });
      }
    }

    if (createdVouchers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể tạo voucher mẫu. Có thể do lỗi validation hoặc duplicate code.",
        errors: errors,
      });
    }

    console.log(`Successfully created ${createdVouchers.length} vouchers out of ${sampleVouchers.length}`);

    res.status(201).json({
      success: true,
      message: `Đã tạo ${createdVouchers.length} voucher mẫu`,
      data: createdVouchers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error creating sample vouchers:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tạo voucher mẫu",
    });
  }
};

// Đánh dấu voucher đã sử dụng
export const markVoucherAsUsed = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const { order_id } = req.body;
    const userId = req.userId;

    const voucher = await Voucher.findOne({
      _id: voucherId,
      user_id: userId,
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher",
      });
    }

    if (voucher.is_used) {
      return res.status(400).json({
        success: false,
        message: "Voucher đã được sử dụng",
      });
    }

    const now = new Date();
    if (new Date(voucher.end_date) < now) {
      return res.status(400).json({
        success: false,
        message: "Voucher đã hết hạn",
      });
    }

    if (voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({
        success: false,
        message: "Voucher đã hết lượt sử dụng",
      });
    }

    voucher.is_used = true;
    voucher.used_at = new Date();
    voucher.order_id = order_id;
    voucher.used_count += 1;

    await voucher.save();

    res.json({
      success: true,
      data: voucher,
      message: "Voucher đã được sử dụng",
    });
  } catch (error) {
    console.error("Error marking voucher as used:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật voucher",
    });
  }
};

// Xóa voucher
export const deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.userId;

    const voucher = await Voucher.findOne({
      _id: voucherId,
      user_id: userId,
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher",
      });
    }

    await Voucher.deleteOne({ _id: voucherId });

    res.json({
      success: true,
      message: "Đã xóa voucher",
    });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa voucher",
    });
  }
};

// Xóa tất cả voucher của user
export const deleteAllUserVouchers = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xóa voucher",
      });
    }

    const result = await Voucher.deleteMany({ user_id: userId });

    res.json({
      success: true,
      message: `Đã xóa ${result.deletedCount} voucher`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all vouchers:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa voucher",
    });
  }
};


