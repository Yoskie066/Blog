import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";

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

    const token = jwt.sign(
        {
            userId: user.id,
            jti
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        }
    );

    return token;
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

    const { error } = await supabase
        .from("refresh_tokens")
        .insert({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt
        });

    if (error) {
        throw error;
    }
};

// =====================================
// REGISTER
// =====================================

export const register = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        // Check existing account
        const { data: existingUser, error: searchError } =
            await supabase
                .from("users")
                .select("id")
                .eq("email", normalizedEmail)
                .maybeSingle();

        if (searchError) {
            console.error(searchError);

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
        const { data: newUser, error: insertError } =
            await supabase
                .from("users")
                .insert({
                    email: normalizedEmail,
                    password_hash: hashedPassword
                })
                .select("id, email, created_at")
                .single();

        if (insertError) {
            if (insertError.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered."
                });
            }

            console.error(insertError);

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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user
        const { data: user, error } = await supabase
            .from("users")
            .select("id, email, password_hash")
            .eq("email", normalizedEmail)
            .maybeSingle();

        if (error) {
            console.error(error);

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

        // Check secrets
        if (
            !process.env.JWT_ACCESS_SECRET ||
            !process.env.JWT_REFRESH_SECRET
        ) {
            throw new Error("JWT secrets are not configured.");
        }

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
        const oldRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

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

        // Hash old token
        const oldTokenHash = hashRefreshToken(oldRefreshToken);

        // Check database record
        const { data: storedToken, error } = await supabase
            .from("refresh_tokens")
            .select("id, user_id, expires_at, revoked_at")
            .eq("token_hash", oldTokenHash)
            .is("revoked_at", null)
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

        if (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Unable to verify refresh token."
            });
        }

        if (!storedToken || storedToken.user_id !== decoded.userId) {
            clearRefreshTokenCookie(res);

            return res.status(401).json({
                success: false,
                message: "Refresh token is no longer valid."
            });
        }

        // Get user
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, email")
            .eq("id", decoded.userId)
            .maybeSingle();

        if (userError || !user) {
            clearRefreshTokenCookie(res);

            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }

        // Revoke old refresh token
        const { data: revokedToken, error: revokeError } = await supabase
            .from("refresh_tokens")
            .update({
                revoked_at: new Date().toISOString()
            })
            .eq("id", storedToken.id)
            .is("revoked_at", null)
            .select("id")
            .maybeSingle();

        if (revokeError) {
            console.error(revokeError);

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

        // Set new cookie
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
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

        if (refreshToken) {
            try {
                jwt.verify(
                    refreshToken,
                    process.env.JWT_REFRESH_SECRET
                );

                const tokenHash = hashRefreshToken(refreshToken);

                const { error } = await supabase
                    .from("refresh_tokens")
                    .update({
                        revoked_at: new Date().toISOString()
                    })
                    .eq("token_hash", tokenHash)
                    .is("revoked_at", null);

                if (error) {
                    console.error(error);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to complete logout."
                    });
                }

            } catch (error) {
                // Invalid or expired token:
                // Clear the browser cookie anyway.
                if (error.code !== "JsonWebTokenError" &&
                    error.name !== "TokenExpiredError" &&
                    error.name !== "NotBeforeError") {
                    console.error(error);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to complete logout."
                    });
                }
            }
        }

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