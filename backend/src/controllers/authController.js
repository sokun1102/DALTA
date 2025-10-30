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