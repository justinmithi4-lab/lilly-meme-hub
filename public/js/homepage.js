const popularMemes =
    document.getElementById("popularMemes");

const latestMemes =
    document.getElementById("latestMemes");

const discussedMemes =
    document.getElementById("discussedMemes");

const homepageLoading =
    document.getElementById("homepageLoading");

const homepageError =
    document.getElementById("homepageError");

const retryHomepage =
    document.getElementById("retryHomepage");

const homepageSearch =
    document.getElementById("homepageSearch");

const clearHomepageSearch =
    document.getElementById("clearHomepageSearch");

const homepageSearchSuggestions =
    document.getElementById("homepageSearchSuggestions");


/* =========================
   SEARCH
========================= */

function performHomepageSearch() {

    const query =
        homepageSearch.value.trim();

    if (!query) {
        return;
    }

    window.location.href =
        `/search.html?q=${encodeURIComponent(query)}`;
}

homepageSearch.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            performHomepageSearch();
        }
    }
);

homepageSearch.addEventListener(
    "input",
    () => {

        const hasText =
            homepageSearch.value.trim().length > 0;

        clearHomepageSearch.style.display =
            hasText ? "flex" : "none";

        if (hasText) {
            homepageSearchSuggestions.classList.add(
                "hidden"
            );
        } else {
            homepageSearchSuggestions.classList.remove(
                "hidden"
            );
        }
    }
);

homepageSearch.addEventListener(
    "focus",
    () => {

        if (!homepageSearch.value.trim()) {

            homepageSearchSuggestions.classList.remove(
                "hidden"
            );
        }
    }
);

clearHomepageSearch.addEventListener(
    "click",
    () => {

        homepageSearch.value = "";

        clearHomepageSearch.style.display =
            "none";

        homepageSearchSuggestions.classList.remove(
            "hidden"
        );

        homepageSearch.focus();
    }
);

document
    .querySelectorAll(
        "#homepageSearchSuggestions button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const query =
                    button.dataset.search;

                window.location.href =
                    `/search.html?q=${encodeURIComponent(
                        query
                    )}`;
            }
        );
    });

document.addEventListener(
    "click",
    (event) => {

        const searchBox =
            document.getElementById(
                "homepageSearchBox"
            );

        if (
            searchBox &&
            !searchBox.contains(event.target)
        ) {

            homepageSearchSuggestions.classList.add(
                "hidden"
            );
        }
    }
);


/* =========================
   MOBILE MENU
========================= */

const mobileMenu =
    document.getElementById("mobileMenu");

const mobileMenuOverlay =
    document.getElementById("mobileMenuOverlay");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const closeMobileMenu =
    document.getElementById("closeMobileMenu");


function openMobileMenu() {

    mobileMenu.classList.add("open");

    mobileMenuOverlay.classList.add("open");

    document.body.style.overflow = "hidden";
}


function closeMenu() {

    mobileMenu.classList.remove("open");

    mobileMenuOverlay.classList.remove("open");

    document.body.style.overflow = "";
}


mobileMenuButton.addEventListener(
    "click",
    openMobileMenu
);

closeMobileMenu.addEventListener(
    "click",
    closeMenu
);

mobileMenuOverlay.addEventListener(
    "click",
    closeMenu
);


/* =========================
   LOAD HOMEPAGE MEMES
========================= */

async function loadHomepageMemes() {

    homepageLoading.classList.remove("hidden");

    homepageError.classList.add("hidden");


    try {

        const response =
            await fetch("/api/memes/homepage");


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load memes."
            );
        }


        renderSection(
            popularMemes,
            data.popular || []
        );


        renderSection(
            latestMemes,
            data.latest || []
        );


        renderSection(
            discussedMemes,
            data.mostDiscussed || []
        );


    } catch (error) {

        console.error(
            "Homepage memes error:",
            error
        );

        homepageError.classList.remove(
            "hidden"
        );


    } finally {

        homepageLoading.classList.add(
            "hidden"
        );
    }
}


/* =========================
   RENDER SECTION
========================= */

function renderSection(
    container,
    memes
) {

    container.innerHTML = "";


    if (!memes.length) {

        container.innerHTML = `
            <div class="homepage-empty">
                No memes available yet.
            </div>
        `;

        return;
    }


    memes.forEach((meme) => {

        container.appendChild(
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

    card.className =
        "homepage-meme-card";


    card.addEventListener(
        "click",
        () => {

            window.location.href =
                `/meme.html?id=${encodeURIComponent(
                    meme.id
                )}`;

        }
    );


    const image =
        document.createElement("img");

    image.className =
        "homepage-meme-image";

    image.src =
        `/uploads/memes/${encodeURIComponent(
            meme.image
        )}`;

    image.alt =
        meme.title || "Lilly Memes";

    image.loading = "lazy";


    const content =
        document.createElement("div");

    content.className =
        "homepage-meme-content";


    const title =
        document.createElement("h3");

    title.className =
        "homepage-meme-title";

    title.textContent =
        meme.title || "Untitled meme";


    const caption =
        document.createElement("p");

    caption.className =
        "homepage-meme-caption";

    caption.textContent =
        meme.caption || "";


    const meta =
        document.createElement("div");

    meta.className =
        "homepage-meme-meta";


    const user =
        document.createElement("span");

    user.className =
        "homepage-meme-user";

    user.textContent =
        `@${meme.username || "user"}`;


    const stats =
        document.createElement("div");

    stats.className =
        "homepage-meme-stats";


    const likes =
        document.createElement("span");

    likes.innerHTML =
        `<i class="fa-solid fa-heart"></i>
         ${formatNumber(meme.like_count)}`;


    if (Number(meme.user_liked)) {
        likes.classList.add("liked");
    }


    const comments =
        document.createElement("span");

    comments.innerHTML =
        `<i class="fa-solid fa-comment"></i>
         ${formatNumber(meme.comment_count)}`;


    const views =
        document.createElement("span");

    views.innerHTML =
        `<i class="fa-solid fa-eye"></i>
         ${formatNumber(meme.view_count)}`;


    stats.appendChild(likes);
    stats.appendChild(comments);
    stats.appendChild(views);


    meta.appendChild(user);
    meta.appendChild(stats);


    content.appendChild(title);


    if (meme.caption) {
        content.appendChild(caption);
    }


    content.appendChild(meta);


    card.appendChild(image);
    card.appendChild(content);


    return card;
}


/* =========================
   NUMBER FORMAT
========================= */

function formatNumber(value) {

    const number =
        Number(value || 0);


    if (number >= 1000000) {
        return `${(number / 1000000).toFixed(1)}M`;
    }


    if (number >= 1000) {
        return `${(number / 1000).toFixed(1)}K`;
    }


    return String(number);
}


/* =========================
   RETRY
========================= */

retryHomepage.addEventListener(
    "click",
    loadHomepageMemes
);


/* =========================
   START
========================= */

loadHomepageMemes();