import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce";

const targetId = "68f0651313ae56acf698fd9d";

async function checkId() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const collections = [
      "users",
      "products",
      "orders",
      "carts",
      "categories",
      "paymentmethods",
      "vouchers",
      "reviews",
      "promotions"
    ];

    console.log(`🔍 Searching for ID: ${targetId}\n`);
    console.log("=" .repeat(60));

    let found = false;

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(targetId) });
        
        if (doc) {
          found = true;
          console.log(`\n✅ FOUND in collection: ${collectionName.toUpperCase()}`);
          console.log("-".repeat(60));
          console.log(JSON.stringify(doc, null, 2));
          console.log("-".repeat(60));
        }
      } catch (err) {
        // Collection might not exist or ID format error
        if (err.message.includes("ObjectId")) {
          // Try as string
          try {
            const collection = mongoose.connection.db.collection(collectionName);
            const doc = await collection.findOne({ _id: targetId });
            if (doc) {
              found = true;
              console.log(`\n✅ FOUND in collection: ${collectionName.toUpperCase()} (as string)`);
              console.log("-".repeat(60));
              console.log(JSON.stringify(doc, null, 2));
              console.log("-".repeat(60));
            }
          } catch (e) {
            // Skip
          }
        }
      }
    }

    if (!found) {
      console.log("\n❌ ID not found in any collection");
      console.log("\nChecked collections:");
      collections.forEach(col => console.log(`  - ${col}`));
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkId();

