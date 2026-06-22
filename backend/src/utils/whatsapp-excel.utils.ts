import * as XLSX from 'xlsx';
import { normalizePhone } from '../services/whatsapp.service';

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
  'contacto',
];

const NAME_HEADERS = ['nombre', 'name', 'contacto', 'cliente', 'empresa'];

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
    return String(value).replace(/\.0+$/, '').replace(/e\+?/i, '');
  }
  return String(value).trim();
}

function cellLooksLikePhone(value: unknown): boolean {
  const digits = cellToText(value).replace(/\D/g, '');
  return digits.length >= 9;
}

function extractPhoneFromRow(row: Record<string, unknown>, phoneKey?: string, nameKey?: string): { phone: string; name?: string } | null {
  let phoneRaw: unknown;
  let nameRaw: unknown;

  if (phoneKey && row[phoneKey] != null && String(row[phoneKey]).trim()) {
    phoneRaw = row[phoneKey];
    if (nameKey && row[nameKey] != null) nameRaw = row[nameKey];
  } else {
    const keys = Object.keys(row);
    for (const key of keys) {
      const h = normHeader(key);
      if (PHONE_HEADERS.some((p) => h.includes(p))) {
        phoneRaw = row[key];
        break;
      }
    }
    if (phoneRaw == null) {
      for (const key of keys) {
        if (cellLooksLikePhone(row[key])) {
          phoneRaw = row[key];
          const other = keys.find((k) => k !== key && row[k] != null && String(row[k]).trim() && !cellLooksLikePhone(row[k]));
          if (other) nameRaw = row[other];
          break;
        }
      }
    } else if (!nameKey) {
      for (const key of keys) {
        const h = normHeader(key);
        if (NAME_HEADERS.some((n) => h.includes(n)) && row[key] != null && !cellLooksLikePhone(row[key])) {
          nameRaw = row[key];
          break;
        }
      }
    }
  }

  const normalized = normalizePhone(cellToText(phoneRaw));
  if (!normalized) return null;
  const name = nameRaw != null ? String(nameRaw).trim().slice(0, 120) : undefined;
  return { phone: normalized, name: name || undefined };
}

/** Parsea Excel (.xlsx / .xls) o CSV y devuelve teléfonos únicos */
export function parseContactsFromSpreadsheet(buffer: Buffer): { phone: string; name?: string }[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
  if (rows.length === 0) {
    const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '', raw: false });
    const results: { phone: string; name?: string }[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      if (!Array.isArray(row)) continue;
      const cells = row.map((c) => cellToText(c)).filter(Boolean);
      if (cells.length === 0) continue;
      // Saltar fila de cabecera si no parece teléfono
      if (i === 0 && cells.every((c) => !cellLooksLikePhone(c))) continue;
      const phoneCell = cells.find((c) => cellLooksLikePhone(c)) || cells[cells.length - 1];
      const nameCell = cells.length > 1 && !cellLooksLikePhone(cells[0]) ? cells[0] : undefined;
      const normalized = normalizePhone(phoneCell);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        results.push({ phone: normalized, name: nameCell });
      }
    }
    return results;
  }

  const headers = Object.keys(rows[0] || {});
  const phoneKey = headers.find((h) => PHONE_HEADERS.some((p) => normHeader(h).includes(p)));
  const nameKey = headers.find((h) => NAME_HEADERS.some((n) => normHeader(h).includes(n)));

  const results: { phone: string; name?: string }[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const item = extractPhoneFromRow(row, phoneKey, nameKey);
    if (item && !seen.has(item.phone)) {
      seen.add(item.phone);
      results.push(item);
    }
  }
  return results;
}
