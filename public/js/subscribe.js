
const params =
    new URLSearchParams(
        window.location.search
    );

const subscriptionId =
    params.get("subscription_id");


const planSummary =
    document.getElementById(
        "planSummary"
    );

const totalAmount =
    document.getElementById(
        "totalAmount"
    );

const paymentForm =
    document.getElementById(
        "paymentForm"
    );

const submitButton =
    document.getElementById(
        "submitPaymentButton"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );


let subscription = null;
let paymentStatusInterval = null;
let checkingPaymentStatus = false;

const paymentRecipients = {
    airtel_money: {
        number: "0990999983",
        label: "Airtel Money"
    },
    tnm_mpamba: {
        number: "0882875937",
        label: "TNM Mpamba"
    }
};

/*
    Start page
*/
document.addEventListener(
    "DOMContentLoaded",
    async function () {
        setupPaymentMethodSelection();

        if (!subscriptionId) {

            showMessage(
                "No subscription was selected.",
                "error"
            );

            submitButton.disabled = true;

            return;
        }


        await loadSubscription();

    }
);

function setupPaymentMethodSelection() {
    const recipient = document.getElementById("paymentRecipient");
    const recipientNumber = document.getElementById("paymentRecipientNumber");
    const recipientMethod = document.getElementById("paymentRecipientMethod");
    const manualDetails =
        document.getElementById("manualPaymentDetails");

    document
        .querySelectorAll('input[name="payment_method"]')
        .forEach((input) => {
            input.addEventListener("change", () => {
                const paymentDetails = paymentRecipients[input.value];
                const isManual = Boolean(paymentDetails);
                manualDetails.hidden = !isManual;
                recipient.hidden = !isManual;
                submitButton.textContent = isManual
                    ? "Submit Payment"
                    : "Pay with PayChangu";

                if (paymentDetails) {
                    recipientNumber.textContent = paymentDetails.number;
                    recipientMethod.textContent =
                        `Send the subscription payment using ${paymentDetails.label}.`;
                }
            });
        });
}

/*
    Load subscription details
*/
async function loadSubscription() {
    try {
        const response =
            await fetch(
                `/api/subscriptions/${encodeURIComponent(
                    subscriptionId
                )}`
            );

        if (response.status === 401) {
            window.location.href =
                "/login.html";
            return;
        }

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Unable to load subscription."
            );
        }

        subscription =
            data.subscription;

        renderSubscription();
        void checkPaymentStatus();

    } catch (error) {
        console.error(
            "Load subscription error:",
            error
        );

        planSummary.innerHTML = `
            <p class="plan-description">
                ${escapeHtml(error.message)}
            </p>
        `;

        submitButton.disabled = true;
    }
}


/*
    Display subscription
*/
function renderSubscription() {

    planSummary.innerHTML = `

        <div class="plan-name">
            ${escapeHtml(
                subscription.plan_name
            )}
        </div>

        <div class="plan-description">
            Lilly Memes membership
        </div>

        <div class="plan-price">
            ${formatMoney(
                subscription.price
            )}
            <small>
                ${escapeHtml(
                    subscription.currency
                )}
            </small>
        </div>

        <div class="plan-duration">
            ${subscription.duration_days}
            ${
                subscription.duration_days === 1
                    ? "day"
                    : "days"
            }
        </div>

    `;


    totalAmount.textContent =
        `${formatMoney(
            subscription.price
        )} ${subscription.currency}`;
}


/*
    Submit payment
*/
paymentForm.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        if (!subscriptionId) {
            showMessage(
                "Subscription not found.",
                "error"
            );

            return;
        }

        const selectedMethod =
            document.querySelector(
                'input[name="payment_method"]:checked'
            );
        const paymentMethod = selectedMethod?.value || "paychangu";
        const isManualPayment = paymentMethod !== "paychangu";
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const transactionReference =
            document.getElementById("transactionReference").value.trim();

        if (isManualPayment && !transactionReference) {
            showMessage(
                "Please enter your transaction reference.",
                "error"
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent =
            isManualPayment
                ? "Submitting payment..."
                : "Connecting to PayChangu...";

        try {
            const response =
                await fetch(
                    "/api/payments",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            subscription_id: subscriptionId,
                            payment_method: paymentMethod,
                            transaction_reference:
                                isManualPayment
                                    ? transactionReference
                                    : null,
                            phone_number:
                                isManualPayment
                                    ? phoneNumber || null
                                    : null
                        })
                    }
                );

            const data =
                await response.json();

            if (response.status === 401) {
                window.location.href =
                    "/login.html";
                return;
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to submit payment."
                );
            }

            if (data.checkout_url) {
                window.location.assign(data.checkout_url);
                return;
            }

            showPendingMessage();
            startPaymentStatusChecking();
        } catch (error) {
            console.error("Payment submission error:", error);

            showMessage(
                error.message ||
                "Unable to submit payment.",
                "error"
            );

            submitButton.disabled = false;
            submitButton.textContent = isManualPayment
                ? "Submit Payment"
                : "Pay with PayChangu";
        }
    }
);

function showPendingMessage() {
    showMessage(
        "Payment submitted successfully. Waiting for administrator verification...",
        "success"
    );

    paymentForm.classList.add("payment-awaiting-approval");
    paymentForm.querySelectorAll(
        "input, select, textarea, button"
    ).forEach((field) => {
        field.disabled = true;
    });
    submitButton.textContent = "Waiting for Verification";
}


function startPaymentStatusChecking() {
    stopPaymentStatusChecking();
    void checkPaymentStatus();
    paymentStatusInterval = window.setInterval(
        checkPaymentStatus,
        15000
    );
}

function setPaymentFormDisabled(disabled) {
    paymentForm.classList.toggle(
        "payment-awaiting-approval",
        disabled
    );
    paymentForm.querySelectorAll(
        "input, select, textarea, button"
    ).forEach((field) => {
        field.disabled = disabled;
    });
}


function stopPaymentStatusChecking() {
    if (paymentStatusInterval !== null) {
        window.clearInterval(paymentStatusInterval);
        paymentStatusInterval = null;
    }
}


async function checkPaymentStatus() {
    if (checkingPaymentStatus || !subscriptionId) {
        return;
    }

    checkingPaymentStatus = true;

    try {
        const response = await fetch(
            `/api/payments/subscription/${encodeURIComponent(subscriptionId)}/status`,
            { cache: "no-store" }
        );

        if (response.status === 401) {
            stopPaymentStatusChecking();
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to check payment status."
            );
        }

        const paymentStatus =
            String(data.payment?.status || "").toLowerCase();
        const subscriptionStatus =
            String(data.subscription_status || "").toLowerCase();

        if (
            paymentStatus === "successful" ||
            paymentStatus === "approved" ||
            subscriptionStatus === "active"
        ) {
            stopPaymentStatusChecking();
            showMessage(
                "Payment approved. Redirecting to your member page...",
                "success"
            );
            window.setTimeout(() => {
                window.location.replace("/member.html");
            }, 1200);
            return;
        }

        if (paymentStatus === "pending") {
            setPaymentFormDisabled(true);

            if (data.payment.payment_method === "paychangu") {
                showMessage(
                    "Payment is still pending. Continue to PayChangu to finish checkout.",
                    "success"
                );
                submitButton.disabled = false;
                submitButton.textContent = "Continue to PayChangu";
            } else {
                showMessage(
                    "Your payment is awaiting administrator verification.",
                    "success"
                );
                submitButton.disabled = true;
                submitButton.textContent = "Waiting for Verification";
            }

            if (paymentStatusInterval === null) {
                paymentStatusInterval = window.setInterval(
                    checkPaymentStatus,
                    15000
                );
            }

            return;
        }

        if (paymentStatus === "failed") {
            stopPaymentStatusChecking();
            showMessage(
                "The payment did not complete. You can try again.",
                "error"
            );
            setPaymentFormDisabled(false);
            submitButton.disabled = false;
            submitButton.textContent = "Try PayChangu Again";
        } else if (
            paymentStatus === "rejected" ||
            subscriptionStatus === "rejected"
        ) {
            stopPaymentStatusChecking();
            showMessage(
                "Your payment was not approved. Please contact the administrator.",
                "error"
            );
            setPaymentFormDisabled(true);
            submitButton.disabled = true;
            submitButton.textContent = "Payment Not Approved";
        } else if (!data.payment) {
            setPaymentFormDisabled(false);
            submitButton.disabled = false;
            submitButton.textContent =
                document.querySelector(
                    'input[name="payment_method"]:checked'
                )?.value === "paychangu"
                    ? "Pay with PayChangu"
                    : "Submit Payment";
        }
    } catch (error) {
        console.error("Check payment status error:", error);
        if (paymentStatusInterval === null) {
            paymentStatusInterval = window.setInterval(
                checkPaymentStatus,
                15000
            );
        }
    } finally {
        checkingPaymentStatus = false;
    }
}


window.addEventListener("beforeunload", stopPaymentStatusChecking);


/*
    Show message
*/
function showMessage(
    message,
    type
) {

    formMessage.textContent =
        message;

    formMessage.className =
        `form-message show ${type}`;
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
    Escape HTML
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
