
document.addEventListener("DOMContentLoaded", () => {
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

    // Check that required HTML elements exist.
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

    // Check the current login session.
    const token = sessionStorage.getItem("token");
    const savedUser = sessionStorage.getItem("user");

    if (!token || !savedUser) {
        window.location.replace("./login.html");
        return;
    }

    try {
        const user = JSON.parse(savedUser);

        if (!user || typeof user.email !== "string" || !user.email.trim()) {
            throw new Error("Invalid user session.");
        }
    } catch (error) {
        console.error("Invalid login session:", error);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.replace("./login.html");
        return;
    }

    // Display messages.
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

    // Show the selected cover image.
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

    // Clear the selected cover image.
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
            fileDropzoneTitle.textContent =
                "Click to upload a cover image";
        }
    }

    // Validate and read an image file.
    function handleImageFile(file) {
        if (!file) return;

        if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
            showMessage(
                "Upload a PNG, JPG, GIF, or WebP image.",
                "error"
            );
            imageInput.value = "";
            return;
        }

        if (file.size > IMAGE_MAX_SIZE) {
            showMessage(
                "The cover image must be 2MB or smaller.",
                "error"
            );
            imageInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                showMessage("Unable to process this image.", "error");
                return;
            }

            setImagePreview(reader.result);
            hideMessage();
        };

        reader.onerror = () => {
            showMessage(
                "Unable to read the image. Please try again.",
                "error"
            );
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

    // Support drag and drop if the dropzone exists.
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

    // Submit the blog to the backend API.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideMessage();

        if (submitButton.disabled) return;

        const title = titleInput.value.trim();
        const category = categoryInput.value.trim();
        const content = contentInput.value.trim();
        const imageUrl = currentImageDataUrl;

        if (!title || !category || !content) {
            showMessage(
                "Please enter a title, select a category, and write your blog.",
                "error"
            );
            return;
        }

        if (title.length > TITLE_MAX) {
            showMessage(
                `The title must not exceed ${TITLE_MAX} characters.`,
                "error"
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            const currentToken = sessionStorage.getItem("token");

            if (!currentToken) {
                sessionStorage.removeItem("user");
                window.location.replace("./login.html");
                return;
            }

            const response = await fetch(
                "http://localhost:3000/api/blogs",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({
                        title,
                        category,
                        content,
                        imageUrl
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (response.status === 401) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                window.location.replace("./login.html");
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to create the blog."
                );
            }

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
                    : "Unable to connect to the server. Please try again.",
                "error"
            );

            submitButton.disabled = false;
            submitButton.textContent = "Save Blog";
        }
    });
});
