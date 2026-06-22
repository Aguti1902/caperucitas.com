#!/bin/bash
# Configuración WhatsApp / Evolution API para Caperucitas
set -e

cd "$(dirname "$0")/.."
API_KEY=$(openssl rand -hex 32)
INSTANCE_NAME="${EVOLUTION_INSTANCE_NAME:-caperucitas}"

echo ""
echo "=========================================="
echo "  Setup WhatsApp - Caperucitas.com"
echo "=========================================="
echo ""

echo "1) Tablas BD..."
npx prisma db push --skip-generate 2>/dev/null || npx prisma db push
echo "   ✓ Tablas WhatsApp listas"
echo ""

echo "2) Clave API generada (úsala en Evolution Y en Railway backend):"
echo ""
echo "   EVOLUTION_API_KEY=$API_KEY"
echo "   AUTHENTICATION_API_KEY=$API_KEY  (servicio Evolution)"
echo ""

echo "3) Variables para Railway → servicio BACKEND (caperucitas):"
echo ""
echo "   EVOLUTION_API_URL=https://TU-EVOLUTION.up.railway.app"
echo "   EVOLUTION_API_KEY=$API_KEY"
echo "   EVOLUTION_INSTANCE_NAME=$INSTANCE_NAME"
echo ""

echo "4) Despliega Evolution API:"
echo "   - Railway → New Service → GitHub repo → Root: evolution-api"
echo "   - Variables del archivo evolution-api/.env.example"
echo "   - SERVER_URL = URL pública del servicio Evolution"
echo ""

echo "5) Conecta WhatsApp desde el panel:"
echo "   https://www.caperucitas.com/admin/whatsapp"
echo "   → Asistente de conexión → Escanear QR"
echo ""
