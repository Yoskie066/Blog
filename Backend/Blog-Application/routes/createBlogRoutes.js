import express from "express";

import {
    createBlog,
    getMyBlogs,
    getBlogById,
    updateBlog,
    deleteBlog
} from "../controllers/createBlogController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All blog routes require authentication
router.use(authenticateToken);

// Create blog
router.post("/", createBlog);

// Read all blogs belonging to logged-in user
router.get("/my", getMyBlogs);

// Read all blogs 
router.get("/", getMyBlogs);

// Read single blog by ID
router.get("/:id", getBlogById);

// Update blog
router.put("/:id", updateBlog);

// Delete blog
router.delete("/:id", deleteBlog);

export default router;
