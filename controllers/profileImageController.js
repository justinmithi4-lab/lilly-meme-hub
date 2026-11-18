const { pool } = require("../config/database");
const {
    deleteManagedProfileImage,
    validateProfileImage
} = require("../middleware/profileImageUpload");

async function updateProfileImage(req, res) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Choose a profile picture to upload."
        });
    }

    try {
        if (!(await validateProfileImage(req.file))) {
            await deleteManagedProfileImage(req.file.filename);
            return res.status(400).json({
                success: false,
                message: "The selected file is not a valid JPG, PNG, or WEBP image."
            });
        }
    } catch (error) {
        await cleanUpNewProfileImage(req.file.filename);
        console.error("Validate profile picture error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to validate the selected profile picture."
        });
    }

    let connection;
    let transactionStarted = false;
    let previousImage;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [users] = await connection.execute(
            `
            SELECT profile_image
            FROM users
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [req.session.user.id]
        );

        if (!users.length) {
            await connection.rollback();
            transactionStarted = false;
            await cleanUpNewProfileImage(req.file.filename);
            return res.status(404).json({
                success: false,
                message: "Your account could not be found."
            });
        }

        previousImage = users[0].profile_image;

        await connection.execute(
            `
            UPDATE users
            SET profile_image = ?
            WHERE id = ?
            `,
            [req.file.filename, req.session.user.id]
        );

        await connection.commit();
        transactionStarted = false;

        req.session.user.profile_image = req.file.filename;

        await deletePreviousProfileImage(previousImage);

        return res.json({
            success: true,
            message: "Your profile picture has been updated.",
            profile_image: req.file.filename
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Profile picture update rollback error:", rollbackError);
            }
        }

        await cleanUpNewProfileImage(req.file.filename);
        console.error("Update profile picture error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to save your profile picture."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function removeProfileImage(req, res) {
    let connection;
    let transactionStarted = false;
    let previousImage;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [users] = await connection.execute(
            `
            SELECT profile_image
            FROM users
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [req.session.user.id]
        );

        if (!users.length) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(404).json({
                success: false,
                message: "Your account could not be found."
            });
        }

        previousImage = users[0].profile_image;

        if (previousImage) {
            await connection.execute(
                `
                UPDATE users
                SET profile_image = NULL
                WHERE id = ?
                `,
                [req.session.user.id]
            );
        }

        await connection.commit();
        transactionStarted = false;

        req.session.user.profile_image = null;
        await deletePreviousProfileImage(previousImage);

        return res.json({
            success: true,
            message: "Your profile picture has been removed.",
            profile_image: null
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Profile picture removal rollback error:", rollbackError);
            }
        }

        console.error("Remove profile picture error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to remove your profile picture."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function deletePreviousProfileImage(filename) {
    if (!filename) {
        return;
    }

    try {
        await deleteManagedProfileImage(filename);
    } catch (error) {
        console.error("Could not remove previous profile picture:", error);
    }
}

async function cleanUpNewProfileImage(filename) {
    try {
        await deleteManagedProfileImage(filename);
    } catch (error) {
        console.error("Could not remove failed profile picture upload:", error);
    }
}

module.exports = {
    updateProfileImage,
    removeProfileImage
};
