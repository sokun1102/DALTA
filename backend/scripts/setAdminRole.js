import mongoose from "mongoose";
import User from "../src/models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const setAdminRole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce");
    console.log("✅ Connected to MongoDB");

    // Get all users
    const users = await User.find({});
    console.log("\n📋 Danh sách users hiện có:");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role || 'user'}`);
    });

    // Set first user as admin (or you can specify email)
    if (users.length > 0) {
      const firstUser = users[0];
      await User.findByIdAndUpdate(firstUser._id, { role: 'admin' });
      console.log(`\n✅ Đã set role 'admin' cho user: ${firstUser.name} (${firstUser.email})`);
    } else {
      console.log("❌ Không có user nào trong database");
    }

    // Show updated users
    console.log("\n📋 Danh sách users sau khi cập nhật:");
    const updatedUsers = await User.find({});
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
setAdminRole();
