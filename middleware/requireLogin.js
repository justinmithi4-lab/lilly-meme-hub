function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    next();
}

module.exports = requireLogin;