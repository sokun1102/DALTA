import PaymentMethod from "../models/PaymentMethod.js";

// Lấy danh sách phương thức thanh toán của user
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xem phương thức thanh toán",
      });
    }

    const paymentMethods = await PaymentMethod.find({ user_id: userId, is_active: true })
      .sort({ is_default: -1, createdAt: -1 });

    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error("Error getting payment methods:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách phương thức thanh toán",
      error: error.message,
    });
  }
};

// Lấy chi tiết một phương thức thanh toán
export const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xem phương thức thanh toán",
      });
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user_id: userId,
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương thức thanh toán",
      });
    }

    res.json({
      success: true,
      data: paymentMethod,
    });
  } catch (error) {
    console.error("Error getting payment method:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin phương thức thanh toán",
      error: error.message,
    });
  }
};

// Tạo phương thức thanh toán mới
export const createPaymentMethod = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để thêm phương thức thanh toán",
      });
    }

    const {
      type,
      provider,
      card_number,
      card_holder_name,
      expiry_date,
      bank_name,
      account_number,
      account_holder_name,
      wallet_id,
      is_default,
    } = req.body;

    // Validation
    if (!type || !provider) {
      return res.status(400).json({
        success: false,
        message: "Loại và nhà cung cấp là bắt buộc",
      });
    }

    // Nếu set làm mặc định, bỏ mặc định của các phương thức khác
    if (is_default) {
      await PaymentMethod.updateMany(
        { user_id: userId },
        { is_default: false }
      );
    }

    // Mask card number nếu có
    let maskedCardNumber = null;
    if (card_number) {
      const last4 = card_number.slice(-4);
      maskedCardNumber = `**** **** **** ${last4}`;
    }

    // Mask account number nếu có
    let maskedAccountNumber = null;
    if (account_number) {
      const last4 = account_number.slice(-4);
      maskedAccountNumber = `****${last4}`;
    }

    const paymentMethod = new PaymentMethod({
      user_id: userId,
      type,
      provider,
      card_number: maskedCardNumber,
      card_holder_name,
      expiry_date,
      bank_name,
      account_number: maskedAccountNumber,
      account_holder_name,
      wallet_id,
      is_default: is_default || false,
    });

    await paymentMethod.save();

    res.status(201).json({
      success: true,
      message: "Đã thêm phương thức thanh toán thành công",
      data: paymentMethod,
    });
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm phương thức thanh toán",
      error: error.message,
    });
  }
};

// Cập nhật phương thức thanh toán
export const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để cập nhật phương thức thanh toán",
      });
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user_id: userId,
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương thức thanh toán",
      });
    }

    const {
      type,
      provider,
      card_number,
      card_holder_name,
      expiry_date,
      bank_name,
      account_number,
      account_holder_name,
      wallet_id,
      is_default,
    } = req.body;

    // Nếu set làm mặc định, bỏ mặc định của các phương thức khác
    if (is_default && !paymentMethod.is_default) {
      await PaymentMethod.updateMany(
        { user_id: userId, _id: { $ne: id } },
        { is_default: false }
      );
    }

    // Mask card number nếu có và thay đổi
    if (card_number && card_number !== paymentMethod.card_number) {
      const last4 = card_number.slice(-4);
      paymentMethod.card_number = `**** **** **** ${last4}`;
    }

    // Mask account number nếu có và thay đổi
    if (account_number && account_number !== paymentMethod.account_number) {
      const last4 = account_number.slice(-4);
      paymentMethod.account_number = `****${last4}`;
    }

    // Cập nhật các trường khác
    if (type) paymentMethod.type = type;
    if (provider) paymentMethod.provider = provider;
    if (card_holder_name !== undefined) paymentMethod.card_holder_name = card_holder_name;
    if (expiry_date !== undefined) paymentMethod.expiry_date = expiry_date;
    if (bank_name !== undefined) paymentMethod.bank_name = bank_name;
    if (account_holder_name !== undefined) paymentMethod.account_holder_name = account_holder_name;
    if (wallet_id !== undefined) paymentMethod.wallet_id = wallet_id;
    if (is_default !== undefined) paymentMethod.is_default = is_default;

    await paymentMethod.save();

    res.json({
      success: true,
      message: "Đã cập nhật phương thức thanh toán thành công",
      data: paymentMethod,
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật phương thức thanh toán",
      error: error.message,
    });
  }
};

// Xóa phương thức thanh toán (soft delete)
export const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xóa phương thức thanh toán",
      });
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user_id: userId,
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương thức thanh toán",
      });
    }

    // Soft delete
    paymentMethod.is_active = false;
    await paymentMethod.save();

    res.json({
      success: true,
      message: "Đã xóa phương thức thanh toán thành công",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa phương thức thanh toán",
      error: error.message,
    });
  }
};

// Đặt làm phương thức mặc định
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để đặt phương thức mặc định",
      });
    }

    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user_id: userId,
      is_active: true,
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương thức thanh toán",
      });
    }

    // Bỏ mặc định của tất cả phương thức khác
    await PaymentMethod.updateMany(
      { user_id: userId, _id: { $ne: id } },
      { is_default: false }
    );

    // Đặt làm mặc định
    paymentMethod.is_default = true;
    await paymentMethod.save();

    res.json({
      success: true,
      message: "Đã đặt làm phương thức thanh toán mặc định",
      data: paymentMethod,
    });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi đặt phương thức mặc định",
      error: error.message,
    });
  }
};

