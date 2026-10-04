function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Administrator access required."
        });
    }

    next();
}

module.exports = requireAdmin;