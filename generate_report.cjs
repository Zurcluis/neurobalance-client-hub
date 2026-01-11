const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('Gestão 2025_Neurobalance.xlsx');
const allPayments = [];
const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function excelDateToJSDate(serial) {
    if (typeof serial !== 'number' || serial < 40000 || serial > 50000) return null;
    const d = new Date((serial - 25569) * 86400 * 1000);
    return d.toLocaleDateString('pt-PT');
}

months.forEach((month, idx) => {
    const ws = wb.Sheets[month];
    if (!ws) return;

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 12) continue;

        // Detect payment row: date is in column 1 (col0 is empty formatting)
        const dateCol = row[1];
        if (typeof dateCol !== 'number' || dateCol < 40000 || dateCol > 50000) continue;

        const cliente = String(row[2] || '').trim();
        if (!cliente || cliente.toLowerCase().includes('total') || cliente.toLowerCase() === 'cliente') continue;

        const dataStr = excelDateToJSDate(dateCol) || '';

        allPayments.push({
            mes: monthNames[idx],
            data: dataStr,
            cliente: cliente,
            nif: String(row[3] || '').trim(),
            tipologia: String(row[4] || '').trim(),
            descricao: String(row[5] || '').trim(),
            fatura: String(row[6] || '').trim(),
            prestacao: row[7] || '',
            base: typeof row[8] === 'number' ? row[8] : 0,
            iva: typeof row[9] === 'number' ? row[9] : 0,
            retencao: typeof row[10] === 'number' ? row[10] : 0,
            total: typeof row[11] === 'number' ? row[11] : 0,
            estado: String(row[12] || '').trim(),
            metodo: String(row[13] || '').trim()
        });
    }
});

console.log('Total payments found:', allPayments.length);

// Group by client
const byClient = {};
allPayments.forEach(p => {
    if (!byClient[p.cliente]) {
        byClient[p.cliente] = { nif: p.nif, payments: [] };
    }
    byClient[p.cliente].payments.push(p);
});

console.log('Unique clients:', Object.keys(byClient).length);

// Generate markdown report
let md = `# Relatório de Pagamentos - Neurobalance 2025

> Documento gerado automaticamente a partir do ficheiro Excel de gestão.

---

## Resumo Geral

| Métrica | Valor |
|---------|-------|
| Total de Clientes | ${Object.keys(byClient).length} |
| Total de Pagamentos | ${allPayments.length} |
| Valor Total Faturado | €${allPayments.reduce((s, p) => s + (p.total || 0), 0).toFixed(2).replace('.', ',')} |

---

## Clientes e Pagamentos

`;

Object.keys(byClient).sort().forEach(cliente => {
    const info = byClient[cliente];
    const totalCliente = info.payments.reduce((s, p) => s + (p.total || 0), 0);
    const numPagamentos = info.payments.length;

    md += `### ${cliente}

**NIF:** ${info.nif || 'N/A'} | **Total Pagamentos:** ${numPagamentos} | **Valor Total:** €${totalCliente.toFixed(2).replace('.', ',')}

| Data | Descrição | Fatura | Base | IVA | Total | Estado | Método |
|------|-----------|--------|------|-----|-------|--------|--------|
`;

    info.payments.forEach(p => {
        md += `| ${p.data} | ${p.descricao} | ${p.fatura} | €${(p.base || 0).toFixed(2)} | €${(p.iva || 0).toFixed(2)} | €${(p.total || 0).toFixed(2)} | ${p.estado} | ${p.metodo} |\n`;
    });

    md += `\n---\n\n`;
});

fs.writeFileSync('relatorio_pagamentos.md', md);
console.log('Report saved to relatorio_pagamentos.md');
