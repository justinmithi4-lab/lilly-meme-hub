const popularMemes =
    document.getElementById("popularMemes");

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

function initializeHomepageHeroSlideshow() {
    const hero = document.querySelector(".hero");
    const slideshow = document.getElementById("heroSlideshow");
    const slideData = document.getElementById("homepageHeroSlideData");
    const controls = document.getElementById("heroSlideshowControls");
    const indicators = document.getElementById("heroSlideIndicators");
    const previousButton = document.getElementById("heroSlidePrevious");
    const nextButton = document.getElementById("heroSlideNext");

    if (!hero || !slideshow || !slideData || !controls || !indicators) {
        return;
    }

    let imageUrls;
    try {
        imageUrls = JSON.parse(slideData.textContent);
    } catch (error) {
        console.error("Could not read homepage slideshow images:", error);
        slideshow.replaceChildren();
        return;
    }

    if (!Array.isArray(imageUrls)) {
        slideshow.replaceChildren();
        return;
    }

    imageUrls = imageUrls.filter(
        imageUrl =>
            typeof imageUrl === "string" &&
            imageUrl.startsWith("/images/homepage/")
    );

    if (imageUrls.length === 0) {
        slideshow.replaceChildren();
        controls.classList.add("hidden");
        return;
    }

    const firstSlide = slideshow.querySelector(".hero-slide");
    const slides = [];
    let currentIndex = 0;
    let autoplayTimer;
    let transitionRequest = 0;
    let paused = false;
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    imageUrls.forEach((imageUrl, index) => {
        let slide = index === 0 ? firstSlide : null;

        if (!slide) {
            slide = document.createElement("div");
            slide.className = index === 0
                ? "hero-slide is-active"
                : "hero-slide";
            slide.dataset.imageUrl = imageUrl;

            const image = document.createElement("img");
            image.className = "hero-slide-image";
            image.alt = "";
            image.decoding = "async";
            if (index === 0) {
                image.loading = "eager";
                image.fetchPriority = "high";
                image.src = imageUrl;
            } else {
                image.loading = "lazy";
                image.dataset.src = imageUrl;
            }
            slide.appendChild(image);
            slideshow.appendChild(slide);
        }

        const image = slide.querySelector("img");
        if (!image) {
            return;
        }

        slide.dataset.imageUrl = imageUrl;
        image.addEventListener("error", () => removeFailedSlide(slide), {
            once: true
        });
        slides.push(slide);
    });

    if (slides.length === 0) {
        slideshow.replaceChildren();
        controls.classList.add("hidden");
        return;
    }

    function renderIndicators() {
        indicators.replaceChildren();
        slides.forEach((slide, index) => {
            const dot = document.createElement("button");
            dot.className = "hero-slide-dot";
            dot.type = "button";
            dot.setAttribute("aria-label", `Show image ${index + 1} of ${slides.length}`);
            dot.setAttribute("aria-current", String(index === currentIndex));
            dot.addEventListener("click", () => showSlide(index));
            indicators.appendChild(dot);
        });

        controls.classList.toggle("hidden", slides.length < 2);
    }

    function scheduleAutoplay() {
        window.clearTimeout(autoplayTimer);
        if (paused || reducedMotion.matches || slides.length < 2) {
            return;
        }

        autoplayTimer = window.setTimeout(
            () => showSlide((currentIndex + 1) % slides.length),
            5000
        );
    }

    function showSlide(index) {
        if (index < 0 || index >= slides.length) {
            return;
        }

        const target = slides[index];
        if (
            index === currentIndex &&
            target.classList.contains("is-active")
        ) {
            scheduleAutoplay();
            return;
        }

        window.clearTimeout(autoplayTimer);
        const request = ++transitionRequest;
        const image = target.querySelector("img");

        const activate = () => {
            if (request !== transitionRequest || !slides.includes(target)) {
                return;
            }

            slides.forEach(slide => {
                slide.classList.toggle("is-active", slide === target);
            });
            currentIndex = index;
            renderIndicators();
            scheduleAutoplay();
        };

        if (!image.hasAttribute("src")) {
            image.loading = "eager";
            image.src = image.dataset.src;
            image.removeAttribute("data-src");
        }

        if (image.complete) {
            if (image.naturalWidth > 0) {
                activate();
            }
            return;
        }

        image.addEventListener("load", activate, { once: true });
    }

    function removeFailedSlide(slide) {
        const failedIndex = slides.indexOf(slide);
        if (failedIndex < 0) {
            return;
        }

        const wasActive = failedIndex === currentIndex;
        slide.remove();
        slides.splice(failedIndex, 1);
        transitionRequest += 1;

        if (slides.length === 0) {
            currentIndex = -1;
            window.clearTimeout(autoplayTimer);
            controls.classList.add("hidden");
            slideshow.replaceChildren();
            return;
        }

        if (failedIndex < currentIndex) {
            currentIndex -= 1;
        } else if (wasActive) {
            currentIndex = -1;
        }

        renderIndicators();
        if (wasActive) {
            showSlide(Math.min(failedIndex, slides.length - 1));
        } else {
            scheduleAutoplay();
        }
    }

    previousButton.addEventListener("click", () => {
        showSlide((currentIndex - 1 + slides.length) % slides.length);
    });
    nextButton.addEventListener("click", () => {
        showSlide((currentIndex + 1) % slides.length);
    });

    const hoverSupported = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );
    if (hoverSupported.matches) {
        hero.addEventListener("mouseenter", () => {
            paused = true;
            window.clearTimeout(autoplayTimer);
        });
        hero.addEventListener("mouseleave", () => {
            paused = false;
            scheduleAutoplay();
        });
    }

    hero.addEventListener("focusin", () => {
        paused = true;
        window.clearTimeout(autoplayTimer);
    });
    hero.addEventListener("focusout", event => {
        if (!hero.contains(event.relatedTarget)) {
            paused = false;
            scheduleAutoplay();
        }
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            window.clearTimeout(autoplayTimer);
        } else {
            scheduleAutoplay();
        }
    });

    const handleMotionChange = () => scheduleAutoplay();
    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", handleMotionChange);
    } else {
        reducedMotion.addListener(handleMotionChange);
    }

    renderIndicators();
    scheduleAutoplay();
}


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
            (data.popular || []).slice(0, 2)
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
        getUploadedMediaUrl(meme.image, "memes");

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

    const avatar = document.createElement("img");
    avatar.alt = "";
    setProfileImageSource(avatar, meme.profile_image);

    const username = document.createElement("span");
    username.textContent = `@${meme.username || "user"}`;
    user.append(avatar, username);


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

initializeHomepageHeroSlideshow();
loadHomepageMemes();
