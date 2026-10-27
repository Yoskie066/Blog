
document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("token");
    const savedUser = sessionStorage.getItem("user");

    console.log("Dashboard token exists:", !!token);
    console.log("Dashboard user:", savedUser);

    if (!token || !savedUser) {
        window.location.replace("login.html");
        return;
    }

    let user;

    try {
        user = JSON.parse(savedUser);
    } catch (error) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.replace("login.html");
        return;
    }

    if (!user || !user.email) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.replace("login.html");
        return;
    }

    const userNameElement = document.querySelector("#dashboard-user-name");

    if (userNameElement) {
        userNameElement.textContent = user.email;
    }

    const logoutButton = document.querySelector("#logout-button");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            window.location.replace("login.html");
        });
    }
});
