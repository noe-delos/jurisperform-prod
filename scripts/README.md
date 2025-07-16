# Course PDF Upload Scripts

This directory contains scripts to upload course PDF files to Supabase Storage and extract their content for the AI chatbot.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the database migration:**
   Execute the `course-contents-migration.sql` file in your Supabase dashboard or via the CLI.

3. **PDF files location:**
   The script now automatically processes PDF files from the `../contenu/` directory, which contains organized course materials by subject.

## Usage

1. **Upload PDFs:**
   ```bash
   python upload_pdfs.py
   ```

   This script will:
   - Scan the `../contenu/` directory recursively for all PDF files
   - Extract text content from each PDF
   - Generate appropriate course IDs based on folder structure
   - Upload the PDF files to Supabase Storage
   - Store the extracted text in the `course_contents` database table

## Course ID Generation

The script automatically generates course IDs based on the folder structure:

**Folder Structure → Course ID Mapping:**
- `1. Intro au droit public et droit constitutionnel/` → `l1-droit-constitutionnel`
- `2. Intro au droit et droit des personnes et de la famille/` → `l1-droit-civil`
- `11. Droit pénal et procédure pénale/` → `l2-droit-penal`
- `17. Procédure civile/` → `crfpa-procedure-civile`
- etc.

For specific PDF files, the course ID combines the base course ID with the filename:
- `l1-droit-civil-introduction.pdf`
- `l2-droit-penal-infractions.pdf`

## Environment Variables

Make sure you have the following environment variables set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

The script creates/uses the following table:

```sql
CREATE TABLE course_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Storage Bucket

PDFs are stored in the `course-pdfs` bucket in Supabase Storage with public read access for authenticated users.

## Troubleshooting

- **"No PDF files found"**: The script expects PDF files in the `../contenu/` directory
- **"Missing Supabase environment variables"**: Check your `.env.local` file
- **"Permission denied"**: Ensure your service role key has the necessary permissions
- **"Text extraction failed"**: Some PDFs might be image-based or encrypted. Try converting them to text-searchable PDFs first.

## Security

- The service role key is used for admin operations (uploading)
- Regular users can only read course content through the AI tools
- All operations respect Supabase RLS policies