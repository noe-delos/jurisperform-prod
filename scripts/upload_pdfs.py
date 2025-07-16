#!/usr/bin/env python3
"""
Script to upload course PDFs to Supabase Storage
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client
import PyPDF2
import io


# Supabase configuration
SUPABASE_URL = "https://gpmgyfuvftxclhoiniel.supabase.co"
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwbWd5ZnV2ZnR4Y2xob2luaWVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc1MDY0MywiZXhwIjoyMDY1MzI2NjQzfQ.ZvFyLeuNgEIJqnsaJIobEKJdR7By6o7nKypmbvcIuo4'


# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def clean_text_for_storage(text: str) -> str:
    """Clean text to be safe for storage keys and course IDs"""
    # Remove accents and special characters
    text = text.replace('é', 'e').replace('è', 'e').replace('à', 'a')
    text = text.replace('ç', 'c').replace('ô', 'o').replace('î', 'i')
    text = text.replace('ê', 'e').replace('û', 'u').replace('â', 'a')
    text = text.replace('°', '').replace('ã', 'a').replace('õ', 'o')
    text = text.replace('ü', 'u').replace('ë', 'e').replace('ï', 'i')
    # Keep only alphanumeric, spaces, hyphens, underscores
    text = "".join(c for c in text if c.isalnum() or c in (' ', '-', '_')).strip()
    # Replace multiple spaces/dashes with single dash
    text = '-'.join(text.split()).lower()
    return text

def get_course_id_from_path(pdf_path: Path, contenu_dir: Path) -> str:
    """Generate a course ID based on the PDF path and folder structure"""
    try:
        # Get relative path from contenu directory
        relative_path = pdf_path.relative_to(contenu_dir)
        
        # Get the parent folder name and filename
        folder_name = relative_path.parts[0] if len(relative_path.parts) > 1 else "general"
        file_name = pdf_path.stem
        
        # Create a mapping of folder numbers to course levels and subjects
        folder_mappings = {
            "1. Intro au droit public et droit constitutionnel": "l1-droit-constitutionnel",
            "Introduction au droit public et droit constitutionnel ": "l1-droit-constitutionnel",
            "2. Intro au droit et droit des personnes et de la famille": "l1-droit-civil",
            "3. Intro historique au Droit et histoire des institutions": "l1-histoire-du-droit", 
            "4. Intro à la science politique et économie politique": "l1-science-politique",
            "5. Droit administratif et institutions administratives": "l2-droit-administratif",
            "6. Institutions européennes et système juridique de l_Union Européenne": "l2-droit-europeen",
            "7. Relations et institutions internationales": "l2-relations-internationales",
            "8. Organisations juridictionnelles et représentations judiciaires": "l2-organisations-juridictionnelles",
            "9. Droit des obligations (L2)": "l2-droit-des-obligations",
            "10. Droit fiscal et finances publiques": "l2-droit-fiscal",
            "11. Droit pénal et procédure pénale": "l2-droit-penal",
            "12. Systèmes juridiques comparés et culture juridique contemporaine": "l2-systemes-juridiques",
            "13. Droit des affaires": "l3-droit-des-affaires",
            "14. Contrats spéciaux": "l3-contrats-speciaux",
            "15. Droit des biens": "l3-droit-des-biens",
            "16. Droit du travail et relations collectives": "l3-droit-du-travail",
            "17. Procédure civile": "crfpa-procedure-civile",
            "18. TGLF": "crfpa-tglf",
            "19. Droit des obligations CRFPA": "crfpa-droit-des-obligations",
            "21. Droit civil CRFPA": "crfpa-droit-civil",
            "22. Droit public et contentieux administratif": "crfpa-droit-public",
            "23. Droit international et européen": "crfpa-droit-international"
        }
        
        # Get the mapped course ID or create one from folder name
        if folder_name in folder_mappings:
            base_id = folder_mappings[folder_name]
        else:
            # Fallback: create ID from folder name
            base_id = folder_name.lower().replace(" ", "-").replace(".", "")[:50]
        
        # Clean the filename for use as course ID
        clean_filename = clean_text_for_storage(file_name)[:50]
        
        # If the filename is very generic or short, use the base_id
        if len(clean_filename) < 10 or clean_filename in ['cours', 'fascicule', 'fasc', 'poly']:
            return clean_text_for_storage(base_id)
        
        # Clean base_id as well
        clean_base_id = clean_text_for_storage(base_id)
        
        # Otherwise combine base with filename
        return f"{clean_base_id}-{clean_filename}"[:100]  # Limit total length
        
    except Exception as e:
        print(f"⚠️  Error generating course ID for {pdf_path}: {e}")
        # Fallback to just the filename
        return clean_text_for_storage(pdf_path.stem)[:50]

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text content from a PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
                except Exception as e:
                    print(f"⚠️  Warning: Could not extract text from page {page_num + 1}: {e}")
                    continue
            
            return text.strip()
    except Exception as e:
        print(f"❌ Error extracting text from {pdf_path}: {e}")
        return ""

def upload_pdf_to_storage(file_path: str, course_id: str) -> bool:
    """Upload PDF file to Supabase Storage"""
    try:
        with open(file_path, 'rb') as file:
            file_data = file.read()
            
        # Upload to the 'course-pdfs' bucket
        storage_path = f"{course_id}.pdf"
        
        result = supabase.storage.from_("course-pdfs").upload(
            path=storage_path,
            file=file_data,
            file_options={"content-type": "application/pdf"}
        )
        
        if result.data:
            print(f"✅ Successfully uploaded {course_id}.pdf to storage")
            return True
        else:
            print(f"❌ Failed to upload {course_id}.pdf: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Error uploading {file_path}: {e}")
        return False

def create_course_content_record(course_id: str, content: str) -> bool:
    """Create or update course content in the database"""
    try:
        # Check if record exists
        existing = supabase.table('course_contents').select('*').eq('course_id', course_id).execute()
        
        if existing.data:
            # Update existing record
            result = supabase.table('course_contents').update({
                'content': content,
                'updated_at': 'now()'
            }).eq('course_id', course_id).execute()
            
            if result.data:
                print(f"✅ Updated course content for {course_id}")
                return True
        else:
            # Insert new record
            result = supabase.table('course_contents').insert({
                'course_id': course_id,
                'content': content
            }).execute()
            
            if result.data:
                print(f"✅ Created course content for {course_id}")
                return True
                
        print(f"❌ Failed to save course content for {course_id}: {result}")
        return False
        
    except Exception as e:
        print(f"❌ Error saving course content for {course_id}: {e}")
        return False

def setup_storage_bucket():
    """Ensure the course-pdfs bucket exists"""
    try:
        # Try to create the bucket (will fail if it already exists, which is fine)
        result = supabase.storage.create_bucket("course-pdfs")
        if result.data:
            print("✅ Created course-pdfs bucket")
        
        # Set bucket to public for read access
        supabase.storage.update_bucket("course-pdfs", {"public": True})
        print("✅ Set course-pdfs bucket to public")
        
    except Exception as e:
        print(f"ℹ️  Bucket setup: {e} (this is often normal if bucket already exists)")

def main():
    """Main function to process all PDFs"""
    print("🚀 Starting PDF upload process...")
    
    # Setup storage bucket
    setup_storage_bucket()
    
    # Define the contenu directory
    contenu_dir = Path(__file__).parent.parent / "contenu"
    
    if not contenu_dir.exists():
        print(f"❌ Contenu directory not found: {contenu_dir}")
        print("Please ensure the 'contenu' directory exists with course PDF files")
        sys.exit(1)
    
    # Find all PDF files recursively in contenu directory
    pdf_files = list(contenu_dir.rglob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ No PDF files found in {contenu_dir}")
        print("Please add PDF files to the contenu directory")
        sys.exit(1)
    
    print(f"📁 Found {len(pdf_files)} PDF files")
    
    success_count = 0
    failed_count = 0
    
    for pdf_file in pdf_files:
        print(f"\n📄 Processing {pdf_file.name}...")
        print(f"    📁 Folder: {pdf_file.parent.name}")
        
        # Generate course ID from path and folder structure
        course_id = get_course_id_from_path(pdf_file, contenu_dir)
        print(f"    🏷️  Course ID: {course_id}")
        
        # Extract text content
        print(f"📖 Extracting text from {pdf_file.name}...")
        text_content = extract_text_from_pdf(str(pdf_file))
        
        if not text_content:
            print(f"⚠️  No text content extracted from {pdf_file.name}")
            failed_count += 1
            continue
        
        # Upload PDF to storage
        print(f"☁️  Uploading {pdf_file.name} to storage...")
        storage_success = upload_pdf_to_storage(str(pdf_file), course_id)
        
        # Save content to database
        print(f"💾 Saving text content for {course_id}...")
        db_success = create_course_content_record(course_id, text_content)
        
        if storage_success and db_success:
            print(f"✅ Successfully processed {pdf_file.name}")
            success_count += 1
        else:
            print(f"❌ Failed to process {pdf_file.name}")
            failed_count += 1
    
    print(f"\n🎉 Upload process completed!")
    print(f"✅ Successfully processed: {success_count} files")
    print(f"❌ Failed: {failed_count} files")
    
    if failed_count > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()