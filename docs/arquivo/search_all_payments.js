import { existsSync, appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as XLSX_STAR from 'xlsx';
import XLSX_DEFAULT from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFile = join(__dirname, 'search_results_all.txt');

function log(msg) {
    try {
        appendFileSync(logFile, msg + '\n');
    } catch (e) { }
}

writeFileSync(logFile, '');

log('Starting broad search for client payments...');

try {
    const filePath = join(__dirname, 'Gestão 2025_Neurobalance.xlsx');

    let XLSX;
    if (XLSX_DEFAULT && typeof XLSX_DEFAULT.readFile === 'function') {
        XLSX = XLSX_DEFAULT;
    } else if (XLSX_STAR && typeof XLSX_STAR.readFile === 'function') {
        XLSX = XLSX_STAR;
    } else {
        throw new Error('XLSX library not loaded correctly');
    }

    if (existsSync(filePath)) {
        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;

        const searchNIF = "293113335";
        const searchName = "joãopedro";
        let count = 0;

        sheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            data.forEach((row, rowIndex) => {
                if (!row) return;
                const rowString = JSON.stringify(row).toLowerCase();

                // Search by NIF or Name part
                if (rowString.includes(searchNIF) || rowString.includes(searchName)) {
                    count++;
                    log(`\n--- Match #${count} ---`);
                    log(`Sheet: ${name}`);
                    log(`Row: ${rowIndex + 1}`);
                    log(`Data: ${JSON.stringify(row)}`);

                    // Attempt to identify columns based on index (heuristic from previous read)
                    // Previous read: [null, Date(int), Name, NIF, Type, Desc, Base?, VAT?, Total?, ?, ?, TotalWithVAT?, Status, Method]
                    // It's approximate, but raw data is best for now.
                }
            });
        });

        if (count === 0) {
            log('\nNo matching records found.');
        } else {
            log(`\nTotal found: ${count}`);
        }

    } else {
        log(`File does NOT exist at path: ${filePath}`);
    }

} catch (e) {
    log(`Error occurred: ${e.message}\n${e.stack}`);
}
