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
    const IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const IMAGE_ALLOWED_TYPES = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp"
    ];

    // Holds the base64 data URL of the uploaded image (empty = no image)
    let currentImageDataUrl = "";

    /* ---------------------------------------------------
       SESSION / USER
    --------------------------------------------------- */

    function getCurrentUser() {
        try {
            const session = localStorage.getItem("blogspace_current_user");

            if (!session) return null;

            const user = JSON.parse(session);

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

    const currentUser = getCurrentUser();

    if (!currentUser) {
        window.location.replace("./login.html");
        return;
    }

    /* ---------------------------------------------------
       MESSAGE HELPERS
    --------------------------------------------------- */

    function showMessage(message, type) {
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.hidden = false;
    }

    function hideMessage() {
        messageElement.textContent = "";
        messageElement.className = "form-message";
        messageElement.hidden = true;
    }

    /* ---------------------------------------------------
       TITLE CHARACTER COUNTER
    --------------------------------------------------- */

    function updateTitleCounter() {
        if (!titleCounter) return;
        titleCounter.textContent = `${titleInput.value.length} / ${TITLE_MAX} characters`;
    }

    titleInput.addEventListener("input", updateTitleCounter);
    updateTitleCounter();

    /* ---------------------------------------------------
       STORAGE
    --------------------------------------------------- */

    function getSavedBlogs() {
        try {
            const savedData = localStorage.getItem("blogspace_blogs");

            if (!savedData) return [];

            const blogs = JSON.parse(savedData);

            if (!Array.isArray(blogs)) {
                throw new Error("Saved blog data is not an array.");
            }

            return blogs;
        } catch (error) {
            console.error("Error reading saved blogs:", error);
            return null;
        }
    }

    /* ---------------------------------------------------
       UTILITIES
    --------------------------------------------------- */

    function createId() {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    /* ---------------------------------------------------
       IMAGE HANDLING
    --------------------------------------------------- */

    function setImagePreview(dataUrl) {
        currentImageDataUrl = dataUrl;

        imagePreview.src = dataUrl;
        imagePreviewContainer.hidden = false;

        fileDropzone.classList.add("has-image");
        fileDropzoneTitle.textContent = "Change cover image";
    }

    function clearImage() {
        currentImageDataUrl = "";
        imageInput.value = "";
        imagePreview.src = "";
        imagePreviewContainer.hidden = true;

        fileDropzone.classList.remove("has-image");
        fileDropzoneTitle.textContent = "Click to upload a cover image";
    }

    function handleImageFile(file) {
        if (!file) return;

        // Type check
        if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
            showMessage(
                "Please upload a valid image file (PNG, JPG, GIF, or WebP).",
                "error"
            );
            imageInput.value = "";
            return;
        }

        // Size check
        if (file.size > IMAGE_MAX_SIZE) {
            const sizeMb = (file.size / 1024 / 1024).toFixed(2);
            showMessage(
                `The image is too large (${sizeMb}MB). Please upload an image under 2MB.`,
                "error"
            );
            imageInput.value = "";
            return;
        }

        // Read as data URL (base64)
        const reader = new FileReader();

        reader.onload = (event) => {
            setImagePreview(event.target.result);
            hideMessage();
        };

        reader.onerror = () => {
            showMessage(
                "Unable to read the image file. Please try again.",
                "error"
            );
            imageInput.value = "";
        };

        reader.readAsDataURL(file);
    }

    // File input change
    imageInput.addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];
        handleImageFile(file);
    });

    // Remove image
    removeImageBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearImage();
        hideMessage();
    });

    // Drag & drop
    ["dragenter", "dragover"].forEach((evtName) => {
        fileDropzone.addEventListener(evtName, (event) => {
            event.preventDefault();
            event.stopPropagation();
            fileDropzone.classList.add("dragover");
        });
    });

    ["dragleave", "drop"].forEach((evtName) => {
        fileDropzone.addEventListener(evtName, (event) => {
            event.preventDefault();
            event.stopPropagation();
            fileDropzone.classList.remove("dragover");
        });
    });

    fileDropzone.addEventListener("drop", (event) => {
        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (file) {
            handleImageFile(file);
        }
    });

    /* ---------------------------------------------------
       HIDE OLD MESSAGES ON EDIT
    --------------------------------------------------- */

    form.addEventListener("input", hideMessage);
    form.addEventListener("change", hideMessage);

    /* ---------------------------------------------------
       SUBMIT HANDLER
    --------------------------------------------------- */

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideMessage();

        // Guard laban sa double-submit
        if (submitButton.disabled) return;

        const title = titleInput.value.trim();
        const category = categoryInput.value;
        const content = contentInput.value.trim();
        const imageUrl = currentImageDataUrl; // base64 data URL or ""

        /* Validation */
        if (!title || !category || !content) {
            showMessage(
                "Please complete the blog title, category, and content.",
                "error"
            );
            return;
        }

        if (title.length > TITLE_MAX) {
            showMessage(
                `The blog title must not exceed ${TITLE_MAX} characters.`,
                "error"
            );
            return;
        }

        // Safety check: kung may image, dapat data URL
        if (imageUrl && !imageUrl.startsWith("data:image/")) {
            showMessage(
                "The cover image could not be processed. Please re-upload it.",
                "error"
            );
            return;
        }

        const blogs = getSavedBlogs();

        if (blogs === null) {
            showMessage(
                "Unable to read your saved blogs. Please check your browser storage.",
                "error"
            );
            return;
        }

        const now = new Date().toISOString();

        const newBlog = {
            id: createId(),
            title,
            category,
            content,
            imageUrl, // base64 data URL (or empty string)
            email: currentUser.email,
            status: "published",
            createdAt: now,
            updatedAt: now
        };

        /* Save */
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            const updatedBlogs = [newBlog, ...blogs];

            localStorage.setItem(
                "blogspace_blogs",
                JSON.stringify(updatedBlogs)
            );

            submitButton.textContent = "Saved!";

            showMessage(
                "Your blog has been saved successfully! Redirecting to your dashboard...",
                "success"
            );

            window.setTimeout(() => {
                window.location.href = "./dashboard.html";
            }, 800);

        } catch (error) {
            console.error("Error saving blog:", error);

            showMessage(
                "Unable to save your blog. Browser storage may be full. Try a smaller image or remove the cover image.",
                "error"
            );

            submitButton.disabled = false;
            submitButton.textContent = "Save Blog";
        }
    });
});