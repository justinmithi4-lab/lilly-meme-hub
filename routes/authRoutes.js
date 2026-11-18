const express = require("express");

const {
    register,
    login,
    logout,
    currentUser
} = require("../controllers/authController");
const requireLogin = require("../middleware/requireLogin");
const { profileImageUpload } = require("../middleware/profileImageUpload");
const {
    updateProfileImage,
    removeProfileImage
} = require("../controllers/profileImageController");

const router = express.Router();


// Register
router.post("/register", register);


// Login
router.post("/login", login);


// Logout
router.post("/logout", logout);


// Current logged-in user
router.get("/me", currentUser);

// Profile picture management
router.put(
    "/profile-image",
    requireLogin,
    profileImageUpload,
    updateProfileImage
);

router.delete(
    "/profile-image",
    requireLogin,
    removeProfileImage
);


module.exports = router;