const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const path = require("path");

require("dotenv").config();

const {
    testDatabaseConnection
} = require("./config/database");

const {
    runMigrations
} = require("./database/migrate");

const authRoutes = require("./routes/authRoutes");
const memeRoutes = require("./routes/memeRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes = require("./routes/searchRoutes");
const storyRoutes = require("./routes/storyRoutes");
const memberMessageRoutes = require("./routes/memberMessageRoutes");

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        rejectUnauthorized: false
    }
});


const app = express();

const PORT = Number(
    process.env.PORT || 3000
);

const IS_PRODUCTION =
    process.env.NODE_ENV === "production";


// --------------------------------------------------
// Production proxy
// --------------------------------------------------

if (IS_PRODUCTION) {
    app.set("trust proxy", 1);
}


// --------------------------------------------------
// Validate production environment
// --------------------------------------------------

if (IS_PRODUCTION) {

    if (!process.env.SESSION_SECRET) {

        console.error(
            "SESSION_SECRET is required in production."
        );

        process.exit(1);
    }

    if (
        process.env.SESSION_SECRET ===
        "change-this-secret"
    ) {

        console.error(
            "Please set a strong SESSION_SECRET in production."
        );

        process.exit(1);
    }

    if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ) {
        console.error(
            "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required in production."
        );
        process.exit(1);
    }
}


// --------------------------------------------------
// Body parsing
// --------------------------------------------------

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// --------------------------------------------------
// Sessions
// --------------------------------------------------

app.use(
    session({

        secret: process.env.SESSION_SECRET,

        store: sessionStore,

        resave: false,

        saveUninitialized: false,

        cookie: {

            httpOnly: true,

            secure: IS_PRODUCTION,

            sameSite: "lax",

            maxAge:
                1000 *
                60 *
                60 *
                24
        }
    })
);


// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/memes",
    memeRoutes
);

app.use(
    "/api/subscriptions",
    subscriptionRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/search",
    searchRoutes
);

app.use(
    "/api/stories",
    storyRoutes
);

app.use(
    "/api/member-messages",
    memberMessageRoutes
);


// --------------------------------------------------
// Static website files
// --------------------------------------------------

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// --------------------------------------------------
// Uploaded files
// --------------------------------------------------

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// --------------------------------------------------
// API health check
// --------------------------------------------------

app.get(
    "/api/test",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Lilly Memes backend is working!",

            environment:
                process.env.NODE_ENV ||
                "development"

        });

    }
);


// --------------------------------------------------
// Homepage
// --------------------------------------------------

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


// --------------------------------------------------
// API 404
// --------------------------------------------------

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found."

        });

    }
);


// --------------------------------------------------
// General error handler
// --------------------------------------------------

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:"
        );

        console.error(error);

        if (res.headersSent) {

            return next(error);

        }

        res.status(500).json({

            success: false,

            message:
                "An unexpected server error occurred."

        });

    }
);


// --------------------------------------------------
// Start application
// --------------------------------------------------

async function startServer() {

    try {

        console.log(
            "----------------------------------------"
        );

        console.log(
            "Starting Lilly Memes..."
        );

        console.log(
            "----------------------------------------"
        );


        // --------------------------------------------------
        // Test database
        // --------------------------------------------------

        await testDatabaseConnection();


        // --------------------------------------------------
        // Run safe migrations
        // --------------------------------------------------

        await runMigrations();


        // --------------------------------------------------
        // Start Express
        // --------------------------------------------------

        app.listen(
            PORT,
            () => {

                console.log(
                    "----------------------------------------"
                );

                console.log(
                    "Lilly Memes server started"
                );

                console.log(
                    `Port: ${PORT}`
                );

                console.log(
                    `Environment: ${
                        process.env.NODE_ENV ||
                        "development"
                    }`
                );

                console.log(
                    `http://localhost:${PORT}`
                );

                console.log(
                    "----------------------------------------"
                );

            }
        );

    } catch (error) {

        console.error(
            "----------------------------------------"
        );

        console.error(
            "Lilly Memes failed to start."
        );

        console.error(
            "Database initialization failed."
        );

        console.error(error);

        console.error(
            "----------------------------------------"
        );

        process.exit(1);
    }
}


startServer();