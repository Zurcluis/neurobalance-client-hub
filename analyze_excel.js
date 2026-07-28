import { existsSync, appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as XLSX_STAR from 'xlsx';
import XLSX_DEFAULT from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFile = join(__dirname, 'analysis_output.txt');

function log(msg) {
    try {
        appendFileSync(logFile, msg + '\n');
    } catch (e) { }
}

writeFileSync(logFile, '');

log('Starting script (attempt 4)...');

try {
    const filePath = join(__dirname, 'Gestão 2025_Neurobalance.xlsx');

    // Determine which object has readFile
    let XLSX;
    if (XLSX_DEFAULT && typeof XLSX_DEFAULT.readFile === 'function') {
        log('Using default import');
        XLSX = XLSX_DEFAULT;
    } else if (XLSX_STAR && typeof XLSX_STAR.readFile === 'function') {
        log('Using star import');
        XLSX = XLSX_STAR;
    } else {
        log('Could not find readFile in imports.');
        log('XLSX_DEFAULT keys: ' + Object.keys(XLSX_DEFAULT || {}));
        log('XLSX_STAR keys: ' + Object.keys(XLSX_STAR || {}));
        throw new Error('XLSX library not loaded correctly');
    }

    if (existsSync(filePath)) {
        log('File exists.');
        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        log(`Sheet names: ${JSON.stringify(sheetNames)}`);

        sheetNames.forEach(name => {
            log(`\n--- Sheet: ${name} ---`);
            const sheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            log(JSON.stringify(data.slice(0, 30), null, 2));
        });

    } else {
        log(`File does NOT exist at path: ${filePath}`);
    }

} catch (e) {
    log(`Error occurred: ${e.message}\n${e.stack}`);
}
