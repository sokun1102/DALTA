import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 👉 Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone_number, password } = req.body;
    
    // Validation chi tiết hơn
    if (!name || !email || !phone_number || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all fields",
        missing_fields: {
          name: !name,
          email: !email,
          phone_number: !phone_number,
          password: !password
        }
      });
    }

    // Kiểm tra email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already exists" });

    // Kiểm tra password có tồn tại và là string
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      name, 
      email, 
      phone_number, 
      password_hash,
      addresses: [],
      payment_methods: []
    });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email,
        phone_number: newUser.phone_number
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Login
export const loginUser = async (req, res) => {
  try {
    console.log("🔍 Login request received:", { email: req.body.email, password: req.body.password ? "***" : "undefined" });
    
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("❌ Missing fields:", { email: !!email, password: !!password });
      return res.status(400).json({ success: false, message: "Please provide email & password" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      success: true,
      message: "Login successful",
      data: { 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email,
          phone_number: user.phone_number,
          role: user.role
        } 
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Logout
export const logoutUser = (req, res) => {
  res.json({ success: true, message: "Logout successful (delete token on client)" });
};

// 👉 Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    if (!users.length) return res.status(404).json({ success: false, message: "No users found" });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Get single user
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Get current user (me)
export const getMe = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await User.findById(req.userId).select("-password_hash");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Update current user profile
export const updateProfile = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, email, phone_number, password, avatar } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Cập nhật các trường nếu có
    if (name !== undefined) user.name = name;
    if (phone_number !== undefined) user.phone_number = phone_number;
    if (avatar !== undefined) user.avatar = avatar;

    // Kiểm tra email nếu có thay đổi
    if (email !== undefined && email !== user.email) {
      // Kiểm tra email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.userId) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }

      user.email = email;
    }

    // Cập nhật password nếu có
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: { avatar: avatarPath }
    });
  } catch (err) {
    console.error("Error uploading avatar:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Get addresses
export const getAddresses = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: user.addresses || []
    });
  } catch (err) {
    console.error("Error getting addresses:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Add address
export const addAddress = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, phone, street, ward, district, city, zip, is_default } = req.body;

    if (!name || !phone || !street || !city) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, phone, street, and city"
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Nếu set làm default, bỏ default của các địa chỉ khác
    if (is_default) {
      user.addresses.forEach(addr => {
        addr.is_default = false;
      });
    }

    const newAddress = {
      name,
      phone,
      street,
      ward: ward || "",
      district: district || "",
      city,
      zip: zip || "",
      is_default: is_default || false
    };

    user.addresses.push(newAddress);
    await user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      data: user.addresses[user.addresses.length - 1]
    });
  } catch (err) {
    console.error("Error adding address:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Update address
export const updateAddress = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { addressId } = req.params;
    const { name, phone, street, ward, district, city, zip, is_default } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Nếu set làm default, bỏ default của các địa chỉ khác
    if (is_default) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.is_default = false;
        }
      });
    }

    if (name !== undefined) address.name = name;
    if (phone !== undefined) address.phone = phone;
    if (street !== undefined) address.street = street;
    if (ward !== undefined) address.ward = ward;
    if (district !== undefined) address.district = district;
    if (city !== undefined) address.city = city;
    if (zip !== undefined) address.zip = zip;
    if (is_default !== undefined) address.is_default = is_default;

    await user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      data: address
    });
  } catch (err) {
    console.error("Error updating address:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 👉 Delete address
export const deleteAddress = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { addressId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.pull(addressId);
    await user.save();

    res.json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};