
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import {
    findUserByEmail,
    findUserById,
    createUser
} from "../models/userModel.js";

import {
    createRefreshToken,
    findRefreshToken,
    revokeRefreshTokenById,
    revokeRefreshToken
} from "../models/refreshTokenModel.js";


// =====================================
// TOKEN CONFIGURATION
// =====================================

const ACCESS_TOKEN_EXPIRES_IN =
    process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

const REFRESH_TOKEN_EXPIRES_IN =
    process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const REFRESH_TOKEN_MAX_AGE =
    7 * 24 * 60 * 60 * 1000;


// =====================================
// JWT SECRET VALIDATION
// =====================================

const validateJWTSecrets = () => {
    if (
        !process.env.JWT_ACCESS_SECRET ||
        !process.env.JWT_REFRESH_SECRET
    ) {
        throw new Error("JWT secrets are not configured.");
    }
};


// =====================================
// TOKEN HELPERS
// =====================================

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN
        }
    );
};


const generateRefreshToken = (user) => {
    const jti = crypto.randomUUID();

    return jwt.sign(
        {
            userId: user.id,
            jti
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        }
    );
};


const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};


// =====================================
// REFRESH TOKEN COOKIE
// =====================================

const setRefreshTokenCookie = (res, token) => {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: "/api/auth"
    });
};


const clearRefreshTokenCookie = (res) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth"
    });
};


// =====================================
// SAVE REFRESH TOKEN
// =====================================

const saveRefreshToken = async (user, token) => {
    const tokenHash = hashRefreshToken(token);

    const expiresAt = new Date(
        Date.now() + REFRESH_TOKEN_MAX_AGE
    ).toISOString();

    const { error } = await createRefreshToken(
        user.id,
        tokenHash,
        expiresAt
    );

    if (error) {
        throw error;
    }
};


// =====================================
// REGISTER
// =====================================

export const register = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body || {};

        // Validate required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string" ||
            !email.trim() ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        // Confirm password
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        // Check existing account
        const {
            data: existingUser,
            error: searchError
        } = await findUserByEmail(normalizedEmail);

        if (searchError) {
            console.error("Find user error:", searchError);

            return res.status(500).json({
                success: false,
                message: "Unable to check existing account."
            });
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const {
            data: newUser,
            error: insertError
        } = await createUser(
            normalizedEmail,
            hashedPassword
        );

        if (insertError) {

            // Duplicate email
            if (insertError.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered."
                });
            }

            console.error("Create user error:", insertError);

            return res.status(500).json({
                success: false,
                message: "Unable to create account."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful. You can now log in.",
            user: newUser
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during registration."
        });
    }
};


// =====================================
// LOGIN
// =====================================

export const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Validate required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Find user
        const {
            data: user,
            error
        } = await findUserByEmail(normalizedEmail);

        if (error) {
            console.error("Find user error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve account."
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Validate JWT secrets
        validateJWTSecrets();

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save hashed refresh token
        await saveRefreshToken(user, refreshToken);

        // Store refresh token in HttpOnly cookie
        setRefreshTokenCookie(res, refreshToken);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            accessToken,
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during login."
        });
    }
};


// =====================================
// REFRESH ACCESS TOKEN
// =====================================

export const refresh = async (req, res) => {
    try {
        validateJWTSecrets();

        const oldRefreshToken =
            req.cookies?.[REFRESH_TOKEN_COOKIE];

        // Check refresh token cookie
        if (!oldRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required."
            });
        }

        // Verify refresh token
        let decoded;

        try {
            decoded = jwt.verify(
                oldRefreshToken,
                process.env.JWT_REFRESH_SECRET
            );

        } catch (error) {
            clearRefreshTokenCookie(res);

            return res.status(401).json({
                success: false,
                message: "Refresh token is invalid or expired."
            });
        }

        // Hash old refresh token
        const oldTokenHash = hashRefreshToken(oldRefreshToken);

        // Find stored refresh token
        const {
            data: storedToken,
            error
        } = await findRefreshToken(oldTokenHash);

        if (error) {
            console.error("Find refresh token error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to verify refresh token."
            });
        }

        // Validate stored token
        if (
            !storedToken ||
            storedToken.user_id !== decoded.userId
        ) {
            clearRefreshTokenCookie(res);

            return res.status(401).json({
                success: false,
                message: "Refresh token is no longer valid."
            });
        }

        // Find user
        const {
            data: user,
            error: userError
        } = await findUserById(decoded.userId);

        if (userError) {
            console.error("Find user error:", userError);

            return res.status(500).json({
                success: false,
                message: "Unable to retrieve user account."
            });
        }

        if (!user) {
            clearRefreshTokenCookie(res);

            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }

        // Revoke old refresh token
        const {
            data: revokedToken,
            error: revokeError
        } = await revokeRefreshTokenById(storedToken.id);

        if (revokeError) {
            console.error("Revoke refresh token error:", revokeError);

            return res.status(500).json({
                success: false,
                message: "Unable to rotate refresh token."
            });
        }

        if (!revokedToken) {
            clearRefreshTokenCookie(res);

            return res.status(401).json({
                success: false,
                message: "Refresh token has already been used."
            });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Save new refresh token
        await saveRefreshToken(user, newRefreshToken);

        // Set new refresh token cookie
        setRefreshTokenCookie(res, newRefreshToken);

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully.",
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error("Refresh token error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to refresh access token."
        });
    }
};


// =====================================
// LOGOUT
// =====================================

export const logout = async (req, res) => {
    try {
        validateJWTSecrets();

        const refreshToken =
            req.cookies?.[REFRESH_TOKEN_COOKIE];

        if (refreshToken) {

            // Verify refresh token
            try {
                jwt.verify(
                    refreshToken,
                    process.env.JWT_REFRESH_SECRET
                );

            } catch (error) {

                // Invalid or expired token
                if (
                    error.name === "JsonWebTokenError" ||
                    error.name === "TokenExpiredError" ||
                    error.name === "NotBeforeError"
                ) {
                    clearRefreshTokenCookie(res);

                    return res.status(200).json({
                        success: true,
                        message: "Logged out successfully."
                    });
                }

                throw error;
            }

            // Hash refresh token
            const tokenHash = hashRefreshToken(refreshToken);

            // Revoke refresh token
            const { error } = await revokeRefreshToken(tokenHash);

            if (error) {
                console.error("Revoke refresh token error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to complete logout."
                });
            }
        }

        // Clear cookie
        clearRefreshTokenCookie(res);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during logout."
        });
    }
};
