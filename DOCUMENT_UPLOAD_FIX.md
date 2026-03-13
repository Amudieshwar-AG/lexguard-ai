# Document Upload Fix — Setup Guide

## Issue
Documents are not uploading because the Supabase database and storage are not configured yet.

## Solution
Follow these steps to enable document uploads:

---

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Open your project: **dmlswisvlpkkvqroyucx**
3. Click **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name:** `documents`
   - **Public bucket:** ❌ **OFF** (keep it private)
   - **File size limit:** 50 MB
   - **Allowed MIME types:** `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document`
6. Click **"Create bucket"**

---

## Step 2: Run the Database Migration

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrations/001_documents_setup.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. You should see: ✅ **Success. No rows returned**

---

## Step 3: Test the Upload

1. Make sure your development server is running:
   ```bash
   npm run dev
   ```

2. Open your browser to **http://localhost:8080/dashboard**

3. Navigate to the **Documents** section

4. Try uploading a PDF or DOCX file:
   - Drag & drop a file into the upload zone, OR
   - Click **"Select Files"** to browse

5. Check the browser console (F12) for any errors

---

## Step 4: Verify in Supabase

After successful upload, verify:

1. **Storage** → **documents** bucket → You should see a folder with your user ID containing the uploaded file
2. **Table Editor** → **documents** table → You should see a new row with file metadata

---

## Troubleshooting

### Error: "new row violates row-level security policy"
- **Fix:** Make sure you ran the SQL migration that creates the RLS policies

### Error: "storage bucket not found"
- **Fix:** Create the `documents` bucket in Storage (Step 1)

### Error: "permission denied for storage object"
- **Fix:** The storage policies weren't created. Re-run the storage policy section of the SQL migration

### File uploads but doesn't appear in the list
- **Fix:** Check the browser console for errors. The `documents` table might not exist or RLS policies are blocking queries

### Nothing happens when clicking "Select Files"
- **Fix:** Open browser console (F12) and check for JavaScript errors. Make sure all environment variables in `.env` are correct

---

## Additional Tables (Optional)

If you want to enable full AI analysis, risk scoring, and reports, also run these table migrations:

```sql
-- Risk Analyses Table
CREATE TABLE public.risk_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_risk_score INT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    ai_summary TEXT,
    confidence_score INT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Clauses Table
CREATE TABLE public.risk_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_analysis_id UUID NOT NULL REFERENCES risk_analyses(id) ON DELETE CASCADE,
    clause_reference TEXT NOT NULL,
    clause_title TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    description TEXT NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports Table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    format TEXT DEFAULT 'pdf',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies for each table
-- (Follow the same pattern as the documents table)
```

---

## Success Checklist

- ✅ Storage bucket `documents` created
- ✅ `documents` table created in database
- ✅ RLS policies applied
- ✅ Storage policies applied
- ✅ Test upload successful
- ✅ Document appears in the documents list

After completing all steps, document uploads should work perfectly!
