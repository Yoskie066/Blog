import express from "express";
import { register,login,refresh,logout } from "../controllers/authController.js";

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Refresh Access Token
router.post("/refresh", refresh);

// Logout
router.post("/logout", logout);

export default router;