const fs = require("fs");
const path = require("path");

const { pool } = require("../config/database");
const {
    deleteCloudinaryAsset,
    uploadBuffer
} = require("../utils/cloudinaryUpload");


async function createNotification(userId, type, title, message, relatedId = null) {
    if (!userId) {
        return;
    }

    try {
        await pool.execute(
            `
            INSERT INTO notifications
                (user_id, type, title, message, related_id)
            VALUES (?, ?, ?, ?, ?)
            `,
            [userId, type, title, message, relatedId]
        );
    } catch (error) {
        console.error("Create notification error:", error);
    }
}


/*
|--------------------------------------------------------------------------
| Get Categories
|--------------------------------------------------------------------------
*/

async function getCategories(req, res) {
    try {
        const [categories] = await pool.query(`
            SELECT id, name
            FROM categories
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            categories
        });

    } catch (error) {

        console.error("Get categories error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load categories."
        });

    }
}


async function createCategory(req, res) {
    const name =
        String(req.body.name || "").trim();

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Category name is required."
        });
    }

    if (name.length > 100) {
        return res.status(400).json({
            success: false,
            message: "Category name cannot exceed 100 characters."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [result] = await connection.execute(
            `
            INSERT INTO categories (name)
            VALUES (?)
            `,
            [name]
        );

        await connection.execute(
            `
            INSERT INTO admin_logs
                (admin_id, action, description, ip_address)
            VALUES (?, 'category_created', ?, ?)
            `,
            [
                req.session.user.id,
                `Created meme category: ${name}`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Category created successfully.",
            category: {
                id: result.insertId,
                name
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Create category rollback error:", rollbackError);
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A category with that name already exists."
            });
        }

        console.error("Create category error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create category."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


/*
|--------------------------------------------------------------------------
| Create Meme
|--------------------------------------------------------------------------
*/

async function createMeme(req, res) {

    let connection;
    let transactionStarted = false;
    let uploadedAsset;

    try {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in."
            });
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator access required."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a meme image."
            });
        }

        const title =
            (req.body.title || "").trim();

        const caption =
            (req.body.caption || "").trim();


        if (!title) {

            return res.status(400).json({
                success: false,
                message: "Meme title is required."
            });

        }


        if (title.length > 150) {

            return res.status(400).json({
                success: false,
                message:
                    "Meme title cannot exceed 150 characters."
            });

        }


        if (caption.length > 500) {

            return res.status(400).json({
                success: false,
                message:
                    "Caption cannot exceed 500 characters."
            });

        }


        const categoryIds =
            parseCategoryIds(
                req.body.categoryIds
            );


        uploadedAsset = await uploadBuffer(
            req.file.buffer,
            {
                folder: "lilly-memes/memes",
                resource_type: "image"
            }
        );

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;


        const [result] =
            await connection.query(
                `
                INSERT INTO memes
                (
                    user_id,
                    title,
                    caption,
                    image,
                    cloudinary_public_id,
                    is_featured,
                    is_active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    req.session.user.id,
                    title,
                    caption || null,
                    uploadedAsset.secure_url,
                    uploadedAsset.public_id,
                    req.body.isFeatured === "true"
                        ? 1
                        : 0,
                    1
                ]
            );


        const memeId =
            result.insertId;


        if (categoryIds.length > 0) {

            const values =
                categoryIds.map(
                    categoryId => [
                        memeId,
                        categoryId
                    ]
                );


            await connection.query(
                `
                INSERT INTO meme_categories
                (
                    meme_id,
                    category_id
                )
                VALUES ?
                `,
                [values]
            );

        }


        await connection.query(
            `
            INSERT INTO admin_logs
            (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.session.user.id,
                "CREATE_MEME",
                `Created meme: ${title}`,
                req.ip
            ]
        );


        await connection.commit();
        transactionStarted = false;


        res.status(201).json({

            success: true,

            message:
                "Meme uploaded successfully.",

            meme: {
                id: memeId,
                title,
                caption,
                image: uploadedAsset.secure_url
            }

        });


    } catch (error) {

        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Create meme rollback error:", rollbackError);
            }
        }

        if (uploadedAsset) {
            try {
                await deleteCloudinaryAsset(
                    uploadedAsset.public_id,
                    "image"
                );
            } catch (cleanupError) {
                console.error(
                    "Could not remove failed Cloudinary meme upload:",
                    cleanupError
                );
            }
        }


        console.error(
            "Create meme error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to upload meme."
        });


    } finally {

        if (connection) {
            connection.release();
        }

    }

}


/*
|--------------------------------------------------------------------------
| Get Admin Memes
|--------------------------------------------------------------------------
*/

async function getAdminMemes(req, res) {

    try {

        const [memes] =
            await pool.query(`
                SELECT
                    m.id,
                    m.title,
                    m.caption,
                    m.image,
                    (
                        SELECT COUNT(DISTINCT mv.user_id)
                        FROM meme_views mv
                        WHERE mv.meme_id = m.id
                    ) AS view_count,
                    m.download_count,
                    m.is_featured,
                    m.is_active,
                    m.created_at,

                    COUNT(
                        DISTINCT l.id
                    ) AS like_count,

                    COUNT(
                        DISTINCT c.id
                    ) AS comment_count,

                    GROUP_CONCAT(
                        DISTINCT cat.name
                        ORDER BY cat.name
                        SEPARATOR ', '
                    ) AS categories

                FROM memes m

                LEFT JOIN likes l
                    ON l.meme_id = m.id

                LEFT JOIN comments c
                    ON c.meme_id = m.id
                    AND c.is_deleted = 0

                LEFT JOIN meme_categories mc
                    ON mc.meme_id = m.id

                LEFT JOIN categories cat
                    ON cat.id = mc.category_id

                GROUP BY m.id

                ORDER BY m.created_at DESC
            `);


        res.json({
            success: true,
            memes
        });


    } catch (error) {

        console.error(
            "Get admin memes error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to load memes."
        });

    }

}


/*
|--------------------------------------------------------------------------
| Get Single Meme
|--------------------------------------------------------------------------
*/

async function getMeme(req, res) {

    try {

        const memeId =
            Number(req.params.id);

        const userId =
            req.session.user
                ? req.session.user.id
                : 0;


        if (
            !Number.isInteger(memeId) ||
            memeId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid meme ID."
            });

        }


        const [memes] =
            await pool.query(
                `
                SELECT
                    m.id,
                    m.title,
                    m.caption,
                    m.image,
                    (
                        SELECT COUNT(DISTINCT mv.user_id)
                        FROM meme_views mv
                        WHERE mv.meme_id = m.id
                    ) AS view_count,
                    m.download_count,
                    m.is_featured,
                    m.is_active,
                    m.created_at,

                    COUNT(DISTINCT l.id) AS like_count,
                    COUNT(DISTINCT c.id) AS comment_count,

                    EXISTS(
                        SELECT 1
                        FROM likes ul
                        WHERE ul.meme_id = m.id
                          AND ul.user_id = ?
                    ) AS user_liked

                FROM memes m

                LEFT JOIN likes l
                    ON l.meme_id = m.id

                LEFT JOIN comments c
                    ON c.meme_id = m.id
                    AND c.is_deleted = 0

                WHERE m.id = ?

                GROUP BY m.id

                LIMIT 1
                `,
                [userId, memeId]
            );


        if (memes.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Meme not found."
            });

        }


        const [categories] =
            await pool.query(
                `
                SELECT
                    c.id,
                    c.name

                FROM categories c

                INNER JOIN meme_categories mc
                    ON mc.category_id = c.id

                WHERE mc.meme_id = ?

                ORDER BY c.name ASC
                `,
                [memeId]
            );


        res.json({
            success: true,

            meme: {
                ...memes[0],
                categories
            }
        });


    } catch (error) {

        console.error(
            "Get meme error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to load meme."
        });

    }

}


/*
|--------------------------------------------------------------------------
| Update Meme
|--------------------------------------------------------------------------
*/

async function updateMeme(req, res) {

    let connection;
    let transactionStarted = false;
    let uploadedAsset;
    let previousAsset;

    try {

        const memeId =
            Number(req.params.id);


        if (
            !Number.isInteger(memeId) ||
            memeId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid meme ID."
            });

        }


        const title =
            (req.body.title || "").trim();

        const caption =
            (req.body.caption || "").trim();


        if (!title) {

            return res.status(400).json({
                success: false,
                message:
                    "Meme title is required."
            });

        }


        if (title.length > 150) {

            return res.status(400).json({
                success: false,
                message:
                    "Meme title cannot exceed 150 characters."
            });

        }


        if (caption.length > 500) {

            return res.status(400).json({
                success: false,
                message:
                    "Caption cannot exceed 500 characters."
            });

        }


        const categoryIds =
            parseCategoryIds(
                req.body.categoryIds
            );

        connection =
            await pool.getConnection();


        await connection.beginTransaction();
        transactionStarted = true;


        const [existing] =
            await connection.query(
                `
                SELECT id, image, cloudinary_public_id
                FROM memes
                WHERE id = ?
                LIMIT 1
                `,
                [memeId]
            );


        if (existing.length === 0) {

            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message:
                    "Meme not found."
            });

        }

        previousAsset = existing[0];

        if (req.file) {
            uploadedAsset = await uploadBuffer(
                req.file.buffer,
                {
                    folder: "lilly-memes/memes",
                    resource_type: "image"
                }
            );
        }

        await connection.query(
            `
            UPDATE memes

            SET
                title = ?,
                caption = ?,
                image = ?,
                cloudinary_public_id = ?,
                is_featured = ?,
                is_active = ?

            WHERE id = ?
            `,
            [
                title,
                caption || null,
                uploadedAsset
                    ? uploadedAsset.secure_url
                    : previousAsset.image,
                uploadedAsset
                    ? uploadedAsset.public_id
                    : previousAsset.cloudinary_public_id,
                req.body.isFeatured === "true"
                    ? 1
                    : 0,
                req.body.isActive !== "false"
                    ? 1
                    : 0,
                memeId
            ]
        );


        await connection.query(
            `
            DELETE FROM meme_categories
            WHERE meme_id = ?
            `,
            [memeId]
        );


        if (categoryIds.length > 0) {

            const values =
                categoryIds.map(
                    categoryId => [
                        memeId,
                        categoryId
                    ]
                );


            await connection.query(
                `
                INSERT INTO meme_categories
                (
                    meme_id,
                    category_id
                )
                VALUES ?
                `,
                [values]
            );

        }


        await connection.query(
            `
            INSERT INTO admin_logs
            (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.session.user.id,
                "UPDATE_MEME",
                `Updated meme: ${title}`,
                req.ip
            ]
        );


        await connection.commit();
        transactionStarted = false;

        if (uploadedAsset && previousAsset.cloudinary_public_id) {
            try {
                await deleteCloudinaryAsset(
                    previousAsset.cloudinary_public_id,
                    "image"
                );
            } catch (cleanupError) {
                console.error(
                    "Could not remove replaced Cloudinary meme image:",
                    cleanupError
                );
            }
        } else if (
            uploadedAsset &&
            !/^https:\/\//i.test(previousAsset.image)
        ) {
            deleteUploadedFile(
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "memes",
                    previousAsset.image
                )
            );
        }

        res.json({
            success: true,
            message:
                "Meme updated successfully."
        });


    } catch (error) {

        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Update meme rollback error:", rollbackError);
            }
        }

        if (uploadedAsset) {
            try {
                await deleteCloudinaryAsset(
                    uploadedAsset.public_id,
                    "image"
                );
            } catch (cleanupError) {
                console.error(
                    "Could not remove failed Cloudinary meme replacement:",
                    cleanupError
                );
            }
        }


        console.error(
            "Update meme error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to update meme."
        });


    } finally {

        if (connection) {
            connection.release();
        }

    }

}


/*
|--------------------------------------------------------------------------
| Delete Meme
|--------------------------------------------------------------------------
*/

async function deleteMeme(req, res) {

    let connection;

    try {

        const memeId =
            Number(req.params.id);


        if (
            !Number.isInteger(memeId) ||
            memeId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid meme ID."
            });

        }


        connection =
            await pool.getConnection();


        await connection.beginTransaction();


        const [memes] =
            await connection.query(
                `
                SELECT
                    id,
                    title,
                    image,
                    cloudinary_public_id

                FROM memes

                WHERE id = ?

                LIMIT 1
                `,
                [memeId]
            );


        if (memes.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Meme not found."
            });

        }


        const meme =
            memes[0];


        await connection.query(
            `
            DELETE FROM meme_categories
            WHERE meme_id = ?
            `,
            [memeId]
        );


        await connection.query(
            `
            DELETE FROM likes
            WHERE meme_id = ?
            `,
            [memeId]
        );


        await connection.query(
            `
            DELETE FROM comments
            WHERE meme_id = ?
            `,
            [memeId]
        );


        await connection.query(
            `
            DELETE FROM downloads
            WHERE meme_id = ?
            `,
            [memeId]
        );


        await connection.query(
            `
            DELETE FROM saved_memes
            WHERE meme_id = ?
            `,
            [memeId]
        );


        await connection.query(
            `
            DELETE FROM meme_views
            WHERE meme_id = ?
            `,
            [memeId]
        );


        await connection.query(
            `
            DELETE FROM memes
            WHERE id = ?
            `,
            [memeId]
        );


        await connection.query(
            `
            INSERT INTO admin_logs
            (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.session.user.id,
                "DELETE_MEME",
                `Deleted meme: ${meme.title}`,
                req.ip
            ]
        );


        await connection.commit();

        if (meme.cloudinary_public_id) {
            try {
                await deleteCloudinaryAsset(
                    meme.cloudinary_public_id,
                    "image"
                );
            } catch (cleanupError) {
                console.error(
                    "Meme deleted but Cloudinary image cleanup failed:",
                    cleanupError
                );
                return res.status(500).json({
                    success: false,
                    message: "Meme deleted, but its Cloudinary image could not be removed."
                });
            }
        } else if (!/^https:\/\//i.test(meme.image)) {
            deleteUploadedFile(
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "memes",
                    meme.image
                )
            );
        }


        res.json({
            success: true,
            message:
                "Meme deleted successfully."
        });


    } catch (error) {

        if (connection) {
            await connection.rollback();
        }


        console.error(
            "Delete meme error:",
            error
        );


        res.status(500).json({
            success: false,
            message:
                "Failed to delete meme."
        });


    } finally {

        if (connection) {
            connection.release();
        }

    }

}


/*
|--------------------------------------------------------------------------
| PUBLIC / MEMBER FEED
|--------------------------------------------------------------------------
*/


async function getHomepageMemes(req, res) {
    return sendHomepageMemes(req, res, false);
}

async function getAllMemberMemes(req, res) {
    return sendHomepageMemes(req, res, true);
}

async function sendHomepageMemes(req, res, includeAll) {
    try {

        const userId =
            req.session.user
                ? req.session.user.id
                : 0;


        const popular =
            await getFeedSection(
                "popular",
                userId,
                includeAll
            );


        const latest =
            await getFeedSection(
                "latest",
                userId,
                includeAll
            );


        const mostDiscussed =
            await getFeedSection(
                "discussed",
                userId,
                includeAll
            );

        const categories = includeAll
            ? null
            : await getHomepageCategorySections(userId);


        res.json({

            success: true,

            popular,

            latest,

            mostDiscussed,

            ...(categories ? { categories } : {})

        });


    } catch (error) {

        console.error(
            "Homepage memes error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load homepage memes."

        });

    }

}

async function getHomepageCategorySections(userId) {
    const [categories] = await pool.query(`
        SELECT id, name
        FROM categories
        WHERE is_active = 1
        ORDER BY name ASC
    `);

    const [memes] = await pool.query(
        `
        WITH ranked_category_memes AS (
            SELECT
                category.id AS category_id,
                category.name AS category_name,
                meme.id,
                meme.title,
                meme.caption,
                meme.image,
                meme.created_at,
                user.username,
                (
                    SELECT COUNT(DISTINCT meme_view.user_id)
                    FROM meme_views meme_view
                    WHERE meme_view.meme_id = meme.id
                ) AS view_count,
                COUNT(DISTINCT meme_like.id) AS like_count,
                COUNT(DISTINCT meme_comment.id) AS comment_count,
                EXISTS(
                    SELECT 1
                    FROM likes user_like
                    WHERE user_like.meme_id = meme.id
                      AND user_like.user_id = ?
                ) AS user_liked,
                GROUP_CONCAT(
                    DISTINCT all_category.name
                    ORDER BY all_category.name
                    SEPARATOR ', '
                ) AS categories,
                ROW_NUMBER() OVER (
                    PARTITION BY category.id
                    ORDER BY meme.created_at DESC, meme.id DESC
                ) AS category_rank
            FROM categories category
            INNER JOIN meme_categories category_meme
                ON category_meme.category_id = category.id
            INNER JOIN memes meme
                ON meme.id = category_meme.meme_id
            INNER JOIN users user
                ON user.id = meme.user_id
            LEFT JOIN likes meme_like
                ON meme_like.meme_id = meme.id
            LEFT JOIN comments meme_comment
                ON meme_comment.meme_id = meme.id
                AND meme_comment.is_deleted = 0
            LEFT JOIN meme_categories all_meme_categories
                ON all_meme_categories.meme_id = meme.id
            LEFT JOIN categories all_category
                ON all_category.id = all_meme_categories.category_id
            WHERE category.is_active = 1
              AND meme.is_active = 1
            GROUP BY
                category.id,
                category.name,
                meme.id,
                user.username
        )
        SELECT
            category_id,
            category_name,
            id,
            title,
            caption,
            image,
            created_at,
            username,
            view_count,
            like_count,
            comment_count,
            user_liked,
            categories
        FROM ranked_category_memes
        WHERE category_rank <= 2
        ORDER BY category_name ASC, created_at DESC, id DESC
        `,
        [userId]
    );

    const sectionsById = new Map(
        categories.map((category) => [
            category.id,
            {
                id: category.id,
                name: category.name,
                memes: []
            }
        ])
    );

    memes.forEach((meme) => {
        const section = sectionsById.get(meme.category_id);
        if (section) {
            section.memes.push(meme);
        }
    });

    return Array.from(sectionsById.values());
}


/*
|--------------------------------------------------------------------------
| Feed Query
|--------------------------------------------------------------------------
*/

async function getFeedSection(
    section,
    userId,
    includeAll = false
) {

    let orderBy;


    if (section === "popular") {

        orderBy = `
            like_count DESC,
            m.created_at DESC
        `;

    } else if (section === "discussed") {

        orderBy = `
            comment_count DESC,
            m.created_at DESC
        `;

    } else {

        orderBy = `
            m.created_at DESC
        `;

    }


    const [memes] =
        await pool.query(
            `
            SELECT

                m.id,
                m.title,
                m.caption,
                m.image,

                (
                    SELECT COUNT(DISTINCT mv.user_id)
                    FROM meme_views mv
                    WHERE mv.meme_id = m.id
                ) AS view_count,
                m.download_count,

                m.is_featured,
                m.created_at,

                COUNT(
                    DISTINCT l.id
                ) AS like_count,

                COUNT(
                    DISTINCT c.id
                ) AS comment_count,

                EXISTS(
                    SELECT 1

                    FROM likes ul

                    WHERE ul.meme_id = m.id

                    AND ul.user_id = ?
                ) AS user_liked,

                GROUP_CONCAT(
                    DISTINCT cat.name
                    ORDER BY cat.name
                    SEPARATOR ', '
                ) AS categories

            FROM memes m

            LEFT JOIN likes l
                ON l.meme_id = m.id

            LEFT JOIN comments c
                ON c.meme_id = m.id
                AND c.is_deleted = 0

            LEFT JOIN meme_categories mc
                ON mc.meme_id = m.id

            LEFT JOIN categories cat
                ON cat.id = mc.category_id

            WHERE m.is_active = 1

            GROUP BY m.id

            ORDER BY ${orderBy}

            ${includeAll ? "" : "LIMIT 6"}
            `,
            [userId]
        );


    return memes;

}


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function parseCategoryIds(value) {

    if (!value) {
        return [];
    }


    let ids = value;


    if (typeof value === "string") {

        try {

            ids = JSON.parse(value);

        } catch {

            ids =
                value.split(",");

        }

    }


    if (!Array.isArray(ids)) {
        ids = [ids];
    }


    return [
        ...new Set(

            ids
                .map(Number)
                .filter(
                    id =>
                        Number.isInteger(id) &&
                        id > 0
                )

        )
    ];

}


function deleteUploadedFile(filePath) {

    if (!filePath) {
        return;
    }


    fs.unlink(
        filePath,
        error => {

            if (
                error &&
                error.code !== "ENOENT"
            ) {

                console.error(
                    "Could not delete uploaded file:",
                    error.message
                );

            }

        }
    );

}

async function toggleLike(req, res) {

    try {

        if (!req.session.user) {

            return res.status(401).json({
                success: false,
                message:
                    "You must be logged in to like memes."
            });

        }


        const memeId =
            Number(req.params.id);


        const userId =
            req.session.user.id;


        if (
            !Number.isInteger(memeId) ||
            memeId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid meme ID."
            });

        }


        const [existing] =
            await pool.query(
                `
                SELECT id

                FROM likes

                WHERE user_id = ?
                AND meme_id = ?

                LIMIT 1
                `,
                [
                    userId,
                    memeId
                ]
            );


        let liked;


        if (existing.length > 0) {

            await pool.query(
                `
                DELETE FROM likes

                WHERE user_id = ?
                AND meme_id = ?
                `,
                [
                    userId,
                    memeId
                ]
            );

            liked = false;

        } else {

            await pool.query(
                `
                INSERT INTO likes
                (
                    user_id,
                    meme_id
                )
                VALUES (?, ?)
                `,
                [
                    userId,
                    memeId
                ]
            );

            liked = true;

        }

        const [memeOwner] = await pool.execute(
            `
            SELECT user_id
            FROM memes
            WHERE id = ?
            `,
            [memeId]
        );

        if (
            liked &&
            memeOwner.length &&
            Number(memeOwner[0].user_id) !== Number(userId)
        ) {
            await createNotification(
                memeOwner[0].user_id,
                "meme_like",
                "Someone liked your meme",
                `${req.session.user.username} liked your meme.`,
                memeId
            );
        }

        const [result] =
            await pool.query(
                `
                SELECT COUNT(*) AS like_count

                FROM likes

                WHERE meme_id = ?
                `,
                [memeId]
            );


        res.json({

            success: true,

            liked,

            like_count:
                result[0].like_count

        });


    } catch (error) {

        console.error(
            "Toggle like error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to update like."

        });

    }

}

// ==========================================================
// RECORD MEME VIEW
// ==========================================================

async function recordMemeView(req, res) {
    let connection;

    try {
        const memeId = Number(req.params.id);

        if (!Number.isInteger(memeId) || memeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid meme ID."
            });
        }

        const userId = req.session.user.id;
        const ipAddress =
            req.ip ||
            req.headers["x-forwarded-for"] ||
            null;

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [memes] = await connection.execute(
            `
            SELECT id
            FROM memes
            WHERE id = ?
              AND is_active = 1
            LIMIT 1
            FOR UPDATE
            `,
            [memeId]
        );

        if (memes.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Meme not found."
            });
        }

        const [existingViews] = await connection.execute(
            `
            SELECT id
            FROM meme_views
            WHERE meme_id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [memeId, userId]
        );

        const isNewView = existingViews.length === 0;

        if (isNewView) {
            await connection.execute(
                `
                INSERT INTO meme_views
                (
                    user_id,
                    meme_id,
                    ip_address
                )
                VALUES (?, ?, ?)
                `,
                [userId, memeId, ipAddress]
            );
        }

        const [viewCounts] = await connection.execute(
            `
            SELECT COUNT(DISTINCT user_id) AS view_count
            FROM meme_views
            WHERE meme_id = ?
            `,
            [memeId]
        );

        const viewCount = Number(viewCounts[0].view_count);

        await connection.execute(
            `
            UPDATE memes
            SET view_count = ?
            WHERE id = ?
            `,
            [viewCount, memeId]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Meme view recorded.",
            is_new_view: isNewView,
            view_count: viewCount
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error(
            "recordMemeView error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to record meme view."
        });

    } finally {

        if (connection) {
            connection.release();
        }

    }
}


// ==========================================================
// SAVE / UNSAVE MEME
// ==========================================================

async function toggleSaveMeme(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to save memes."
            });
        }

        const memeId = Number(req.params.id);
        const userId = req.session.user.id;

        if (!Number.isInteger(memeId) || memeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid meme ID."
            });
        }

        // Check meme exists
        const [memes] = await pool.query(
            `
            SELECT id
            FROM memes
            WHERE id = ?
              AND is_active = 1
            LIMIT 1
            `,
            [memeId]
        );

        if (memes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Meme not found."
            });
        }

        // Check if already saved
        const [saved] = await pool.query(
            `
            SELECT id
            FROM saved_memes
            WHERE user_id = ?
              AND meme_id = ?
            LIMIT 1
            `,
            [
                userId,
                memeId
            ]
        );

        if (saved.length > 0) {

            await pool.query(
                `
                DELETE FROM saved_memes
                WHERE user_id = ?
                  AND meme_id = ?
                `,
                [
                    userId,
                    memeId
                ]
            );

            return res.json({
                success: true,
                saved: false,
                message: "Meme removed from saved."
            });
        }

        await pool.query(
            `
            INSERT INTO saved_memes
            (
                user_id,
                meme_id
            )
            VALUES (?, ?)
            `,
            [
                userId,
                memeId
            ]
        );

        return res.json({
            success: true,
            saved: true,
            message: "Meme saved."
        });

    } catch (error) {

        console.error(
            "toggleSaveMeme error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to save meme."
        });
    }
}


// ==========================================================
// DOWNLOAD MEME
// ==========================================================

async function downloadMeme(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to download memes."
            });
        }

        const memeId = Number(req.params.id);
        const userId = req.session.user.id;

        if (!Number.isInteger(memeId) || memeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid meme ID."
            });
        }

        const [memes] = await pool.query(
            `
            SELECT
                id,
                image,
                cloudinary_public_id,
                title
            FROM memes
            WHERE id = ?
              AND is_active = 1
            LIMIT 1
            `,
            [memeId]
        );

        if (memes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Meme not found."
            });
        }

        const meme = memes[0];

        let cloudinaryFile = null;
        if (/^https:\/\/res\.cloudinary\.com\//i.test(meme.image)) {
            const imageUrl = new URL(meme.image);
            if (
                imageUrl.protocol !== "https:" ||
                imageUrl.hostname !== "res.cloudinary.com"
            ) {
                return res.status(500).json({
                    success: false,
                    message: "Meme image URL is invalid."
                });
            }

            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(
                    `Cloudinary image download failed with status ${imageResponse.status}.`
                );
            }

            cloudinaryFile = {
                buffer: Buffer.from(await imageResponse.arrayBuffer()),
                contentType: imageResponse.headers.get("content-type") || "image/jpeg"
            };
        }

        const safeTitle =
            (meme.title || "lilly-meme")
                .replace(/[^a-zA-Z0-9_-]/g, "-")
                .replace(/-+/g, "-")
                .substring(0, 80);

        const extension = path.extname(
            cloudinaryFile
                ? new URL(meme.image).pathname
                : meme.image
        );
        const downloadName =
            `${safeTitle || "lilly-meme"}${extension || ".jpg"}`;

        let resolvedFilePath;
        if (!cloudinaryFile) {
            const filePath = path.join(
                __dirname,
                "..",
                "uploads",
                "memes",
                meme.image
            );
            const uploadsDirectory = path.resolve(
                path.join(__dirname, "..", "uploads", "memes")
            );
            resolvedFilePath = path.resolve(filePath);

            if (
                !resolvedFilePath.startsWith(
                    uploadsDirectory + path.sep
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid file."
                });
            }

            if (!fs.existsSync(resolvedFilePath)) {
                return res.status(404).json({
                    success: false,
                    message: "Meme image file not found."
                });
            }
        }

        // Record download
        await pool.query(
            `
            INSERT INTO downloads
            (
                user_id,
                meme_id
            )
            VALUES (?, ?)
            `,
            [
                userId,
                memeId
            ]
        );

        // Increase download counter
        await pool.query(
            `
            UPDATE memes
            SET download_count = download_count + 1
            WHERE id = ?
            `,
            [memeId]
        );

        if (cloudinaryFile) {
            res.setHeader("Content-Type", cloudinaryFile.contentType);
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${downloadName}"`
            );
            return res.send(cloudinaryFile.buffer);
        }

        return res.download(resolvedFilePath, downloadName);

    } catch (error) {

        console.error(
            "downloadMeme error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to download meme."
        });
    }
}


// ==========================================================
// GET COMMENTS
// ==========================================================

async function getComments(req, res) {
    try {
        const memeId = req.params.id;
        const userId = req.session.user ? req.session.user.id : 0;

        const [comments] = await pool.query(`
            SELECT
                c.id,
                c.user_id,
                c.meme_id,
                c.parent_id,
                c.comment_text,
                c.is_deleted,
                c.created_at,
                c.updated_at,
                u.username,
                u.full_name,
                u.profile_image,

                (
                    SELECT COUNT(*)
                    FROM comment_likes cl
                    WHERE cl.comment_id = c.id
                ) AS like_count,

                EXISTS (
                    SELECT 1
                    FROM comment_likes cl2
                    WHERE cl2.comment_id = c.id
                    AND cl2.user_id = ?
                ) AS user_liked

            FROM comments c
            INNER JOIN users u
                ON c.user_id = u.id

            WHERE c.meme_id = ?
            AND c.is_deleted = 0

            ORDER BY c.created_at ASC
        `, [userId, memeId]);

        res.json({
            success: true,
            comments
        });

    } catch (error) {
        console.error("Get comments error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load comments."
        });
    }
}
async function toggleCommentLike(req, res) {
    try {
        const userId = req.session.user.id;
        const commentId = req.params.commentId;

        if (!Number.isInteger(Number(commentId)) || Number(commentId) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID."
            });
        }

        // Check that the comment exists and is not deleted
        const [comments] = await pool.query(`
            SELECT id
            FROM comments
            WHERE id = ?
            AND is_deleted = 0
            LIMIT 1
        `, [commentId]);

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Comment not found."
            });
        }

        // Check whether the user already liked the comment
        const [existingLikes] = await pool.query(`
            SELECT id
            FROM comment_likes
            WHERE user_id = ?
            AND comment_id = ?
            LIMIT 1
        `, [userId, commentId]);

        let liked;

        if (existingLikes.length > 0) {
            // Unlike
            await pool.query(`
                DELETE FROM comment_likes
                WHERE user_id = ?
                AND comment_id = ?
            `, [userId, commentId]);

            liked = false;
        } else {
            // Like
            await pool.query(`
                INSERT INTO comment_likes (user_id, comment_id)
                VALUES (?, ?)
            `, [userId, commentId]);

            liked = true;
        }

        const [commentOwner] = await pool.execute(
            `
            SELECT user_id
            FROM comments
            WHERE id = ?
            `,
            [commentId]
        );

        if (
            liked &&
            commentOwner.length &&
            Number(commentOwner[0].user_id) !== Number(userId)
        ) {
            await createNotification(
                commentOwner[0].user_id,
                "comment_like",
                "Someone liked your comment",
                `${req.session.user.username} liked your comment.`,
                commentId
            );
        }

        // Get updated like count
        const [countResult] = await pool.query(`
            SELECT COUNT(*) AS like_count
            FROM comment_likes
            WHERE comment_id = ?
        `, [commentId]);

        res.json({
            success: true,
            liked,
            like_count: Number(countResult[0].like_count)
        });

    } catch (error) {
        console.error("Toggle comment like error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update comment like."
        });
    }
}

// ==========================================================
// CREATE COMMENT / REPLY
// ==========================================================

async function createComment(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to comment."
            });
        }

        const memeId = Number(req.params.id);
        const userId = req.session.user.id;

        let {
            comment_text,
            parent_id
        } = req.body;

        if (!Number.isInteger(memeId) || memeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid meme ID."
            });
        }

        // Make sure comment is a string
        if (
            typeof comment_text !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Comment is required."
            });
        }

        comment_text =
            comment_text.trim();

        if (!comment_text) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty."
            });
        }

        if (comment_text.length > 500) {
            return res.status(400).json({
                success: false,
                message:
                    "Comment cannot be longer than 500 characters."
            });
        }

        // Check meme exists
        const [memes] = await pool.query(
            `
            SELECT id
            FROM memes
            WHERE id = ?
              AND is_active = 1
            LIMIT 1
            `,
            [memeId]
        );

        if (memes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Meme not found."
            });
        }

        // --------------------------------------------------
        // Handle reply
        // --------------------------------------------------

        let parentId = null;
        let parentComment = null;

        if (
            parent_id !== undefined &&
            parent_id !== null &&
            parent_id !== ""
        ) {

            parentId =
                Number(parent_id);

            if (
                !Number.isInteger(parentId) ||
                parentId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent comment."
                });
            }

            if (parentId) {
                const [parentRows] = await pool.execute(
                    `
                    SELECT id, user_id
                    FROM comments
                    WHERE id = ?
                    AND meme_id = ?
                    AND is_deleted = 0
                    `,
                    [parentId, memeId]
                );

                if (!parentRows.length) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid parent comment."
                    });
                }

                parentComment = parentRows[0];
            }
        }

        // --------------------------------------------------
        // Insert comment
        // --------------------------------------------------

        const [result] =
            await pool.query(
                `
                INSERT INTO comments
                (
                    user_id,
                    meme_id,
                    parent_id,
                    comment_text
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    userId,
                    memeId,
                    parentId,
                    comment_text
                ]
            );

        const [memeOwner] = await pool.execute(
            `
            SELECT user_id
            FROM memes
            WHERE id = ?
            `,
            [memeId]
        );

        if (
            memeOwner.length &&
            Number(memeOwner[0].user_id) !== Number(userId)
        ) {
            await createNotification(
                memeOwner[0].user_id,
                parentId
                    ? "comment_reply"
                    : "meme_comment",
                parentId
                    ? "Someone replied to a comment"
                    : "New comment on your meme",
                parentId
                    ? `${req.session.user.username} replied to a comment on your meme.`
                    : `${req.session.user.username} commented on your meme.`,
                memeId
            );
        }

        if (
            parentComment &&
            Number(parentComment.user_id) !== Number(userId)
        ) {
            await createNotification(
                parentComment.user_id,
                "comment_reply",
                "Someone replied to your comment",
                `${req.session.user.username} replied to your comment.`,
                memeId
            );
        }

        // --------------------------------------------------
        // Return newly-created comment
        // --------------------------------------------------

        const [newComments] =
            await pool.query(
                `
                SELECT
                    c.id,
                    c.user_id,
                    c.meme_id,
                    c.parent_id,
                    c.comment_text,
                    c.is_deleted,
                    c.created_at,

                    u.username,
                    u.full_name,
                    u.profile_image

                FROM comments c

                INNER JOIN users u
                    ON u.id = c.user_id

                WHERE c.id = ?

                LIMIT 1
                `,
                [result.insertId]
            );

        return res.status(201).json({
            success: true,
            message: parentId
                ? "Reply posted successfully."
                : "Comment posted successfully.",
            comment:
                newComments[0]
        });

    } catch (error) {

        console.error(
            "createComment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to post comment."
        });
    }
}


// ==========================================================
// REPORT MEME
// ==========================================================

async function reportMeme(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in to report memes."
            });
        }

        const memeId = Number(req.params.id);
        const userId = req.session.user.id;

        const {
            reason,
            details
        } = req.body;

        if (!Number.isInteger(memeId) || memeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid meme ID."
            });
        }

        if (
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please select a report reason."
            });
        }

        const allowedReasons = [
            "spam",
            "nudity",
            "violence",
            "hate",
            "harassment",
            "copyright",
            "misinformation",
            "other"
        ];

        const cleanReason =
            reason.trim().toLowerCase();

        if (
            !allowedReasons.includes(
                cleanReason
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid report reason."
            });
        }

        // Check meme exists
        const [memes] = await pool.query(
            `
            SELECT id
            FROM memes
            WHERE id = ?
            LIMIT 1
            `,
            [memeId]
        );

        if (memes.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Meme not found."
            });
        }

        // Check if the same user already reported
        // this meme and it is still pending.
        const [existingReports] =
            await pool.query(
                `
                SELECT id
                FROM reports
                WHERE user_id = ?
                  AND report_type = 'meme'
                  AND target_id = ?
                  AND status = 'pending'
                LIMIT 1
                `,
                [
                    userId,
                    memeId
                ]
            );

        if (existingReports.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "You have already reported this meme."
            });
        }

        let reportReason =
            cleanReason;

        if (
            typeof details === "string" &&
            details.trim()
        ) {
            reportReason +=
                ": " +
                details
                    .trim()
                    .substring(0, 1000);
        }

        await pool.query(
            `
            INSERT INTO reports
            (
                user_id,
                report_type,
                target_id,
                reason,
                status
            )
            VALUES (?, 'meme', ?, ?, 'pending')
            `,
            [
                userId,
                memeId,
                reportReason
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Thank you. Your report has been submitted."
        });

    } catch (error) {

        console.error(
            "reportMeme error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to submit report."
        });
    }
}


module.exports = {
    getCategories,
    createCategory,
    createMeme,
    getAdminMemes,
    getMeme,
    updateMeme,
    deleteMeme,
    getHomepageMemes,
    getAllMemberMemes,
    toggleLike,
    recordMemeView,
    toggleSaveMeme,
    downloadMeme,
    getComments,
    createComment,
    reportMeme,
    toggleCommentLike
};