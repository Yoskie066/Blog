document.addEventListener("DOMContentLoaded", async () => {

    const LOGIN_URL = "./login.html";

    const token = sessionStorage.getItem("accessToken");
    const savedUser = sessionStorage.getItem("user");

    console.log("Dashboard access token exists:", !!token);
    console.log("Dashboard user:", savedUser);

    // Check if user information exists.
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

    // Refresh access token if missing.
    if (!token) {
        if (typeof window.refreshAccessToken === "function") {
            const refreshed = await window.refreshAccessToken();

            if (!refreshed) {
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("user");

                window.location.replace(LOGIN_URL);
                return;
            }
        } else {
            console.error("refreshAccessToken() is unavailable.");

            window.location.replace(LOGIN_URL);
            return;
        }
    }

    // Display user email.
    const userNameElement = document.querySelector("#dashboard-user-name");

    if (userNameElement) {
        userNameElement.textContent = currentUser.email;
    }

    // Logout.
    const logoutButton = document.querySelector("#logout-button");

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {

            logoutButton.disabled = true;

            try {
                if (typeof window.logout === "function") {
                    await window.logout();
                } else {
                    sessionStorage.removeItem("accessToken");
                    sessionStorage.removeItem("user");

                    window.location.replace(LOGIN_URL);
                }

            } catch (error) {
                console.error("Logout error:", error);

                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("user");

                window.location.replace(LOGIN_URL);
            }
        });
    }

});