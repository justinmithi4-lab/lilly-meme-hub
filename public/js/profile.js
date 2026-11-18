document.addEventListener("DOMContentLoaded", loadProfile);

let currentProfileImage = null;
let selectedProfileImage = null;
let profileImagePreviewUrl = null;

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
        setupProfileImageControls();
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
    currentProfileImage = user.profile_image || null;

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
    const image = avatar.querySelector("img");
    if (image) {
        image.alt = `${user.full_name || username} profile picture`;
        setProfileImageSource(image, user.profile_image);
    }

    document.getElementById("profileImageRemove").hidden =
        !currentProfileImage;
}

function setupProfileImageControls() {
    const input = document.getElementById("profileImageInput");
    const chooseButton = document.getElementById("profileImageChoose");
    const cameraButton = document.getElementById("profileImageCamera");
    const saveButton = document.getElementById("profileImageSave");
    const cancelButton = document.getElementById("profileImageCancel");
    const removeButton = document.getElementById("profileImageRemove");
    const message = document.getElementById("profileImageMessage");
    const avatarImage = document.querySelector("#profileAvatar img");
    const controls = [
        chooseButton,
        cameraButton,
        saveButton,
        cancelButton,
        removeButton
    ];

    const openFilePicker = () => input.click();
    chooseButton.addEventListener("click", openFilePicker);
    cameraButton.addEventListener("click", openFilePicker);

    input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        input.value = "";

        if (!file) {
            return;
        }

        const allowedTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]);
        if (!allowedTypes.has(file.type)) {
            showProfileImageMessage(
                message,
                "Choose a JPG, JPEG, PNG, or WEBP image.",
                "error"
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showProfileImageMessage(
                message,
                "Profile pictures must be 5 MB or smaller.",
                "error"
            );
            return;
        }

        clearProfileImagePreview();
        selectedProfileImage = file;
        profileImagePreviewUrl = URL.createObjectURL(file);
        avatarImage.src = profileImagePreviewUrl;
        saveButton.hidden = false;
        cancelButton.hidden = false;
        removeButton.hidden = true;
        showProfileImageMessage(
            message,
            "Preview your picture, then save to apply it.",
            ""
        );
    });

    saveButton.addEventListener("click", async () => {
        if (!selectedProfileImage) {
            return;
        }

        const formData = new FormData();
        formData.append("profileImage", selectedProfileImage);
        setProfileImageControlsDisabled(controls, true);
        saveButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Uploading...</span>';

        try {
            const response = await fetch("/api/auth/profile-image", {
                method: "PUT",
                body: formData
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to upload your picture.");
            }

            currentProfileImage = data.profile_image;
            clearProfileImagePreview();
            selectedProfileImage = null;
            setProfileImageSource(avatarImage, currentProfileImage);
            saveButton.hidden = true;
            cancelButton.hidden = true;
            removeButton.hidden = false;
            showProfileImageMessage(message, data.message, "success");
        } catch (error) {
            showProfileImageMessage(
                message,
                error.message || "Unable to upload your picture.",
                "error"
            );
        } finally {
            saveButton.innerHTML =
                '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i><span>Save picture</span>';
            setProfileImageControlsDisabled(controls, false);
        }
    });

    cancelButton.addEventListener("click", () => {
        clearProfileImagePreview();
        selectedProfileImage = null;
        setProfileImageSource(avatarImage, currentProfileImage);
        saveButton.hidden = true;
        cancelButton.hidden = true;
        removeButton.hidden = !currentProfileImage;
        message.hidden = true;
    });

    removeButton.addEventListener("click", async () => {
        if (!currentProfileImage) {
            return;
        }

        if (!window.confirm("Remove your profile picture?")) {
            return;
        }

        setProfileImageControlsDisabled(controls, true);
        removeButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Removing...</span>';

        try {
            const response = await fetch("/api/auth/profile-image", {
                method: "DELETE"
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to remove your picture.");
            }

            currentProfileImage = null;
            setProfileImageSource(avatarImage, null);
            removeButton.hidden = true;
            showProfileImageMessage(message, data.message, "success");
        } catch (error) {
            showProfileImageMessage(
                message,
                error.message || "Unable to remove your picture.",
                "error"
            );
        } finally {
            removeButton.innerHTML =
                '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Remove picture</span>';
            setProfileImageControlsDisabled(controls, false);
        }
    });
}

function clearProfileImagePreview() {
    if (profileImagePreviewUrl) {
        URL.revokeObjectURL(profileImagePreviewUrl);
        profileImagePreviewUrl = null;
    }
}

function setProfileImageControlsDisabled(controls, disabled) {
    controls.forEach(button => {
        button.disabled = disabled;
    });
}

function showProfileImageMessage(element, text, type) {
    element.textContent = text;
    element.classList.remove("success", "error");
    if (type) {
        element.classList.add(type);
    }
    element.hidden = false;
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
