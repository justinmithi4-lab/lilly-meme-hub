const memeForm = document.getElementById("memeForm");

const imageInput = document.getElementById("image");
const imageDropArea = document.getElementById("imageDropArea");
const imagePreview = document.getElementById("imagePreview");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");

const titleInput = document.getElementById("title");
const captionInput = document.getElementById("caption");

const titleCount = document.getElementById("titleCount");
const captionCount = document.getElementById("captionCount");

const categoriesContainer =
    document.getElementById("categoriesContainer");

const categoryForm =
    document.getElementById("categoryForm");

const categoryNameInput =
    document.getElementById("categoryName");

const categoryMessage =
    document.getElementById("categoryMessage");

const categoryList =
    document.getElementById("categoryList");

const addCategoryButton =
    document.getElementById("addCategoryButton");

const memesTableBody =
    document.getElementById("memesTableBody");

const formMessage =
    document.getElementById("formMessage");

const memesMessage =
    document.getElementById("memesMessage");

const uploadButton =
    document.getElementById("uploadButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const refreshButton =
    document.getElementById("refreshButton");

const logoutButton =
    document.getElementById("logoutButton");

const adminName =
    document.getElementById("adminName");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");

const editModal =
    document.getElementById("editModal");

const closeModalButton =
    document.getElementById("closeModalButton");

const modalCancelButton =
    document.getElementById("modalCancelButton");

const editForm =
    document.getElementById("editForm");

const editMemeId =
    document.getElementById("editMemeId");

const editTitle =
    document.getElementById("editTitle");

const editCaption =
    document.getElementById("editCaption");

const editFeatured =
    document.getElementById("editFeatured");

const editActive =
    document.getElementById("editActive");

const editImagePreview =
    document.getElementById("editImagePreview");

const editCategoriesContainer =
    document.getElementById("editCategoriesContainer");

const editMessage =
    document.getElementById("editMessage");

let categories = [];
let editingMeme = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const isAdmin = await checkAdmin();

    if (!isAdmin) {
        return;
    }

    await loadCategories();

    await loadMemes();

    setupEvents();

});


/* =========================================================
   ADMIN CHECK
========================================================= */

async function checkAdmin() {

    try {

        const response = await fetch("/api/auth/me");

        const data = await response.json();

        if (!data.success || !data.user) {
            window.location.href = "/login.html";
            return false;
        }

        if (data.user.role !== "admin") {
            window.location.href = "/member.html";
            return false;
        }

        adminName.textContent =
            data.user.full_name ||
            data.user.username ||
            "Admin";

        return true;

    } catch (error) {

        console.error(error);

        window.location.href = "/login.html";
        return false;

    }

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    imageDropArea.addEventListener(
        "click",
        () => imageInput.click()
    );


    imageInput.addEventListener(
        "change",
        handleImagePreview
    );


    titleInput.addEventListener(
        "input",
        updateCharacterCounts
    );


    captionInput.addEventListener(
        "input",
        updateCharacterCounts
    );


    memeForm.addEventListener(
        "submit",
        handleMemeSubmit
    );


    editForm.addEventListener(
        "submit",
        handleEditSubmit
    );

    categoryForm.addEventListener(
        "submit",
        handleCategorySubmit
    );

    cancelEditButton.addEventListener(
        "click",
        resetForm
    );


    refreshButton.addEventListener(
        "click",
        loadMemes
    );


    logoutButton.addEventListener(
        "click",
        logout
    );


    menuButton.addEventListener(
        "click",
        () => {
            sidebar.classList.toggle("open");
        }
    );


    closeModalButton.addEventListener(
        "click",
        closeEditModal
    );


    modalCancelButton.addEventListener(
        "click",
        closeEditModal
    );


    editModal.addEventListener(
        "click",
        (event) => {

            if (event.target === editModal) {
                closeEditModal();
            }

        }
    );

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function handleImagePreview() {

    const file = imageInput.files[0];

    if (!file) {
        resetImagePreview();
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowedTypes.includes(file.type)) {

        showMessage(
            formMessage,
            "Please choose a JPG, PNG, WEBP or GIF image.",
            "error"
        );

        imageInput.value = "";

        resetImagePreview();

        return;
    }


    if (file.size > 10 * 1024 * 1024) {

        showMessage(
            formMessage,
            "Image must not exceed 10 MB.",
            "error"
        );

        imageInput.value = "";

        resetImagePreview();

        return;
    }


    const reader = new FileReader();

    reader.onload = function (event) {

        imagePreview.src = event.target.result;

        imagePreview.classList.remove("hidden");

        uploadPlaceholder.classList.add("hidden");

        hideMessage(formMessage);

    };

    reader.readAsDataURL(file);

}


function resetImagePreview() {

    imagePreview.src = "";

    imagePreview.classList.add("hidden");

    uploadPlaceholder.classList.remove("hidden");

}


/* =========================================================
   CHARACTER COUNTS
========================================================= */

function updateCharacterCounts() {

    titleCount.textContent =
        titleInput.value.length;

    captionCount.textContent =
        captionInput.value.length;

}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadCategories() {

    try {

        const response = await fetch(
            "/api/memes/categories"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load categories."
            );

        }

        categories = data.categories;

        renderCategories();
        renderCategoryList();

    } catch (error) {

        console.error(error);

        categoriesContainer.innerHTML = `
            <span class="loading-text">
                Could not load categories.
            </span>
        `;

    }

}


function renderCategoryList() {
    if (!categoryList) {
        return;
    }

    if (categories.length === 0) {
        categoryList.innerHTML = `
            <span class="loading-text">No categories yet.</span>
        `;
        return;
    }

    categoryList.innerHTML = categories
        .map((category) => `
            <span class="category-tag">
                ${escapeHtml(category.name)}
            </span>
        `)
        .join("");
}


async function handleCategorySubmit(event) {
    event.preventDefault();
    hideMessage(categoryMessage);

    const name = categoryNameInput.value.trim();

    if (!name) {
        showMessage(categoryMessage, "Enter a category name.", "error");
        return;
    }

    addCategoryButton.disabled = true;
    addCategoryButton.textContent = "Adding...";

    try {
        const response = await fetch("/api/memes/categories", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to create category."
            );
        }

        categoryNameInput.value = "";
        showMessage(categoryMessage, data.message, "success");
        await loadCategories();

    } catch (error) {
        console.error("Create category error:", error);
        showMessage(
            categoryMessage,
            error.message || "Failed to create category.",
            "error"
        );
    } finally {
        addCategoryButton.disabled = false;
        addCategoryButton.textContent = "Add Category";
    }
}


/* =========================================================
   RENDER CATEGORIES
========================================================= */

function renderCategories(
    container = categoriesContainer,
    selectedIds = []
) {

    if (!categories.length) {

        container.innerHTML = `
            <span class="loading-text">
                No categories found.
            </span>
        `;

        return;
    }


    container.innerHTML = categories.map(category => {

        const checked =
            selectedIds.includes(Number(category.id))
                ? "checked"
                : "";

        return `
            <label class="category-option">

                <input
                    type="checkbox"
                    value="${category.id}"
                    ${checked}
                >

                <span>
                    ${escapeHtml(category.name)}
                </span>

            </label>
        `;

    }).join("");

}


/* =========================================================
   GET SELECTED CATEGORIES
========================================================= */

function getSelectedCategories(container) {

    return Array.from(
        container.querySelectorAll(
            'input[type="checkbox"]:checked'
        )
    ).map(input => Number(input.value));

}


/* =========================================================
   UPLOAD MEME
========================================================= */

async function handleMemeSubmit(event) {

    event.preventDefault();

    hideMessage(formMessage);


    const file = imageInput.files[0];

    if (!file) {

        showMessage(
            formMessage,
            "Please select a meme image.",
            "error"
        );

        return;
    }


    const title =
        titleInput.value.trim();

    const caption =
        captionInput.value.trim();

    const selectedCategories =
        getSelectedCategories(
            categoriesContainer
        );


    if (!title) {

        showMessage(
            formMessage,
            "Please enter a meme title.",
            "error"
        );

        return;
    }


    const formData =
        new FormData();

    formData.append(
        "image",
        file
    );

    formData.append(
        "title",
        title
    );

    formData.append(
        "caption",
        caption
    );

    formData.append(
        "categoryIds",
        JSON.stringify(selectedCategories)
    );

    formData.append(
        "isFeatured",
        document.getElementById("isFeatured").checked
    );


    uploadButton.disabled = true;

    uploadButton.textContent =
        "Uploading...";


    try {

        const response = await fetch(
            "/api/memes",
            {
                method: "POST",
                body: formData
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to upload meme."
            );

        }


        showMessage(
            formMessage,
            "Meme uploaded successfully.",
            "success"
        );


        resetForm();

        await loadMemes();


    } catch (error) {

        console.error(error);

        showMessage(
            formMessage,
            error.message,
            "error"
        );

    } finally {

        uploadButton.disabled = false;

        uploadButton.textContent =
            editingMeme
                ? "Save Changes"
                : "Upload Meme";

    }

}


/* =========================================================
   LOAD MEMES
========================================================= */

async function loadMemes() {

    memesTableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="loading-cell"
            >
                Loading memes...
            </td>
        </tr>
    `;


    try {

        const response = await fetch(
            "/api/memes/admin"
        );

        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load memes."
            );

        }


        renderMemes(data.memes);


    } catch (error) {

        console.error(error);

        memesTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-cell"
                >
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;

    }

}


/* =========================================================
   RENDER MEMES
========================================================= */

function renderMemes(memes) {

    if (!memes.length) {

        memesTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="empty-cell"
                >
                    No memes have been uploaded yet.
                </td>
            </tr>
        `;

        return;
    }


    memesTableBody.innerHTML =
        memes.map(meme => {

            const imageUrl =
                getUploadedMediaUrl(meme.image, "memes");


            const statusClass =
                Number(meme.is_active)
                    ? "status-active"
                    : "status-inactive";


            const statusText =
                Number(meme.is_active)
                    ? "Active"
                    : "Inactive";


            return `
                <tr>

                    <td>
                        <img
                            class="meme-thumbnail"
                            src="${imageUrl}"
                            alt="${escapeHtml(meme.title)}"
                        >
                    </td>


                    <td>

                        <div class="meme-title">
                            ${escapeHtml(meme.title)}
                        </div>

                        <div class="meme-caption">
                            ${escapeHtml(
                                meme.caption || "No caption"
                            )}
                        </div>

                        ${
                            Number(meme.is_featured)
                                ? `
                                    <span class="featured-badge">
                                        ⭐ Featured
                                    </span>
                                `
                                : ""
                        }

                    </td>


                    <td>
                        ${
                            meme.categories
                                ? escapeHtml(
                                    meme.categories
                                )
                                : "Uncategorized"
                        }
                    </td>


                    <td>

                        <div class="stats">
                            <span>
                                ❤️ ${meme.like_count || 0}
                            </span>

                            <span>
                                💬 ${meme.comment_count || 0}
                            </span>

                            <span>
                                👁️ ${meme.view_count || 0}
                            </span>

                            <span>
                                ⬇️ ${meme.download_count || 0}
                            </span>
                        </div>

                    </td>


                    <td>

                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${statusText}
                        </span>

                    </td>


                    <td>

                        <div class="actions">

                            <button
                                type="button"
                                class="edit-button"
                                onclick="openEditModal(${meme.id})"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="danger-button"
                                onclick="deleteMeme(${meme.id})"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

async function openEditModal(memeId) {

    hideMessage(editMessage);

    try {

        const response = await fetch(
            `/api/memes/${memeId}`
        );

        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load meme."
            );

        }


        const meme = data.meme;

        editingMeme = meme;


        editMemeId.value =
            meme.id;

        editTitle.value =
            meme.title || "";

        editCaption.value =
            meme.caption || "";

        editFeatured.checked =
            Boolean(Number(meme.is_featured));

        editActive.checked =
            Boolean(Number(meme.is_active));


        editImagePreview.src =
            getUploadedMediaUrl(meme.image, "memes");


        const selectedIds =
            (meme.categories || [])
                .map(category =>
                    Number(category.id)
                );


        renderCategories(
            editCategoriesContainer,
            selectedIds
        );


        editModal.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


/* =========================================================
   SAVE EDIT
========================================================= */

async function handleEditSubmit(event) {

    event.preventDefault();

    hideMessage(editMessage);


    const memeId =
        editMemeId.value;


    const title =
        editTitle.value.trim();


    const caption =
        editCaption.value.trim();


    const selectedCategories =
        getSelectedCategories(
            editCategoriesContainer
        );


    if (!title) {

        showMessage(
            editMessage,
            "Meme title is required.",
            "error"
        );

        return;
    }


    const payload = {

        title,

        caption,

        categoryIds:
            selectedCategories,

        isFeatured:
            editFeatured.checked,

        isActive:
            editActive.checked

    };


    const saveButton =
        editForm.querySelector(
            ".primary-button"
        );


    saveButton.disabled = true;

    saveButton.textContent =
        "Saving...";


    try {

        const response = await fetch(
            `/api/memes/${memeId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    payload
                )
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to update meme."
            );

        }


        closeEditModal();

        await loadMemes();


        showMessage(
            memesMessage,
            "Meme updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(error);

        showMessage(
            editMessage,
            error.message,
            "error"
        );

    } finally {

        saveButton.disabled = false;

        saveButton.textContent =
            "Save Changes";

    }

}


/* =========================================================
   DELETE MEME
========================================================= */

async function deleteMeme(memeId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this meme? This will also remove its likes, comments, saves and view records."
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `/api/memes/${memeId}`,
            {
                method: "DELETE"
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to delete meme."
            );

        }


        await loadMemes();


        showMessage(
            memesMessage,
            "Meme deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(error);

        showMessage(
            memesMessage,
            error.message,
            "error"
        );

    }

}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    editingMeme = null;

    memeForm.reset();

    imageInput.value = "";

    resetImagePreview();

    updateCharacterCounts();

    renderCategories();

    hideMessage(formMessage);

    cancelEditButton.classList.add(
        "hidden"
    );

    uploadButton.textContent =
        "Upload Meme";

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeEditModal() {

    editModal.classList.add(
        "hidden"
    );

    editingMeme = null;

    editForm.reset();

    editImagePreview.src = "";

    hideMessage(editMessage);

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(error);

    }

    window.location.href =
        "/login.html";

}


/* =========================================================
   MESSAGE HELPERS
========================================================= */

function showMessage(
    element,
    message,
    type
) {

    element.textContent =
        message;

    element.className =
        `form-message ${type}`;

}


function hideMessage(element) {

    element.classList.add(
        "hidden"
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}