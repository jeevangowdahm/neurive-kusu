# Neurive - AI-Powered Karnataka Digital Archive Intelligence Platform

Neurive is a production-grade digital archive intelligence platform built specifically for the indexing, OCR extraction, semantic vector searching, and retrieval testing of historical scrolls, land revenue deeds, inscriptions, and proclamations belonging to the state of Karnataka.

## 🚀 Key Architectural Features
1. **Bilingual OCR & Layout Recognition:** Scans paper scrolls in English and Kannada (ಮುದ್ರಿತ ಪ್ರತಿಗಳು) and segment pages.
2. **Explainable Hybrid Search:** Fuses pgvector cosine similarity (dense matching) and GIN-backed Full Text Search (sparse token matches) with named entity recognition weights.
3. **Conversational RAG Chat Assistant:** Strictly grounded LLM chat with inline citation page reference tags.
4. **Knowledge Graph & Timeline Engine:** Interactive force-directed map plotting events, places, and dynastic links.
5. **Geographical Division Cockpit:** Visual map-based explorer linking Karnataka divisions, districts, and categories.
6. **Algorithmic Evaluation Ground:** Automated testing suite evaluating search engines on MRR, Recall@10, and Precision@5 metrics.

---

## 🛠️ Step-by-Step Installation

### Prerequisites
- Node.js (v18 or higher)
- NPM
- A Supabase Project (https://supabase.com)
- Google Gemini API Key (Optional; for RAG assistant)

### 1. Clone & Install Dependencies
```bash
git clone <repository_url>
cd "neurive kusu"
npm install
```

### 2. Database Migrations Setup
Log into your Supabase Dashboard, open the **SQL Editor**, and run the SQL migration files located in the `supabase/migrations/` directory in chronological sequence:
1. `20260514140820_create_neurive_schema.sql` (Creates core tables, auth users, RLS)
2. `20260514152858_add_auth_user_trigger.sql` (Auto-adds profile trigger for new users)
3. `20260519015745_add_vector_embeddings_infrastructure.sql` (Adds pgvector extension, columns, and indexes)
4. `20260605153200_upload_ingestion_pipeline.sql` (Adds processing queues)
5. `20260605160000_implement_hybrid_search.sql` (Creates `hybrid_search` RPC function)
6. `20260606180000_implement_document_viewer.sql` (Adds bookmarks and notes)
7. `20260606190000_implement_knowledge_graph.sql` (Sets entity relations)
8. `20260606200000_implement_district_category_explorer.sql` (Populates Karnataka geographical stats)
9. `20260606210000_implement_admin_analytics_testing.sql` (Adds test query suites)
10. `20260606220000_implement_demo_mode.sql` (Sets demo markers)

### 3. Storage Bucket Setup
1. In your Supabase Dashboard, navigate to **Storage**.
2. Click **New Bucket** and name it exactly `archive-documents`.
3. Set the bucket access to **Public** so the signed URL generator can fetch public links safely.

### 4. Configure Environment Variables
Create a `.env` file in the root directory and populate it according to the template in `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-google-studio-key
OPENAI_API_KEY=your-openai-key
```

### 5. Build and Start Server
To start the local development server:
```bash
npm run dev
```
To build the application for production deployment:
```bash
npm run build
```
To run the built production server:
```bash
npm run start
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## ☁️ Deployment Notes for Vercel

To host Neurive on Vercel:
1. Push your code to GitHub.
2. Link your repository in the **Vercel Dashboard**.
3. Add your environment variables in Vercel's **Project Settings**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`
4. Click **Deploy**. Vercel will build and host the Next.js routes automatically.

---

## 👤 Demo Accounts & Credentials
To log in as administrator and perform retries, health audits, or run search tests, sign in using the following credential:
- **Email:** `user@neurive.karnataka.gov.in`
- **Password:** `Admin123!` (or sign up a new account and alter its role field in the `users` table to `admin` using the Supabase SQL editor).

---

## 🔍 Troubleshooting FAQ

#### Issue: Chunks vector matching throws length mismatch error
*Reason:* The embedding model returned a different dimension length than expected.
*Fix:* Check that the query embedding generator outputs 1536-dimensional vectors (standard OpenAI embedding size) or disable embeddings temporarily in config to run simulated cosine matching.

#### Issue: "Access Denied" when visiting admin paths
*Reason:* Active account role is not set to `admin`.
*Fix:* Access `/demo` and log in with `user@neurive.karnataka.gov.in`. Or manually run `UPDATE public.users SET role = 'admin' WHERE email = 'YOUR_EMAIL';` in the SQL editor.
