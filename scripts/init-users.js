// scripts/init-users.js
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import Usuario from '../models/usuario.model.js';
import Role from '../models/role.model.js';

const initUsers = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Verificar roles
    const roles = await Role.findAll();
    console.log('📋 Roles encontrados:');
    roles.forEach(r => console.log(`   ${r.id}: ${r.nombre}`));

    // Generar hashes REALES
    const salt = await bcrypt.genSalt(10);
    const hashAdmin = await bcrypt.hash('admin123', salt);
    const hashDocente = await bcrypt.hash('docente123', salt);

    console.log('\n🔑 HASHES GENERADOS:');
    console.log(`   admin123 → ${hashAdmin}`);
    console.log(`   docente123 → ${hashDocente}\n`);

    // Eliminar usuarios existentes
    await Usuario.destroy({ where: {} });
    console.log('✅ Usuarios anteriores eliminados');

    // Crear usuarios
    await Usuario.create({
      usuario: 'admin',
      password: hashAdmin,
      rol_id: 1,
      estado: true,
    });

    await Usuario.create({
      usuario: 'docente1',
      password: hashDocente,
      rol_id: 2,
      estado: true,
    });

    console.log('✅ Usuarios creados correctamente\n');

    // Verificar
    const usuarios = await Usuario.findAll({
      include: [{ model: Role, as: 'rol' }],
    });

    console.log('📊 USUARIOS EN BASE DE DATOS:');
    usuarios.forEach(u => {
      console.log(`   ${u.usuario} | ${u.rol.nombre} | ${u.password.substring(0, 25)}...`);
    });

    // Test de login automático
    console.log('\n🔐 PROBANDO LOGIN...');
    const testUser = await Usuario.findOne({ where: { usuario: 'admin' } });
    const isValid = await bcrypt.compare('admin123', testUser.password);
    console.log(`   ${isValid ? '✅ LOGIN EXITOSO' : '❌ LOGIN FALLIDO'}`);

    console.log('\n🎉 ¡Listo! Prueba en Postman:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   { "usuario": "admin", "password": "admin123" }');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

initUsers();