import * as XLSX from 'xlsx';
import { normalizePhone } from '../utils/phone.utils';

const PHONE_HEADERS = [
  'telefono',
  'teléfono',
  'tel',
  'phone',
  'movil',
  'móvil',
  'whatsapp',
  'numero',
  'número',
  'mobile',
  'celular',
];

const NAME_HEADERS = ['nombre', 'name', 'cliente', 'empresa'];

function normHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function cellToText(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value)) return String(Math.trunc(value));
    return String(value).replace(/\.0+$/, '');
  }
  return String(value).trim();
}

function cellLooksLikePhone(value: unknown): boolean {
  const digits = cellToText(value).replace(/\D/g, '');
  return digits.length >= 9;
}

function isHeaderRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  if (cells.some(cellLooksLikePhone)) return false;
  return cells.some((c) => {
    const h = normHeader(c);
    return PHONE_HEADERS.some((p) => h.includes(p)) || NAME_HEADERS.some((n) => h.includes(n));
  });
}

function isJunkName(value: string): boolean {
  const v = value.toLowerCase();
  return v.includes('mycontacts') || v.includes('importado el') || v.startsWith('*');
}

function parseDataRow(cells: string[]): { phone: string; name?: string } | null {
  if (cells.length === 0) return null;

  // Export Google Contacts: teléfono en columna A
  if (cellLooksLikePhone(cells[0])) {
    const phone = normalizePhone(cells[0]);
    return phone ? { phone } : null;
  }

  // Una sola columna
  if (cells.length === 1) {
    const phone = normalizePhone(cells[0]);
    return phone ? { phone } : null;
  }

  const phoneCell = cells.find(cellLooksLikePhone) || cells[cells.length - 1];
  const phone = normalizePhone(phoneCell);
  if (!phone) return null;

  const nameCell = cells.find((c) => c !== phoneCell && !cellLooksLikePhone(c) && !isJunkName(c));
  return { phone, name: nameCell?.slice(0, 120) };
}

/** Parsea Excel (.xlsx / .xls) o CSV — admite una columna solo con teléfonos */
export function parseContactsFromSpreadsheet(buffer: Buffer): { phone: string; name?: string }[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '', raw: false });

  const results: { phone: string; name?: string }[] = [];
  const seen = new Set<string>();
  let startIndex = 0;

  if (matrix.length > 0 && Array.isArray(matrix[0])) {
    const firstCells = matrix[0].map(cellToText).filter(Boolean);
    if (isHeaderRow(firstCells)) startIndex = 1;
  }

  for (let i = startIndex; i < matrix.length; i++) {
    const row = matrix[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map(cellToText).filter(Boolean);
    if (cells.length === 0) continue;

    const item = parseDataRow(cells);
    if (item && !seen.has(item.phone)) {
      seen.add(item.phone);
      results.push(item);
    }
  }

  return results;
}
