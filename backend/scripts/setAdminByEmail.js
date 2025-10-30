import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const setAdminByEmail = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce");
    console.log("✅ Connected to MongoDB");

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ Không tìm thấy user với email: ${email}`);
      return;
    }

    console.log(`📋 User hiện tại: ${user.name} (${user.email}) - Role: ${user.role || 'user'}`);

    // Update role to admin
    await User.findByIdAndUpdate(user._id, { role: 'admin' });
    console.log(`✅ Đã set role 'admin' cho user: ${user.name} (${user.email})`);

    // Verify update
    const updatedUser = await User.findById(user._id);
    console.log(`✅ Xác nhận: ${updatedUser.name} (${updatedUser.email}) - Role: ${updatedUser.role}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log("❌ Vui lòng cung cấp email:");
  console.log("Usage: node setAdminByEmail.js <email>");
  console.log("Example: node setAdminByEmail.js admin@example.com");
  process.exit(1);
}

// Run the script
setAdminByEmail(email);
