import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import createBlogRoutes from "./routes/createBlogRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(cookieParser());

app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "BlogSpace API is working!"
    });
});

// Login and registration
app.use("/api/auth", authRoutes);

// Create and retrieve blogs
app.use("/api/blogs", createBlogRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
