
const blogs = [];

export function createBlog(req, res) {
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

        if (imageUrl !== "") {
            const imagePattern =
                /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/]+=*$/;

            if (
                typeof imageUrl !== "string" ||
                !imagePattern.test(imageUrl) ||
                imageUrl.length > 3_000_000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid image or image is too large."
                });
            }
        }

        const now = new Date().toISOString();

        const blog = {
            id: crypto.randomUUID(),
            title: title.trim(),
            category: category.trim(),
            content: content.trim(),
            imageUrl,
            email: req.user.email,
            status: "published",
            createdAt: now,
            updatedAt: now
        };

        blogs.unshift(blog);

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

export function getMyBlogs(req, res) {
    try {
        const userBlogs = blogs.filter(
            (blog) => blog.email === req.user.email
        );

        return res.status(200).json({
            success: true,
            count: userBlogs.length,
            blogs: userBlogs
        });
    } catch (error) {
        console.error("Get blogs error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your blogs."
        });
    }
}

export function getBlogById(req, res) {
    try {
        const blog = blogs.find((item) => item.id === req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found."
            });
        }

        if (blog.email !== req.user.email) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to view this blog."
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
