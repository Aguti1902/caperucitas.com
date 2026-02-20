# 🚨 SOLUCIÓN URGENTE: Error P2025 en Railway

## Problema
Railway está fallando con el error:
```
PrismaClientKnownRequestError: Record to update not found
code: 'P2025'
```

Esto ocurre porque cambiamos `solo_sexo` a `encuentros_casuales` en el frontend, pero los perfiles existentes en la base de datos todavía tienen el valor antiguo.

## Solución: Ejecutar Migración de Datos

### Opción 1: Desde tu computadora (RECOMENDADO)

1. **Asegúrate de tener la variable DATABASE_URL de Railway**
   - Ve a tu proyecto en Railway
   - Copia la DATABASE_URL de PostgreSQL

2. **Ejecuta el script de migración localmente contra la BD de Railway:**
   ```bash
   cd "/Users/guti/Desktop/CURSOR WEBS/9CITAS/backend"
   DATABASE_URL="tu-url-de-railway-postgres" npm run migrate:relationship-goal
   ```

### Opción 2: Ejecutar directamente en Railway

1. **Ir a tu proyecto en Railway**
2. **Abrir la terminal/shell del servicio backend**
3. **Ejecutar:**
   ```bash
   npm run migrate:relationship-goal
   ```

### Opción 3: Ejecutar SQL directo en Railway

Si las opciones anteriores no funcionan, puedes ejecutar directamente el SQL:

1. **Conectarse a la base de datos de Railway** (desde la UI de Railway o desde tu terminal)
2. **Ejecutar este SQL:**
   ```sql
   UPDATE "Profile" 
   SET "relationshipGoal" = 'encuentros_casuales' 
   WHERE "relationshipGoal" = 'solo_sexo';
   ```

3. **Verificar que se actualizó:**
   ```sql
   SELECT COUNT(*) FROM "Profile" WHERE "relationshipGoal" = 'solo_sexo';
   ```
   Debe devolver 0.

## Después de la migración

1. **Reinicia el servicio backend en Railway**
2. **Verifica que la app funcione correctamente**
3. **El error P2025 debería desaparecer**

## Commit y Deploy

Los archivos del script de migración ya están en el repositorio. Solo necesitas:

```bash
git add .
git commit -m "Añadir script de migración para relationshipGoal"
git push
```

Railway se desplegará automáticamente con los nuevos cambios.

---

## ⚠️ IMPORTANTE
Esta migración es **segura** y **no destructiva**. Solo actualiza el valor de `solo_sexo` a `encuentros_casuales` en perfiles existentes.
