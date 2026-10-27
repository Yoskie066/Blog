
(() => {
    // Authentication uses the same sessionStorage keys as auth.js
    const TOKEN_KEY = "token";
    const USER_KEY = "user";

    const isPagesFolder = /\/pages\//i.test(
        window.location.pathname
    );

    // File paths
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

    // Get the current logged-in user
    function getCurrentUser() {
        try {
            const savedUser = sessionStorage.getItem(USER_KEY);
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Unable to read user session:", error);
            return null;
        }
    }

    // Check whether the user has an active frontend session
    const token = sessionStorage.getItem(TOKEN_KEY);
    const currentUser = getCurrentUser();

    if (!token || !currentUser || !currentUser.email) {
        window.location.replace(loginUrl);
        return;
    }

    // Load sidebar HTML
    fetch(sidebarFile)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Unable to load sidebar.html (${response.status})`
                );
            }

            return response.text();
        })
        .then((html) => {
            const container = document.getElementById("app-sidebar");

            if (!container) {
                throw new Error(
                    'Missing element with id="app-sidebar".'
                );
            }

            container.innerHTML = html;

            initializeSidebar(currentUser);
        })
        .catch((error) => {
            console.error("Sidebar loading error:", error);
        });

    function initializeSidebar(user) {
        const emailElement = document.getElementById("sidebar-email");
        const avatarElement = document.getElementById("sidebar-avatar");
        const dashboardLink = document.getElementById("sidebar-dashboard");
        const createBlogLink = document.getElementById("sidebar-create-blog");
        const logoLink = document.getElementById("sidebar-logo");
        const logoutButton = document.getElementById("sidebar-logout");

        // Display user information
        if (emailElement) {
            emailElement.textContent = user.email;
            emailElement.title = user.email;
        }

        if (avatarElement) {
            avatarElement.textContent = user.email
                .charAt(0)
                .toUpperCase();
        }

        // Set navigation links
        if (dashboardLink) {
            dashboardLink.href = dashboardUrl;
        }

        if (createBlogLink) {
            createBlogLink.href = createBlogUrl;
        }

        if (logoLink) {
            logoLink.href = dashboardUrl;
        }

        // Highlight active navigation item
        const currentPath = window.location.pathname.toLowerCase();

        if (currentPath.endsWith("/dashboard.html")) {
            dashboardLink?.classList.add("active");
        } else if (currentPath.endsWith("/create-blog.html")) {
            createBlogLink?.classList.add("active");
        }

        // Logout
        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                sessionStorage.removeItem(TOKEN_KEY);
                sessionStorage.removeItem(USER_KEY);

                window.location.replace(loginUrl);
            });
        }
    }
})();
