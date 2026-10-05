
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const memeId = params.get("id");
    const backButton = document.getElementById("backButton");

    if (backButton) {
        backButton.addEventListener("click", () => {
            window.location.href = "/member.html";
        });
    }

    if (!memeId) {
        window.location.href = "/member.html";
        return;
    }

    let currentUser = null;
    let activeReplyBox = null;

    // Keep track of which comment reply sections are open.
    const expandedReplies = new Set();

    const memeImage = document.getElementById("memeImage");
    const memeTitle = document.getElementById("memeTitle");
    const memeCaption = document.getElementById("memeCaption");
    const memeCategories = document.getElementById("memeCategories");

    const likeButton = document.getElementById("likeButton");
    const saveButton = document.getElementById("saveButton");
    const downloadButton = document.getElementById("downloadButton");
    const shareButton = document.getElementById("shareButton");
    const reportButton = document.getElementById("reportButton");

    const likeCount = document.getElementById("likeCount");
    const viewCount = document.getElementById("viewCount");
    const downloadCount = document.getElementById("downloadCount");
    const commentCount = document.getElementById("commentCount");

    const commentForm = document.getElementById("commentForm");
    const commentInput = document.getElementById("commentInput");
    const commentCharacterCount = document.getElementById("commentCharacterCount");
    const commentButton = document.getElementById("commentButton");
    const commentsMessage = document.getElementById("commentsMessage");
    const commentsList = document.getElementById("commentsList");

    const reportModal = document.getElementById("reportModal");
    const reportForm = document.getElementById("reportForm");
    const reportReason = document.getElementById("reportReason");
    const reportMessage = document.getElementById("reportMessage");
    const closeReportModal = document.getElementById("closeReportModal");

    function handleSubscriptionError(data, response) {
        if (
            response.status === 403 &&
            data.code === "SUBSCRIPTION_REQUIRED"
        ) {
            window.location.href = "/subscribe.html";
            return true;
        }

        return false;
    }

    // =========================================
    // LOAD CURRENT USER
    // =========================================

    async function loadCurrentUser() {
        try {
            const response = await fetch("/api/auth/me");
            const data = await response.json();

            if (!response.ok || !data.success || !data.user) {
                window.location.href = "/login.html";
                return;
            }

            currentUser = data.user;

            await loadMeme();
            await loadComments();

        } catch (error) {
            console.error("Load current user error:", error);
            window.location.href = "/login.html";
        }
    }

    // =========================================
    // LOAD MEME
    // =========================================

    async function loadMeme() {
        try {
            const response = await fetch(`/api/memes/${memeId}`);
            const data = await response.json();

            if (!response.ok || !data.success || !data.meme) {
                window.location.href = "/member.html";
                return;
            }

            const meme = data.meme;

            if (memeImage) {
                memeImage.src =
                    getUploadedMediaUrl(meme.image, "memes");

                memeImage.alt = meme.title || "Meme";
            }

            if (memeTitle) {
                memeTitle.textContent = meme.title || "";
            }

            if (memeCaption) {
                memeCaption.textContent = meme.caption || "";
            }

            if (memeCategories) {
                renderCategories(meme.categories);
            }

            if (likeCount) {
                likeCount.textContent = meme.like_count || 0;
            }

            if (viewCount) {
                viewCount.textContent = meme.view_count || 0;
            }

            if (downloadCount) {
                downloadCount.textContent = meme.download_count || 0;
            }

            if (commentCount) {
                commentCount.textContent = meme.comment_count || 0;
            }

            updateMemeLikeButton(Boolean(meme.user_liked));
            updateSaveButton(Boolean(meme.user_saved));

            recordView();

        } catch (error) {
            console.error("Load meme error:", error);
        }
    }

    // =========================================
    // CATEGORIES
    // =========================================

    function renderCategories(categories) {
        if (!memeCategories) {
            return;
        }

        memeCategories.innerHTML = "";

        if (!categories) {
            return;
        }

        let categoryList = categories;

        if (typeof categories === "string") {
            try {
                categoryList = JSON.parse(categories);
            } catch {
                categoryList = categories
                    .split(",")
                    .map((category) => category.trim())
                    .filter(Boolean);
            }
        }

        if (!Array.isArray(categoryList)) {
            return;
        }

        categoryList.forEach((category) => {
            const span = document.createElement("span");

            if (typeof category === "object" && category !== null) {
                span.textContent = category.name || "";
            } else {
                span.textContent = category;
            }

            if (span.textContent) {
                memeCategories.appendChild(span);
            }
        });
    }

    // =========================================
    // MEME VIEW
    // =========================================

    async function recordView() {
        try {
            const response = await fetch(`/api/memes/${memeId}/view`, {
                method: "POST"
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Could not record meme view."
                );
            }

            if (
                viewCount &&
                Number.isFinite(Number(data.view_count))
            ) {
                viewCount.textContent = data.view_count;
            }

        } catch (error) {
            console.error("Record view error:", error);
        }
    }

    // =========================================
    // MEME LIKE
    // =========================================

    function updateMemeLikeButton(liked) {
        if (!likeButton) {
            return;
        }

        likeButton.classList.toggle("liked", liked);

        const icon = likeButton.querySelector("i");

        if (icon) {
            icon.className = liked
                ? "fas fa-heart"
                : "far fa-heart";
        }

        const text = likeButton.querySelector(".action-text");

        if (text) {
            text.textContent = liked ? "Liked" : "Like";
        }
    }

    async function toggleMemeLike() {
        if (!currentUser) {
            return;
        }

        try {
            const response = await fetch(`/api/memes/${memeId}/like`, {
                method: "POST"
            });

            const data = await response.json();

            if (handleSubscriptionError(data, response)) {
                return;
            }

            if (!response.ok || !data.success) {
                return;
            }

            updateMemeLikeButton(Boolean(data.liked));

            if (likeCount) {
                likeCount.textContent = data.like_count || 0;
            }

        } catch (error) {
            console.error("Toggle meme like error:", error);
        }
    }

    // =========================================
    // SAVE MEME
    // =========================================

    function updateSaveButton(saved) {
        if (!saveButton) {
            return;
        }

        saveButton.classList.toggle("saved", saved);

        const icon = saveButton.querySelector("i");

        if (icon) {
            icon.className = saved
                ? "fas fa-bookmark"
                : "far fa-bookmark";
        }

        const text = saveButton.querySelector(".action-text");

        if (text) {
            text.textContent = saved ? "Saved" : "Save";
        }
    }

    async function toggleSave() {
        if (!currentUser) {
            return;
        }

        try {
            const response = await fetch(`/api/memes/${memeId}/save`, {
                method: "POST"
            });

            const data = await response.json();

            if (handleSubscriptionError(data, response)) {
                return;
            }

            if (!response.ok || !data.success) {
                return;
            }

            updateSaveButton(Boolean(data.saved));

        } catch (error) {
            console.error("Toggle save error:", error);
        }
    }

    // =========================================
    // DOWNLOAD
    // =========================================

    async function downloadMeme() {
        try {
            const response =
                await fetch(
                    `/api/memes/${memeId}/download`
                );

            if (!response.ok) {
                const data =
                    await response.json();

                if (handleSubscriptionError(data, response)) {
                    return;
                }

                throw new Error(
                    data.message ||
                    "Unable to download meme."
                );
            }

            const blob =
                await response.blob();

            const downloadUrl =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            const disposition =
                response.headers.get("Content-Disposition") || "";

            const filenameMatch =
                disposition.match(/filename="?([^";]+)"?/i);

            link.href = downloadUrl;
            link.download =
                filenameMatch
                    ? filenameMatch[1]
                    : `meme-${memeId}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(
                () => URL.revokeObjectURL(downloadUrl),
                1000
            );

        } catch (error) {
            console.error("Download error:", error);
        }
    }

    // =========================================
    // SHARE
    // =========================================

    async function shareMeme() {
        const shareUrl = window.location.href;

        const title = memeTitle
            ? memeTitle.textContent
            : "Lilly Memes";

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || "Lilly Memes",
                    text: "Check out this meme on Lilly Memes!",
                    url: shareUrl
                });
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Share error:", error);
                }
            }

            return;
        }

        try {
            await navigator.clipboard.writeText(shareUrl);

            alert("Meme link copied to clipboard.");

        } catch (error) {
            console.error("Copy share link error:", error);
        }
    }

    // =========================================
    // LOAD COMMENTS
    // =========================================

    async function loadComments() {
        try {
            if (commentsMessage) {
                commentsMessage.textContent =
                    "Loading comments...";
            }

            const response =
                await fetch(`/api/memes/${memeId}/comments`);

            const data = await response.json();

            if (handleSubscriptionError(data, response)) {
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load comments."
                );
            }

            renderComments(data.comments || []);

            if (commentsMessage) {
                commentsMessage.textContent = "";
            }

        } catch (error) {
            console.error("Load comments error:", error);

            if (commentsMessage) {
                commentsMessage.textContent =
                    "Unable to load comments.";
            }
        }
    }

    // =========================================
    // RENDER COMMENTS
    // =========================================

    function renderComments(comments) {
        if (!commentsList) {
            return;
        }

        commentsList.innerHTML = "";

        if (!comments.length) {
            const empty = document.createElement("p");

            empty.className = "no-comments";
            empty.textContent =
                "No comments yet. Be the first to comment!";

            commentsList.appendChild(empty);

            return;
        }

        const commentMap = new Map();

        // Prepare each comment
        comments.forEach((comment) => {
            comment.replies = [];

            commentMap.set(
                Number(comment.id),
                comment
            );
        });

        // Attach replies to their parents
        comments.forEach((comment) => {
            if (comment.parent_id) {
                const parent =
                    commentMap.get(
                        Number(comment.parent_id)
                    );

                if (parent) {
                    parent.replies.push(comment);
                }
            }
        });

        // Only show main comments initially
        const topLevelComments =
            comments.filter(
                (comment) => !comment.parent_id
            );

        topLevelComments.forEach((comment) => {
            commentsList.appendChild(
                createCommentElement(comment)
            );
        });
    }

    // =========================================
    // CREATE COMMENT ELEMENT
    // =========================================

    function createCommentElement(comment) {
        const thread = document.createElement("article");

        thread.className = "comment-thread";
        thread.dataset.commentId = comment.id;

        const commentElement =
            document.createElement("div");

        commentElement.className = "comment";

        // -------------------------------------
        // AVATAR
        // -------------------------------------

        const profileImage =
            document.createElement("div");

        profileImage.className =
            "comment-avatar";

        if (comment.profile_image) {
            const image =
                document.createElement("img");

            image.src =
                getUploadedMediaUrl(comment.profile_image, "profiles");

            image.alt =
                comment.username || "User";

            image.onerror = () => {
                profileImage.innerHTML = "";

                profileImage.textContent =
                    getInitials(
                        comment.full_name ||
                        comment.username
                    );
            };

            profileImage.appendChild(image);

        } else {
            profileImage.textContent =
                getInitials(
                    comment.full_name ||
                    comment.username
                );
        }

        // -------------------------------------
        // CONTENT
        // -------------------------------------

        const content =
            document.createElement("div");

        content.className =
            "comment-content";

        // -------------------------------------
        // COMMENT BUBBLE
        // -------------------------------------

        const bubble =
            document.createElement("div");

        bubble.className =
            "comment-bubble";

        const username =
            document.createElement("strong");

        username.className =
            "comment-username";

        username.textContent =
            comment.username || "User";

        const text =
            document.createElement("div");

        text.className =
            "comment-text";

        text.textContent =
            comment.comment_text || "";

        bubble.appendChild(username);
        bubble.appendChild(text);

        // -------------------------------------
        // META
        // -------------------------------------

        const meta =
            document.createElement("div");

        meta.className =
            "comment-meta";

        const time =
            document.createElement("span");

        time.className =
            "comment-time";

        time.textContent =
            formatCommentDate(
                comment.created_at
            );

        // -------------------------------------
        // LIKE BUTTON
        // -------------------------------------

        const commentLikeButton =
            document.createElement("button");

        commentLikeButton.type = "button";

        commentLikeButton.className =
            "comment-like-button";

        const liked =
            Number(comment.user_liked) === 1 ||
            comment.user_liked === true;

        if (liked) {
            commentLikeButton.classList.add(
                "liked"
            );
        }

        const heartIcon =
            document.createElement("i");

        heartIcon.className =
            liked
                ? "fas fa-heart"
                : "far fa-heart";

        const likeLabel =
            document.createElement("span");

        likeLabel.className =
            "comment-like-label";

        likeLabel.textContent =
            liked ? "Unlike" : "Like";

        const count =
            document.createElement("span");

        count.className =
            "comment-like-count";

        count.textContent =
            Number(comment.like_count || 0);

        commentLikeButton.appendChild(
            heartIcon
        );

        commentLikeButton.appendChild(
            likeLabel
        );

        commentLikeButton.appendChild(
            count
        );

        commentLikeButton.addEventListener(
            "click",
            () => {
                toggleCommentLike(
                    comment.id,
                    commentLikeButton,
                    heartIcon,
                    count,
                    likeLabel
                );
            }
        );

        // -------------------------------------
        // REPLY BUTTON
        // -------------------------------------

        const replyButton =
            document.createElement("button");

        replyButton.type = "button";

        replyButton.className =
            "reply-button";

        replyButton.textContent =
            "Reply";

        replyButton.addEventListener(
            "click",
            () => {
                replyToComment(
                    comment.id,
                    comment.username || "User"
                );
            }
        );

        meta.appendChild(time);
        meta.appendChild(
            commentLikeButton
        );
        meta.appendChild(
            replyButton
        );

        // -------------------------------------
        // ADD BASIC COMMENT
        // -------------------------------------

        content.appendChild(bubble);
        content.appendChild(meta);

        // -------------------------------------
        // REPLIES
        // -------------------------------------

        if (
            comment.replies &&
            comment.replies.length > 0
        ) {
            const replyToggle =
                document.createElement("button");

            replyToggle.type = "button";

            replyToggle.className =
                "replies-toggle";

            const replyCount =
                countAllReplies(comment);

            replyToggle.textContent =
                `${replyCount} ${
                    replyCount === 1
                        ? "reply"
                        : "replies"
                }`;

            const repliesContainer =
                document.createElement("div");

            repliesContainer.className =
                "comment-replies";

            repliesContainer.hidden = true;

            // ---------------------------------
            // TOGGLE REPLIES
            // ---------------------------------

            replyToggle.addEventListener(
                "click",
                () => {
                    const isOpen =
                        expandedReplies.has(
                            Number(comment.id)
                        );

                    if (isOpen) {
                        expandedReplies.delete(
                            Number(comment.id)
                        );

                        repliesContainer.hidden =
                            true;

                        replyToggle.textContent =
                            `${replyCount} ${
                                replyCount === 1
                                    ? "reply"
                                    : "replies"
                            }`;

                    } else {
                        expandedReplies.add(
                            Number(comment.id)
                        );

                        repliesContainer.hidden =
                            false;

                        replyToggle.textContent =
                            "Hide replies";
                    }
                }
            );

            content.appendChild(
                replyToggle
            );

            // Only render the replies inside
            // the hidden container.
            comment.replies.forEach(
                (reply) => {
                    repliesContainer.appendChild(
                        createCommentElement(reply)
                    );
                }
            );

            content.appendChild(
                repliesContainer
            );
        }

        commentElement.appendChild(
            profileImage
        );

        commentElement.appendChild(
            content
        );

        thread.appendChild(
            commentElement
        );

        return thread;
    }

    // =========================================
    // COUNT ALL REPLIES
    // =========================================

    function countAllReplies(comment) {
        if (
            !comment.replies ||
            comment.replies.length === 0
        ) {
            return 0;
        }

        let count =
            comment.replies.length;

        comment.replies.forEach(
            (reply) => {
                count += countAllReplies(reply);
            }
        );

        return count;
    }

    // =========================================
    // COMMENT LIKE / UNLIKE
    // =========================================

    async function toggleCommentLike(
        commentId,
        button,
        icon,
        countElement,
        label
    ) {
        if (!currentUser) {
            return;
        }

        button.disabled = true;

        try {
            const response =
                await fetch(
                    `/api/memes/comments/${commentId}/like`,
                    {
                        method: "POST"
                    }
                );

            const data =
                await response.json();

            if (handleSubscriptionError(data, response)) {
                return;
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to update comment like."
                );
            }

            const liked =
                Boolean(data.liked);

            const newCount =
                Number(
                    data.like_count || 0
                );

            button.classList.toggle(
                "liked",
                liked
            );

            icon.className =
                liked
                    ? "fas fa-heart"
                    : "far fa-heart";

            countElement.textContent =
                newCount;

            label.textContent =
                liked
                    ? "Unlike"
                    : "Like";

        } catch (error) {
            console.error(
                "Toggle comment like error:",
                error
            );

        } finally {
            button.disabled = false;
        }
    }

    // =========================================
    // CREATE TOP-LEVEL COMMENT
    // =========================================

    async function submitComment() {
        if (
            !currentUser ||
            !commentInput
        ) {
            return;
        }

        const text =
            commentInput.value.trim();

        if (!text) {
            return;
        }

        if (text.length > 500) {
            if (commentsMessage) {
                commentsMessage.textContent =
                    "Comment cannot exceed 500 characters.";
            }

            return;
        }

        if (commentButton) {
            commentButton.disabled = true;
        }

        try {
            const response =
                await fetch(
                    `/api/memes/${memeId}/comments`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            comment_text: text
                        })
                    }
                );

            const data =
                await response.json();

            if (handleSubscriptionError(data, response)) {
                return;
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to post comment."
                );
            }

            commentInput.value = "";

            updateCommentCharacterCount();

            closeReplyBox();

            await loadComments();

        } catch (error) {
            console.error(
                "Submit comment error:",
                error
            );

            if (commentsMessage) {
                commentsMessage.textContent =
                    error.message ||
                    "Unable to post comment.";
            }

        } finally {
            if (commentButton) {
                commentButton.disabled =
                    false;
            }
        }
    }

    // =========================================
    // REPLY TO COMMENT
    // =========================================

    function replyToComment(
        commentId,
        username
    ) {
        if (!currentUser) {
            return;
        }

        const existingThread =
            document.querySelector(
                `.comment-thread[data-comment-id="${commentId}"]`
            );

        if (!existingThread) {
            return;
        }

        // If this reply box is already open,
        // close it.
        if (
            activeReplyBox &&
            activeReplyBox.dataset.commentId ===
                String(commentId)
        ) {
            closeReplyBox();
            return;
        }

        closeReplyBox();

        const content =
            existingThread.querySelector(
                ".comment-content"
            );

        if (!content) {
            return;
        }

        const replyBox =
            document.createElement("div");

        replyBox.className =
            "reply-box";

        replyBox.dataset.commentId =
            commentId;

        const textarea =
            document.createElement("textarea");

        textarea.className =
            "reply-input";

        textarea.placeholder =
            `Reply to ${username}...`;

        textarea.maxLength = 500;

        textarea.rows = 1;

        const submitButton =
            document.createElement("button");

        submitButton.type = "button";

        submitButton.className =
            "reply-submit";

        submitButton.innerHTML = "➤";

        const cancelButton =
            document.createElement("button");

        cancelButton.type = "button";

        cancelButton.className =
            "reply-cancel";

        cancelButton.textContent =
            "Cancel";

        const controls =
            document.createElement("div");

        controls.className =
            "reply-controls";

        controls.appendChild(
            cancelButton
        );

        controls.appendChild(
            submitButton
        );

        replyBox.appendChild(
            textarea
        );

        replyBox.appendChild(
            controls
        );

        const repliesContainer =
            content.querySelector(
                ":scope > .comment-replies"
            );

        if (repliesContainer) {
            content.insertBefore(
                replyBox,
                repliesContainer
            );
        } else {
            content.appendChild(
                replyBox
            );
        }

        activeReplyBox =
            replyBox;

        textarea.focus();

        textarea.addEventListener(
            "input",
            () => {
                textarea.style.height =
                    "auto";

                textarea.style.height =
                    Math.min(
                        textarea.scrollHeight,
                        90
                    ) + "px";
            }
        );

        textarea.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Enter" &&
                    (event.ctrlKey ||
                        event.metaKey)
                ) {
                    event.preventDefault();

                    submitReply(
                        commentId,
                        username,
                        textarea,
                        submitButton
                    );
                }

                if (
                    event.key === "Escape"
                ) {
                    closeReplyBox();
                }
            }
        );

        submitButton.addEventListener(
            "click",
            () => {
                submitReply(
                    commentId,
                    username,
                    textarea,
                    submitButton
                );
            }
        );

        cancelButton.addEventListener(
            "click",
            () => {
                closeReplyBox();
            }
        );
    }

    // =========================================
    // SUBMIT REPLY
    // =========================================

    async function submitReply(
        commentId,
        username,
        textarea,
        submitButton
    ) {
        const text =
            textarea.value.trim();

        if (!text) {
            textarea.focus();
            return;
        }

        if (text.length > 500) {
            return;
        }

        submitButton.disabled =
            true;

        try {
            const response =
                await fetch(
                    `/api/memes/${memeId}/comments/${commentId}/reply`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            comment_text: text
                        })
                    }
                );

            const data =
                await response.json();

            if (handleSubscriptionError(data, response)) {
                return;
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to post reply."
                );
            }

            // Keep this comment's replies
            // open after the new reply is added.
            expandedReplies.add(
                Number(commentId)
            );

            closeReplyBox();

            await loadComments();

        } catch (error) {
            console.error(
                "Submit reply error:",
                error
            );

            if (commentsMessage) {
                commentsMessage.textContent =
                    error.message ||
                    "Unable to post reply.";
            }

        } finally {
            submitButton.disabled =
                false;
        }
    }

    // =========================================
    // CLOSE REPLY BOX
    // =========================================

    function closeReplyBox() {
        if (activeReplyBox) {
            activeReplyBox.remove();
            activeReplyBox = null;
        }
    }

    // =========================================
    // COMMENT CHARACTER COUNT
    // =========================================

    function updateCommentCharacterCount() {
        if (
            !commentInput ||
            !commentCharacterCount
        ) {
            return;
        }

        commentCharacterCount.textContent =
            `${commentInput.value.length}/500`;
    }

    // =========================================
    // REPORT MODAL
    // =========================================

    function openReportModal() {
        if (!reportModal) {
            return;
        }

        reportModal.classList.add("active");

        reportModal.removeAttribute(
            "hidden"
        );
    }

    function closeReport() {
        if (!reportModal) {
            return;
        }

        reportModal.classList.remove(
            "active"
        );

        reportModal.setAttribute(
            "hidden",
            ""
        );

        if (reportForm) {
            reportForm.reset();
        }

        if (reportMessage) {
            reportMessage.textContent =
                "";
        }
    }

    async function submitReport(event) {
        event.preventDefault();

        if (!reportReason) {
            return;
        }

        const reason =
            reportReason.value.trim();

        if (!reason) {
            return;
        }

        try {
            const response =
                await fetch(
                    `/api/memes/${memeId}/report`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            reason
                        })
                    }
                );

            const data =
                await response.json();

            if (handleSubscriptionError(data, response)) {
                return;
            }

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to submit report."
                );
            }

            if (reportMessage) {
                reportMessage.textContent =
                    "Thank you. Your report has been submitted.";
            }

            setTimeout(
                closeReport,
                1200
            );

        } catch (error) {
            console.error(
                "Report meme error:",
                error
            );

            if (reportMessage) {
                reportMessage.textContent =
                    error.message ||
                    "Unable to submit report.";
            }
        }
    }

    // =========================================
    // HELPERS
    // =========================================

    function getInitials(name) {
        if (!name) {
            return "U";
        }

        const parts =
            name.trim().split(/\s+/);

        if (parts.length === 1) {
            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }

    function formatCommentDate(
        dateValue
    ) {
        if (!dateValue) {
            return "";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const now =
            new Date();

        const seconds =
            Math.floor(
                (now - date) / 1000
            );

        if (seconds < 60) {
            return "now";
        }

        const minutes =
            Math.floor(
                seconds / 60
            );

        if (minutes < 60) {
            return `${minutes}m`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {
            return `${hours}h`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        if (days < 7) {
            return `${days}d`;
        }

        return date.toLocaleDateString();
    }

    // =========================================
    // EVENT LISTENERS
    // =========================================

    if (likeButton) {
        likeButton.addEventListener(
            "click",
            toggleMemeLike
        );
    }

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            toggleSave
        );
    }

    if (downloadButton) {
        downloadButton.addEventListener(
            "click",
            downloadMeme
        );
    }

    if (shareButton) {
        shareButton.addEventListener(
            "click",
            shareMeme
        );
    }

    if (reportButton) {
        reportButton.addEventListener(
            "click",
            openReportModal
        );
    }

    if (closeReportModal) {
        closeReportModal.addEventListener(
            "click",
            closeReport
        );
    }

    if (reportForm) {
        reportForm.addEventListener(
            "submit",
            submitReport
        );
    }

    if (commentForm) {
        commentForm.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();
                submitComment();
            }
        );
    }

    if (commentInput) {
        commentInput.addEventListener(
            "input",
            updateCommentCharacterCount
        );

        commentInput.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Enter" &&
                    (event.ctrlKey ||
                        event.metaKey)
                ) {
                    event.preventDefault();

                    submitComment();
                }
            }
        );

        updateCommentCharacterCount();
    }

    // =========================================
    // START
    // =========================================

    loadCurrentUser();
});
