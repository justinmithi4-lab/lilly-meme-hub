
const plansContainer =
    document.getElementById("plansContainer");

const currentSubscription =
    document.getElementById("currentSubscription");

const subscriptionText =
    document.getElementById("subscriptionText");

const resumePendingPayment =
    document.getElementById("resumePendingPayment");


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadCurrentSubscription();

        await loadPlans();

    }
);


/*
    Load the user's current subscription
*/
async function loadCurrentSubscription() {

    try {

        const response =
            await fetch(
                "/api/subscriptions/current"
            );

        if (response.status === 401) {
            return;
        }

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            return;
        }

        if (!data.subscription) {
            return;
        }

        const subscription =
            data.subscription;

        currentSubscription.classList.remove(
            "hidden"
        );

        let message =
            `${subscription.plan_name} — ${formatStatus(subscription.status)}`;

        if (subscription.end_date) {

            const endDate =
                new Date(
                    subscription.end_date
                );

            message +=
                ` · Ends ${formatDate(endDate)}`;
        }

        subscriptionText.textContent =
            message;

        if (
            subscription.status === "pending" &&
            Number.isInteger(Number(subscription.id))
        ) {
            resumePendingPayment.href =
                `/subscribe.html?subscription_id=${encodeURIComponent(
                    subscription.id
                )}`;
            resumePendingPayment.classList.remove("hidden");
        }

    } catch (error) {

        console.error(
            "Failed to load current subscription:",
            error
        );

    }
}


/*
    Load membership plans
*/
async function loadPlans() {

    try {

        const response =
            await fetch(
                "/api/subscriptions/plans"
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to load plans."
            );
        }

        renderPlans(data.plans);

    } catch (error) {

        console.error(
            "Failed to load plans:",
            error
        );

        plansContainer.innerHTML = `
            <div class="plans-error">
                <p>
                    Unable to load membership plans.
                </p>

                <button
                    class="plan-button"
                    onclick="loadPlans()"
                >
                    Try Again
                </button>
            </div>
        `;

    }
}


/*
    Display plans
*/
function renderPlans(plans) {

    if (!plans || plans.length === 0) {

        plansContainer.innerHTML = `
            <div class="plans-error">
                <p>
                    There are currently no membership plans available.
                </p>
            </div>
        `;

        return;
    }

    plansContainer.innerHTML =
        plans
            .map(
                (plan) =>
                    createPlanCard(plan)
            )
            .join("");
}


/*
    Create a single plan card
*/
function createPlanCard(plan) {

    const featured =
        Number(plan.duration_days) === 90;

    const badge =
        featured
            ? "Best value"
            : Number(plan.duration_days) === 7
                ? "Most popular"
                : "Member access";

    const durationDays =
        Number(plan.duration_days);

    const durationLabel =
        durationDays === 90
            ? "3 months"
            : durationDays === 30
                ? "1 month"
                : durationDays === 7
                    ? "1 week"
                    : `${durationDays} ${durationDays === 1 ? "day" : "days"}`;

    const dailyPrice =
        durationDays > 0
            ? (Number(plan.price) / durationDays).toLocaleString(
                "en-MW",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            )
            : null;

    return `
        <article
            class="plan-card ${
                featured
                    ? "featured"
                    : ""
            }"
        >

            <div class="plan-card-header">
                <span class="plan-icon" aria-hidden="true">
                    <i class="fa-solid ${
                        featured
                            ? "fa-crown"
                            : durationDays === 7
                                ? "fa-bolt"
                                : "fa-star"
                    }"></i>
                </span>

                <span class="plan-badge">
                    ${badge}
                </span>
            </div>

            <h2 class="plan-name">
                ${escapeHtml(plan.name)}
            </h2>

            <p class="plan-description">
                ${
                    escapeHtml(
                        plan.description ||
                        `Access Lilly Memes for ${plan.duration_days} days.`
                    )
                }
            </p>

            <div class="plan-price-block">
                <div class="plan-price">
                    <span class="plan-currency">${escapeHtml(plan.currency)}</span>
                    <strong>${formatMoney(plan.price)}</strong>
                </div>

                <span class="plan-price-period">
                    for ${escapeHtml(durationLabel)}
                </span>
            </div>

            <div class="plan-value">
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                <span>
                    ${dailyPrice === null
                        ? "Membership access included"
                        : `About ${escapeHtml(plan.currency)} ${dailyPrice} per day`}
                </span>
            </div>

            <ul class="plan-features">
                <li><i class="fa-solid fa-check" aria-hidden="true"></i> Browse the full meme collection</li>
                <li><i class="fa-solid fa-check" aria-hidden="true"></i> Like, comment and join discussions</li>
                <li><i class="fa-solid fa-check" aria-hidden="true"></i> Download your favourite memes</li>
                <li><i class="fa-solid fa-check" aria-hidden="true"></i> Access for ${escapeHtml(durationLabel)}</li>
            </ul>

            <button
                type="button"
                class="plan-button"
                onclick="selectPlan(${Number(plan.id)})"
            >
                Choose this plan
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>

        </article>
    `;
}


/*
    Start subscription
*/
async function selectPlan(planId) {
    try {
        const response = await fetch(
            "/api/subscriptions/subscribe",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    plan_id: planId
                })
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            window.location.href =
                "/login.html?redirect=plans.html";
            return;
        }

        if (!response.ok || !data.success) {
            alert(
                data.message ||
                "Unable to start subscription."
            );
            return;
        }

        console.log(
            "Subscription created:",
            data
        );

        /*
            IMPORTANT:
            Go directly to the payment page.
        */
        window.location.assign(
            "/subscribe.html?subscription_id=" +
            encodeURIComponent(
                data.subscription_id
            )
        );

    } catch (error) {
        console.error(
            "Subscription error:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );
    }
}


/*
    Format money
*/
function formatMoney(amount) {

    const number =
        Number(amount);

    if (Number.isNaN(number)) {
        return "0";
    }

    return number.toLocaleString(
        "en-MW",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


/*
    Format subscription status
*/
function formatStatus(status) {

    if (!status) {
        return "";
    }

    return status
        .charAt(0)
        .toUpperCase()
        +
        status
            .slice(1)
            .toLowerCase();
}


/*
    Format date
*/
function formatDate(date) {

    if (
        !(date instanceof Date) ||
        Number.isNaN(date.getTime())
    ) {
        return "";
    }

    return date.toLocaleDateString(
        "en-MW",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/*
    Protect HTML output
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
