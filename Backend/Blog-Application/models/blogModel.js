
import { supabase } from "../config/supabase.js";

// Create blog
export async function createBlogModel(blogData) {
    return await supabase
        .from("blogs")
        .insert(blogData)
        .select("*")
        .single();
}

// Get all blogs of logged-in user
export async function getMyBlogsModel(userId) {
    return await supabase
        .from("blogs")
        .select(`
            *,
            users!blogs_user_id_fkey (
                email
            )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
}

// Get blog by ID with user email
export async function getBlogByIdModel(blogId, userId) {
    return await supabase
        .from("blogs")
        .select(`
            *,
            users!blogs_user_id_fkey (
                email
            )
        `)
        .eq("id", blogId)
        .eq("user_id", userId)
        .maybeSingle();
}

// Update blog
export async function updateBlogModel(blogId, userId, blogData) {
    return await supabase
        .from("blogs")
        .update(blogData)
        .eq("id", blogId)
        .eq("user_id", userId)
        .select("*")
        .maybeSingle();
}

// Delete blog
export async function deleteBlogModel(blogId, userId) {
    return await supabase
        .from("blogs")
        .delete()
        .eq("id", blogId)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();
}
