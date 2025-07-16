-- Create table for storing course PDF content
CREATE TABLE IF NOT EXISTS public.course_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.course_contents ENABLE ROW LEVEL SECURITY;

-- Create policy for reading course contents (all authenticated users can read)
CREATE POLICY "Users can read course contents" ON public.course_contents
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Create policy for admins to manage course contents
CREATE POLICY "Admins can manage course contents" ON public.course_contents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'owner')
        )
    );

-- Create index for faster course_id lookups
CREATE INDEX IF NOT EXISTS idx_course_contents_course_id ON public.course_contents(course_id);

-- Create storage bucket for course PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-pdfs', 'course-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for reading PDFs (all authenticated users)
CREATE POLICY "Users can read course PDFs" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'course-pdfs' AND auth.role() = 'authenticated');

-- Create storage policy for admins to upload PDFs
CREATE POLICY "Admins can upload course PDFs" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'course-pdfs' AND auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'owner')
        )
    );

-- Create storage policy for admins to update PDFs
CREATE POLICY "Admins can update course PDFs" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'course-pdfs' AND auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'owner')
        )
    );

-- Create storage policy for admins to delete PDFs
CREATE POLICY "Admins can delete course PDFs" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'course-pdfs' AND auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'owner')
        )
    );