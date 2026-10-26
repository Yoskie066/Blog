document.addEventListener("DOMContentLoaded", () => {
    const CURRENT_USER_KEY = "blogspace_current_user";
    const BLOGS_KEY = "blogspace_blogs";

    /* ---------------------------------------------------
       ELEMENT REFERENCES
    --------------------------------------------------- */

    const userNameElement = document.getElementById("dashboard-user-name");
    const recentBlogsContainer = document.getElementById("recent-blogs");
    const emptyBlogsElement = document.getElementById("empty-blogs");

    /* ---------------------------------------------------
       USER SESSION
    --------------------------------------------------- */

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            if (!raw) return null;

            const user = JSON.parse(raw);

            if (
                !user ||
                typeof user.email !== "string" ||
                !user.email.trim()
            ) {
                return null;
            }

            return { email: user.email.trim().toLowerCase() };
        } catch (error) {
            console.error("Error reading user session:", error);
            return null;
        }
    }

    /* ---------------------------------------------------
       LOCAL STORAGE 
    --------------------------------------------------- */

    function getBlogs() {
        try {
            const raw = localStorage.getItem(BLOGS_KEY);
            if (!raw) return [];

            const blogs = JSON.parse(raw);
            return Array.isArray(blogs) ? blogs : [];
        } catch (error) {
            console.error("Error reading saved blogs:", error);
            return [];
        }
    }

    /* ---------------------------------------------------
       HELPERS
    --------------------------------------------------- */

    function getBlogOwnerEmail(blog) {
        return String(
            blog.email ||
            blog.userEmail ||
            blog.authorEmail ||
            ""
        ).toLowerCase();
    }

    function getBlogStatus(blog) {
        return String(blog.status || "published").toLowerCase();
    }

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "recently";

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function truncate(text, maxLength = 110) {
        const clean = String(text || "").replace(/\s+/g, " ").trim();
        if (clean.length <= maxLength) return clean;
        return clean.slice(0, maxLength).trimEnd() + "…";
    }

    /* ---------------------------------------------------
       AUTH
    --------------------------------------------------- */

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const currentEmail = currentUser.email;

    /* ---------------------------------------------------
       GREETING
    --------------------------------------------------- */

    const emailName = currentEmail.split("@")[0];
    const formattedName = emailName
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

    if (userNameElement) {
        userNameElement.textContent = formattedName || "Blogger";
    }

    /* ---------------------------------------------------
       RECENT BLOGS
    --------------------------------------------------- */

    const userBlogs = getBlogs().filter(
        (blog) => getBlogOwnerEmail(blog) === currentEmail
    );

    function renderRecentBlogs(blogs) {
        if (!recentBlogsContainer) return;

        recentBlogsContainer
            .querySelectorAll(".blog-item")
            .forEach((el) => el.remove());

        if (blogs.length === 0) {
            if (emptyBlogsElement) emptyBlogsElement.hidden = false;
            return;
        }

        if (emptyBlogsElement) emptyBlogsElement.hidden = true;

        const recentBlogs = [...blogs]
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, 5);

        recentBlogs.forEach((blog) => {
            const article = document.createElement("article");
            article.className = "blog-item";
            article.dataset.blogId = blog.id || "";

            const details = document.createElement("div");
            details.className = "blog-details";

            const title = document.createElement("h3");
            title.textContent = blog.title || "Untitled Blog";
            details.appendChild(title);

            const metaParts = [];
            if (blog.category) metaParts.push(blog.category);
            if (blog.createdAt) {
                metaParts.push(`Created ${formatDate(blog.createdAt)}`);
            }

            if (metaParts.length) {
                const meta = document.createElement("p");
                meta.className = "blog-meta";
                meta.textContent = metaParts.join(" • ");
                details.appendChild(meta);
            }

            const previewText = truncate(blog.content, 110);
            if (previewText) {
                const preview = document.createElement("p");
                preview.className = "blog-preview";
                preview.textContent = previewText;
                details.appendChild(preview);
            }

            const blogStatus = getBlogStatus(blog);

            const status = document.createElement("span");
            status.className = "blog-status";
            if (blogStatus === "draft") status.classList.add("draft");
            status.textContent = blogStatus;

            article.appendChild(details);
            article.appendChild(status);

            recentBlogsContainer.appendChild(article);
        });
    }

    renderRecentBlogs(userBlogs);
});