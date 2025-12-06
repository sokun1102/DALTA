import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log("getProductReviews - productId:", productId);
    
    // Validate productId
    if (!productId) {
      console.error("getProductReviews - productId is missing");
      return res.status(400).json({ 
        success: false, 
        message: "Product ID is required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("getProductReviews - Invalid productId format:", productId);
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID format" 
      });
    }

    // Convert productId to ObjectId if it's a string
    const productObjectId = mongoose.Types.ObjectId.isValid(productId) 
      ? new mongoose.Types.ObjectId(productId) 
      : productId;

    const reviews = await Review.find({ product_id: productObjectId })
      .populate({
        path: 'user_id',
        select: 'name email avatar',
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out reviews with deleted users
    const validReviews = (reviews || []).filter(review => review && review.user_id !== null);

    res.json({
      success: true,
      data: validReviews
    });
  } catch (err) {
    console.error("Error in getProductReviews:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: "Failed to load reviews"
    });
  }
};

// Get user's review for a product
export const getUserReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId || req.user?._id;

    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }

    const review = await Review.findOne({ 
      product_id: productId, 
      user_id: userId 
    }).populate({
      path: 'user_id',
      select: 'name email avatar',
      options: { lean: true }
    }).lean();

    res.json({
      success: true,
      data: review || null
    });
  } catch (err) {
    console.error("Error in getUserReview:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: "Failed to load user review"
    });
  }
};

// Create or update review
export const createOrUpdateReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId || req.user?._id;
    const { rating, comment } = req.body;

    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }

    if (!rating || !comment) {
      return res.status(400).json({ 
        success: false, 
        message: "Rating and comment are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Rating must be between 1 and 5" 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Check if user has purchased this product (for verified purchase)
    const hasPurchased = await Order.findOne({
      user_id: userId,
      status: 'delivered',
      'items.product_id': productId
    });

    // Check if review already exists
    let review = await Review.findOne({ 
      product_id: productId, 
      user_id: userId 
    });

    let isNew = false;
    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      review.verified_purchase = hasPurchased ? true : review.verified_purchase;
      await review.save();
    } else {
      // Create new review
      isNew = true;
      review = new Review({
        user_id: userId,
        product_id: productId,
        rating,
        comment,
        verified_purchase: hasPurchased ? true : false
      });
      await review.save();
    }

    const populatedReview = await Review.findById(review._id)
      .populate({
        path: 'user_id',
        select: 'name email avatar',
        options: { lean: true }
      })
      .lean();

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? "Review created successfully" : "Review updated successfully",
      data: populatedReview
    });
  } catch (err) {
    console.error("Error in createOrUpdateReview:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      message: "Failed to create/update review"
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId || req.user?._id;

    const review = await Review.findOne({ 
      _id: reviewId, 
      user_id: userId 
    });

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Review not found or you don't have permission to delete it" 
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

