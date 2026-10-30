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

app.use(express.json({
    limit: "5mb"
}));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BlogSpace API is working!"
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Blog routes
app.use("/api/blogs", createBlogRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
