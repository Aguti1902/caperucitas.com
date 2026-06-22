/**
 * Importa masivamente Excels de contactos WhatsApp a la BD.
 * Uso: npx tsx scripts/import-whatsapp-excels.ts /ruta/archivo1.xlsx /ruta/archivo2.xlsx ...
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { buildDatabaseUrl } from '../src/lib/databaseUrl';
import { parseContactsFromSpreadsheet } from '../src/utils/whatsapp-excel.utils';
import { upsertWhatsAppContactsBatch } from '../src/utils/whatsapp-contacts.utils';
import prisma from '../src/lib/prisma';

dotenv.config({ path: path.join(__dirname, '../.env') });
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = buildDatabaseUrl(process.env.DATABASE_URL);
}

const DEFAULT_FILES = [
  '/Users/guti/Downloads/vizcaya-647-google.xlsx',
  '/Users/guti/Downloads/sevilla-376-google.xlsx',
  '/Users/guti/Downloads/resto-sevilla-355-google.xlsx',
  '/Users/guti/Downloads/murcia-google-595.xlsx',
  '/Users/guti/Downloads/malaga+a+yo+ili-1038.xlsx',
  '/Users/guti/Downloads/girona-google-808.xlsx',
  '/Users/guti/Downloads/cadiz-530-google.xlsx',
  '/Users/guti/Downloads/alicante-google-1358.xlsx',
  '/Users/guti/Downloads/1232+a-madrid1232-google.xlsx',
  '/Users/guti/Downloads/1049+b-madrid-google.xlsx',
  '/Users/guti/Downloads/1027+m&m-barcelona-google.xlsx',
  '/Users/guti/Downloads/1013+a-barcelona-google.xlsx',
  '/Users/guti/Downloads/675-valencia-google.xlsx',
  '/Users/guti/Downloads/625-valencia-google.xlsx',
  '/Users/guti/Downloads/401-sevilla-gogle.xlsx',
];

async function main() {
  const files = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_FILES;
  const all = new Map<string, { phone: string; name?: string; source: string }>();

  console.log(`📂 Procesando ${files.length} archivos...\n`);

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  No encontrado: ${filePath}`);
      continue;
    }
    const buffer = fs.readFileSync(filePath);
    const parsed = parseContactsFromSpreadsheet(buffer);
    const label = path.basename(filePath, path.extname(filePath));
    const source = `excel:${label}`;
    let added = 0;
    for (const item of parsed) {
      if (!all.has(item.phone)) {
        all.set(item.phone, { ...item, source });
        added++;
      }
    }
    console.log(`✅ ${path.basename(filePath)} → ${parsed.length} filas, ${added} nuevos únicos (total acumulado: ${all.size})`);
  }

  const contacts = [...all.values()];
  console.log(`\n📱 Importando ${contacts.length} teléfonos únicos a la BD...`);

  const before = await prisma.whatsAppContact.count();
  const result = await upsertWhatsAppContactsBatch(contacts, 'excel-google-bulk', { skipUpdates: true });
  const after = await prisma.whatsAppContact.count();

  console.log('\n🎉 Importación completada');
  console.log(`   Nuevos:    ${result.imported}`);
  console.log(`   Ya existían (omitidos): ${result.skipped ?? 0}`);
  console.log(`   Total procesados: ${result.total}`);
  console.log(`   Contactos en BD: ${before} → ${after}`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
