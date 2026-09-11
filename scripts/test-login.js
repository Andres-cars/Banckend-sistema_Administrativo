// scripts/test-login.js
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import Usuario from '../models/usuario.model.js';
import Role from '../models/role.model.js';

const testLogin = async () => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos\n');

    // Buscar usuario admin
    const user = await Usuario.findOne({
      where: { usuario: 'admin' },
      include: [{ model: Role, as: 'rol' }]
    });

    if (!user) {
      console.log('❌ Usuario "admin" NO encontrado');
      console.log('🔍 Ejecuta: SELECT * FROM usuarios;');
      return;
    }

    console.log('📋 DATOS DEL USUARIO ENCONTRADO:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Usuario: ${user.usuario}`);
    console.log(`   Rol: ${user.rol?.nombre || 'Sin rol'}`);
    console.log(`   Hash completo: ${user.password}`);
    console.log(`   Longitud del hash: ${user.password.length} caracteres\n`);

    // === PRUEBA 1: Comparar con bcrypt ===
    const password = 'admin123';
    const isValid = await bcrypt.compare(password, user.password);

    console.log(`🔐 PRUEBA 1 - bcrypt.compare()`);
    console.log(`   Contraseña probada: "${password}"`);
    console.log(`   ${isValid ? '✅ CONTRASEÑA CORRECTA' : '❌ CONTRASEÑA INCORRECTA'}\n`);

    // === PRUEBA 2: Generar un hash nuevo y comparar ===
    if (!isValid) {
      console.log('🔧 PRUEBA 2 - Generar hash nuevo para comparar:');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      console.log(`   Nuevo hash generado: ${newHash}`);
      console.log(`   ¿Coincide con el de la BD?`);
      console.log(`   BD:  ${user.password}`);
      console.log(`   New: ${newHash}`);
      console.log(`   ⚠️ Si son diferentes, el hash de la BD NO es válido\n`);
    }

    // === PRUEBA 3: Insertar un usuario nuevo con hash generado en Node.js ===
    console.log('🔧 PRUEBA 3 - Crear usuario de prueba con hash nuevo:');
    const salt = await bcrypt.genSalt(10);
    const testHash = await bcrypt.hash('test123', salt);
    console.log(`   Hash para "test123": ${testHash}`);

    // Verificar si el hash es válido
    const isValidTest = await bcrypt.compare('test123', testHash);
    console.log(`   ¿El hash generado funciona? ${isValidTest ? '✅ SÍ' : '❌ NO'}\n`);

    console.log('========================================');
    console.log('💡 RECOMENDACIÓN:');
    console.log('   Ejecuta el script init-users.js para crear usuarios con hashes válidos');
    console.log('   node scripts/init-users.js');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testLogin();