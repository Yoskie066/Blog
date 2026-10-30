import { supabase } from "../config/supabase.js";

// Save refresh token
export async function createRefreshToken(userId, tokenHash, expiresAt) {
    return await supabase
        .from("refresh_tokens")
        .insert({
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt
        });
}

// Find valid refresh token
export async function findRefreshToken(tokenHash) {
    return await supabase
        .from("refresh_tokens")
        .select("id, user_id, expires_at, revoked_at")
        .eq("token_hash", tokenHash)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
}

// Revoke refresh token
export async function revokeRefreshToken(tokenHash) {
    return await supabase
        .from("refresh_tokens")
        .update({
            revoked_at: new Date().toISOString()
        })
        .eq("token_hash", tokenHash)
        .is("revoked_at", null);
}

// Revoke refresh token by ID
export async function revokeRefreshTokenById(tokenId) {
    return await supabase
        .from("refresh_tokens")
        .update({
            revoked_at: new Date().toISOString()
        })
        .eq("id", tokenId)
        .is("revoked_at", null)
        .select("id")
        .maybeSingle();
}
