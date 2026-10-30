document.addEventListener("DOMContentLoaded", () => {
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

    const TITLE_MAX = 120;
    const IMAGE_MAX_SIZE = 2 * 1024 * 1024;

    const IMAGE_ALLOWED_TYPES = [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp"
    ];

    let currentImageDataUrl = "";

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

        if (!user || typeof user.email !== "string" || !user.email.trim()) {
            throw new Error("Invalid user session.");
        }
    } catch (error) {
        console.error("Invalid login session:", error);

        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("user");

        window.location.replace(LOGIN_URL);
        return;
    }

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

    function updateTitleCounter() {
        if (titleCounter) {
            titleCounter.textContent =
                `${titleInput.value.length} / ${TITLE_MAX} characters`;
        }
    }

    titleInput.addEventListener("input", updateTitleCounter);
    updateTitleCounter();

    function setImagePreview(dataUrl) {
        currentImageDataUrl = dataUrl;

        if (imagePreview && imagePreviewContainer) {
            imagePreview.src = dataUrl;
            imagePreviewContainer.hidden = false;
        }

        fileDropzone?.classList.add("has-image");

        if (fileDropzoneTitle) {
            fileDropzoneTitle.textContent = "Change cover image";
        }
    }

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

    async function sendBlogRequest(blogData) {
        let token = sessionStorage.getItem("accessToken");

        if (!token) {
            const refreshed = await window.refreshAccessToken?.();

            if (!refreshed) {
                throw new Error("Your session has expired. Please log in again.");
            }

            token = sessionStorage.getItem("accessToken");
        }

        let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            credentials: "include",
            body: JSON.stringify(blogData)
        });

        // Retry once if the access token expired.
        if (response.status === 401) {
            const refreshed = await window.refreshAccessToken?.();

            if (!refreshed) {
                throw new Error("Your session has expired. Please log in again.");
            }

            token = sessionStorage.getItem("accessToken");

            response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include",
                body: JSON.stringify(blogData)
            });
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to create the blog.");
        }

        return data;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideMessage();

        if (submitButton.disabled) return;

        const title = titleInput.value.trim();
        const category = categoryInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !category || !content) {
            showMessage("Please enter a title, select a category, and write your blog.");
            return;
        }

        if (title.length > TITLE_MAX) {
            showMessage(`The title must not exceed ${TITLE_MAX} characters.`);
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            await sendBlogRequest({
                title,
                category,
                content,
                imageUrl: currentImageDataUrl
            });

            showMessage(
                "Blog created successfully! Redirecting to Dashboard...",
                "success"
            );

            submitButton.textContent = "Saved!";

            window.setTimeout(() => {
                window.location.href = "./dashboard.html";
            }, 800);

        } catch (error) {
            console.error("Create blog error:", error);

            showMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to connect to the server. Please try again."
            );

            submitButton.disabled = false;
            submitButton.textContent = "Save Blog";
        }
    });
});