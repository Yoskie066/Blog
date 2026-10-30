import express from "express";

import {
    register,
    login,
    refresh,
    logout
} from "../controllers/authController.js";

const router = express.Router();

// =====================================
// AUTHENTICATION ROUTES
// =====================================

// User Registration
router.post("/register", register);

// User Login
router.post("/login", login);

// Refresh Access Token
router.post("/refresh", refresh);

// User Logout
router.post("/logout", logout);

export default router;
