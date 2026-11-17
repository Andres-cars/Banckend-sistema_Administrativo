// scripts/test-create-user.js
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import Usuario from '../models/usuario.model.js';
import Docente from '../models/docente.model.js';
import Role from '../models/role.model.js';

const testCreateUser = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Verificar el docente
    const docente = await Docente.findOne({ 
      where: { identificacion: '1314151623' } 
    });

    if (!docente) {
      console.log('❌ Docente no encontrado');
      console.log('   Primero crea el docente en Postman');
      return;
    }

    console.log('📋 Docente encontrado:');
    console.log(`   ID: ${docente.id}`);
    console.log(`   Nombre: ${docente.nombres} ${docente.apellidos}\n`);

    // 2. Verificar el rol DOCENTE
    const roleDocente = await Role.findOne({ where: { nombre: 'DOCENTE' } });
    
    if (!roleDocente) {
      console.log('❌ Rol DOCENTE no encontrado');
      console.log('   Ejecuta: SELECT * FROM roles;');
      return;
    }

    console.log(`📋 Rol DOCENTE: ID ${roleDocente.id}\n`);

    // 3. Generar hash para "tati123"
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('tati123', salt);
    console.log(`🔑 Hash generado para "tati123":`);
    console.log(`   ${hash}\n`);

    // 4. Crear el usuario
    const [usuario, created] = await Usuario.findOrCreate({
      where: { usuario: 'tati@gmail.com' },
      defaults: {
        password: hash,
        rol_id: roleDocente.id,
        docente_id: docente.id,
        estado: true,
      },
    });

    if (created) {
      console.log('✅ Usuario creado correctamente:');
    } else {
      console.log('⚠️ El usuario ya existía, actualizando contraseña:');
      await usuario.update({ password: hash });
    }

    console.log(`   Usuario: ${usuario.usuario}`);
    console.log(`   Contraseña: tati123`);
    console.log(`   Rol: DOCENTE (ID ${roleDocente.id})`);
    console.log(`   Docente: ${docente.nombres} ${docente.apellidos}\n`);

    console.log('🎉 ¡Ahora prueba el login en Postman!');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   { "usuario": "tati@gmail.com", "password": "tati123" }');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testCreateUser();