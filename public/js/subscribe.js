
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


/*
    Start page
*/
document.addEventListener(
    "DOMContentLoaded",
    async function () {

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


        if (!selectedMethod) {

            showMessage(
                "Please select a payment method.",
                "error"
            );

            return;
        }


        const phoneNumber =
            document.getElementById(
                "phoneNumber"
            ).value.trim();


        const transactionReference =
            document.getElementById(
                "transactionReference"
            ).value.trim();


        /*
            Mobile money and Malipo normally
            need a transaction reference.
        */
        if (
            (
                selectedMethod.value ===
                    "airtel_money" ||
                selectedMethod.value ===
                    "tnm_mpamba" ||
                selectedMethod.value ===
                    "malipo"
            ) &&
            !transactionReference
        ) {

            showMessage(
                "Please enter your transaction reference.",
                "error"
            );

            return;
        }


        submitButton.disabled = true;

        submitButton.textContent =
            "Submitting payment...";


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

                            subscription_id:
                                subscriptionId,

                            payment_method:
                                selectedMethod.value,

                            transaction_reference:
                                transactionReference ||
                                null,

                            phone_number:
                                phoneNumber ||
                                null

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


            showMessage(
                "Payment submitted successfully. Your payment is now awaiting verification.",
                "success"
            );


            submitButton.textContent =
                "Payment Submitted";


            submitButton.disabled = true;


            /*
                Give the user time to read
                the confirmation before returning
                to the member area.
            */
            setTimeout(
                function () {

                    window.location.href =
                        "/member.html";

                },
                2500
            );


        } catch (error) {

            console.error(
                "Payment submission error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to submit payment.",
                "error"
            );


            submitButton.disabled =
                false;

            submitButton.textContent =
                "Submit Payment";
        }

    }
);


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
