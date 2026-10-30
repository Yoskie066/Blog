import jwt from "jsonwebtoken";

// =====================================
// AUTHENTICATE ACCESS TOKEN
// =====================================

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const accessToken = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            accessToken,
            process.env.JWT_ACCESS_SECRET
        );

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired."
            });
        }

        return res.status(403).json({
            success: false,
            message: "Invalid access token."
        });
    }
};