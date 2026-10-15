const PAYCHANGU_API_URL = "https://api.paychangu.com";

function getSecretKey() {
    const secretKey = process.env.PAYCHANGU_SECRET_KEY;

    if (!secretKey) {
        throw new Error("PAYCHANGU_SECRET_KEY is not configured.");
    }

    return secretKey;
}

function getAppUrl() {
    const appUrl = process.env.APP_URL;

    if (!appUrl) {
        throw new Error("APP_URL is not configured.");
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(appUrl);
    } catch {
        throw new Error("APP_URL must be a valid absolute URL.");
    }

    if (
        !["http:", "https:"].includes(parsedUrl.protocol) ||
        parsedUrl.username ||
        parsedUrl.password
    ) {
        throw new Error("APP_URL must be an HTTP or HTTPS URL.");
    }

    return parsedUrl.origin;
}

async function paychanguRequest(path, options = {}) {
    const response = await fetch(
        `${PAYCHANGU_API_URL}${path}`,
        {
            ...options,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${getSecretKey()}`,
                ...options.headers
            },
            signal: AbortSignal.timeout(10000)
        }
    );

    let payload;

    try {
        payload = await response.json();
    } catch (error) {
        throw new Error(
            `PayChangu returned an invalid JSON response (HTTP ${response.status}).`,
            { cause: error }
        );
    }

    if (!response.ok || !payload || payload.status !== "success") {
        throw new Error(
            payload?.message ||
            `PayChangu request failed (HTTP ${response.status}).`
        );
    }

    return payload;
}

async function createCheckout({
    amount,
    currency,
    email,
    firstName,
    lastName,
    planName,
    subscriptionId,
    txRef
}) {
    const appUrl = getAppUrl();
    const callbackUrl = new URL(
        "/api/payments/paychangu/callback",
        appUrl
    ).toString();
    const returnUrl = new URL(
        `/subscribe.html?subscription_id=${encodeURIComponent(subscriptionId)}`,
        appUrl
    ).toString();

    const payload = await paychanguRequest("/payment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            amount: String(amount),
            currency,
            email,
            first_name: firstName,
            last_name: lastName,
            callback_url: callbackUrl,
            return_url: returnUrl,
            tx_ref: txRef,
            customization: {
                title: "Lilly Memes Membership",
                description: `${planName} membership`
            },
            meta: {
                subscription_id: subscriptionId
            }
        })
    });

    const checkoutUrl = payload.data?.checkout_url;

    let parsedCheckoutUrl;

    try {
        parsedCheckoutUrl = new URL(checkoutUrl);
    } catch {
        throw new Error("PayChangu did not return a valid checkout URL.");
    }

    if (
        parsedCheckoutUrl.protocol !== "https:" ||
        parsedCheckoutUrl.hostname !== "checkout.paychangu.com"
    ) {
        throw new Error("PayChangu returned an unexpected checkout URL.");
    }

    return checkoutUrl;
}

async function verifyTransaction(txRef) {
    return paychanguRequest(
        `/verify-payment/${encodeURIComponent(txRef)}`
    );
}

module.exports = {
    createCheckout,
    verifyTransaction
};
