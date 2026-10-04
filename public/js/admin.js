/* =========================================
   LILLY MEMES ADMIN DASHBOARD
========================================= */

let dashboardData = null;
let allPayments = [];
let selectedPayment = null;
let members = [];
let selectedMember = null;


/* =========================================
   ELEMENTS
========================================= */

const sections = {
    dashboard: document.getElementById("dashboardSection"),
    payments: document.getElementById("paymentsSection"),
    members: document.getElementById("membersSection"),
    memes: document.getElementById("memesSection"),
    stories: document.getElementById("storiesSection"),
    messages: document.getElementById("messagesSection")
};

const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");

const adminUsername = document.getElementById("adminUsername");

const pendingPaymentsBadge =
    document.getElementById("pendingPaymentsBadge");

const totalMembers =
    document.getElementById("totalMembers");

const activeMembers =
    document.getElementById("activeMembers");

const pendingPayments =
    document.getElementById("pendingPayments");

const totalRevenue =
    document.getElementById("totalRevenue");

const activeSubscriptions =
    document.getElementById("activeSubscriptions");

const totalMemes =
    document.getElementById("totalMemes");

const recentPaymentsTable =
    document.getElementById("recentPaymentsTable");

const paymentsTable =
    document.getElementById("paymentsTable");

const paymentSearch =
    document.getElementById("paymentSearch");

const paymentStatusFilter =
    document.getElementById("paymentStatusFilter");

const paymentModal =
    document.getElementById("paymentModal");

const paymentDetails =
    document.getElementById("paymentDetails");

const approvePaymentButton =
    document.getElementById("approvePaymentButton");

const rejectPaymentButton =
    document.getElementById("rejectPaymentButton");

const closePaymentModal =
    document.getElementById("closePaymentModal");

const adminToast =
    document.getElementById("adminToast");

const membersSection =
    document.getElementById("membersSection");

const membersTableBody =
    document.getElementById("membersTableBody");

const memberSearchInput =
    document.getElementById("memberSearchInput");

const memberStatusFilter =
    document.getElementById("memberStatusFilter");

const refreshMembersBtn =
    document.getElementById("refreshMembersBtn");

const memberModal =
    document.getElementById("memberModal");

const closeMemberModal =
    document.getElementById("closeMemberModal");

const memberModalAvatar =
    document.getElementById("memberModalAvatar");

const memberModalName =
    document.getElementById("memberModalName");

const memberModalUsername =
    document.getElementById("memberModalUsername");

const memberModalEmail =
    document.getElementById("memberModalEmail");

const memberModalStatus =
    document.getElementById("memberModalStatus");

const memberModalPlan =
    document.getElementById("memberModalPlan");

const memberModalSubscriptionStatus =
    document.getElementById("memberModalSubscriptionStatus");

const memberModalExpiry =
    document.getElementById("memberModalExpiry");

const memberModalJoined =
    document.getElementById("memberModalJoined");

const verifyMemberBtn =
    document.getElementById("verifyMemberBtn");

const rejectMemberBtn =
    document.getElementById("rejectMemberBtn");

const cancelMemberSubscriptionBtn =
    document.getElementById("cancelMemberSubscriptionBtn");

const reactivateMemberSubscriptionBtn =
    document.getElementById("reactivateMemberSubscriptionBtn");

const extendMemberSubscriptionBtn =
    document.getElementById("extendMemberSubscriptionBtn");

const extendSubscriptionDays =
    document.getElementById("extendSubscriptionDays");

const memberSubscriptionActions =
    document.getElementById("memberSubscriptionActions");

const storyForm =
    document.getElementById("storyForm");

const storyMediaInput =
    document.getElementById("storyMediaInput");

const storyCaptionInput =
    document.getElementById("storyCaptionInput");

const storyDurationInput =
    document.getElementById("storyDurationInput");

const publishStoryBtn =
    document.getElementById("publishStoryBtn");

const storyFormMessage =
    document.getElementById("storyFormMessage");

const storiesTableBody =
    document.getElementById("storiesTableBody");

const refreshStoriesBtn =
    document.getElementById("refreshStoriesBtn");

const memberMessagesTableBody =
    document.getElementById("memberMessagesTableBody");

const refreshMessagesBtn =
    document.getElementById("refreshMessagesBtn");


/* =========================================
   NAVIGATION
========================================= */

const navigationButtons =
    document.querySelectorAll(
        ".admin-nav-item"
    );

const sectionButtons =
    document.querySelectorAll(
        "[data-section]"
    );


function switchSection(sectionName) {
    if (sectionName === "memes") {
        window.location.assign("/admin-memes.html");
        return;
    }

    Object.values(sections).forEach((section) => {

        if (section) {
            section.classList.remove("active");
        }

    });


    navigationButtons.forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );

    });


    const selectedSection =
        sections[sectionName];

    if (selectedSection) {
        selectedSection.classList.add("active");
    }


    const titles = {

        dashboard: [
            "Dashboard",
            "Overview of your Lilly Memes platform."
        ],

        payments: [
            "Payments",
            "Review and verify member payments."
        ],

        members: [
            "Members",
            "Manage Lilly Memes members."
        ],

        memes: [
            "Memes",
            "Manage memes published on Lilly Memes."
        ],

        stories: [
            "Stories",
            "Manage stories published by the platform."
        ],

        messages: [
            "Member Messages",
            "Read messages sent directly by members."
        ]

    };


    if (titles[sectionName]) {

        pageTitle.textContent =
            titles[sectionName][0];

        pageDescription.textContent =
            titles[sectionName][1];

    }


    const sidebar =
        document.getElementById("adminSidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }


    if (sectionName === "payments") {
        renderPayments();
    }

    if (sectionName === "members" && membersSection) {
        loadMembers();
    }

    if (sectionName === "stories") {
        loadAdminStories();
    }

    if (sectionName === "messages") {
        loadMemberMessages();
    }
}


sectionButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const section =
            button.dataset.section;

        if (section) {
            switchSection(section);
        }

    });

});


/* =========================================
   MOBILE MENU
========================================= */

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            const sidebar =
                document.getElementById("adminSidebar");

            sidebar.classList.toggle("open");

        }
    );
}


/* =========================================
   FORMATTERS
========================================= */

function formatNumber(value) {

    return Number(value || 0)
        .toLocaleString();
}


function formatMoney(amount, currency = "MWK") {

    const value =
        Number(amount || 0)
            .toLocaleString();

    if (currency === "MWK") {
        return `MK ${value}`;
    }

    return `${currency} ${value}`;
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsedDate =
        new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "—";
    }

    return parsedDate.toLocaleDateString(
        "en-MW",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatPaymentMethod(method) {

    const methods = {

        airtel_money: "Airtel Money",

        tnm_mpamba: "TNM Mpamba",

        malipo: "Malipo",

        bank: "Bank Transfer",

        cash: "Cash",

        manual: "Manual Payment"

    };

    return methods[method] || method || "—";
}


function formatStatus(status) {

    const label =
        String(status || "")
            .replace(/_/g, " ");

    return label
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
}


/* =========================================
   TOAST
========================================= */

let toastTimer = null;


function showToast(message) {

    if (!adminToast) {
        return;
    }

    adminToast.textContent =
        message;

    adminToast.classList.remove(
        "hidden"
    );


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(() => {

            adminToast.classList.add(
                "hidden"
            );

        }, 3000);
}


/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/admin/dashboard"
            );


        if (response.status === 401) {

            window.location.href =
                "/login.html";

            return;
        }


        if (response.status === 403) {

            window.location.href =
                "/member.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load dashboard."
            );
        }


        dashboardData =
            data;


        renderDashboard(
            data
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showToast(
            "Failed to load dashboard."
        );
    }
}


/* =========================================
   RENDER DASHBOARD
========================================= */

function renderDashboard(data) {

    const statistics =
        data.statistics || {};

    const members =
        statistics.members || {};

    const payments =
        statistics.payments || {};

    const subscriptions =
        statistics.subscriptions || {};

    const memes =
        statistics.memes || {};


    totalMembers.textContent =
        formatNumber(
            members.total_members
        );


    activeMembers.textContent =
        formatNumber(
            members.active_members
        );


    pendingPayments.textContent =
        formatNumber(
            payments.pending_payments
        );


    totalRevenue.textContent =
        (statistics.revenueByCurrency || [])
            .map((revenue) =>
                formatMoney(
                    revenue.total_revenue,
                    revenue.currency
                )
            )
            .join(" · ") ||
        formatMoney(0, "MWK");


    activeSubscriptions.textContent =
        formatNumber(
            subscriptions.active_subscriptions
        );


    totalMemes.textContent =
        formatNumber(
            memes.total_memes
        );


    const pending =
        Number(
            payments.pending_payments || 0
        );


    pendingPaymentsBadge.textContent =
        pending;


    pendingPaymentsBadge.classList.toggle(
        "hidden",
        pending === 0
    );


    renderRecentPayments(
        data.recentPayments || []
    );
}


/* =========================================
   RECENT PAYMENTS
========================================= */

function renderRecentPayments(payments) {

    if (!payments.length) {

        recentPaymentsTable.innerHTML = `
            <tr>
                <td colspan="6" class="table-loading">
                    No payments found.
                </td>
            </tr>
        `;

        return;
    }


    recentPaymentsTable.innerHTML =
        payments.map((payment) => {

            const status =
                payment.status || "pending";


            return `
                <tr>

                    <td>
                        <div class="member-cell">
                            <strong>
                                ${escapeHtml(
                                    payment.full_name ||
                                    payment.username ||
                                    "Unknown"
                                )}
                            </strong>

                            <span>
                                @${escapeHtml(
                                    payment.username || "user"
                                )}
                            </span>
                        </div>
                    </td>

                    <td>
                        ${escapeHtml(
                            payment.plan_name || "—"
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            payment.amount,
                            payment.currency || "MWK"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatPaymentMethod(
                                payment.payment_method
                            )
                        )}
                    </td>

                    <td>
                        <span class="
                            status-badge
                            status-${escapeHtml(status)}
                        ">
                            ${escapeHtml(
                                formatStatus(status)
                            )}
                        </span>
                    </td>

                    <td>
                        ${formatDate(
                            payment.created_at
                        )}
                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================
   LOAD PAYMENTS
========================================= */

async function loadPayments() {

    try {

        paymentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading">
                    Loading payments...
                </td>
            </tr>
        `;


        const response =
            await fetch(
                "/api/payments/admin"
            );


        if (response.status === 401) {

            window.location.href =
                "/login.html";

            return;
        }


        if (response.status === 403) {

            window.location.href =
                "/member.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load payments."
            );
        }


        allPayments =
            data.payments || [];


        renderPayments();


    } catch (error) {

        console.error(
            "Payments error:",
            error
        );


        paymentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading">
                    Failed to load payments.
                </td>
            </tr>
        `;

        showToast(
            "Failed to load payments."
        );
    }
}


/* =========================================
   RENDER PAYMENTS
========================================= */

function renderPayments() {

    const search =
        (paymentSearch?.value || "")
            .trim()
            .toLowerCase();


    const status =
        paymentStatusFilter?.value ||
        "all";


    const filtered =
        allPayments.filter((payment) => {

            const matchesSearch =
                !search ||

                String(
                    payment.username || ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    payment.full_name || ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    payment.transaction_reference || ""
                )
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                status === "all" ||
                payment.status === status;


            return matchesSearch &&
                matchesStatus;

        });


    if (!filtered.length) {

        paymentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="table-loading">
                    No payments found.
                </td>
            </tr>
        `;

        return;
    }


    paymentsTable.innerHTML =
        filtered.map((payment) => {

            const paymentStatus =
                payment.status || "pending";


            return `
                <tr>

                    <td>
                        <div class="member-cell">
                            <strong>
                                ${escapeHtml(
                                    payment.full_name ||
                                    payment.username ||
                                    "Unknown"
                                )}
                            </strong>

                            <span>
                                @${escapeHtml(
                                    payment.username || "user"
                                )}
                            </span>
                        </div>
                    </td>

                    <td>
                        ${escapeHtml(
                            payment.plan_name || "—"
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            payment.amount,
                            payment.currency || "MWK"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatPaymentMethod(
                                payment.payment_method
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            payment.transaction_reference ||
                            "—"
                        )}
                    </td>

                    <td>
                        <span class="
                            status-badge
                            status-${escapeHtml(paymentStatus)}
                        ">
                            ${escapeHtml(
                                formatStatus(paymentStatus)
                            )}
                        </span>
                    </td>

                    <td>

                        <button
                            type="button"
                            class="view-payment-button"
                            data-payment-id="${payment.id}"
                        >
                            View
                        </button>

                    </td>

                </tr>
            `;

        }).join("");


    document
        .querySelectorAll(
            ".view-payment-button"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    openPayment(
                        button.dataset.paymentId
                    );

                }
            );

        });
}


/* =========================================
   OPEN PAYMENT
========================================= */

async function openPayment(paymentId) {

    try {

        const response =
            await fetch(
                `/api/payments/admin/${paymentId}`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load payment."
            );
        }


        selectedPayment =
            data.payment;


        renderPaymentDetails(
            selectedPayment
        );


        paymentModal.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Failed to load payment details."
        );
    }
}


/* =========================================
   PAYMENT DETAILS
========================================= */

function renderPaymentDetails(payment) {

    const isPending =
        payment.status === "pending";


    paymentDetails.innerHTML = `

        <div class="detail-item">

            <span>Member</span>

            <strong>
                ${escapeHtml(
                    payment.full_name ||
                    payment.username ||
                    "Unknown"
                )}
            </strong>

        </div>


        <div class="detail-item">

            <span>Username</span>

            <strong>
                @${escapeHtml(
                    payment.username || "user"
                )}
            </strong>

        </div>


        <div class="detail-item">

            <span>Plan</span>

            <strong>
                ${escapeHtml(
                    payment.plan_name || "—"
                )}
            </strong>

        </div>


        <div class="detail-item">

            <span>Amount</span>

            <strong>
                ${formatMoney(
                    payment.amount,
                    payment.currency || "MWK"
                )}
            </strong>

        </div>


        <div class="detail-item">

            <span>Payment Method</span>

            <strong>
                ${escapeHtml(
                    formatPaymentMethod(
                        payment.payment_method
                    )
                )}
            </strong>

        </div>


        <div class="detail-item">

            <span>Phone Number</span>

            <strong>
                ${escapeHtml(
                    payment.phone_number || "—"
                )}
            </strong>

        </div>


        <div class="detail-item full">

            <span>Transaction Reference</span>

            <strong>
                ${escapeHtml(
                    payment.transaction_reference ||
                    "—"
                )}
            </strong>

        </div>


        <div class="detail-item">

            <span>Payment Status</span>

            <strong>
                ${escapeHtml(
                    formatStatus(
                        payment.status
                    )
                )}
            </strong>

        </div>


        <div class="detail-item">

            <span>Submitted</span>

            <strong>
                ${formatDate(
                    payment.created_at
                )}
            </strong>

        </div>

    `;


    approvePaymentButton.classList.toggle(
        "hidden",
        !isPending
    );


    rejectPaymentButton.classList.toggle(
        "hidden",
        !isPending
    );
}


/* =========================================
   CLOSE MODAL
========================================= */

function closeModal() {

    paymentModal.classList.add(
        "hidden"
    );

    selectedPayment = null;
}


closePaymentModal.addEventListener(
    "click",
    closeModal
);


paymentModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === paymentModal
        ) {
            closeModal();
        }

    }
);


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   MEMBERS
========================================= */

async function loadMembers() {

    if (!membersTableBody) {
        return;
    }

    membersTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">
                Loading members...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(
                "/api/admin/members"
            );

        if (response.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (response.status === 403) {
            window.location.href = "/member.html";
            return;
        }

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load members."
            );
        }

        members =
            Array.isArray(data.members)
                ? data.members
                : [];

        renderMembers();

    } catch (error) {

        console.error("Load members:", error);

        membersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    Failed to load members.
                </td>
            </tr>
        `;

        showToast(
            error.message ||
            "Failed to load members."
        );

    }
}


function getMemberInitials(value) {

    const parts =
        String(value || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


function getMemberStatusBadge(status) {

    const safeStatus =
        ["pending", "active", "suspended", "cancelled", "expired", "rejected"].includes(status)
            ? status
            : "none";

    const label =
        safeStatus === "none"
            ? escapeHtml(status || "Unknown")
            : formatStatus(safeStatus);

    return `
        <span class="status-badge status-${safeStatus}">
            ${label}
        </span>
    `;

}


function renderMembers() {

    if (!membersTableBody) {
        return;
    }

    const searchTerm =
        memberSearchInput
            ? memberSearchInput.value.trim().toLowerCase()
            : "";

    const statusFilter =
        memberStatusFilter
            ? memberStatusFilter.value
            : "all";

    const filteredMembers =
        members.filter((member) => {

            const username =
                String(member.username || "");

            const email =
                String(member.email || "");

            const fullName =
                String(member.full_name || "");

            const matchesSearch =
                !searchTerm ||
                username.toLowerCase().includes(searchTerm) ||
                email.toLowerCase().includes(searchTerm) ||
                fullName.toLowerCase().includes(searchTerm);

            const matchesStatus =
                statusFilter === "all" ||
                member.status === statusFilter;

            return matchesSearch && matchesStatus;

        });

    if (filteredMembers.length === 0) {
        membersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    No members found.
                </td>
            </tr>
        `;

        return;
    }

    membersTableBody.innerHTML =
        filteredMembers.map((member) => {

            const memberId =
                Number(member.id);

            const username =
                String(member.username || "");

            const memberName =
                String(member.full_name || username || "Member");

            const initials =
                getMemberInitials(memberName);

            return `
                <tr>
                    <td>
                        <div class="member-name-cell">
                            <div class="member-avatar">
                                ${escapeHtml(initials)}
                            </div>
                            <div>
                                <strong>${escapeHtml(memberName)}</strong>
                                <small>@${escapeHtml(username)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(member.email || "—")}</td>
                    <td>${getMemberStatusBadge(member.status)}</td>
                    <td>
                        ${
                            member.plan_name
                                ? escapeHtml(member.plan_name)
                                : '<span class="status-badge status-none">None</span>'
                        }
                    </td>
                    <td>${formatDate(member.end_date)}</td>
                    <td>${formatDate(member.created_at)}</td>
                    <td>
                        <div class="member-action-buttons">
                            <button
                                type="button"
                                class="member-view-btn"
                                data-member-action="view"
                                data-member-id="${memberId}"
                            >
                                <i class="fa-solid fa-eye"></i>
                                View
                            </button>
                            ${
                                member.status === "pending"
                                    ? `
                                        <button
                                            type="button"
                                            class="member-verify-btn"
                                            data-member-action="verify"
                                            data-member-id="${memberId}"
                                        >
                                            <i class="fa-solid fa-check"></i>
                                            Verify
                                        </button>
                                        <button
                                            type="button"
                                            class="member-reject-btn"
                                            data-member-action="reject"
                                            data-member-id="${memberId}"
                                        >
                                            <i class="fa-solid fa-xmark"></i>
                                            Reject
                                        </button>
                                    `
                                    : ""
                            }
                        </div>
                    </td>
                </tr>
            `;

        }).join("");

}


function openMemberModal(memberId) {

    const member =
        members.find(
            (item) => Number(item.id) === Number(memberId)
        );

    if (!member || !memberModal) {
        return;
    }

    selectedMember = member;

    const memberName =
        member.full_name ||
        member.username ||
        "Member";

    memberModalAvatar.textContent =
        getMemberInitials(memberName);

    memberModalName.textContent =
        memberName;

    memberModalUsername.textContent =
        `@${member.username || ""}`;

    memberModalEmail.textContent =
        member.email || "—";

    memberModalStatus.textContent =
        formatStatus(member.status) || "—";

    memberModalPlan.textContent =
        member.plan_name || "No subscription";

    memberModalSubscriptionStatus.textContent =
        formatStatus(member.subscription_status) || "None";

    memberModalExpiry.textContent =
        member.end_date
            ? formatDate(member.end_date)
            : "No subscription expiry";

    memberModalJoined.textContent =
        formatDate(member.created_at);

    verifyMemberBtn.classList.toggle(
        "hidden",
        member.status !== "pending"
    );

    rejectMemberBtn.classList.toggle(
        "hidden",
        member.status !== "pending"
    );

    const hasFutureExpiry =
        member.end_date &&
        new Date(member.end_date) > new Date();

    const canCancelOrExtend =
        member.subscription_status === "active" &&
        hasFutureExpiry;

    const canReactivate =
        member.subscription_status === "cancelled" &&
        hasFutureExpiry;

    cancelMemberSubscriptionBtn.classList.toggle(
        "hidden",
        !canCancelOrExtend
    );

    extendMemberSubscriptionBtn.classList.toggle(
        "hidden",
        !canCancelOrExtend
    );

    reactivateMemberSubscriptionBtn.classList.toggle(
        "hidden",
        !canReactivate
    );

    memberSubscriptionActions.classList.toggle(
        "hidden",
        !canCancelOrExtend && !canReactivate
    );

    memberModal.classList.add("show");
    memberModal.setAttribute("aria-hidden", "false");
    closeMemberModal.focus();

}


function closeMemberDetailsModal() {

    if (!memberModal) {
        return;
    }

    memberModal.classList.remove("show");
    memberModal.setAttribute("aria-hidden", "true");
    selectedMember = null;

}


async function updateMemberStatus(action) {

    if (!selectedMember) {
        return;
    }

    const member =
        selectedMember;

    const isVerify =
        action === "verify";

    const prompt =
        isVerify
            ? `Verify ${member.username}'s account?`
            : `Reject ${member.username}'s account verification?`;

    if (!confirm(prompt)) {
        return;
    }

    const button =
        isVerify
            ? verifyMemberBtn
            : rejectMemberBtn;

    const otherButton =
        isVerify
            ? rejectMemberBtn
            : verifyMemberBtn;

    const originalButtonText =
        button.innerHTML;

    button.disabled = true;
    otherButton.disabled = true;
    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${isVerify ? "Verifying..." : "Rejecting..."}
    `;

    try {

        const response =
            await fetch(
                `/api/admin/members/${encodeURIComponent(member.id)}/${action}`,
                {
                    method: "PUT"
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                `Failed to ${action} member.`
            );
        }

        closeMemberDetailsModal();
        await loadMembers();
        await loadDashboard();

        showToast(
            data.message ||
            (isVerify
                ? "Member verified successfully."
                : "Member verification rejected.")
        );

    } catch (error) {

        console.error(
            `${isVerify ? "Verify" : "Reject"} member error:`,
            error
        );

        showToast(
            error.message ||
            `Failed to ${action} member.`
        );

    } finally {

        button.disabled = false;
        otherButton.disabled = false;
        button.innerHTML = originalButtonText;

    }

}


async function updateMemberSubscription(action) {

    if (!selectedMember) {
        return;
    }

    const member =
        selectedMember;

    const days =
        Number(extendSubscriptionDays.value);

    if (
        action === "extend" &&
        (
            !Number.isInteger(days) ||
            days < 1 ||
            days > 3650
        )
    ) {
        showToast("Enter an extension from 1 to 3650 whole days.");
        return;
    }

    const messages = {
        cancel: {
            confirmation:
                `Cancel ${member.username}'s subscription now? Access will end immediately.`,
            button: cancelMemberSubscriptionBtn,
            label: "Cancelling...",
            endpoint: "cancel-subscription"
        },
        reactivate: {
            confirmation:
                `Reactivate ${member.username}'s subscription until its original expiry date?`,
            button: reactivateMemberSubscriptionBtn,
            label: "Reactivating...",
            endpoint: "reactivate-subscription"
        },
        extend: {
            confirmation:
                `Extend ${member.username}'s subscription by ${days} day${days === 1 ? "" : "s"}?`,
            button: extendMemberSubscriptionBtn,
            label: "Extending...",
            endpoint: "extend-subscription"
        }
    };

    const actionDetails =
        messages[action];

    if (!actionDetails || !confirm(actionDetails.confirmation)) {
        return;
    }

    const button =
        actionDetails.button;

    const originalButtonText =
        button.innerHTML;

    button.disabled = true;
    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${actionDetails.label}
    `;

    try {

        const response =
            await fetch(
                `/api/admin/members/${encodeURIComponent(member.id)}/${actionDetails.endpoint}`,
                {
                    method: "PUT",
                    ...(action === "extend"
                        ? {
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ days })
                        }
                        : {})
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to cancel member subscription."
            );
        }

        closeMemberDetailsModal();
        await loadMembers();
        await loadDashboard();

        showToast(
            data.message ||
            `Member subscription ${action}d.`
        );

    } catch (error) {

        console.error(
            `Member subscription ${action} error:`,
            error
        );

        showToast(
            error.message ||
            `Failed to ${action} member subscription.`
        );

    } finally {
        button.disabled = false;
        button.innerHTML = originalButtonText;
    }

}


if (memberSearchInput) {
    memberSearchInput.addEventListener(
        "input",
        renderMembers
    );
}

if (memberStatusFilter) {
    memberStatusFilter.addEventListener(
        "change",
        renderMembers
    );
}

if (refreshMembersBtn) {
    refreshMembersBtn.addEventListener(
        "click",
        loadMembers
    );
}

if (membersTableBody) {
    membersTableBody.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest("[data-member-action]");

            if (!button) {
                return;
            }

            const { memberAction, memberId } =
                button.dataset;

            if (memberAction === "view") {
                openMemberModal(memberId);
                return;
            }

            selectedMember =
                members.find(
                    (member) => Number(member.id) === Number(memberId)
                ) || null;

            if (selectedMember) {
                updateMemberStatus(memberAction);
            }

        }
    );
}

if (closeMemberModal) {
    closeMemberModal.addEventListener(
        "click",
        closeMemberDetailsModal
    );
}

if (memberModal) {
    memberModal.addEventListener(
        "click",
        (event) => {
            if (event.target === memberModal) {
                closeMemberDetailsModal();
            }
        }
    );
}

if (verifyMemberBtn) {
    verifyMemberBtn.addEventListener(
        "click",
        () => updateMemberStatus("verify")
    );
}

if (rejectMemberBtn) {
    rejectMemberBtn.addEventListener(
        "click",
        () => updateMemberStatus("reject")
    );
}

if (cancelMemberSubscriptionBtn) {
    cancelMemberSubscriptionBtn.addEventListener(
        "click",
        () => updateMemberSubscription("cancel")
    );
}

if (reactivateMemberSubscriptionBtn) {
    reactivateMemberSubscriptionBtn.addEventListener(
        "click",
        () => updateMemberSubscription("reactivate")
    );
}

if (extendMemberSubscriptionBtn) {
    extendMemberSubscriptionBtn.addEventListener(
        "click",
        () => updateMemberSubscription("extend")
    );
}

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape" &&
            memberModal &&
            memberModal.classList.contains("show")
        ) {
            closeMemberDetailsModal();
        }
    }
);


/* =========================================
   PAYMENT SEARCH / FILTER
========================================= */

if (paymentSearch) {

    paymentSearch.addEventListener(
        "input",
        renderPayments
    );
}


if (paymentStatusFilter) {

    paymentStatusFilter.addEventListener(
        "change",
        renderPayments
    );
}


/* =========================================
   REFRESH
========================================= */

const refreshPayments =
    document.getElementById(
        "refreshPayments"
    );

if (refreshPayments) {

    refreshPayments.addEventListener(
        "click",
        async () => {

            await loadPayments();

            await loadDashboard();

            showToast(
                "Payments refreshed."
            );

        }
    );
}


/* =========================================
   APPROVE / REJECT
========================================= */

approvePaymentButton.addEventListener(
    "click",
    async () => {

        if (!selectedPayment) {
            return;
        }

        const confirmed =
            confirm(
                `Approve payment #${selectedPayment.id} and activate the ${selectedPayment.plan_name} subscription?`
            );

        if (!confirmed) {
            return;
        }

        approvePaymentButton.disabled = true;

        approvePaymentButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Approving...
        `;

        try {

            const response =
                await fetch(
                    `/api/payments/admin/${selectedPayment.id}/approve`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to approve payment."
                );
            }

            closeModal();

            showToast(
                "Payment approved. Subscription activated."
            );

            await loadDashboard();
            await loadPayments();

        } catch (error) {

            console.error(
                "Approve payment:",
                error
            );

            showToast(
                error.message ||
                "Failed to approve payment."
            );

        } finally {

            approvePaymentButton.disabled =
                false;

            approvePaymentButton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Approve Payment
            `;
        }
    }
);


rejectPaymentButton.addEventListener(
    "click",
    async () => {

        if (!selectedPayment) {
            return;
        }

        const confirmed =
            confirm(
                `Reject payment #${selectedPayment.id}?`
            );

        if (!confirmed) {
            return;
        }

        rejectPaymentButton.disabled = true;

        rejectPaymentButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Rejecting...
        `;

        try {

            const response =
                await fetch(
                    `/api/payments/admin/${selectedPayment.id}/reject`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to reject payment."
                );
            }

            closeModal();

            showToast(
                "Payment rejected."
            );

            await loadDashboard();
            await loadPayments();

        } catch (error) {

            console.error(
                "Reject payment:",
                error
            );

            showToast(
                error.message ||
                "Failed to reject payment."
            );

        } finally {

            rejectPaymentButton.disabled =
                false;

            rejectPaymentButton.innerHTML = `
                <i class="fa-solid fa-xmark"></i>
                Reject
            `;
        }
    }
);


/* =========================================
   LOGOUT
========================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST"
                    }
                );

            } finally {

                window.location.href =
                    "/login.html";

            }

        }
    );
}


/* =========================================
   INITIALIZE
========================================= */

async function initializeAdmin() {

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


        if (
            data.user.role !== "admin"
        ) {

            window.location.href =
                "/member.html";

            return;
        }


        if (adminUsername) {

            adminUsername.textContent =
                data.user.username ||
                "Admin";

        }


    } catch (error) {

        console.error(
            error
        );

        window.location.href =
            "/login.html";

        return;
    }


    await loadDashboard();

    await loadPayments();

    if (storyForm) {
        storyForm.addEventListener("submit", handleStorySubmit);
    }

    if (refreshStoriesBtn) {
        refreshStoriesBtn.addEventListener("click", loadAdminStories);
    }

    if (refreshMessagesBtn) {
        refreshMessagesBtn.addEventListener("click", loadMemberMessages);
    }
}

async function loadMemberMessages() {
    if (!memberMessagesTableBody) {
        return;
    }

    memberMessagesTableBody.innerHTML = `
        <tr>
            <td colspan="4" class="loading-cell">Loading member messages...</td>
        </tr>
    `;

    try {
        const response = await fetch("/api/member-messages/admin");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load member messages.");
        }

        renderMemberMessages(data.messages || []);
    } catch (error) {
        console.error("Load member messages error:", error);
        memberMessagesTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-cell">Failed to load member messages.</td>
            </tr>
        `;
        showToast(error.message || "Failed to load member messages.");
    }
}

function renderMemberMessages(messages) {
    if (messages.length === 0) {
        memberMessagesTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-cell">No member messages have been sent.</td>
            </tr>
        `;
        return;
    }

    memberMessagesTableBody.innerHTML = messages.map((message) => `
        <tr>
            <td>
                <strong>${escapeHtml(message.full_name || message.username || "Member")}</strong>
                <small class="message-member-meta">
                    @${escapeHtml(message.username || "member")}<br>
                    ${escapeHtml(message.email || "")}
                </small>
            </td>
            <td>${escapeHtml(message.subject)}</td>
            <td class="member-message-content">${escapeHtml(message.message)}</td>
            <td>${escapeHtml(formatDateTime(message.created_at))}</td>
        </tr>
    `).join("");
}

function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("en-MW", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


async function loadAdminStories() {
    if (!storiesTableBody) {
        return;
    }

    storiesTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-cell">Loading stories...</td>
        </tr>
    `;

    try {
        const response = await fetch("/api/stories/admin");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load stories.");
        }

        renderAdminStories(data.stories || []);
    } catch (error) {
        console.error("Load stories error:", error);
        storiesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cell">Failed to load stories.</td>
            </tr>
        `;
        showToast(error.message || "Failed to load stories.");
    }
}


function renderAdminStories(stories) {
    if (stories.length === 0) {
        storiesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cell">No stories have been published.</td>
            </tr>
        `;
        return;
    }

    storiesTableBody.innerHTML = stories.map((story) => {
        const active =
            Number(story.is_active) === 1 &&
            new Date(story.expires_at).getTime() > Date.now();
        const mediaUrl =
            getUploadedMediaUrl(story.media, "stories");
        const preview = story.media_type === "video"
            ? `<video class="story-media-preview" src="${mediaUrl}" muted preload="metadata"></video>`
            : `<img class="story-media-preview" src="${mediaUrl}" alt="Story media">`;

        return `
            <tr>
                <td>${preview}</td>
                <td>${escapeHtml(story.caption || "-")}</td>
                <td>${escapeHtml(story.username || "-")}</td>
                <td>${formatDate(story.expires_at)}</td>
                <td>
                    <span class="story-status ${active ? "story-status-active" : "story-status-expired"}">
                        ${active ? "Active" : "Expired"}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}


async function handleStorySubmit(event) {
    event.preventDefault();
    storyFormMessage.className = "story-form-message hidden";

    const file = storyMediaInput.files[0];

    if (!file) {
        storyFormMessage.textContent = "Choose an image or video to publish.";
        storyFormMessage.className = "story-form-message error";
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        storyFormMessage.textContent = "Story media must not exceed 50 MB.";
        storyFormMessage.className = "story-form-message error";
        return;
    }

    const formData = new FormData();
    formData.append("media", file);
    formData.append("caption", storyCaptionInput.value.trim());
    formData.append("durationHours", storyDurationInput.value);

    publishStoryBtn.disabled = true;
    publishStoryBtn.textContent = "Publishing...";

    try {
        const response = await fetch("/api/stories", {
            method: "POST",
            body: formData
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to publish story.");
        }

        storyForm.reset();
        storyFormMessage.textContent = data.message;
        storyFormMessage.className = "story-form-message success";
        await loadAdminStories();
    } catch (error) {
        console.error("Publish story error:", error);
        storyFormMessage.textContent =
            error.message || "Failed to publish story.";
        storyFormMessage.className = "story-form-message error";
        showToast(error.message || "Failed to publish story.");
    } finally {
        publishStoryBtn.disabled = false;
        publishStoryBtn.innerHTML =
            '<i class="fa-solid fa-cloud-arrow-up"></i> Publish Story';
    }
}


initializeAdmin();