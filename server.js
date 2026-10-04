const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const { testDatabaseConnection } = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const memeRoutes = require("./routes/memeRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes = require("./routes/searchRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// Create upload directories
// --------------------------------------------------

const uploadDirectories = [
    path.join(__dirname, "uploads"),
    path.join(__dirname, "uploads", "memes"),
    path.join(__dirname, "uploads", "stories"),
    path.join(__dirname, "uploads", "profiles")
];

uploadDirectories.forEach((directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {
            recursive: true
        });
    }
});

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// --------------------------------------------------
// Session
// --------------------------------------------------

app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use("/api/auth", authRoutes);

app.use("/api/memes", memeRoutes);

app.use(
    "/api/subscriptions",
    subscriptionRoutes
);

app.use("/api/payments", paymentRoutes);

// --------------------------------------------------
// Static files
// --------------------------------------------------

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

// --------------------------------------------------
// Test route
// --------------------------------------------------

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Lilly Memes backend is working!"
    });
});

// --------------------------------------------------
// Homepage
// --------------------------------------------------

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

// --------------------------------------------------
// 404 API handler
// --------------------------------------------------

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// --------------------------------------------------
// General error handler
// --------------------------------------------------

app.use((error, req, res, next) => {
    console.error("Server error:");
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "An unexpected server error occurred."
    });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, async () => {
    console.log("----------------------------------------");
    console.log("Lilly Memes server started");
    console.log(`http://localhost:${PORT}`);
    console.log("----------------------------------------");

    await testDatabaseConnection();
});