import express from "express";
import { registerUser, loginUser, logoutUser, getUsers, getUserById, getMe } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/users", getUsers);
router.get("/users/me", auth, getMe);
router.get("/users/:id", getUserById);

export default router;
