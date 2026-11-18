
const fs = require("fs");
const path = require("path");

const { pool } = require("../config/database");

const SCHEMA_MIGRATIONS_INCLUDED = [
    "20261004_cloudinary_memes.sql",
    "20261004_member_messages.sql",
    "20261005_add_three_month_plan.sql",
    "20261005_cloudinary_stories.sql",
    "20261005_notification_comment_targets.sql",
    "20261005_story_likes.sql"
];

async function tableExists(connection, tableName) {
    const [rows] = await connection.execute(
        `
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        `,
        [tableName]
    );

    return rows.length > 0;
}

async function initializeDatabase(connection) {
    const schemaPath = path.join(__dirname, "schema.sql");

    if (!fs.existsSync(schemaPath)) {
        throw new Error("database/schema.sql was not found.");
    }

    // Check whether the main schema has already been initialized.
    if (await tableExists(connection, "users")) {
        console.log("Initial database schema already exists.");
        return false;
    }

    console.log("----------------------------------------");
    console.log("Initializing fresh Lilly Memes database...");
    console.log("----------------------------------------");

    const schema = fs.readFileSync(schemaPath, "utf8");

    // The supplied schema contains ordinary SQL statements
    // separated by semicolons.
    const statements = schema
        .split(";")
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);

    for (const statement of statements) {
        await connection.query(statement);
    }

    console.log("Initial database schema created successfully.");
    return true;
}

async function runMigrations() {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log("----------------------------------------");
        console.log("Checking database migrations...");
        console.log("----------------------------------------");

        // Migration tracking table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create the original tables before applying later changes.
        const initializedDatabase = await initializeDatabase(connection);

        // Record migrations already included in schema.sql.
        if (initializedDatabase) {
            for (const migration of SCHEMA_MIGRATIONS_INCLUDED) {
                await connection.execute(
                    `
                    INSERT IGNORE INTO schema_migrations (migration_name)
                    VALUES (?)
                    `,
                    [migration]
                );
            }
        }

        const migrationsDirectory = path.join(
            __dirname,
            "migrations"
        );

        if (!fs.existsSync(migrationsDirectory)) {
            console.log("No migrations directory found.");
            return;
        }

        const migrationFiles = fs.readdirSync(migrationsDirectory)
            .filter(file => file.endsWith(".sql"))
            .sort();

        for (const file of migrationFiles) {
            const [existing] = await connection.execute(
                `
                SELECT id
                FROM schema_migrations
                WHERE migration_name = ?
                LIMIT 1
                `,
                [file]
            );

            if (existing.length > 0) {
                console.log(`Already applied: ${file}`);
                continue;
            }

            const migrationPath = path.join(
                migrationsDirectory,
                file
            );

            const sql = fs.readFileSync(
                migrationPath,
                "utf8"
            ).trim();

            if (!sql) {
                continue;
            }

            console.log(`Applying migration: ${file}`);

            await connection.query(sql);

            await connection.execute(
                `
                INSERT INTO schema_migrations (migration_name)
                VALUES (?)
                `,
                [file]
            );

            console.log(`Migration applied successfully: ${file}`);
        }

        console.log("----------------------------------------");
        console.log("Database migrations completed.");
        console.log("----------------------------------------");

    } catch (error) {
        console.error("----------------------------------------");
        console.error("DATABASE MIGRATION FAILED");
        console.error("----------------------------------------");
        console.error(error);

        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

if (require.main === module) {
    runMigrations()
        .then(async () => {
            await pool.end();
            process.exit(0);
        })
        .catch(async () => {
            await pool.end();
            process.exit(1);
        });
}

module.exports = {
    runMigrations
};
