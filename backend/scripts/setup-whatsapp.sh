#!/bin/bash
# Setup WhatsApp integrado (Supabase + Baileys) — Caperucitas
set -e
cd "$(dirname "$0")/.."

echo ""
echo "=========================================="
echo "  WhatsApp integrado — Caperucitas.com"
echo "=========================================="
echo ""

echo "1) Tablas en Supabase..."
npx prisma db push --skip-generate 2>/dev/null || npx prisma db push
echo "   ✓ whatsapp_contacts, whatsapp_campaigns, whatsapp_sessions"
echo ""

echo "2) Variables opcionales en Railway (backend):"
echo ""
echo "   WHATSAPP_PROVIDER=builtin"
echo "   WHATSAPP_INSTANCE_NAME=caperucitas"
echo ""
echo "   (No necesitas Evolution API ni AUTHENTICATION_API_KEY)"
echo ""

echo "3) Conecta WhatsApp:"
echo "   https://www.caperucitas.com/admin/whatsapp"
echo "   → Crear instancia y mostrar QR → escanear con tu móvil"
echo ""
