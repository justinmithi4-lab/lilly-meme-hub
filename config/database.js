
const mysql = require("mysql2/promise");

require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // Explicitly enable TLS for TiDB Cloud Starter
    ssl: process.env.TIDB_ENABLE_SSL === "true"
        ? {
            minVersion: "TLSv1.2"
        }
        : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDatabaseConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.ping();

        const [rows] = await connection.query(
            "SELECT DATABASE() AS database_name"
        );

        console.log("MySQL database connected successfully.");
        console.log("Connected database:", rows[0].database_name);

        return true;

    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);

        return false;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    testDatabaseConnection
};
