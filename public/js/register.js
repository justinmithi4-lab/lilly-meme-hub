const registerForm = document.getElementById("registerForm");

const message = document.getElementById("message");


registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const fullName =
        document.getElementById("fullName").value.trim();

    const username =
        document.getElementById("username").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    message.textContent = "Creating your account...";


    try {

        const response = await fetch("/api/auth/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                full_name: fullName,
                username,
                email,
                password
            })

        });


        const data = await response.json();


        if (!response.ok) {

            message.textContent = data.message;

            return;
        }


        message.textContent =
            "Account created! Redirecting to membership plans...";


        setTimeout(() => {

            window.location.href = "/plans.html";

        }, 700);


    } catch (error) {

        console.error(error);

        message.textContent =
            "Could not connect to the server.";

    }

});