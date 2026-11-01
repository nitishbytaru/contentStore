-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    idea TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted')),
    date_posted TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Article and Video Content
    base_article TEXT DEFAULT '',
    medium_article TEXT DEFAULT '',
    youtube_script TEXT DEFAULT '',

    -- Eligibility Flags
    eligible_medium BOOLEAN DEFAULT true,
    eligible_substack BOOLEAN DEFAULT true,
    ineligible_medium BOOLEAN DEFAULT false,
    ineligible_substack BOOLEAN DEFAULT false,
    eligible_youtube BOOLEAN DEFAULT true,
    eligible_instagram BOOLEAN DEFAULT true,
    ineligible_youtube BOOLEAN DEFAULT false,
    ineligible_instagram BOOLEAN DEFAULT false
);

-- 2. RESEARCH MESSAGES TABLE (Chats & Sources per idea)
CREATE TABLE IF NOT EXISTS public.research_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'source')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_messages_idea_id ON public.research_messages(idea_id);
CREATE INDEX IF NOT EXISTS idx_research_messages_user_id ON public.research_messages(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR IDEAS
-- Users can only view their own ideas
CREATE POLICY "Users can select own ideas"
    ON public.ideas
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own ideas
CREATE POLICY "Users can insert own ideas"
    ON public.ideas
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own ideas
CREATE POLICY "Users can update own ideas"
    ON public.ideas
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own ideas
CREATE POLICY "Users can delete own ideas"
    ON public.ideas
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. RLS POLICIES FOR RESEARCH MESSAGES
-- Users can only view messages belonging to their ideas
CREATE POLICY "Users can select own research messages"
    ON public.research_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert messages for their ideas
CREATE POLICY "Users can insert own research messages"
    ON public.research_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own research messages
CREATE POLICY "Users can delete own research messages"
    ON public.research_messages
    FOR DELETE
    USING (auth.uid() = user_id);
