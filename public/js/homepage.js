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

const homepageMemeCarousel =
    document.getElementById("popularMemes");

const homepageMemeCarouselRegion =
    document.querySelector(".hero-meme-showcase");

const homepageMemeControls =
    document.getElementById("homepageMemeControls");

const homepageMemeDots =
    document.getElementById("homepageMemeDots");

const homepageMemeProgress =
    document.getElementById("homepageMemeProgress");

function initializeHomepageHeroSlideshow() {
    const hero = document.querySelector(".hero");
    const slideshow = document.getElementById("heroSlideshow");
    const slideData = document.getElementById("homepageHeroSlideData");
    const controls = document.getElementById("heroSlideshowControls");
    const indicators = document.getElementById("heroSlideIndicators");

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
        controls.classList.add("hidden");
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

    const slides = [];
    let currentIndex = 0;
    let autoplayTimer;
    let transitionRequest = 0;
    let paused = false;
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    imageUrls.forEach((imageUrl, index) => {
        let slide = index === 0
            ? slideshow.querySelector(".hero-slide")
            : null;

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

    function renderIndicators() {
        indicators.replaceChildren();
        slides.forEach((slide, index) => {
            const dot = document.createElement("button");
            dot.className = "hero-slide-dot";
            dot.type = "button";
            dot.setAttribute(
                "aria-label",
                `Show background image ${index + 1} of ${slides.length}`
            );
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

    renderIndicators();
    scheduleAutoplay();

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
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
    homepageMemeControls.classList.add("hidden");


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
            (data.popular || []).slice(0, 8)
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

    stopMemeAutoplay();
    container.replaceChildren();
    homepageMemeDots.replaceChildren();
    homepageMemeSlides = [];
    homepageMemeIndex = 0;


    if (!memes.length) {

        container.innerHTML = `
            <div class="homepage-empty">
                No popular memes yet. Check back soon.
            </div>
        `;

        homepageMemeControls.classList.add("hidden");
        return;
    }

    memes.forEach((meme, index) => {
        const card = createMemeCard(meme);
        card.classList.add("meme-carousel-slide");
        card.setAttribute("role", "group");
        card.setAttribute("aria-roledescription", "slide");
        card.setAttribute("aria-label", `${index + 1} of ${memes.length}`);
        card.setAttribute("aria-hidden", String(index !== 0));
        if (index === 0) {
            card.classList.add("is-active");
        }

        const image = card.querySelector(".homepage-meme-image");
        if (image) {
            image.loading = index === 0 ? "eager" : "lazy";
        }

        container.appendChild(card);
        homepageMemeSlides.push(card);
    });

    if (memes.length > 1) {
        memes.forEach((meme, index) => {
            const dot = document.createElement("button");
            dot.className = "meme-carousel-dot";
            dot.type = "button";
            dot.setAttribute(
                "aria-label",
                `Show meme ${index + 1} of ${memes.length}`
            );
            dot.setAttribute("aria-current", String(index === 0));
            dot.addEventListener("click", () => {
                showMeme(index, index > homepageMemeIndex ? 1 : -1, true);
                resumeMemeAutoplay();
            });
            homepageMemeDots.appendChild(dot);
        });

        homepageMemeControls.classList.remove("hidden");
        preloadNextMemeImage();
        scheduleMemeAutoplay();
    } else {
        homepageMemeControls.classList.add("hidden");
    }

    updateMemeCarouselPauseState();
}

let homepageMemeSlides = [];
let homepageMemeIndex = 0;
let homepageMemeAutoplayTimer;
let homepageMemeResumeTimer;
let homepageMemeTransitionTimer;
let suppressMemeClick = false;
let memePointerId = null;
let memePointerStartX = 0;
let memePointerDeltaX = 0;
let memePointerCard = null;
let isMemeDragging = false;

const homepageMemePauseReasons = {
    hover: false,
    focus: false,
    drag: false,
    hidden: document.hidden
};

function isMemeCarouselPaused() {
    return Object.values(homepageMemePauseReasons).some(Boolean);
}

function updateMemeCarouselPauseState() {
    if (isMemeCarouselPaused()) {
        stopMemeAutoplay();
    }
}

function stopMemeAutoplay() {
    window.clearTimeout(homepageMemeAutoplayTimer);
    window.clearTimeout(homepageMemeResumeTimer);
    homepageMemeProgress.classList.remove("is-running");
}

function scheduleMemeAutoplay() {
    stopMemeAutoplay();
    if (homepageMemeSlides.length < 2 || isMemeCarouselPaused()) {
        return;
    }

    void homepageMemeProgress.offsetWidth;
    homepageMemeProgress.classList.add("is-running");
    homepageMemeAutoplayTimer = window.setTimeout(() => {
        showMeme((homepageMemeIndex + 1) % homepageMemeSlides.length, 1);
    }, 4000);
}

function resumeMemeAutoplay() {
    window.clearTimeout(homepageMemeResumeTimer);
    if (homepageMemeSlides.length < 2 || isMemeCarouselPaused()) {
        return;
    }

    stopMemeAutoplay();
    homepageMemeResumeTimer = window.setTimeout(
        scheduleMemeAutoplay,
        2000
    );
}

function preloadNextMemeImage() {
    if (homepageMemeSlides.length < 2) {
        return;
    }

    const nextIndex = (homepageMemeIndex + 1) % homepageMemeSlides.length;
    const nextImage = homepageMemeSlides[nextIndex].querySelector(
        ".homepage-meme-image"
    );

    if (!nextImage || !nextImage.src) {
        return;
    }

    nextImage.loading = "eager";
    const preloadedImage = new Image();
    preloadedImage.src = nextImage.currentSrc || nextImage.src;
}

function showMeme(index, direction, isManual = false) {
    if (
        index < 0 ||
        index >= homepageMemeSlides.length ||
        index === homepageMemeIndex
    ) {
        if (isManual) {
            resumeMemeAutoplay();
        }
        return;
    }

    window.clearTimeout(homepageMemeTransitionTimer);
    const currentSlide = homepageMemeSlides[homepageMemeIndex];
    const nextSlide = homepageMemeSlides[index];
    const enteringClass = direction > 0
        ? "is-entering-from-right"
        : "is-entering-from-left";
    const exitingClass = direction > 0
        ? "is-exiting-left"
        : "is-exiting-right";

    homepageMemeSlides.forEach(slide => {
        slide.classList.remove(
            "is-active",
            "is-entering-from-right",
            "is-entering-from-left",
            "is-exiting-left",
            "is-exiting-right"
        );
        slide.setAttribute("aria-hidden", "true");
    });

    currentSlide.classList.add(exitingClass);
    nextSlide.classList.add(enteringClass);
    nextSlide.setAttribute("aria-hidden", "false");
    void nextSlide.offsetWidth;
    requestAnimationFrame(() => {
        currentSlide.classList.remove("is-active");
        nextSlide.classList.remove(enteringClass);
        nextSlide.classList.add("is-active");
    });

    homepageMemeIndex = index;
    homepageMemeDots.querySelectorAll(".meme-carousel-dot").forEach(
        (dot, dotIndex) => {
            dot.setAttribute("aria-current", String(dotIndex === index));
        }
    );
    preloadNextMemeImage();
    homepageMemeTransitionTimer = window.setTimeout(() => {
        currentSlide.classList.remove(exitingClass);
    }, 550);

    if (isManual) {
        stopMemeAutoplay();
        resumeMemeAutoplay();
    } else {
        scheduleMemeAutoplay();
    }
}

homepageMemeCarouselRegion.addEventListener("mouseenter", () => {
    homepageMemePauseReasons.hover = true;
    updateMemeCarouselPauseState();
});

homepageMemeCarouselRegion.addEventListener("mouseleave", () => {
    homepageMemePauseReasons.hover = false;
    resumeMemeAutoplay();
});

homepageMemeCarouselRegion.addEventListener("focusin", () => {
    homepageMemePauseReasons.focus = true;
    updateMemeCarouselPauseState();
});

homepageMemeCarouselRegion.addEventListener("focusout", event => {
    if (!homepageMemeCarouselRegion.contains(event.relatedTarget)) {
        homepageMemePauseReasons.focus = false;
        resumeMemeAutoplay();
    }
});

homepageMemeCarousel.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
        (homepageMemeIndex + direction + homepageMemeSlides.length) %
        homepageMemeSlides.length;
    showMeme(nextIndex, direction, true);
});

homepageMemeCarousel.addEventListener("pointerdown", event => {
    if (
        !event.isPrimary ||
        event.button !== 0 ||
        !event.target.closest(".meme-carousel-slide")
    ) {
        return;
    }

    memePointerId = event.pointerId;
    memePointerStartX = event.clientX;
    memePointerDeltaX = 0;
    memePointerCard = homepageMemeSlides[homepageMemeIndex];
    isMemeDragging = true;
    homepageMemePauseReasons.drag = true;
    updateMemeCarouselPauseState();
    memePointerCard.style.transition = "none";
    homepageMemeCarousel.setPointerCapture(event.pointerId);
});

homepageMemeCarousel.addEventListener("pointermove", event => {
    if (!isMemeDragging || event.pointerId !== memePointerId) {
        return;
    }

    memePointerDeltaX = event.clientX - memePointerStartX;
    memePointerCard.style.transform =
        `translate3d(${memePointerDeltaX}px, 0, 0)`;
});

function finishMemePointer(event, allowSwipe) {
    if (!isMemeDragging || event.pointerId !== memePointerId) {
        return;
    }

    const delta = memePointerDeltaX;
    const dragged = Math.abs(delta) >= 8;
    const swiped = allowSwipe && Math.abs(delta) >= 40;
    isMemeDragging = false;
    memePointerId = null;
    memePointerCard.style.transition = "";
    memePointerCard.style.transform = "";

    if (homepageMemeCarousel.hasPointerCapture(event.pointerId)) {
        homepageMemeCarousel.releasePointerCapture(event.pointerId);
    }

    if (dragged) {
        suppressMemeClick = true;
        window.setTimeout(() => {
            suppressMemeClick = false;
        }, 400);
    }

    if (swiped && homepageMemeSlides.length > 1) {
        const direction = delta < 0 ? 1 : -1;
        const nextIndex =
            (homepageMemeIndex + direction + homepageMemeSlides.length) %
            homepageMemeSlides.length;
        showMeme(nextIndex, direction, true);
    }

    memePointerCard = null;
    homepageMemePauseReasons.drag = false;
    resumeMemeAutoplay();
}

homepageMemeCarousel.addEventListener(
    "pointerup",
    event => finishMemePointer(event, true)
);
homepageMemeCarousel.addEventListener(
    "pointercancel",
    event => finishMemePointer(event, false)
);

document.addEventListener("visibilitychange", () => {
    homepageMemePauseReasons.hidden = document.hidden;
    updateMemeCarouselPauseState();
    if (!document.hidden) {
        resumeMemeAutoplay();
    }
});

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
        event => {
            if (suppressMemeClick) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

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
