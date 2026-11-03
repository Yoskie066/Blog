/* =====================================
   BlogSpace Authentication
   Access Token + Refresh Token
===================================== */

const API_URL = "https://blog-snmt.onrender.com/api/auth";

// =====================================
// HELPERS
// =====================================

function showMessage(message) {
    alert(message);
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function getLoginUrl() {
    const isPagesFolder = /\/pages\//i.test(
        window.location.pathname
    );

    return isPagesFolder
        ? "./login.html"
        : "./pages/login.html";
}

function getDashboardUrl() {
    const isPagesFolder = /\/pages\//i.test(
        window.location.pathname
    );

    return isPagesFolder
        ? "./dashboard.html"
        : "./pages/dashboard.html";
}

async function getResponseData(response) {
    return response.json().catch(() => ({}));
}

// =====================================
// ACCESS TOKEN STORAGE
// =====================================

function saveAccessToken(token) {
    sessionStorage.setItem("accessToken", token);
}

function getAccessToken() {
    return sessionStorage.getItem("accessToken");
}

function clearAccessToken() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
}

// =====================================
// REFRESH ACCESS TOKEN
// =====================================

async function refreshAccessToken() {
    try {
        const response = await fetch(`${API_URL}/refresh`, {
            method: "POST",
            credentials: "include"
        });

        const data = await getResponseData(response);

        if (!response.ok || !data.accessToken) {
            clearAccessToken();
            return false;
        }

        saveAccessToken(data.accessToken);

        return true;

    } catch (error) {
        console.error("Token refresh error:", error);
        return false;
    }
}

// =====================================
// PROTECTED API REQUEST
// =====================================

async function apiFetch(url, options = {}) {
    let accessToken = getAccessToken();

    if (!accessToken) {
        const refreshed = await refreshAccessToken();

        if (!refreshed) {
            clearAccessToken();
            window.location.replace(getLoginUrl());

            throw new Error("Authentication required.");
        }

        accessToken = getAccessToken();
    }

    const headers = new Headers(options.headers || {});

    headers.set("Authorization", `Bearer ${accessToken}`);

    let response = await fetch(url, {
        ...options,
        headers,
        credentials: "include"
    });

    if (response.status === 401) {
        const refreshed = await refreshAccessToken();

        if (!refreshed) {
            clearAccessToken();
            window.location.replace(getLoginUrl());

            throw new Error(
                "Session expired. Please log in again."
            );
        }

        accessToken = getAccessToken();

        headers.set("Authorization", `Bearer ${accessToken}`);

        response = await fetch(url, {
            ...options,
            headers,
            credentials: "include"
        });
    }

    return response;
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

        const password =
            registerForm.querySelector("#password").value;

        const confirmPassword =
            registerForm.querySelector("#confirm-password").value;

        const button = registerForm.querySelector(
            'button[type="submit"]'
        );

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            showMessage(
                "Password must be at least 8 characters."
            );
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

            const data = await getResponseData(response);

            if (!response.ok) {
                showMessage(
                    data.message || "Registration failed."
                );
                return;
            }

            showMessage(
                data.message || "Registration successful!"
            );

            window.location.href = getLoginUrl();

        } catch (error) {
            console.error("Registration error:", error);

            showMessage(
                "Unable to connect to the backend."
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

        const password =
            loginForm.querySelector("#password").value;

        const button = loginForm.querySelector(
            'button[type="submit"]'
        );

        button.disabled = true;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await getResponseData(response);

            if (!response.ok) {
                showMessage(data.message || "Login failed.");
                return;
            }

            if (!data.accessToken || !data.user) {
                showMessage("Invalid login response.");
                return;
            }

            saveAccessToken(data.accessToken);

            sessionStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            showMessage(
                "Login successful! Welcome to BlogSpace."
            );

            window.location.replace(getDashboardUrl());

        } catch (error) {
            console.error("Login error:", error);

            showMessage(
                "Unable to connect to the backend."
            );

        } finally {
            button.disabled = false;
        }
    });
}

// =====================================
// LOGOUT
// =====================================

async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Authorization": `Bearer ${getAccessToken() || ""}`
            }
        });

        const data = await getResponseData(response);

        if (!response.ok) {
            console.error(
                data.message || "Logout failed."
            );
        }

    } catch (error) {
        console.error("Logout error:", error);

    } finally {
        clearAccessToken();
        window.location.replace(getLoginUrl());
    }
}

// =====================================
// GLOBAL FUNCTIONS
// =====================================

window.logout = logout;
window.apiFetch = apiFetch;
window.refreshAccessToken = refreshAccessToken;
window.getAccessToken = getAccessToken;
window.clearAccessToken = clearAccessToken;