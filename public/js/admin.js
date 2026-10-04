async function loadAdmin() {

    try {

        const response =
            await fetch("/api/auth/me");

        const data =
            await response.json();


        if (!data.loggedIn) {

            window.location.href =
                "/login.html";

            return;
        }


        if (data.user.role !== "admin") {

            window.location.href =
                "/member.html";

            return;
        }


        document.getElementById("adminName")
            .textContent =
            data.user.username;


    } catch (error) {

        console.error(
            "Could not load administrator:",
            error
        );

        window.location.href =
            "/login.html";
    }
}


document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {

        try {

            await fetch(
                "/api/auth/logout",
                {
                    method: "POST"
                }
            );

            window.location.href =
                "/login.html";

        } catch (error) {

            console.error(error);
        }
    });


loadAdmin();