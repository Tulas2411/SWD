const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(pdfPath, outPath) {
    try {
        let dataBuffer = fs.readFileSync(pdfPath);
        let data = await pdf(dataBuffer);
        fs.writeFileSync(outPath, data.text);
        console.log(`Extracted: ${outPath}`);
    } catch (error) {
        console.error(`Error processing ${pdfPath}:`, error);
    }
}

async function main() {
    await extractText('d:\\Code\\SWD\\WEBMED HEALTH CARE SERVICES SYSTEM - PROJECT REPORT- GROUP 4.pdf', 'd:\\Code\\SWD\\tmp_pdf_extract\\srs.txt');
    await extractText('d:\\Code\\SWD\\ERD_Concept.docx.pdf', 'd:\\Code\\SWD\\tmp_pdf_extract\\erd.txt');
}

main();
