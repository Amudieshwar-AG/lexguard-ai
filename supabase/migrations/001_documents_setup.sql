-- ═══════════════════════════════════════════════════════════════════════════
-- LexGuard AI — Documents Table & Storage Setup
-- Run this in your Supabase SQL Editor to enable document uploads
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Drop existing table (safe — no data yet) and recreate with correct schema
DROP TABLE IF EXISTS public.documents CASCADE;

-- 2. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
    pages INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. Add columns if table exists but columns are missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'documents' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.documents ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'documents' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.documents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

-- 6. Create RLS policies so users can only see their own documents
CREATE POLICY "Users can view own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.documents;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKET SETUP (Run these separately after creating the table)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: Storage buckets must be created via the Supabase Dashboard first!
-- Go to: Storage → Create a new bucket named "documents"
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Then run the policies below:

-- Storage policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policy: Allow users to read their own documents
CREATE POLICY "Users can view own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policy: Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- RISK ANALYSES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.risk_clauses CASCADE;
DROP TABLE IF EXISTS public.risk_analyses CASCADE;

CREATE TABLE public.risk_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_risk_score INT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    ai_summary TEXT,
    confidence_score INT,
    clause_summary JSONB,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add clause_summary to any existing risk_analyses table (safe to run multiple times)
ALTER TABLE public.risk_analyses ADD COLUMN IF NOT EXISTS clause_summary JSONB;

CREATE INDEX IF NOT EXISTS idx_risk_analyses_document_id ON public.risk_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_risk_analyses_user_id ON public.risk_analyses(user_id);

ALTER TABLE public.risk_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own analyses" ON public.risk_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.risk_analyses;
CREATE POLICY "Users can view own analyses"  ON public.risk_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.risk_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RISK CLAUSES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.risk_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_analysis_id UUID NOT NULL REFERENCES public.risk_analyses(id) ON DELETE CASCADE,
    clause_reference TEXT NOT NULL,
    clause_title TEXT NOT NULL,
    clause_type TEXT CHECK (clause_type IN ('liability', 'termination', 'non_compete', 'indemnity', 'financial', 'governance', 'regulatory', 'other')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    description TEXT NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add clause_type column if table exists but column is missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'risk_clauses' 
                   AND column_name = 'clause_type') THEN
        ALTER TABLE public.risk_clauses ADD COLUMN clause_type TEXT CHECK (clause_type IN ('liability', 'termination', 'non_compete', 'indemnity', 'financial', 'governance', 'regulatory', 'other'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_risk_clauses_analysis_id ON public.risk_clauses(risk_analysis_id);

ALTER TABLE public.risk_clauses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own clauses" ON public.risk_clauses;
DROP POLICY IF EXISTS "Users can insert own clauses" ON public.risk_clauses;
CREATE POLICY "Users can view own clauses"
    ON public.risk_clauses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.risk_analyses ra
        WHERE ra.id = risk_analysis_id AND ra.user_id = auth.uid()
    ));
CREATE POLICY "Users can insert own clauses"
    ON public.risk_clauses FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.risk_analyses ra
        WHERE ra.id = risk_analysis_id AND ra.user_id = auth.uid()
    ));

-- ═══════════════════════════════════════════════════════════════════════════
-- REPORTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS public.reports CASCADE;

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('full_due_diligence', 'executive_summary')),
    file_path TEXT,
    file_size BIGINT,
    status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'error')),
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_document_id ON public.reports(document_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can view own reports"  ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
