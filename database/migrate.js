const fs = require("fs");
const path = require("path");

const { pool } = require("../config/database");


async function runMigrations() {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log("----------------------------------------");
        console.log("Checking database migrations...");
        console.log("----------------------------------------");

        // --------------------------------------------------
        // Migration tracking table
        // --------------------------------------------------

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrationsDirectory = path.join(
            __dirname,
            "migrations"
        );

        if (!fs.existsSync(migrationsDirectory)) {
            console.log("No migrations directory found.");
            return;
        }

        // --------------------------------------------------
        // Find migration files
        // --------------------------------------------------

        const migrationFiles = fs
            .readdirSync(migrationsDirectory)
            .filter((file) => file.endsWith(".sql"))
            .sort();

        if (migrationFiles.length === 0) {
            console.log("No migration files found.");
            return;
        }

        // --------------------------------------------------
        // Apply migrations
        // --------------------------------------------------

        for (const file of migrationFiles) {

            const [existingMigration] =
                await connection.execute(
                    `
                    SELECT id
                    FROM schema_migrations
                    WHERE migration_name = ?
                    LIMIT 1
                    `,
                    [file]
                );

            if (existingMigration.length > 0) {
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
                console.log(`Skipping empty migration: ${file}`);
                continue;
            }

            console.log(`Applying migration: ${file}`);

            await connection.query(sql);

            await connection.execute(
                `
                INSERT INTO schema_migrations (
                    migration_name
                )
                VALUES (?)
                `,
                [file]
            );

            console.log(
                `Migration applied successfully: ${file}`
            );
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


// --------------------------------------------------
// Run directly from command line
// --------------------------------------------------

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