#!/usr/bin/env python3
"""
Simple script to count and preview PDFs that would be uploaded
"""

import os
from pathlib import Path

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
            "2. Intro au droit et droit des personnes et de la famille": "l1-droit-civil",
            "3. Intro historique au Droit et histoire des institutions": "l1-histoire-du-droit", 
            "4. Intro à la science politique et économie politique": "l1-science-politique",
            "5. Droit administratif et institutions administratives": "l2-droit-administratif",
            "6. Institutions européennes et système juridique de l_Union Européenne": "l2-droit-europeen",
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

def main():
    """Count PDFs and show preview"""
    print("📊 PDF Count and Preview")
    print("=" * 50)
    
    # Define the contenu directory
    contenu_dir = Path(__file__).parent.parent / "contenu"
    
    if not contenu_dir.exists():
        print(f"❌ Contenu directory not found: {contenu_dir}")
        return
    
    # Find all PDF files recursively
    pdf_files = list(contenu_dir.rglob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ No PDF files found in {contenu_dir}")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files")
    print()
    
    # Group by folder
    by_folder = {}
    for pdf_file in pdf_files:
        folder_name = pdf_file.parent.name
        if folder_name not in by_folder:
            by_folder[folder_name] = []
        by_folder[folder_name].append(pdf_file)
    
    # Show summary by folder
    print("📂 Summary by folder:")
    for folder, files in sorted(by_folder.items()):
        print(f"  {folder}: {len(files)} files")
    
    print()
    print("📋 First 10 course ID examples:")
    for i, pdf_file in enumerate(pdf_files[:10]):
        course_id = get_course_id_from_path(pdf_file, contenu_dir)
        print(f"  {pdf_file.name} → {course_id}")
    
    if len(pdf_files) > 10:
        print(f"  ... and {len(pdf_files) - 10} more files")

if __name__ == "__main__":
    main()