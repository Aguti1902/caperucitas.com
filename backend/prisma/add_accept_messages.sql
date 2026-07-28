-- Añadir contacto por mensaje interno (bandeja)
-- Ejecutar en Supabase SQL Editor o: npx prisma db push

ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "acceptMessages" BOOLEAN NOT NULL DEFAULT false;
