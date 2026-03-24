import PyPDF2
import sys

def extract_text(pdf_path, out_path):
    try:
        text = ""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        with open(out_path, 'w', encoding='utf-8') as out_file:
            out_file.write(text)
        print(f"Successfully extracted {pdf_path} to {out_path}")
    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")

if __name__ == "__main__":
    extract_text(r'd:\Code\SWD\WEBMED HEALTH CARE SERVICES SYSTEM - PROJECT REPORT- GROUP 4.pdf', r'd:\Code\SWD\tmp_pdf_extract\srs.txt')
    extract_text(r'd:\Code\SWD\ERD_Concept.docx.pdf', r'd:\Code\SWD\tmp_pdf_extract\erd.txt')
