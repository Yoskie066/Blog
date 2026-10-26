
/* =====================================
   BlogSpace Authentication
   Frontend demo using localStorage
===================================== */

const USERS_KEY = "blogspace_users";

// Show messages through alert
function showMessage(message) {
    alert(message);
}

// Get registered users
function getUsers() {
    try {
        const data = localStorage.getItem(USERS_KEY);
        const users = data ? JSON.parse(data) : {};

        if (
            !users ||
            typeof users !== "object" ||
            Array.isArray(users)
        ) {
            return {};
        }

        return users;
    } catch (error) {
        showMessage("Unable to read saved accounts.");
        return {};
    }
}

// Save registered users
function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    } catch (error) {
        showMessage("Unable to save account. Please check your browser storage.");
        return false;
    }
}

// Normalize email
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

// Hash password for this demo
async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error(
            "Password hashing is unavailable. Please open the project using localhost or HTTPS."
        );
    }

    const encodedPassword = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest(
        "SHA-256",
        encodedPassword
    );

    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// =====================================
// REGISTER
// =====================================

const registerForm = document.querySelector("#register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = document.querySelector("#email");
        const passwordInput = document.querySelector("#password");
        const confirmPasswordInput =
            document.querySelector("#confirm-password");

        if (!emailInput || !passwordInput || !confirmPasswordInput) {
            showMessage("Registration form fields are missing.");
            return;
        }

        const email = normalizeEmail(emailInput.value);
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Check matching passwords
        if (password !== confirmPassword) {
            showMessage("Passwords do not match. Please try again.");
            confirmPasswordInput.focus();
            return;
        }

        // Check password length
        if (password.length < 8) {
            showMessage("Password must be at least 8 characters long.");
            passwordInput.focus();
            return;
        }

        const users = getUsers();

        // Check existing email
        if (users[email]) {
            showMessage(
                "This email is already registered. Please log in."
            );
            return;
        }

        try {
            const passwordHash = await hashPassword(password);

            users[email] = {
                email: email,
                passwordHash: passwordHash
            };

            if (!saveUsers(users)) {
                return;
            }

            showMessage("Registration successful! You can now log in.");

            // Register page is inside the pages folder
            window.location.href = "login.html";
        } catch (error) {
            showMessage(
                error.message || "Registration failed. Please try again."
            );
        }
    });
}

// =====================================
// LOGIN
// =====================================

const loginForm = document.querySelector("#login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailInput = document.querySelector("#email");
        const passwordInput = document.querySelector("#password");

        if (!emailInput || !passwordInput) {
            showMessage("Login form fields are missing.");
            return;
        }

        const email = normalizeEmail(emailInput.value);
        const password = passwordInput.value;

        const users = getUsers();
        const user = users[email];

        // Check if account exists
        if (!user) {
            showMessage("Account not found. Please register first.");
            window.location.href = "register.html";
            return;
        }

        try {
            const passwordHash = await hashPassword(password);

            // Check password
            if (passwordHash !== user.passwordHash) {
                showMessage("Incorrect password. Please try again.");
                passwordInput.focus();
                return;
            }

            showMessage("Login successful! Welcome to BlogSpace.");

            // Save the email of the logged-in user
            localStorage.setItem(
                "blogspace_current_user",
                JSON.stringify({
                    email: user.email
                })
            );

            // Redirect to the project dashboard
            window.location.href = "../pages/dashboard.html";

        } catch (error) {
            showMessage(
                error.message || "Login failed. Please try again."
            );
        }
    });
}
