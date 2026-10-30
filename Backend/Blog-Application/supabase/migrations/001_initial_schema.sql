
-- =========================================
-- 1. USERS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================
-- 2. BLOGS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(120) NOT NULL,

    category VARCHAR(100) NOT NULL,

    content TEXT NOT NULL,

    image_url TEXT DEFAULT '',

    status VARCHAR(20) NOT NULL DEFAULT 'published',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT blogs_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE,

    CONSTRAINT blogs_status_check
        CHECK (status IN ('draft', 'published'))
);


-- =========================================
-- 3. REFRESH TOKENS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    token_hash TEXT UNIQUE NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT refresh_tokens_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE
);


-- =========================================
-- 4. INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_blogs_user_id
ON public.blogs(user_id);

CREATE INDEX IF NOT EXISTS idx_blogs_created_at
ON public.blogs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blogs_category
ON public.blogs(category);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
ON public.refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
ON public.refresh_tokens(token_hash);


-- =========================================
-- 5. UPDATED_AT TRIGGER
-- =========================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blogs_updated_at_trigger
ON public.blogs;

CREATE TRIGGER blogs_updated_at_trigger
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


-- =========================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
