const popularContainer =
    document.getElementById("popularMemes");

const latestContainer =
    document.getElementById("latestMemes");

const discussedContainer =
    document.getElementById("discussedMemes");

/* =========================================
   MEMBER SEARCH
========================================= */

const memberSearch =
    document.getElementById("memberSearch");

const clearMemberSearch =
    document.getElementById("clearMemberSearch");

const memberSearchSuggestions =
    document.getElementById("memberSearchSuggestions");

function performMemberSearch(value) {

    const query =
        value.trim();

    if (!query) {
        return;
    }

    window.location.href =
        `/search.html?q=${encodeURIComponent(query)}`;
}

if (memberSearch) {

    memberSearch.addEventListener(
        "input",
        () => {

            const value =
                memberSearch.value.trim();

            if (clearMemberSearch) {
                clearMemberSearch.classList.toggle(
                    "visible",
                    value.length > 0
                );
            }

            if (
                memberSearchSuggestions &&
                value.length > 0
            ) {
                memberSearchSuggestions.classList.add(
                    "hidden"
                );
            }
        }
    );

    memberSearch.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                performMemberSearch(
                    memberSearch.value
                );
            }
        }
    );

    memberSearch.addEventListener(
        "focus",
        () => {

            if (
                memberSearch.value.trim() === "" &&
                memberSearchSuggestions
            ) {
                memberSearchSuggestions.classList.remove(
                    "hidden"
                );
            }
        }
    );
}

if (clearMemberSearch) {

    clearMemberSearch.addEventListener(
        "click",
        () => {

            if (!memberSearch) {
                return;
            }

            memberSearch.value = "";

            clearMemberSearch.classList.remove(
                "visible"
            );

            memberSearch.focus();

            if (memberSearchSuggestions) {
                memberSearchSuggestions.classList.remove(
                    "hidden"
                );
            }
        }
    );
}

if (memberSearchSuggestions) {

    const suggestionButtons =
        memberSearchSuggestions.querySelectorAll(
            "[data-search]"
        );

    suggestionButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const searchValue =
                        button.dataset.search || "";

                    if (!searchValue) {
                        return;
                    }

                    performMemberSearch(
                        searchValue
                    );
                }
            );
        }
    );
}

document.addEventListener(
    "click",
    (event) => {

        const searchBox =
            document.getElementById(
                "memberSearchBox"
            );

        if (
            searchBox &&
            memberSearchSuggestions &&
            !searchBox.contains(event.target)
        ) {
            memberSearchSuggestions.classList.add(
                "hidden"
            );
        }
    }
);

let currentUser = null;
let notificationAudioContext = null;
let notificationSoundEnabled = true;
let knownNotificationIds = new Set();
let hasNotificationSnapshot = false;


/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();

        setupExtraNavigation();

        setupMembershipNavigation();

        setupNotificationControls();

        await loadCurrentUser();

        if (currentUser) {

            await refreshUnreadNotificationCount();

            window.addEventListener(
                "focus",
                refreshUnreadNotificationCount
            );

            window.setInterval(
                refreshUnreadNotificationCount,
                30000
            );

        }

        await loadHomepageMemes();

    }
);


/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                "/api/auth/me"
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success ||
            !data.user
        ) {

            window.location.href =
                "/login.html";

            return;

        }

        currentUser =
            data.user;

        updateUserInterface();

    } catch (error) {

        console.error(
            "Failed to load current user:",
            error
        );

        window.location.href =
            "/login.html";

    }

}


/*
|--------------------------------------------------------------------------
| User Interface
|--------------------------------------------------------------------------
*/

function updateUserInterface() {

    if (!currentUser) {
        return;
    }


    /*
    |--------------------------------------------------------------------------
    | Username
    |--------------------------------------------------------------------------
    */

    const usernameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );

    usernameElements.forEach(
        element => {

            element.textContent =
                currentUser.full_name ||
                currentUser.username;

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Existing username elements
    |--------------------------------------------------------------------------
    */

    const profileUsername =
        document.getElementById(
            "profileUsername"
        );

    if (profileUsername) {

        profileUsername.textContent =
            currentUser.full_name ||
            currentUser.username;

    }


    /*
    |--------------------------------------------------------------------------
    | Profile images
    |--------------------------------------------------------------------------
    */

    const profileImages =
        document.querySelectorAll(
            "[data-profile-image]"
        );

    profileImages.forEach(
        image => {

            if (
                currentUser.profile_image
            ) {

                image.src =
                    `/uploads/profiles/${encodeURIComponent(
                        currentUser.profile_image
                    )}`;

            }

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Profile avatar
    |--------------------------------------------------------------------------
    */

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );

    if (
        profileAvatar &&
        currentUser.profile_image
    ) {

        profileAvatar.innerHTML = `
            <img
                src="/uploads/profiles/${encodeURIComponent(
                    currentUser.profile_image
                )}"
                alt="Profile"
            >
        `;

    }

}


/*
|--------------------------------------------------------------------------
| Load Homepage Memes
|--------------------------------------------------------------------------
*/

async function loadHomepageMemes() {

    try {

        showLoading(
            popularContainer
        );

        showLoading(
            latestContainer
        );

        showLoading(
            discussedContainer
        );


        const response =
            await fetch(
                "/api/memes/homepage"
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load memes."
            );

        }


        renderMemes(
            popularContainer,
            data.popular
        );


        renderMemes(
            latestContainer,
            data.latest
        );


        renderMemes(
            discussedContainer,
            data.mostDiscussed
        );


    } catch (error) {

        console.error(
            "Failed to load homepage memes:",
            error
        );


        showError(
            popularContainer
        );

        showError(
            latestContainer
        );

        showError(
            discussedContainer
        );

    }

}


/*
|--------------------------------------------------------------------------
| Render Meme Cards
|--------------------------------------------------------------------------
*/

function renderMemes(
    container,
    memes
) {

    if (!container) {
        return;
    }


    if (
        !memes ||
        memes.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-feed">

                <div class="empty-icon">
                    😂
                </div>

                <p>
                    No memes available yet.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        memes
            .map(
                meme =>
                    createMemeCard(meme)
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| Meme Card
|--------------------------------------------------------------------------
*/

function createMemeCard(meme) {

    const imageUrl =
        `/uploads/memes/${encodeURIComponent(
            meme.image
        )}`;


    const liked =
        Number(
            meme.user_liked
        ) === 1;


    return `
        <article
            class="meme-card"
            data-meme-id="${meme.id}"
        >

            <div
                class="meme-card-image-wrapper"
                onclick="openMeme(${meme.id})"
            >

                <img
                    class="meme-card-image"
                    src="${imageUrl}"
                    alt="${escapeHtml(
                        meme.title
                    )}"
                    loading="lazy"
                >

            </div>


            <div class="meme-card-body">

                <h3 class="meme-card-title">
                    ${escapeHtml(
                        meme.title
                    )}
                </h3>


                ${
                    meme.caption
                        ? `
                            <p class="meme-card-caption">
                                ${escapeHtml(
                                    meme.caption
                                )}
                            </p>
                        `
                        : ""
                }


                ${
                    meme.categories
                        ? `
                            <div class="meme-categories">

                                ${meme.categories
                                    .split(", ")
                                    .map(
                                        category => `
                                            <span>
                                                #${escapeHtml(
                                                    category
                                                )}
                                            </span>
                                        `
                                    )
                                    .join("")}

                            </div>
                        `
                        : ""
                }


                <div class="meme-card-actions">

                    <button
                        type="button"
                        class="meme-action ${
                            liked
                                ? "liked"
                                : ""
                        }"
                        onclick="likeMeme(
                            ${meme.id},
                            this
                        )"
                    >
                        ❤️

                        <span>
                            ${meme.like_count || 0}
                        </span>
                    </button>


                    <button
                        type="button"
                        class="meme-action"
                        onclick="openMeme(
                            ${meme.id}
                        )"
                    >
                        💬

                        <span>
                            ${meme.comment_count || 0}
                        </span>
                    </button>


                    <span class="meme-stat">
                        👁️
                        ${meme.view_count || 0}
                    </span>

                </div>

            </div>

        </article>
    `;

}


/*
|--------------------------------------------------------------------------
| Like Meme
|--------------------------------------------------------------------------
*/

async function likeMeme(
    memeId,
    button
) {

    if (!currentUser) {

        window.location.href =
            "/login.html";

        return;

    }


    try {

        const response =
            await fetch(
                `/api/memes/${memeId}/like`,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            if (
                response.status === 401
            ) {

                window.location.href =
                    "/login.html";

                return;

            }

            throw new Error(
                data.message ||
                "Could not like meme."
            );

        }


        const count =
            button.querySelector(
                "span"
            );


        if (count) {

            count.textContent =
                data.like_count;

        }


        button.classList.toggle(
            "liked",
            data.liked
        );


    } catch (error) {

        console.error(
            "Like error:",
            error
        );

    }

}


/*
|--------------------------------------------------------------------------
| Open Meme
|--------------------------------------------------------------------------
*/

function openMeme(memeId) {

    window.location.href =
        `/meme.html?id=${memeId}`;

}


/*
|--------------------------------------------------------------------------
| MOBILE MENU
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| HTML:
|   menuButton
|   sideMenu
|   menuOverlay
|
| CSS:
|   .left-sidebar.open
|   .menu-overlay.visible
|
|--------------------------------------------------------------------------
*/

function setupNavigation() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const closeMenuButton =
        document.getElementById(
            "closeMenuButton"
        );


    /*
    |--------------------------------------------------------------------------
    | IMPORTANT FIX
    |--------------------------------------------------------------------------
    */

    const sidebar =
        document.getElementById(
            "sideMenu"
        );


    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    /*
    |--------------------------------------------------------------------------
    | Open Menu
    |--------------------------------------------------------------------------
    */

    function openMenu() {

        if (!sidebar) {

            console.error(
                "Mobile sidebar #sideMenu was not found."
            );

            return;

        }


        sidebar.classList.add(
            "open"
        );


        if (overlay) {

            overlay.classList.add(
                "visible"
            );

        }


        document.body.classList.add(
            "menu-open"
        );


        if (menuButton) {

            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Close Menu
    |--------------------------------------------------------------------------
    */

    function closeMenu() {

        if (sidebar) {

            sidebar.classList.remove(
                "open"
            );

        }


        if (overlay) {

            overlay.classList.remove(
                "visible"
            );

        }


        document.body.classList.remove(
            "menu-open"
        );


        if (menuButton) {

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Hamburger Button
    |--------------------------------------------------------------------------
    */

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openMenu();

            }
        );

    } else {

        console.error(
            "Hamburger button #menuButton was not found."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Close Button
    |--------------------------------------------------------------------------
    */

    if (closeMenuButton) {

        closeMenuButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeMenu();

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Overlay
    |--------------------------------------------------------------------------
    */

    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                closeMenu();

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Close menu when clicking a sidebar link
    |--------------------------------------------------------------------------
    */

    if (sidebar) {

        const sidebarLinks =
            sidebar.querySelectorAll(
                "a.sidebar-link"
            );


        sidebarLinks.forEach(
            link => {

                link.addEventListener(
                    "click",
                    function () {

                        closeMenu();

                    }
                );

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Escape key
    |--------------------------------------------------------------------------
    */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeMenu();

            }

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

}


/*
|--------------------------------------------------------------------------
| Extra Navigation
|--------------------------------------------------------------------------
*/

function setupExtraNavigation() {

    /*
    |--------------------------------------------------------------------------
    | Profile
    |--------------------------------------------------------------------------
    */

    const profileButton =
        document.getElementById(
            "profileButton"
        );


    const mobileProfileButton =
        document.getElementById(
            "mobileProfileButton"
        );


    if (profileButton) {

        profileButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/profile.html";

            }
        );

    }


    if (mobileProfileButton) {

        mobileProfileButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/profile.html";

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );


    const mobileNotificationButton =
        document.getElementById(
            "mobileNotificationButton"
        );

    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            toggleNotificationPanel
        );

    }


    if (mobileNotificationButton) {

        mobileNotificationButton.addEventListener(
            "click",
            toggleNotificationPanel
        );

    }

}


    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    function setupNotificationControls() {

        const panel =
            document.getElementById(
                "notificationPanel"
            );

        const markAllButton =
            document.getElementById(
                "markAllNotificationsRead"
            );

        const soundCheckbox =
            document.getElementById(
                "notificationSoundEnabled"
            );

        const testSoundButton =
            document.getElementById(
                "testNotificationSound"
            );

        if (!panel) {
            return;
        }

        try {

            notificationSoundEnabled =
                window.localStorage.getItem(
                    "notificationSoundEnabled"
                ) !== "false";

        } catch (error) {

            console.error(
                "Failed to load notification sound preference:",
                error
            );

        }

        if (soundCheckbox) {

            soundCheckbox.checked =
                notificationSoundEnabled;

            soundCheckbox.addEventListener(
                "change",
                function () {

                    notificationSoundEnabled =
                        soundCheckbox.checked;

                    try {

                        window.localStorage.setItem(
                            "notificationSoundEnabled",
                            String(notificationSoundEnabled)
                        );

                    } catch (error) {

                        console.error(
                            "Failed to save notification sound preference:",
                            error
                        );

                    }

                    if (notificationSoundEnabled) {
                        playNotificationSound();
                    }

                }
            );

        }

        if (testSoundButton) {

            testSoundButton.addEventListener(
                "click",
                function () {
                    playNotificationSound(true);
                }
            );

        }

        window.addEventListener(
            "pointerdown",
            initializeNotificationAudio,
            { once: true }
        );

        window.addEventListener(
            "keydown",
            initializeNotificationAudio,
            { once: true }
        );

        if (markAllButton) {

            markAllButton.addEventListener(
                "click",
                markAllNotificationsAsRead
            );

        }

        document.addEventListener(
            "click",
            function (event) {

                const notificationButtons = [
                    document.getElementById("notificationButton"),
                    document.getElementById("mobileNotificationButton")
                ];

                if (
                    !panel.hidden &&
                    !panel.contains(event.target) &&
                    !notificationButtons.some(
                        button => button && button.contains(event.target)
                    )
                ) {
                    setNotificationPanelOpen(false);
                }

            }
        );

        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {
                    setNotificationPanelOpen(false);
                }

            }
        );

    }


    function toggleNotificationPanel() {

        const panel =
            document.getElementById(
                "notificationPanel"
            );

        if (!panel) {
            return;
        }

        const shouldOpen = panel.hidden;
        setNotificationPanelOpen(shouldOpen);

        if (shouldOpen) {
            loadNotifications();
        }

    }


    function setNotificationPanelOpen(isOpen) {

        const panel =
            document.getElementById(
                "notificationPanel"
            );

        if (!panel) {
            return;
        }

        panel.hidden = !isOpen;

        [
            document.getElementById("notificationButton"),
            document.getElementById("mobileNotificationButton")
        ].forEach(
            button => {

                if (button) {

                    button.setAttribute(
                        "aria-expanded",
                        String(isOpen)
                    );

                }

            }
        );

    }


function syncNotificationSnapshot(notifications, playSoundOnNew) {

    const notificationIds =
        notifications
            .map(notification => String(notification.id))
            .filter(id => id && id !== "undefined" && id !== "null");

    const hasNewNotification =
        hasNotificationSnapshot &&
        notificationIds.some(
            id => !knownNotificationIds.has(id)
        );

    knownNotificationIds =
        new Set(notificationIds);

    hasNotificationSnapshot = true;

    if (
        hasNewNotification &&
        playSoundOnNew &&
        notificationSoundEnabled
    ) {
        playNotificationSound();
    }

}


function initializeNotificationAudio() {

    if (notificationAudioContext) {

        if (notificationAudioContext.state === "suspended") {

            notificationAudioContext.resume().catch(
                error => console.error(
                    "Could not enable notification audio:",
                    error
                )
            );

        }

        return;

    }

    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) {
        return;
    }

    try {

        notificationAudioContext =
            new AudioContextClass();

        if (notificationAudioContext.state === "suspended") {

            notificationAudioContext.resume().catch(
                error => console.error(
                    "Could not enable notification audio:",
                    error
                )
            );

        }

    } catch (error) {

        console.error(
            "Could not initialize notification audio:",
            error
        );

    }

}


function playNotificationSound(force = false) {

    if (!notificationSoundEnabled && !force) {
        return;
    }

    initializeNotificationAudio();

    if (!notificationAudioContext) {
        console.error(
            "Notification sounds are not supported by this browser."
        );
        return;
    }

    const context = notificationAudioContext;

    const playChime = () => {

        const startTime = context.currentTime;

        [880, 1174].forEach(
            (frequency, index) => {

                const oscillator =
                    context.createOscillator();

                const gain =
                    context.createGain();

                const noteStart =
                    startTime + index * 0.14;

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(
                    frequency,
                    noteStart
                );

                gain.gain.setValueAtTime(0.0001, noteStart);
                gain.gain.exponentialRampToValueAtTime(
                    0.12,
                    noteStart + 0.025
                );
                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    noteStart + 0.28
                );

                oscillator.connect(gain);
                gain.connect(context.destination);
                oscillator.start(noteStart);
                oscillator.stop(noteStart + 0.3);

            }
        );

    };

    if (context.state === "suspended") {

        context.resume().then(
            playChime
        ).catch(
            error => console.error(
                "Could not play notification sound:",
                error
            )
        );

        return;

    }

    playChime();

}


    async function refreshUnreadNotificationCount() {

        try {

            const response =
                await fetch(
                    "/api/notifications/unread-count"
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success ||
                !Number.isFinite(Number(data.unread_count))
            ) {
                throw new Error(
                    data.message ||
                    "Could not load unread notifications."
                );
            }

            const count =
                Math.max(0, Number(data.unread_count));

            [
                document.getElementById("notificationCount"),
                document.getElementById("mobileNotificationCount")
            ].forEach(
                badge => {

                    if (!badge) {
                        return;
                    }

                    badge.textContent =
                        count > 99
                            ? "99+"
                            : String(count);

                    badge.hidden = count === 0;

                }
            );

            const notificationsResponse =
                await fetch(
                    "/api/notifications"
                );

            const notificationsData =
                await notificationsResponse.json();

            if (
                !notificationsResponse.ok ||
                !notificationsData.success ||
                !Array.isArray(notificationsData.notifications)
            ) {
                throw new Error(
                    notificationsData.message ||
                    "Could not check for new notifications."
                );
            }

            syncNotificationSnapshot(
                notificationsData.notifications,
                true
            );

        } catch (error) {

            console.error(
                "Failed to load notification count:",
                error
            );

        }

    }


    async function loadNotifications() {

        const list =
            document.getElementById(
                "notificationList"
            );

        if (!list) {
            return;
        }

        list.replaceChildren();
        showNotificationMessage(list, "Loading notifications...");

        try {

            const response =
                await fetch(
                    "/api/notifications"
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success ||
                !Array.isArray(data.notifications)
            ) {
                throw new Error(
                    data.message ||
                    "Could not load notifications."
                );
            }

            syncNotificationSnapshot(
                data.notifications,
                false
            );

            renderNotifications(list, data.notifications);

        } catch (error) {

            console.error(
                "Failed to load notifications:",
                error
            );

            list.replaceChildren();
            showNotificationMessage(
                list,
                "Notifications could not be loaded. Please try again."
            );

        }

    }


    function renderNotifications(list, notifications) {

        list.replaceChildren();

        if (notifications.length === 0) {
            showNotificationMessage(list, "You're all caught up.");
            return;
        }

        notifications.forEach(
            notification => {

                const isRead =
                    Number(notification.is_read) === 1;

                const item =
                    document.createElement("article");

                item.className =
                    isRead
                        ? "notification-item"
                        : "notification-item unread";

                const title =
                    document.createElement("h3");

                title.textContent =
                    notification.title || "Notification";

                item.appendChild(title);

                if (notification.message) {

                    const message =
                        document.createElement("p");

                    message.textContent =
                        notification.message;

                    item.appendChild(message);

                }

                if (notification.created_at) {

                    const createdAt =
                        new Date(notification.created_at);

                    if (!Number.isNaN(createdAt.getTime())) {

                        const time =
                            document.createElement("time");

                        time.dateTime =
                            createdAt.toISOString();

                        time.textContent =
                            createdAt.toLocaleString();

                        item.appendChild(time);

                    }

                }

                if (!isRead) {

                    const actions =
                        document.createElement("div");

                    actions.className =
                        "notification-item-actions";

                    const readButton =
                        document.createElement("button");

                    readButton.type = "button";
                    readButton.className = "notification-read-button";
                    readButton.textContent = "Mark as read";

                    readButton.addEventListener(
                        "click",
                        () => markNotificationAsRead(
                            notification.id,
                            readButton
                        )
                    );

                    actions.appendChild(readButton);
                    item.appendChild(actions);

                }

                list.appendChild(item);

            }
        );

        const markAllButton =
            document.getElementById(
                "markAllNotificationsRead"
            );

        if (markAllButton) {

            markAllButton.hidden =
                !notifications.some(
                    notification => Number(notification.is_read) !== 1
                );

        }

    }


    function showNotificationMessage(list, message) {

        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "notification-empty";

        emptyMessage.textContent =
            message;

        list.appendChild(emptyMessage);

    }


    async function markNotificationAsRead(notificationId, button) {

        button.disabled = true;

        try {

            const response =
                await fetch(
                    `/api/notifications/${encodeURIComponent(notificationId)}/read`,
                    {
                        method: "PUT"
                    }
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Could not mark notification as read."
                );
            }

            await loadNotifications();
            await refreshUnreadNotificationCount();

        } catch (error) {

            button.disabled = false;

            console.error(
                "Failed to mark notification as read:",
                error
            );

        }

    }


    async function markAllNotificationsAsRead() {

        const button =
            document.getElementById(
                "markAllNotificationsRead"
            );

        if (button) {
            button.disabled = true;
        }

        try {

            const response =
                await fetch(
                    "/api/notifications/read-all",
                    {
                        method: "PUT"
                    }
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Could not mark notifications as read."
                );
            }

            await loadNotifications();
            await refreshUnreadNotificationCount();

        } catch (error) {

            console.error(
                "Failed to mark all notifications as read:",
                error
            );

        } finally {

            if (button) {
                button.disabled = false;
            }

        }

    }


function setupMembershipNavigation() {

    /*
    |--------------------------------------------------------------------------
    | Membership
    |--------------------------------------------------------------------------
    */

    const membershipButton =
        document.getElementById(
            "membershipButton"
        );


    if (membershipButton) {

        membershipButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/plans.html";

            }
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Create button
    |--------------------------------------------------------------------------
    */

    const mobileCreateButton =
        document.getElementById(
            "mobileCreateButton"
        );


    if (mobileCreateButton) {

        mobileCreateButton.addEventListener(
            "click",
            function () {

                console.log(
                    "Create button clicked."
                );

            }
        );

    }

}


/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

async function logout() {

    try {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    window.location.href =
        "/login.html";

}


/*
|--------------------------------------------------------------------------
| Loading
|--------------------------------------------------------------------------
*/

function showLoading(container) {

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="feed-loading">

            <div class="loading-spinner"></div>

            <span>
                Loading memes...
            </span>

        </div>
    `;

}


/*
|--------------------------------------------------------------------------
| Error
|--------------------------------------------------------------------------
*/

function showError(container) {

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div class="empty-feed">

            <div class="empty-icon">
                ⚠️
            </div>

            <p>
                Unable to load memes.
            </p>

        </div>
    `;

}


/*
|--------------------------------------------------------------------------
| Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}