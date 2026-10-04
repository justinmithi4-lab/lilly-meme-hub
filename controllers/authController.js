const bcrypt = require("bcrypt");

const { pool } = require("../config/database");

// ============================================================
// REGISTER
// ============================================================

async function register(req, res) {
    try {
        const {
            username,
            email,
            password,
            full_name
        } = req.body;

        // --------------------------------------------
        // Validate input
        // --------------------------------------------

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email and password are required."
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Username must be at least 3 characters."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        // --------------------------------------------
        // Check existing username/email
        // --------------------------------------------

        const [existingUsers] = await pool.execute(
            `
            SELECT id, username, email
            FROM users
            WHERE username = ? OR email = ?
            LIMIT 1
            `,
            [username, email]
        );

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];

            if (existingUser.username === username) {
                return res.status(409).json({
                    success: false,
                    message: "Username is already taken."
                });
            }

            if (existingUser.email === email) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered."
                });
            }
        }

        // --------------------------------------------
        // Hash password
        // --------------------------------------------

        const passwordHash = await bcrypt.hash(password, 12);

        // --------------------------------------------
        // Create user
        // --------------------------------------------

        const [result] = await pool.execute(
            `
            INSERT INTO users
                (
                    username,
                    email,
                    password_hash,
                    full_name
                )
            VALUES
                (?, ?, ?, ?)
            `,
            [
                username,
                email,
                passwordHash,
                full_name || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            userId: result.insertId
        });

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while creating your account."
        });
    }
}


// ============================================================
// LOGIN
// ============================================================

async function login(req, res) {
    try {

        const {
            login,
            password
        } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                success: false,
                message: "Username/email and password are required."
            });
        }

        // --------------------------------------------
        // Find user
        // --------------------------------------------

        const [users] = await pool.execute(
            `
            SELECT
                id,
                username,
                email,
                password_hash,
                full_name,
                profile_image,
                role,
                status
            FROM users
            WHERE username = ? OR email = ?
            LIMIT 1
            `,
            [login, login]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password."
            });
        }

        const user = users[0];

        // --------------------------------------------
        // Check account status
        // --------------------------------------------

        if (user.status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended."
            });
        }

        // --------------------------------------------
        // Verify password
        // --------------------------------------------

        const passwordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password."
            });
        }

        // --------------------------------------------
        // Create session
        // --------------------------------------------

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            profile_image: user.profile_image,
            role: user.role,
            status: user.status
        };

        res.json({
            success: true,
            message: "Login successful.",

            user: req.session.user
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while logging in."
        });
    }
}


// ============================================================
// LOGOUT
// ============================================================

function logout(req, res) {

    req.session.destroy((error) => {

        if (error) {

            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not log out."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
}


// ============================================================
// CURRENT USER
// ============================================================

function currentUser(req, res) {

    if (!req.session.user) {
        return res.json({
            success: true,
            loggedIn: false
        });
    }

    res.json({
        success: true,
        loggedIn: true,
        user: req.session.user
    });
}


module.exports = {
    register,
    login,
    logout,
    currentUser
};