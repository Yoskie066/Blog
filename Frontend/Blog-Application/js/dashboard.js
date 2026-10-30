document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://127.0.0.1:3000/api/blogs";
    const LOGIN_URL = "./login.html";

    const userNameElement = document.getElementById("dashboard-user-name");
    const recentBlogsContainer = document.getElementById("recent-blogs");
    const emptyBlogsElement = document.getElementById("empty-blogs");

    const savedUser = sessionStorage.getItem("user");

    // Check logged-in user.
    if (!savedUser) {
        sessionStorage.removeItem("accessToken");
        window.location.replace(LOGIN_URL);
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
        console.error("Invalid user session:", error);

        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("user");

        window.location.replace(LOGIN_URL);
        return;
    }

    // Display user's email.
    if (userNameElement) {
        userNameElement.textContent = currentUser.email;
    }

    // Create an HTML element safely.
    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    // Format database date.
    function formatDate(dateValue) {
        if (!dateValue) return "Date unavailable";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    // Get a valid access token and fetch user's blogs.
    async function fetchMyBlogs() {
        let token = sessionStorage.getItem("accessToken");

        if (!token) {
            const refreshed = await window.refreshAccessToken?.();

            if (!refreshed) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            token = sessionStorage.getItem("accessToken");
        }

        let response = await fetch(`${API_URL}/my`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            credentials: "include"
        });

        // Refresh and retry if access token expired.
        if (response.status === 401) {
            const refreshed = await window.refreshAccessToken?.();

            if (!refreshed) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            token = sessionStorage.getItem("accessToken");

            response = await fetch(`${API_URL}/my`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include"
            });
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load your blogs.");
        }

        return data.blogs || [];
    }

    // Create blog preview modal.
    function createPreviewModal() {
        const overlay = createElement("div", "blog-preview-overlay");
        overlay.id = "blog-preview-overlay";
        overlay.setAttribute("aria-hidden", "true");

        const modal = createElement("div", "blog-preview-modal");
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "preview-blog-title");

        const header = createElement("div", "blog-preview-header");

        const headerLabel = createElement(
            "span",
            "blog-preview-label",
            "BLOGSPACE / BLOG PREVIEW"
        );

        const closeButton = createElement(
            "button",
            "blog-preview-close",
            "×"
        );

        closeButton.type = "button";
        closeButton.setAttribute("aria-label", "Close blog preview");

        header.append(headerLabel, closeButton);

        const body = createElement("div", "blog-preview-body");

        const image = document.createElement("img");
        image.className = "blog-preview-image";
        image.alt = "Blog cover image";
        image.hidden = true;

        const details = createElement("div", "blog-preview-details");

        const category = createElement(
            "span",
            "blog-preview-category"
        );

        const title = createElement("h2", "blog-preview-title");
        title.id = "preview-blog-title";

        const date = createElement("p", "blog-preview-date");

        const divider = document.createElement("div");
        divider.className = "blog-preview-divider";

        const content = createElement("div", "blog-preview-content");

        details.append(category, title, date, divider, content);
        body.append(image, details);
        modal.append(header, body);
        overlay.appendChild(modal);

        document.body.appendChild(overlay);

        function closeModal() {
            overlay.classList.remove("active");
            overlay.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
        }

        closeButton.addEventListener("click", closeModal);

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (
                event.key === "Escape" &&
                overlay.classList.contains("active")
            ) {
                closeModal();
            }
        });

        return {
            overlay,
            image,
            category,
            title,
            date,
            content,
            closeButton
        };
    }

    const previewModal = createPreviewModal();

    // Open blog preview.
    function openBlogPreview(blog) {
        previewModal.category.textContent = blog.category || "Uncategorized";
        previewModal.title.textContent = blog.title || "Untitled Blog";
        previewModal.date.textContent =
            `Published on ${formatDate(blog.created_at)}`;

        previewModal.content.textContent = blog.content || "";

        // Display image only inside the preview modal.
        if (blog.image_url) {
            previewModal.image.src = blog.image_url;
            previewModal.image.alt = blog.title || "Blog cover image";
            previewModal.image.hidden = false;
        } else {
            previewModal.image.removeAttribute("src");
            previewModal.image.hidden = true;
        }

        previewModal.overlay.classList.add("active");
        previewModal.overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");

        previewModal.closeButton.focus();
    }

    // Create clickable blog card.
    function createBlogCard(blog) {
        const card = createElement("article", "blog-card");

        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute(
            "aria-label",
            `Preview blog: ${blog.title || "Untitled Blog"}`
        );

        const cardTop = createElement("div", "blog-card-top");

        const category = createElement(
            "span",
            "blog-card-category",
            blog.category || "Uncategorized"
        );

        const date = createElement(
            "span",
            "blog-card-date",
            formatDate(blog.created_at)
        );

        cardTop.append(category, date);

        const title = createElement(
            "h3",
            "blog-card-title",
            blog.title || "Untitled Blog"
        );

        const content = createElement(
            "p",
            "blog-card-content",
            blog.content
                ? blog.content.length > 160
                    ? `${blog.content.slice(0, 160)}...`
                    : blog.content
                : "No content available."
        );

        const footer = createElement("div", "blog-card-footer");

        const previewText = createElement(
            "span",
            "blog-card-preview-text",
            "Read blog"
        );

        const arrow = createElement(
            "span",
            "blog-card-arrow",
            "→"
        );

        footer.append(previewText, arrow);

        card.append(cardTop, title, content, footer);

        // Mouse click.
        card.addEventListener("click", () => {
            openBlogPreview(blog);
        });

        // Keyboard accessibility.
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openBlogPreview(blog);
            }
        });

        return card;
    }

    // Render recent blogs.
    function renderBlogs(blogs) {
        if (!recentBlogsContainer) return;

        // Remove old blog cards without removing the empty state.
        recentBlogsContainer
            .querySelectorAll(".blog-card")
            .forEach((card) => card.remove());

        if (!blogs.length) {
            if (emptyBlogsElement) {
                emptyBlogsElement.hidden = false;
            }

            return;
        }

        if (emptyBlogsElement) {
            emptyBlogsElement.hidden = true;
        }

        // Show latest 5 blogs.
        const recentBlogs = blogs.slice(0, 5);

        recentBlogs.forEach((blog) => {
            const card = createBlogCard(blog);
            recentBlogsContainer.appendChild(card);
        });
    }

    // Load blogs from Supabase through the backend.
    try {
        const blogs = await fetchMyBlogs();

        renderBlogs(blogs);

        console.log("Blogs loaded successfully:", blogs.length);

    } catch (error) {
        console.error("Dashboard error:", error);

        if (
            error.message.includes("session has expired") ||
            error.message.includes("Please log in")
        ) {
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("user");

            window.location.replace(LOGIN_URL);
            return;
        }

        if (recentBlogsContainer) {
            recentBlogsContainer
                .querySelectorAll(".blog-card")
                .forEach((card) => card.remove());

            if (emptyBlogsElement) {
                emptyBlogsElement.hidden = true;
            }

            recentBlogsContainer.appendChild(
                createElement(
                    "p",
                    "error-message",
                    error.message || "Unable to load blogs."
                )
            );
        }
    }
});