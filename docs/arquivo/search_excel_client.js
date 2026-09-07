import { existsSync, appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as XLSX_STAR from 'xlsx';
import XLSX_DEFAULT from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFile = join(__dirname, 'search_output.txt');

function log(msg) {
    try {
        appendFileSync(logFile, msg + '\n');
    } catch (e) { }
}

writeFileSync(logFile, '');

log('Starting search for "JoãoPedro 73C"...');

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

        let found = false;
        const searchTerm = "JoãoPedro 73C".toLowerCase();

        sheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            data.forEach((row, rowIndex) => {
                const rowString = JSON.stringify(row).toLowerCase();
                if (rowString.includes(searchTerm)) {
                    found = true;
                    log(`\nFOUND in Sheet: "${name}", Row: ${rowIndex + 1}`);
                    log(`Data: ${JSON.stringify(row)}`);
                }
            });
        });

        if (!found) {
            log('\nClient "JoãoPedro 73C" not found in any sheet.');
        }

    } else {
        log(`File does NOT exist at path: ${filePath}`);
    }

} catch (e) {
    log(`Error occurred: ${e.message}\n${e.stack}`);
}
