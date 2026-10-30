import express from "express";
import jwt from "jsonwebtoken";

import {
    createBlog,
    getMyBlogs,
    getBlogById
} from "../controllers/createBlogController.js";

const router = express.Router();

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Please log in to continue."
        });
    }

    if (!process.env.JWT_ACCESS_SECRET) {
        console.error("JWT_ACCESS_SECRET is not configured.");

        return res.status(500).json({
            success: false,
            message: "Server authentication is not configured."
        });
    }

    const token = authHeader.slice("Bearer ".length);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        if (
            !decoded ||
            typeof decoded.userId !== "string" ||
            typeof decoded.email !== "string"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email.trim().toLowerCase()
        };

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Your session is invalid or expired. Please log in again."
        });
    }
}

// Create a blog.
router.post("/", authenticateToken, createBlog);

// Get all blogs owned by the logged-in user.
router.get("/my", authenticateToken, getMyBlogs);

// Get one blog owned by the logged-in user.
router.get("/:id", authenticateToken, getBlogById);

export default router;