# Course PDFs Directory

Place your course PDF files in this directory using the following naming convention:

## Naming Convention

Use the course ID as the filename:

### L1 Courses
- `l1-droit-civil.pdf`
- `l1-droit-constitutionnel.pdf`
- `l1-histoire-du-droit.pdf`
- `l1-institutions-juridictionnelles.pdf`

### L2 Courses
- `l2-droit-civil.pdf`
- `l2-droit-penal.pdf`
- `l2-droit-administratif.pdf`
- `l2-droit-des-obligations.pdf`

### L3 Courses
- `l3-droit-des-affaires.pdf`
- `l3-droit-du-travail.pdf`
- `l3-droit-fiscal.pdf`
- `l3-droit-international.pdf`

### CRFPA Courses
- `crfpa-procedure-civile.pdf`
- `crfpa-procedure-penale.pdf`
- `crfpa-droit-des-obligations.pdf`
- `crfpa-note-de-synthese.pdf`

## Upload Process

Once you've added your PDF files here, run the upload script:

```bash
cd scripts
python upload_pdfs.py
```

This will automatically:
1. Extract text from each PDF
2. Upload PDFs to Supabase Storage
3. Store content in the database for AI access

## Important Notes

- PDF files should be text-searchable (not just images)
- Large files may take longer to process
- The filename (without .pdf) becomes the course ID used by the AI system
- Make sure filenames match the course IDs defined in `app/lib/courses.ts`