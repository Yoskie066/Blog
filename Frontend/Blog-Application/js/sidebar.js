
(() => {
    const CURRENT_USER_KEY = "blogspace_current_user";

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

    // Read the logged-in account
    function getCurrentUser() {
        try {
            return JSON.parse(
                localStorage.getItem(CURRENT_USER_KEY)
            );
        } catch (error) {
            return null;
        }
    }

    // Protect dashboard and create-blog pages
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.email) {
        window.location.replace(loginUrl);
        return;
    }

    // Load the reusable sidebar HTML
    fetch(sidebarFile)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Unable to load sidebar.html");
            }

            return response.text();
        })
        .then((html) => {
            const container = document.getElementById(
                "app-sidebar"
            );

            if (!container) {
                throw new Error(
                    'Missing element with id="app-sidebar".'
                );
            }

            container.innerHTML = html;

            initializeSidebar(currentUser);
        })
        .catch((error) => {
            console.error("Sidebar error:", error);
        });

    function initializeSidebar(user) {
        const emailElement = document.getElementById(
            "sidebar-email"
        );

        const avatarElement = document.getElementById(
            "sidebar-avatar"
        );

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

        // Sync email from successful login
        emailElement.textContent = user.email;
        emailElement.title = user.email;

        avatarElement.textContent =
            user.email.charAt(0).toUpperCase();

        // Set navigation links
        dashboardLink.href = dashboardUrl;
        createBlogLink.href = createBlogUrl;
        logoLink.href = dashboardUrl;

        // Highlight the current page
        const currentPath = window.location.pathname
            .toLowerCase();

        if (currentPath.endsWith("/dashboard.html")) {
            dashboardLink.classList.add("active");
        } else if (
            currentPath.endsWith("/create-blog.html")
        ) {
            createBlogLink.classList.add("active");
        }

        // Logout: clear session, keep registered accounts
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem(CURRENT_USER_KEY);

            window.location.replace(loginUrl);
        });
    }
})();
