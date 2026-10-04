const express = require("express");

const {
    searchMemes,
    getSearchCategories
} = require("../controllers/searchController");

const router = express.Router();

/*
 * Search memes.
 *
 * Example:
 * /api/search?q=funny
 * /api/search?q=malawi&sort=popular
 * /api/search?category=Sports
 */
router.get("/", searchMemes);

/*
 * Search/category filter options.
 */
router.get("/categories", getSearchCategories);

module.exports = router;