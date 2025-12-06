import express from "express";
import {
  getProductReviews,
  getUserReview,
  createOrUpdateReview,
  deleteReview
} from "../controllers/reviewController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all reviews for a product (public)
router.get("/product/:productId", getProductReviews);

// Get user's review for a product (authenticated)
router.get("/product/:productId/user", auth, getUserReview);

// Create or update review (authenticated)
router.post("/product/:productId", auth, createOrUpdateReview);

// Delete review (authenticated)
router.delete("/:reviewId", auth, deleteReview);

export default router;

