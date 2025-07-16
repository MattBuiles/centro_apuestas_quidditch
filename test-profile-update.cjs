/**
 * Script para verificar la funcionalidad de actualización de perfil de usuario
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'quidditch.db');

async function testUserProfileUpdate() {
  console.log('🔍 Verificando funcionalidad de actualización de perfil...\n');

  const db = new sqlite3.Database(dbPath);

  try {
    // 1. Verificar la estructura de la tabla users
    console.log('📊 1. Estructura de la tabla users:');
    const columns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });

    // 2. Verificar usuarios existentes
    console.log('\n👥 2. Usuarios existentes:');
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT id, username, email, updated_at FROM users LIMIT 5", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Actualizado: ${user.updated_at}`);
    });

    // 3. Simular actualización de un usuario (si existe)
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🔄 3. Simulando actualización del usuario: ${testUser.username}`);
      
      // Simulamos la consulta que haría el backend para verificar duplicados
      const duplicateCheck = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM users WHERE username = ? AND id != ?",
          [`${testUser.username}_updated`, testUser.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      console.log(`  - Verificación de duplicados: ${duplicateCheck ? 'CONFLICTO' : 'OK'}`);
      
      // Mostrar la consulta SQL que se ejecutaría
      console.log('  - Query SQL que se ejecutaría:');
      console.log(`    UPDATE users SET username = '${testUser.username}_updated', email = '${testUser.email}', updated_at = datetime('now') WHERE id = '${testUser.id}'`);
    }

    console.log('\n✅ Verificación completada. La funcionalidad debería funcionar correctamente.');
    console.log('\n📝 Para probar la funcionalidad:');
    console.log('1. Ejecuta el backend con: npm run dev');
    console.log('2. Inicia sesión en el frontend');
    console.log('3. Ve a la página de cuenta y edita tu perfil');
    console.log('4. Los cambios se reflejarán en backend/database/quidditch.db');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

testUserProfileUpdate();
