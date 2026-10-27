
/* =====================================
   BlogSpace Authentication
   Connected to Express Backend
===================================== */

const API_URL = "http://localhost:3000/api/auth";

function showMessage(message) {
    alert(message);
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

// =====================================
// REGISTER
// =====================================

const registerForm = document.querySelector("#register-form");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = normalizeEmail(
            registerForm.querySelector("#email").value
        );
        const password = registerForm.querySelector("#password").value;
        const confirmPassword = registerForm.querySelector(
            "#confirm-password"
        ).value;

        const button = registerForm.querySelector(
            'button[type="submit"]'
        );

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            showMessage("Password must be at least 8 characters.");
            return;
        }

        button.disabled = true;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password,
                    confirmPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.message || "Registration failed.");
                return;
            }

            showMessage(
                data.message ||
                "Registration successful! Please log in."
            );

            window.location.href = "login.html";

        } catch (error) {
            console.error("Registration error:", error);

            showMessage(
                "Unable to connect to the backend. Check if the server is running."
            );
        } finally {
            button.disabled = false;
        }
    });
}

// =====================================
// LOGIN
// =====================================

const loginForm = document.querySelector("#login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = normalizeEmail(
            loginForm.querySelector("#email").value
        );
        const password = loginForm.querySelector("#password").value;

        const button = loginForm.querySelector(
            'button[type="submit"]'
        );

        button.disabled = true;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            // Login failed
            if (!response.ok) {
                showMessage(data.message || "Login failed.");
                return;
            }

            // Validate server response
            if (!data.token || !data.user) {
                showMessage(
                    "The server did not return a valid login response."
                );
                return;
            }

            // Save login session
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify(data.user));

            // Confirm successful login
            showMessage("Login successful! Welcome to BlogSpace.");

            // Redirect to dashboard after the alert is closed
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);

            showMessage(
                "Unable to connect to the backend. Check if the server is running."
            );
        } finally {
            button.disabled = false;
        }
    });
}
