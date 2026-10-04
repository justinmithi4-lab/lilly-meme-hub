const express = require("express");

const {
    register,
    login,
    logout,
    currentUser
} = require("../controllers/authController");

const router = express.Router();


// Register
router.post("/register", register);


// Login
router.post("/login", login);


// Logout
router.post("/logout", logout);


// Current logged-in user
router.get("/me", currentUser);


module.exports = router;