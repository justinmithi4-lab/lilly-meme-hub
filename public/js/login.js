const loginForm =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const login =
        document.getElementById("login").value.trim();

    const password =
        document.getElementById("password").value;


    message.textContent = "Logging in...";


    try {

        const response = await fetch(
            "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    login,
                    password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            message.textContent =
                data.message;

            return;
        }


        message.textContent =
            "Login successful. Redirecting...";


        if (data.user.role === "admin") {

            window.location.href =
                "/admin.html";

        } else if (data.user.status === "pending") {

            window.location.href =
                "/plans.html";

        } else {

            window.location.href =
                "/member.html";
        }


    } catch (error) {

        console.error(error);

        message.textContent =
            "Could not connect to the server.";
    }

});