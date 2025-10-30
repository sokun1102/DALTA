import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce");
    console.log("✅ Connected to MongoDB");

    // Get all users
    const users = await User.find({}).select('name email role createdAt');
    
    console.log("\n📋 Danh sách tất cả users:");
    console.log("=" .repeat(80));
    
    if (users.length === 0) {
      console.log("❌ Không có user nào trong database");
    } else {
      users.forEach((user, index) => {
        const roleDisplay = user.role === 'admin' ? '🔴 ADMIN' : '👤 USER';
        const createdDate = new Date(user.createdAt).toLocaleDateString('vi-VN');
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🎭 Role: ${roleDisplay}`);
        console.log(`   📅 Created: ${createdDate}`);
        console.log("-".repeat(50));
      });
    }

    console.log(`\n📊 Tổng cộng: ${users.length} users`);
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user' || !u.role).length;
    console.log(`   🔴 Admin: ${adminCount}`);
    console.log(`   👤 User: ${userCount}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
listUsers();
