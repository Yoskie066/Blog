import { supabase } from "../config/supabase.js";

export async function createBlog(req, res) {
    try {
        const { title, category, content, imageUrl = "" } = req.body;

        if (
            typeof title !== "string" ||
            typeof category !== "string" ||
            typeof content !== "string" ||
            !title.trim() ||
            !category.trim() ||
            !content.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, category, and content are required."
            });
        }

        if (title.trim().length > 120) {
            return res.status(400).json({
                success: false,
                message: "Title must not exceed 120 characters."
            });
        }

        if (typeof imageUrl !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid image."
            });
        }

        if (imageUrl) {
            const imagePattern =
                /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/]+=*$/;

            if (!imagePattern.test(imageUrl) || imageUrl.length > 3_000_000) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid image or image is too large."
                });
            }
        }

        // Insert blog into Supabase.
        const { data: blog, error } = await supabase
            .from("blogs")
            .insert({
                user_id: req.user.userId,
                title: title.trim(),
                category: category.trim(),
                content: content.trim(),
                image_url: imageUrl,
                status: "published"
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase create blog error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to save the blog."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Blog created successfully.",
            blog
        });

    } catch (error) {
        console.error("Create blog error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create blog."
        });
    }
}

export async function getMyBlogs(req, res) {
    try {
        const { data: blogs, error } = await supabase
            .from("blogs")
            .select("*")
            .eq("user_id", req.user.userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase get blogs error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve your blogs."
            });
        }

        return res.status(200).json({
            success: true,
            count: blogs.length,
            blogs
        });

    } catch (error) {
        console.error("Get blogs error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your blogs."
        });
    }
}

export async function getBlogById(req, res) {
    try {
        const { data: blog, error } = await supabase
            .from("blogs")
            .select("*")
            .eq("id", req.params.id)
            .eq("user_id", req.user.userId)
            .maybeSingle();

        if (error) {
            console.error("Supabase get blog by ID error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve the blog."
            });
        }

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found."
            });
        }

        return res.status(200).json({
            success: true,
            blog
        });

    } catch (error) {
        console.error("Get blog error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the blog."
        });
    }
}