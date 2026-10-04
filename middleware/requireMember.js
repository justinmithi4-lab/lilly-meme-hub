function requireMember(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    if (req.session.user.role !== "member") {
        return res.status(403).json({
            success: false,
            message: "Member access required."
        });
    }

    if (req.session.user.status !== "active") {
        return res.status(403).json({
            success: false,
            message: "Your account is not active."
        });
    }

    next();
}

module.exports = requireMember;