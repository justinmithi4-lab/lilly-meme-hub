document.addEventListener("DOMContentLoaded", loadProfile);

async function loadProfile() {
    const message = document.getElementById("profileMessage");
    const content = document.getElementById("profileContent");

    try {
        const [userResponse, subscriptionResponse] = await Promise.all([
            fetch("/api/auth/me", { cache: "no-store" }),
            fetch("/api/subscriptions/current", { cache: "no-store" })
        ]);
        const [userData, subscriptionData] = await Promise.all([
            userResponse.json(),
            subscriptionResponse.json()
        ]);

        if (
            userResponse.status === 401 ||
            (userData.success && !userData.loggedIn)
        ) {
            window.location.replace("/login.html");
            return;
        }

        if (!userResponse.ok || !userData.success || !userData.user) {
            throw new Error(
                userData.message || "Unable to load your account information."
            );
        }

        if (subscriptionResponse.status === 401) {
            window.location.replace("/login.html");
            return;
        }

        if (!subscriptionResponse.ok || !subscriptionData.success) {
            throw new Error(
                subscriptionData.message ||
                "Unable to load your subscription information."
            );
        }

        renderMemberInfo(userData.user);
        renderSubscription(subscriptionData.subscription);
        message.hidden = true;
        content.hidden = false;
    } catch (error) {
        console.error("Failed to load member profile:", error);
        message.textContent =
            error.message || "Unable to load your profile. Please try again.";
        message.classList.add("error");
        message.setAttribute("role", "alert");
    }
}

function renderMemberInfo(user) {
    const fullName = user.full_name || "Not provided";
    const username = user.username || "—";

    document.getElementById("memberDisplayName").textContent =
        user.full_name || username;
    document.getElementById("memberUsername").textContent =
        username ? `@${username}` : "";
    document.getElementById("memberFullName").textContent = fullName;
    document.getElementById("memberUsernameDetail").textContent = username;
    document.getElementById("memberEmail").textContent = user.email || "—";
    setStatusBadge(
        document.getElementById("accountStatus"),
        user.status || "unknown"
    );

    const avatar = document.getElementById("profileAvatar");
    if (user.profile_image) {
        const image = document.createElement("img");
        image.src = getUploadedMediaUrl(user.profile_image, "profiles");
        image.alt = `${user.full_name || username} profile`;
        image.addEventListener("error", () => {
            avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
        }, { once: true });
        avatar.replaceChildren(image);
    }
}

function renderSubscription(subscription) {
    const details = document.getElementById("subscriptionDetails");
    const emptyState = document.getElementById("noSubscription");

    if (!subscription) {
        emptyState.hidden = false;
        return;
    }

    document.getElementById("planName").textContent =
        subscription.plan_name || "Membership";
    setStatusBadge(
        document.getElementById("subscriptionStatus"),
        subscription.status || "unknown"
    );
    document.getElementById("subscriptionStart").textContent =
        formatDate(subscription.start_date);
    document.getElementById("subscriptionEnd").textContent =
        formatDate(subscription.end_date);
    document.getElementById("subscriptionDuration").textContent =
        subscription.duration_days
            ? `${subscription.duration_days} day${subscription.duration_days === 1 ? "" : "s"}`
            : "—";
    document.getElementById("subscriptionPrice").textContent =
        formatPrice(subscription.price, subscription.currency);
    details.hidden = false;
}

function setStatusBadge(element, status) {
    const normalizedStatus = String(status).toLowerCase();
    element.textContent = normalizedStatus.replace(/_/g, " ");
    element.classList.add(
        ["active", "pending", "expired", "cancelled", "rejected", "suspended"]
            .includes(normalizedStatus)
            ? normalizedStatus
            : "unknown"
    );
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-MW", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatPrice(value, currency) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    const amount = Number(value);
    if (!Number.isFinite(amount)) {
        return "—";
    }

    return `${currency || "MWK"} ${amount.toLocaleString("en-MW", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
