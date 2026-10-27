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

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured.");

        return res.status(500).json({
            success: false,
            message: "Server authentication is not configured."
        });
    }

    const token = authHeader.slice("Bearer ".length);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (
            !decoded ||
            typeof decoded.email !== "string" ||
            !decoded.email.trim()
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email.trim().toLowerCase()
        };

        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Your session is invalid or expired. Please log in again."
        });
    }
}

router.post("/", authenticateToken, createBlog);
router.get("/my", authenticateToken, getMyBlogs);
router.get("/:id", authenticateToken, getBlogById);

export default router;
