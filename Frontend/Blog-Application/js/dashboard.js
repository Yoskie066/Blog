document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://localhost:3000/api/blogs";

    const userNameElement = document.getElementById("dashboard-user-name");
    const recentBlogsContainer = document.getElementById("recent-blogs");
    const emptyBlogsElement = document.getElementById("empty-blogs");

    // 1. Check login session.
    const token = sessionStorage.getItem("token");
    const savedUser = sessionStorage.getItem("user");

    if (!token || !savedUser) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.replace("./login.html");
        return;
    }

    let currentUser;

    try {
        currentUser = JSON.parse(savedUser);

        if (
            !currentUser ||
            typeof currentUser.email !== "string" ||
            !currentUser.email.trim()
        ) {
            throw new Error("Invalid user session.");
        }
    } catch (error) {
        console.error("Session error:", error);

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.replace("./login.html");
        return;
    }

    // 2. Display the user's name.
    const emailName = currentUser.email.split("@")[0];

    const formattedName = emailName
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

    if (userNameElement) {
        userNameElement.textContent = formattedName || "Blogger";
    }

    // 3. Format blog creation date.
    function formatDate(value) {
        if (!value) return "Recently created";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Recently created";
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    // 4. Shorten blog content for the preview.
    function truncate(text, maxLength = 110) {
        const cleanText = String(text || "")
            .replace(/\s+/g, " ")
            .trim();

        if (cleanText.length <= maxLength) {
            return cleanText;
        }

        return cleanText.slice(0, maxLength).trimEnd() + "...";
    }

    // 5. Display an empty state or error message.
    function showEmptyState(title, message) {
        if (!recentBlogsContainer || !emptyBlogsElement) return;

        recentBlogsContainer
            .querySelectorAll(".blog-item")
            .forEach((element) => element.remove());

        emptyBlogsElement.hidden = false;

        const heading = emptyBlogsElement.querySelector("h3");
        const paragraph = emptyBlogsElement.querySelector("p");

        if (heading) heading.textContent = title;
        if (paragraph) paragraph.textContent = message;
    }

    // 6. Create a blog card WITHOUT an image.
    function createBlogCard(blog) {
        const article = document.createElement("article");
        article.className = "blog-item";

        if (blog.id) {
            article.dataset.blogId = blog.id;
        }

        const details = document.createElement("div");
        details.className = "blog-details";

        // Blog title.
        const title = document.createElement("h3");
        title.className = "blog-title";
        title.textContent = blog.title || "Untitled Blog";

        details.appendChild(title);

        // Category and creation date.
        const meta = document.createElement("p");
        meta.className = "blog-meta";

        const metaParts = [];

        if (blog.category) {
            metaParts.push(blog.category);
        }

        metaParts.push(`Created ${formatDate(blog.createdAt)}`);

        meta.textContent = metaParts.join(" • ");
        details.appendChild(meta);

        // Blog content preview.
        const previewText = truncate(blog.content);

        if (previewText) {
            const preview = document.createElement("p");
            preview.className = "blog-preview";
            preview.textContent = previewText;

            details.appendChild(preview);
        }

        article.appendChild(details);

        // Blog status.
        const status = document.createElement("span");
        const blogStatus = String(
            blog.status || "published"
        ).toLowerCase();

        status.className = "blog-status";

        if (blogStatus === "draft") {
            status.classList.add("draft");
        }

        status.textContent =
            blogStatus.charAt(0).toUpperCase() + blogStatus.slice(1);

        article.appendChild(status);

        return article;
    }

    // 7. Render the five most recent blogs.
    function renderBlogs(blogs) {
        if (!recentBlogsContainer || !emptyBlogsElement) return;

        recentBlogsContainer
            .querySelectorAll(".blog-item")
            .forEach((element) => element.remove());

        if (!Array.isArray(blogs) || blogs.length === 0) {
            showEmptyState(
                "No blogs yet",
                "Your blog posts will appear here after you create them."
            );
            return;
        }

        emptyBlogsElement.hidden = true;

        const recentBlogs = [...blogs]
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();

                return dateB - dateA;
            })
            .slice(0, 5);

        recentBlogs.forEach((blog) => {
            recentBlogsContainer.appendChild(createBlogCard(blog));
        });
    }

    // 8. Fetch the logged-in user's blogs from the backend.
    try {
        const response = await fetch(`${API_URL}/my`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            window.location.replace("./login.html");
            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load your blogs."
            );
        }

        renderBlogs(data.blogs);
    } catch (error) {
        console.error("Dashboard blogs error:", error);

        showEmptyState(
            "Unable to load blogs",
            "Please check your backend server and refresh this page."
        );
    }
});
