const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");

const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");

const searchResults = document.getElementById("searchResults");

const searchLoading = document.getElementById("searchLoading");
const searchEmpty = document.getElementById("searchEmpty");
const searchError = document.getElementById("searchError");

const searchErrorMessage =
    document.getElementById("searchErrorMessage");

const retrySearch =
    document.getElementById("retrySearch");

const loadMoreButton =
    document.getElementById("loadMoreButton");

const searchDescription =
    document.getElementById("searchDescription");

const resultsTitle =
    document.getElementById("resultsTitle");

const resultsCount =
    document.getElementById("resultsCount");


let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let isLoading = false;


/* =========================
   URL PARAMETERS
========================= */

function getUrlParameters() {

    const params = new URLSearchParams(window.location.search);

    return {
        query: params.get("q") || "",
        category: params.get("category") || "",
        sort: params.get("sort") || "latest"
    };
}


/* =========================
   UPDATE URL
========================= */

function updateUrl() {

    const params = new URLSearchParams();

    const query = searchInput.value.trim();
    const category = categoryFilter.value;
    const sort = sortFilter.value;

    if (query) {
        params.set("q", query);
    }

    if (category) {
        params.set("category", category);
    }

    if (sort !== "latest") {
        params.set("sort", sort);
    }

    const newUrl =
        params.toString()
            ? `/search.html?${params.toString()}`
            : "/search.html";

    window.history.replaceState({}, "", newUrl);
}


/* =========================
   STATUS
========================= */

function hideAllStatuses() {

    searchLoading.classList.add("hidden");
    searchEmpty.classList.add("hidden");
    searchError.classList.add("hidden");
}


function showLoading() {

    hideAllStatuses();

    searchLoading.classList.remove("hidden");
}


function showEmpty() {

    hideAllStatuses();

    searchEmpty.classList.remove("hidden");
}


function showError(message) {

    hideAllStatuses();

    searchErrorMessage.textContent =
        message || "Unable to load search results.";

    searchError.classList.remove("hidden");
}


/* =========================
   INITIALIZE CATEGORIES
========================= */

async function loadCategories() {

    try {

        const response =
            await fetch("/api/search/categories");

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        data.categories.forEach(category => {

            const option =
                document.createElement("option");

            option.value = category.name;
            option.textContent = category.name;

            categoryFilter.appendChild(option);
        });

        const params = getUrlParameters();

        if (params.category) {
            categoryFilter.value =
                params.category;
        }

    } catch (error) {

        console.error(
            "Load categories error:",
            error
        );
    }
}


/* =========================
   SEARCH
========================= */

async function performSearch(reset = true) {

    if (isLoading) {
        return;
    }

    if (reset) {

        currentPage = 1;

        searchResults.innerHTML = "";

        hideAllStatuses();
    }

    const query =
        searchInput.value.trim();

    const category =
        categoryFilter.value;

    const sort =
        sortFilter.value;

    currentQuery = query;

    updateUrl();

    isLoading = true;

    if (reset) {
        showLoading();
    }

    loadMoreButton.classList.add("hidden");

    try {

        const params =
            new URLSearchParams();

        if (query) {
            params.set("q", query);
        }

        if (category) {
            params.set("category", category);
        }

        params.set("sort", sort);

        params.set(
            "page",
            currentPage
        );

        params.set(
            "limit",
            "12"
        );

        const response =
            await fetch(
                `/api/search?${params.toString()}`
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Search failed."
            );
        }

        hideAllStatuses();

        totalPages =
            Number(data.totalPages || 1);

        renderResults(
            data.memes || [],
            reset
        );

        updateResultsHeader(
            data.total,
            query,
            category
        );

        if (
            data.hasMore &&
            data.memes.length > 0
        ) {
            loadMoreButton.classList.remove(
                "hidden"
            );
        }

        if (
            reset &&
            data.memes.length === 0
        ) {
            showEmpty();
        }

    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        if (reset) {
            showError(error.message);
        }

    } finally {

        isLoading = false;
    }
}


/* =========================
   RESULTS HEADER
========================= */

function updateResultsHeader(
    total,
    query,
    category
) {

    if (query) {

        resultsTitle.textContent =
            `Results for "${query}"`;

        searchDescription.textContent =
            "Memes matching your search.";

    } else if (category) {

        resultsTitle.textContent =
            category;

        searchDescription.textContent =
            `Memes in ${category}.`;

    } else {

        resultsTitle.textContent =
            "Recent memes";

        searchDescription.textContent =
            "Find memes, categories and creators.";
    }

    resultsCount.textContent =
        `${total} ${total === 1 ? "meme" : "memes"}`;
}


/* =========================
   RENDER RESULTS
========================= */

function renderResults(
    memes,
    reset
) {

    if (reset) {
        searchResults.innerHTML = "";
    }

    memes.forEach(meme => {

        searchResults.appendChild(
            createMemeCard(meme)
        );
    });
}


/* =========================
   MEME CARD
========================= */

function createMemeCard(meme) {

    const card =
        document.createElement("article");

    card.className = "meme-card";

    card.addEventListener(
        "click",
        () => {

            window.location.href =
                `/meme.html?id=${encodeURIComponent(
                    meme.id
                )}`;
        }
    );


    const imageWrapper =
        document.createElement("div");

    imageWrapper.className =
        "meme-image-wrapper";


    const image =
        document.createElement("img");

    image.className =
        "meme-image";

    image.src =
        getUploadedMediaUrl(meme.image, "memes");

    image.alt =
        meme.title || "Meme";

    image.loading = "lazy";


    imageWrapper.appendChild(image);


    const content =
        document.createElement("div");

    content.className =
        "meme-card-content";


    const title =
        document.createElement("h3");

    title.className =
        "meme-title";

    title.textContent =
        meme.title || "Untitled meme";


    const caption =
        document.createElement("p");

    caption.className =
        "meme-caption";

    caption.textContent =
        meme.caption || "";


    const user =
        document.createElement("div");

    user.className =
        "meme-user";


    const avatar =
        document.createElement("div");

    avatar.className =
        "meme-avatar";


    if (meme.profile_image) {

        const avatarImage =
            document.createElement("img");

        avatarImage.src =
            getUploadedMediaUrl(meme.profile_image, "profiles");

        avatarImage.alt =
            meme.username || "User";

        avatar.appendChild(
            avatarImage
        );

    } else {

        avatar.textContent =
            getInitials(
                meme.full_name ||
                meme.username
            );
    }


    const username =
        document.createElement("span");

    username.className =
        "meme-username";

    username.textContent =
        `@${meme.username || "user"}`;


    user.appendChild(avatar);
    user.appendChild(username);


    const stats =
        document.createElement("div");

    stats.className =
        "meme-stats";


    stats.appendChild(
        createStat(
            "fa-heart",
            Number(meme.like_count || 0),
            Boolean(meme.user_liked)
        )
    );


    stats.appendChild(
        createStat(
            "fa-comment",
            Number(meme.comment_count || 0)
        )
    );


    stats.appendChild(
        createStat(
            "fa-eye",
            Number(meme.view_count || 0)
        )
    );


    content.appendChild(title);

    if (meme.caption) {
        content.appendChild(caption);
    }

    content.appendChild(user);
    content.appendChild(stats);


    card.appendChild(imageWrapper);
    card.appendChild(content);


    return card;
}


/* =========================
   STAT
========================= */

function createStat(
    icon,
    count,
    liked = false
) {

    const stat =
        document.createElement("span");

    stat.className =
        "meme-stat";

    if (liked) {
        stat.classList.add("liked");
    }


    const iconElement =
        document.createElement("i");

    iconElement.className =
        `fa-solid ${icon}`;


    const number =
        document.createElement("span");

    number.textContent =
        formatNumber(count);


    stat.appendChild(iconElement);
    stat.appendChild(number);


    return stat;
}


/* =========================
   HELPERS
========================= */

function formatNumber(number) {

    number = Number(number || 0);

    if (number >= 1000000) {
        return `${(number / 1000000).toFixed(1)}M`;
    }

    if (number >= 1000) {
        return `${(number / 1000).toFixed(1)}K`;
    }

    return String(number);
}


function getInitials(name) {

    if (!name) {
        return "?";
    }

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "?";
    }

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


/* =========================
   INPUT EVENTS
========================= */

let searchTimer = null;

searchInput.addEventListener(
    "input",
    () => {

        clearSearch.style.display =
            searchInput.value.trim()
                ? "flex"
                : "none";

        clearTimeout(searchTimer);

        searchTimer = setTimeout(
            () => performSearch(true),
            400
        );
    }
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            clearTimeout(searchTimer);

            performSearch(true);
        }
    }
);


/* =========================
   CLEAR
========================= */

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        clearSearch.style.display =
            "none";

        performSearch(true);

        searchInput.focus();
    }
);


/* =========================
   FILTERS
========================= */

categoryFilter.addEventListener(
    "change",
    () => {
        performSearch(true);
    }
);


sortFilter.addEventListener(
    "change",
    () => {
        performSearch(true);
    }
);


/* =========================
   LOAD MORE
========================= */

loadMoreButton.addEventListener(
    "click",
    async () => {

        if (currentPage >= totalPages) {
            return;
        }

        currentPage++;

        await performSearch(false);
    }
);


/* =========================
   RETRY
========================= */

retrySearch.addEventListener(
    "click",
    () => {
        performSearch(true);
    }
);


/* =========================
   INITIAL LOAD
========================= */

async function initializeSearch() {

    const params =
        getUrlParameters();


    searchInput.value =
        params.query;


    clearSearch.style.display =
        params.query
            ? "flex"
            : "none";


    sortFilter.value =
        params.sort;


    await loadCategories();


    await performSearch(true);


    if (params.query) {

        searchInput.focus();

        searchInput.setSelectionRange(
            searchInput.value.length,
            searchInput.value.length
        );
    }
}


initializeSearch();