const { pool } = require("../config/database");

async function searchMemes(req, res) {
    try {
        const searchQuery = String(req.query.q || "").trim();
        const category = String(req.query.category || "").trim();
        const sort = String(req.query.sort || "latest").trim();

        let page = Number(req.query.page || 1);
        let limit = Number(req.query.limit || 12);

        if (!Number.isInteger(page) || page < 1) {
            page = 1;
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
            limit = 12;
        }

        const offset = (page - 1) * limit;

        /*
         * Search is available to everyone.
         *
         * Only active memes are returned.
         */
        const conditions = [
            "m.is_active = 1"
        ];

        const params = [];

        /*
         * Text search
         */
        if (searchQuery) {
            conditions.push(`
                (
                    m.title LIKE ?
                    OR m.caption LIKE ?
                    OR u.username LIKE ?
                    OR u.full_name LIKE ?
                    OR EXISTS (
                        SELECT 1
                        FROM meme_categories mc2
                        INNER JOIN categories c2
                            ON c2.id = mc2.category_id
                        WHERE mc2.meme_id = m.id
                        AND c2.name LIKE ?
                    )
                )
            `);

            const keyword = `%${searchQuery}%`;

            params.push(
                keyword,
                keyword,
                keyword,
                keyword,
                keyword
            );
        }

        /*
         * Category filter
         */
        if (category) {
            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM meme_categories mc3
                    INNER JOIN categories c3
                        ON c3.id = mc3.category_id
                    WHERE mc3.meme_id = m.id
                    AND c3.name = ?
                )
            `);

            params.push(category);
        }

        let orderBy = "m.created_at DESC";

        if (sort === "popular") {
            orderBy = "like_count DESC, m.created_at DESC";
        } else if (sort === "discussed") {
            orderBy = "comment_count DESC, m.created_at DESC";
        } else if (sort === "downloads") {
            orderBy = "m.download_count DESC, m.created_at DESC";
        } else if (sort === "views") {
            orderBy = "m.view_count DESC, m.created_at DESC";
        }

        const whereClause = conditions.join(" AND ");

        /*
         * Current logged-in user.
         *
         * Guests use user ID 0.
         */
        const userId = req.session?.user?.id
            ? Number(req.session.user.id)
            : 0;

        /*
         * Get total result count.
         */
        const countParams = [...params];

        const [countRows] = await pool.execute(
            `
            SELECT COUNT(*) AS total
            FROM memes m
            INNER JOIN users u
                ON u.id = m.user_id
            WHERE ${whereClause}
            `,
            countParams
        );

        const total = Number(countRows[0].total);

        /*
         * Get search results.
         */
        const queryParams = [
            userId,
            ...params,
            limit,
            offset
        ];

        const [memes] = await pool.execute(
            `
            SELECT
                m.id,
                m.user_id,
                m.title,
                m.caption,
                m.image,
                m.view_count,
                m.download_count,
                m.is_featured,
                m.created_at,

                u.username,
                u.full_name,
                u.profile_image,

                (
                    SELECT COUNT(*)
                    FROM likes l
                    WHERE l.meme_id = m.id
                ) AS like_count,

                (
                    SELECT COUNT(*)
                    FROM comments c
                    WHERE c.meme_id = m.id
                    AND c.is_deleted = 0
                ) AS comment_count,

                EXISTS (
                    SELECT 1
                    FROM likes ul
                    WHERE ul.meme_id = m.id
                    AND ul.user_id = ?
                ) AS user_liked,

                EXISTS (
                    SELECT 1
                    FROM saved_memes us
                    WHERE us.meme_id = m.id
                    AND us.user_id = ?
                ) AS user_saved

            FROM memes m

            INNER JOIN users u
                ON u.id = m.user_id

            WHERE ${whereClause}

            ORDER BY ${orderBy}

            LIMIT ? OFFSET ?
            `,
            [
                userId,
                userId,
                ...params,
                limit,
                offset
            ]
        );

        /*
         * Get categories for each meme.
         */
        for (const meme of memes) {
            const [categories] = await pool.execute(
                `
                SELECT
                    c.id,
                    c.name
                FROM meme_categories mc
                INNER JOIN categories c
                    ON c.id = mc.category_id
                WHERE mc.meme_id = ?
                ORDER BY c.name ASC
                `,
                [meme.id]
            );

            meme.categories = categories;
        }

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            query: searchQuery,
            category: category || null,
            sort,
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
            memes
        });

    } catch (error) {
        console.error("Search memes error:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to search memes."
        });
    }
}


async function getSearchCategories(req, res) {
    try {
        const [categories] = await pool.execute(
            `
            SELECT
                id,
                name
            FROM categories
            ORDER BY name ASC
            `
        );

        res.json({
            success: true,
            categories
        });

    } catch (error) {
        console.error("Get search categories error:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load categories."
        });
    }
}


module.exports = {
    searchMemes,
    getSearchCategories
};