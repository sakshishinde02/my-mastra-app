import fs from 'fs/promises';
import path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pkg from 'pg';
const { Client } = pkg;

const DATA_DIR = path.resolve('./documents');

// Postgres connection string from your .env
const connectionString = 'postgres://postgres:mysecretpassword@localhost:5432/postgres';

// chunk helper
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        let end = Math.min(i + chunkSize, text.length);
        chunks.push(text.substring(i, end));
        i += chunkSize - overlap;
    }
    return chunks;
}

async function ingestDocument(filePath) {
    console.log(`\n--- Processing document: ${filePath} ---`);
    const fileName = path.basename(filePath);
    const yearMatch = fileName.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : 'unknown_year';

    const client = new Client({ connectionString });
    await client.connect();

    const dataBuffer = await fs.readFile(filePath);
    const pdfDocument = await getDocument({ data: new Uint8Array(dataBuffer) }).promise;

    console.log(`Extracting ${pdfDocument.numPages} pages from ${fileName}...`);

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        try {
            const page = await pdfDocument.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ') + '\n\n';

            const chunks = chunkText(pageText);
            console.log(`Page ${pageNumber}: ${chunks.length} chunks`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                const metadata = {
                    source: fileName,
                    year: year,
                    chunk_index: `page${pageNumber}_chunk${i}`,
                    document_type: 'shareholder_letter',
                };

                console.log(`Inserting page ${pageNumber}, chunk ${i + 1}/${chunks.length}...`);

                await client.query(
                    `
                    INSERT INTO mdocument (text, source, year, chunk_index, document_type)
                    VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        chunk,
                        metadata.source,
                        metadata.year,
                        metadata.chunk_index,
                        metadata.document_type,
                    ]
                );

                console.log(`✅ Inserted page ${pageNumber}, chunk ${i + 1}`);
            }

            // free memory
            page.cleanup();
            global.gc?.();

        } catch (err) {
            console.error(`❌ Error on page ${pageNumber}:`, err);
        }
    }

    await client.end();
    console.log(`✅ Finished processing ${fileName}`);
}

async function runIngestion() {
    console.log('🚀 Starting single-file ingestion...');
    const fileName = '2022.pdf';
    const filePath = path.join(DATA_DIR, fileName);
    await ingestDocument(filePath);
}

runIngestion();
