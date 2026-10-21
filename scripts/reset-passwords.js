// scripts/reset-passwords.js
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import Usuario from '../models/usuario.model.js';

const resetPasswords = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL\n');

    // ⚠️ Define los usuarios y sus contraseñas
    const usuarios = [
      { usuario: 'alejandro@gmail.com', password: 'ale123' },
      { usuario: 'mor.mero', password: 'docente123' },
      // Agrega más usuarios aquí
    ];

    for (const u of usuarios) {
      const user = await Usuario.findOne({ where: { usuario: u.usuario } });
      
      if (!user) {
        console.log(`⚠️ Usuario "${u.usuario}" no encontrado`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.password, salt);

      // Actualizar directamente sin el hook
      await user.update({ password: hash }, { hooks: false });

      console.log(`✅ ${u.usuario} → contraseña reseteada a "${u.password}"`);
    }

    console.log('\n🎉 ¡Contraseñas reseteadas!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetPasswords();