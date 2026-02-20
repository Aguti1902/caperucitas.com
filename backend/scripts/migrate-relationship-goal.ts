import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRelationshipGoal() {
  console.log('🔄 Iniciando migración de relationshipGoal...');
  
  try {
    // Actualizar todos los perfiles que tienen 'solo_sexo' a 'encuentros_casuales'
    const result = await prisma.profile.updateMany({
      where: {
        relationshipGoal: 'solo_sexo'
      },
      data: {
        relationshipGoal: 'encuentros_casuales'
      }
    });

    console.log(`✅ Migración completada: ${result.count} perfiles actualizados de "solo_sexo" a "encuentros_casuales"`);
    
    // Verificar que no queden perfiles con 'solo_sexo'
    const remaining = await prisma.profile.count({
      where: {
        relationshipGoal: 'solo_sexo'
      }
    });
    
    if (remaining > 0) {
      console.warn(`⚠️ Advertencia: Todavía quedan ${remaining} perfiles con "solo_sexo"`);
    } else {
      console.log('✅ Verificación completada: No quedan perfiles con "solo_sexo"');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateRelationshipGoal()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
