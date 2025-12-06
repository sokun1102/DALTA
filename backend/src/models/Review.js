// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    product_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { type: String, required: true },
    verified_purchase: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

// Indexes để tối ưu queries
reviewSchema.index({ product_id: 1 }); // Tìm reviews theo product
reviewSchema.index({ user_id: 1 }); // Tìm reviews của user
// Compound index để đảm bảo 1 user chỉ review 1 product 1 lần
reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
// Index để sort reviews mới nhất
reviewSchema.index({ product_id: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
