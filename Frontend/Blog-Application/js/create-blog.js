document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://127.0.0.1:3000/api/blogs";
    const LOGIN_URL = "./login.html";

    const form = document.getElementById("create-blog-form");

    const titleInput = document.getElementById("blog-title");
    const categoryInput = document.getElementById("blog-category");
    const contentInput = document.getElementById("blog-content");
    const imageInput = document.getElementById("blog-image");
    const titleCounter = document.getElementById("title-counter");

    const fileDropzone = document.getElementById("file-dropzone");
    const fileDropzoneTitle = document.getElementById("file-dropzone-title");
    const imagePreviewContainer = document.getElementById("image-preview-container");
    const imagePreview = document.getElementById("image-preview");
    const removeImageBtn = document.getElementById("remove-image");

    const submitButton = document.getElementById("submit-button");
    const messageElement = document.getElementById("form-message");

    const pageTitle = document.querySelector(".page-header h1");
    const pageDescription = document.querySelector(".page-description");

    const TITLE_MAX = 120;
    const IMAGE_MAX_SIZE = 2 * 1024 * 1024;

    const IMAGE_ALLOWED_TYPES = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp"
    ];

    // Check whether the page is in edit mode.
    const urlParams = new URLSearchParams(window.location.search);
    const editBlogId = urlParams.get("edit");

    let currentImageDataUrl = "";
    let isEditMode = Boolean(editBlogId);

    if (
        !form ||
        !titleInput ||
        !categoryInput ||
        !contentInput ||
        !imageInput ||
        !submitButton ||
        !messageElement
    ) {
        console.error("Create Blog form is missing required HTML elements.");
        return;
    }

    // Check login session.
    const savedUser = sessionStorage.getItem("user");

    if (!savedUser) {
        sessionStorage.removeItem("accessToken");
        window.location.replace(LOGIN_URL);
        return;
    }

    try {
        const user = JSON.parse(savedUser);

        if (
            !user ||
            typeof user.email !== "string" ||
            !user.email.trim()
        ) {
            throw new Error("Invalid user session.");
        }
    } catch (error) {
        console.error("Invalid login session:", error);

        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("user");

        window.location.replace(LOGIN_URL);
        return;
    }

    // Show form message.
    function showMessage(message, type = "error") {
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.hidden = false;
    }

    function hideMessage() {
        messageElement.textContent = "";
        messageElement.className = "form-message";
        messageElement.hidden = true;
    }

    // Update title character counter.
    function updateTitleCounter() {
        if (titleCounter) {
            titleCounter.textContent =
                `${titleInput.value.length} / ${TITLE_MAX} characters`;
        }
    }

    titleInput.addEventListener("input", updateTitleCounter);
    updateTitleCounter();

    // Get valid access token.
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

    // Reusable authenticated API request.
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

    // Display selected image.
    function setImagePreview(imageUrl) {
        currentImageDataUrl = imageUrl;

        if (imagePreview && imagePreviewContainer) {
            imagePreview.src = imageUrl;
            imagePreviewContainer.hidden = false;
        }

        fileDropzone?.classList.add("has-image");

        if (fileDropzoneTitle) {
            fileDropzoneTitle.textContent = "Change cover image";
        }
    }

    // Clear selected image.
    function clearImage() {
        currentImageDataUrl = "";
        imageInput.value = "";

        if (imagePreview) {
            imagePreview.removeAttribute("src");
        }

        if (imagePreviewContainer) {
            imagePreviewContainer.hidden = true;
        }

        fileDropzone?.classList.remove("has-image");

        if (fileDropzoneTitle) {
            fileDropzoneTitle.textContent = "Click to upload a cover image";
        }
    }

    // Validate and process image.
    function handleImageFile(file) {
        if (!file) return;

        if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
            showMessage("Upload a PNG, JPG, GIF, or WebP image.");
            imageInput.value = "";
            return;
        }

        if (file.size > IMAGE_MAX_SIZE) {
            showMessage("The cover image must be 2MB or smaller.");
            imageInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                showMessage("Unable to process this image.");
                return;
            }

            setImagePreview(reader.result);
            hideMessage();
        };

        reader.onerror = () => {
            showMessage("Unable to read the image. Please try again.");
            imageInput.value = "";
        };

        reader.readAsDataURL(file);
    }

    imageInput.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        handleImageFile(file);
    });

    removeImageBtn?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        clearImage();
        hideMessage();
    });

    // Drag and drop image.
    if (fileDropzone) {
        ["dragenter", "dragover"].forEach((eventName) => {
            fileDropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                fileDropzone.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            fileDropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                fileDropzone.classList.remove("dragover");
            });
        });

        fileDropzone.addEventListener("drop", (event) => {
            const file = event.dataTransfer?.files?.[0];

            if (file) {
                handleImageFile(file);
            }
        });
    }

    form.addEventListener("input", hideMessage);
    form.addEventListener("change", hideMessage);

    // Load existing blog for editing.
    async function loadBlogForEditing() {
        if (!editBlogId) return;

        try {
            submitButton.disabled = true;
            submitButton.textContent = "Loading...";

            const data = await apiRequest(
                `${API_URL}/${encodeURIComponent(editBlogId)}`
            );

            const blog = data.blog || data.data?.blog || data.data;

            if (!blog || !blog.id) {
                throw new Error("Blog not found.");
            }

            titleInput.value = blog.title || "";
            categoryInput.value = blog.category || "";
            contentInput.value = blog.content || "";

            updateTitleCounter();

            if (blog.image_url) {
                setImagePreview(blog.image_url);
            }

            // Change page heading and button label.
            if (pageTitle) {
                pageTitle.textContent = "Update Blog";
            }

            if (pageDescription) {
                pageDescription.textContent =
                    "Edit your blog post and save your changes.";
            }

            submitButton.textContent = "Update Blog";

            console.log("Blog loaded for editing:", blog.id);

        } catch (error) {
            console.error("Load blog error:", error);

            showMessage(
                error.message || "Unable to load this blog."
            );

            submitButton.disabled = true;
            submitButton.textContent = "Unable to Load";

            return;
        }

        submitButton.disabled = false;
    }

    // Submit create or update request.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideMessage();

        if (submitButton.disabled) return;

        const title = titleInput.value.trim();
        const category = categoryInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !category || !content) {
            showMessage(
                "Please enter a title, select a category, and write your blog."
            );
            return;
        }

        if (title.length > TITLE_MAX) {
            showMessage(
                `The title must not exceed ${TITLE_MAX} characters.`
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = isEditMode
            ? "Updating..."
            : "Saving...";

        try {
            const blogData = {
                title,
                category,
                content,
                imageUrl: currentImageDataUrl
            };

            let data;

            if (isEditMode) {
                // UPDATE existing blog.
                data = await apiRequest(
                    `${API_URL}/${encodeURIComponent(editBlogId)}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(blogData)
                    }
                );

                console.log("Blog updated successfully:", data);

                showMessage(
                    "Blog updated successfully! Redirecting to Dashboard...",
                    "success"
                );

            } else {
                // CREATE new blog.
                data = await apiRequest(API_URL, {
                    method: "POST",
                    body: JSON.stringify(blogData)
                });

                console.log("Blog created successfully:", data);

                showMessage(
                    "Blog created successfully! Redirecting to Dashboard...",
                    "success"
                );
            }

            submitButton.textContent = "Saved!";

            window.setTimeout(() => {
                window.location.href = "./dashboard.html";
            }, 800);

        } catch (error) {
            console.error("Save blog error:", error);

            if (
                error.message.includes("session has expired") ||
                error.message.includes("Please log in")
            ) {
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("user");

                window.location.replace(LOGIN_URL);
                return;
            }

            showMessage(
                error.message ||
                "Unable to save the blog. Please try again."
            );

            submitButton.disabled = false;
            submitButton.textContent = isEditMode
                ? "Update Blog"
                : "Save Blog";
        }
    });

    // Initialize page.
    if (isEditMode) {
        if (pageTitle) {
            pageTitle.textContent = "Update Blog";
        }

        if (pageDescription) {
            pageDescription.textContent =
                "Edit your blog post and save your changes.";
        }

        submitButton.textContent = "Update Blog";

        await loadBlogForEditing();

    } else {
        if (pageTitle) {
            pageTitle.textContent = "Create Blog";
        }

        submitButton.textContent = "Save Blog";
    }
});
