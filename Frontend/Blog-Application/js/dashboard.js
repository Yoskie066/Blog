document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://127.0.0.1:3000/api/blogs";
    const LOGIN_URL = "./login.html";

    const userNameElement = document.getElementById("dashboard-user-name");
    const recentBlogsContainer = document.getElementById("recent-blogs");
    const emptyBlogsElement = document.getElementById("empty-blogs");

    const savedUser = sessionStorage.getItem("user");

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

    if (userNameElement) {
        userNameElement.textContent = currentUser.email;
    }

    let blogs = [];

    // Create HTML elements safely.
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

    // Get a valid access token.
    async function getAccessToken() {
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

        if (!token) {
            throw new Error("Unable to obtain an access token.");
        }

        return token;
    }

    // Send authenticated API requests.
    async function apiRequest(url, options = {}) {
        let token = await getAccessToken();

        const makeRequest = () => fetch(url, {
            ...options,
            headers: {
                ...(options.body ? {
                    "Content-Type": "application/json"
                } : {}),
                ...options.headers,
                "Authorization": `Bearer ${token}`
            },
            credentials: "include"
        });

        let response = await makeRequest();

        // Refresh expired access token and retry once.
        if (response.status === 401) {
            const refreshed = await window.refreshAccessToken?.();

            if (!refreshed) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            token = sessionStorage.getItem("accessToken");

            if (!token) {
                throw new Error("Unable to refresh your session.");
            }

            response = await makeRequest();
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
            throw new Error(
                data.message || "Something went wrong. Please try again."
            );
        }

        return data;
    }

    // Load logged-in user's blogs.
    async function fetchMyBlogs() {
        const data = await apiRequest(`${API_URL}/my`);

        return data.blogs || [];
    }

    // Preview modal.
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

        const category = createElement("span", "blog-preview-category");
        const title = createElement("h2", "blog-preview-title");
        const date = createElement("p", "blog-preview-date");

        title.id = "preview-blog-title";

        const divider = document.createElement("div");
        divider.className = "blog-preview-divider";

        const content = createElement("div", "blog-preview-content");

        details.append(category, title, date, divider, content);
        body.append(image, details);

        // Preview action buttons.
        const actions = createElement("div", "blog-preview-actions");

        const updateButton = createElement(
            "button",
            "blog-update-button",
            "Update Blog"
        );

        updateButton.type = "button";

        const deleteButton = createElement(
            "button",
            "blog-delete-button",
            "Delete Blog"
        );

        deleteButton.type = "button";

        actions.append(updateButton, deleteButton);

        modal.append(header, body, actions);
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
            closeButton,
            updateButton,
            deleteButton,
            closeModal
        };
    }

    const previewModal = createPreviewModal();

    let selectedBlog = null;

    // Open blog preview.
    function openBlogPreview(blog) {
        selectedBlog = blog;

        previewModal.category.textContent =
            blog.category || "Uncategorized";

        previewModal.title.textContent =
            blog.title || "Untitled Blog";

        previewModal.date.textContent =
            `Published on ${formatDate(blog.created_at)}`;

        previewModal.content.textContent =
            blog.content || "No content available.";

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

    // Update button: navigate to Create Blog page.
    previewModal.updateButton.addEventListener("click", () => {
        if (!selectedBlog?.id) {
            alert("Unable to identify this blog.");
            return;
        }

        window.location.href =
            `./create-blog.html?edit=${encodeURIComponent(selectedBlog.id)}`;
    });

    // Delete button: delete blog from database.
    previewModal.deleteButton.addEventListener("click", async () => {
        if (!selectedBlog?.id) {
            alert("Unable to identify this blog.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${selectedBlog.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        const blogId = selectedBlog.id;

        previewModal.deleteButton.disabled = true;
        previewModal.deleteButton.textContent = "Deleting...";

        try {
            await apiRequest(`${API_URL}/${encodeURIComponent(blogId)}`, {
                method: "DELETE"
            });

            // Remove deleted blog from local data.
            blogs = blogs.filter((blog) => blog.id !== blogId);

            // Close preview and update dashboard.
            previewModal.closeModal();
            renderBlogs(blogs);

            console.log("Blog deleted successfully:", blogId);

        } catch (error) {
            console.error("Delete blog error:", error);

            alert(error.message || "Unable to delete blog.");

        } finally {
            previewModal.deleteButton.disabled = false;
            previewModal.deleteButton.textContent = "Delete Blog";
        }
    });

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

        const arrow = createElement("span", "blog-card-arrow", "→");

        footer.append(previewText, arrow);

        card.append(cardTop, title, content, footer);

        card.addEventListener("click", () => {
            openBlogPreview(blog);
        });

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openBlogPreview(blog);
            }
        });

        return card;
    }

    // Render latest 5 blogs.
    function renderBlogs(blogList) {
        if (!recentBlogsContainer) return;

        recentBlogsContainer
            .querySelectorAll(".blog-card")
            .forEach((card) => card.remove());

        recentBlogsContainer
            .querySelectorAll(".error-message")
            .forEach((message) => message.remove());

        if (!blogList.length) {
            if (emptyBlogsElement) {
                emptyBlogsElement.hidden = false;
            }

            return;
        }

        if (emptyBlogsElement) {
            emptyBlogsElement.hidden = true;
        }

        const recentBlogs = [...blogList]
            .sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            })
            .slice(0, 5);

        recentBlogs.forEach((blog) => {
            recentBlogsContainer.appendChild(createBlogCard(blog));
        });
    }

    // Load blogs.
    try {
        blogs = await fetchMyBlogs();

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
