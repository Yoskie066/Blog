/* =====================================
   BlogSpace Sidebar
   Authentication + Navigation
===================================== */

(async () => {

    // =====================================
    // PATH CONFIGURATION
    // =====================================

    const isPagesFolder = /\/pages\//i.test(
        window.location.pathname
    );

    const sidebarFile = isPagesFolder
        ? "../sidebar.html"
        : "./sidebar.html";

    const dashboardUrl = isPagesFolder
        ? "./dashboard.html"
        : "./pages/dashboard.html";

    const createBlogUrl = isPagesFolder
        ? "./create-blog.html"
        : "./pages/create-blog.html";

    const loginUrl = isPagesFolder
        ? "./login.html"
        : "./pages/login.html";

    // =====================================
    // GET CURRENT USER
    // =====================================

    function getCurrentUser() {

        try {

            const savedUser = sessionStorage.getItem("user");

            return savedUser
                ? JSON.parse(savedUser)
                : null;

        } catch (error) {

            console.error("Unable to read user session:", error);

            return null;

        }
    }

    // =====================================
    // AUTHENTICATION CHECK
    // =====================================

    async function checkAuthentication() {

        let accessToken = sessionStorage.getItem("accessToken");

        const currentUser = getCurrentUser();

        // User information is required
        if (!currentUser || !currentUser.email) {

            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("user");

            window.location.replace(loginUrl);

            return false;
        }

        // Try refreshing if Access Token is missing
        if (!accessToken) {

            if (typeof window.refreshAccessToken !== "function") {

                console.error("Refresh function is not available.");

                window.location.replace(loginUrl);

                return false;
            }

            const refreshed = await window.refreshAccessToken();

            if (!refreshed) {

                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("user");

                window.location.replace(loginUrl);

                return false;
            }

            accessToken = sessionStorage.getItem("accessToken");
        }

        return Boolean(accessToken);
    }

    // Stop if authentication fails
    const isAuthenticated = await checkAuthentication();

    if (!isAuthenticated) {
        return;
    }

    const currentUser = getCurrentUser();

    // =====================================
    // LOAD SIDEBAR
    // =====================================

    try {

        const response = await fetch(sidebarFile);

        if (!response.ok) {

            throw new Error(
                `Unable to load sidebar.html (${response.status})`
            );
        }

        const html = await response.text();

        const container = document.getElementById("app-sidebar");

        if (!container) {

            throw new Error(
                'Missing element with id="app-sidebar".'
            );
        }

        container.innerHTML = html;

        initializeSidebar(currentUser);

    } catch (error) {

        console.error("Sidebar loading error:", error);

    }

    // =====================================
    // INITIALIZE SIDEBAR
    // =====================================

    function initializeSidebar(user) {

        const emailElement = document.getElementById("sidebar-email");

        const avatarElement = document.getElementById("sidebar-avatar");

        const dashboardLink = document.getElementById(
            "sidebar-dashboard"
        );

        const createBlogLink = document.getElementById(
            "sidebar-create-blog"
        );

        const logoLink = document.getElementById(
            "sidebar-logo"
        );

        const logoutButton = document.getElementById(
            "sidebar-logout"
        );

        // Display user email
        if (emailElement) {

            emailElement.textContent = user.email;
            emailElement.title = user.email;

        }

        // Display user avatar
        if (avatarElement) {

            avatarElement.textContent = user.email
                .charAt(0)
                .toUpperCase();

        }

        // Navigation links
        if (dashboardLink) {
            dashboardLink.href = dashboardUrl;
        }

        if (createBlogLink) {
            createBlogLink.href = createBlogUrl;
        }

        if (logoLink) {
            logoLink.href = dashboardUrl;
        }

        // Highlight active navigation
        const currentPath = window.location.pathname.toLowerCase();

        if (currentPath.endsWith("/dashboard.html")) {

            dashboardLink?.classList.add("active");

        } else if (currentPath.endsWith("/create-blog.html")) {

            createBlogLink?.classList.add("active");

        }

        // =====================================
        // LOGOUT
        // =====================================

        if (logoutButton) {

            logoutButton.addEventListener("click", async () => {

                if (typeof window.logout === "function") {

                    await window.logout();

                } else {

                    console.error(
                        "Logout function is not available."
                    );

                }

            });

        }
    }

})();