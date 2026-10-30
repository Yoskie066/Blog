import {
    createBlogModel,
    getMyBlogsModel,
    getBlogByIdModel,
    updateBlogModel,
    deleteBlogModel
} from "../models/blogModel.js";

// =====================================
// CREATE BLOG
// =====================================

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

        const { data: blog, error } = await createBlogModel({
            user_id: req.user.userId,
            title: title.trim(),
            category: category.trim(),
            content: content.trim(),
            image_url: imageUrl,
            status: "published"
        });

        if (error) {
            console.error("Create blog database error:", error);

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

// =====================================
// GET MY BLOGS
// =====================================

export async function getMyBlogs(req, res) {
    try {
        const { data: blogs, error } =
            await getMyBlogsModel(req.user.userId);

        if (error) {
            console.error("Get blogs database error:", error);

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

// =====================================
// GET BLOG BY ID
// =====================================

export async function getBlogById(req, res) {
    try {
        const { data: blog, error } =
            await getBlogByIdModel(
                req.params.id,
                req.user.userId
            );

        if (error) {
            console.error("Get blog database error:", error);

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

// =====================================
// UPDATE BLOG
// =====================================

export async function updateBlog(req, res) {
    try {
        const { title, category, content, imageUrl } = req.body;

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

        if (
            imageUrl !== undefined &&
            (typeof imageUrl !== "string" ||
                (imageUrl !== "" &&
                    (!/^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/]+=*$/.test(imageUrl) ||
                    imageUrl.length > 3_000_000)))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid image or image is too large."
            });
        }

        const blogData = {
            title: title.trim(),
            category: category.trim(),
            content: content.trim()
        };

        if (imageUrl !== undefined) {
            blogData.image_url = imageUrl;
        }

        const { data: blog, error } = await updateBlogModel(
            req.params.id,
            req.user.userId,
            blogData
        );

        if (error) {
            console.error("Update blog database error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update the blog."
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
            message: "Blog updated successfully.",
            blog
        });

    } catch (error) {
        console.error("Update blog error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update the blog."
        });
    }
}

// =====================================
// DELETE BLOG
// =====================================

export async function deleteBlog(req, res) {
    try {
        const { data: blog, error } = await deleteBlogModel(
            req.params.id,
            req.user.userId
        );

        if (error) {
            console.error("Delete blog database error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete the blog."
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
            message: "Blog deleted successfully."
        });

    } catch (error) {
        console.error("Delete blog error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the blog."
        });
    }
}
