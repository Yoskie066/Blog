import { supabase } from "../config/supabase.js";

// Find user by email
export async function findUserByEmail(email) {
    return await supabase
        .from("users")
        .select("id, email, password_hash, created_at")
        .eq("email", email)
        .maybeSingle();
}

// Find user by ID
export async function findUserById(userId) {
    return await supabase
        .from("users")
        .select("id, email, created_at")
        .eq("id", userId)
        .maybeSingle();
}

// Create new user
export async function createUser(email, passwordHash) {
    return await supabase
        .from("users")
        .insert({
            email,
            password_hash: passwordHash
        })
        .select("id, email, created_at")
        .single();
}
