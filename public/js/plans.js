
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
                (plan, index) =>
                    createPlanCard(
                        plan,
                        index
                    )
            )
            .join("");
}


/*
    Create a single plan card
*/
function createPlanCard(plan, index) {

    const featured =
        plan.duration_days === 7;

    const badge =
        featured
            ? "Popular"
            : index === 0
                ? "Flexible"
                : "Best Access";

    return `
        <article
            class="plan-card ${
                featured
                    ? "featured"
                    : ""
            }"
        >

            <span class="plan-badge">
                ${badge}
            </span>

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

            <div class="plan-price">
                ${formatMoney(plan.price)}

                <small>
                    ${escapeHtml(plan.currency)}
                </small>
            </div>

            <div class="plan-duration">
                ${plan.duration_days}
                ${
                    plan.duration_days === 1
                        ? "day"
                        : "days"
                }
            </div>

            <button
                type="button"
                class="plan-button"
                onclick="selectPlan(${plan.id})"
            >
                Subscribe
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
