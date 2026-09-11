// scripts/generate-hash.js
import bcrypt from 'bcrypt';

const generateHash = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

const run = async () => {
  console.log('========================================');
  console.log('🔐 GENERANDO HASHES PARA BCRYPT');
  console.log('========================================\n');

  const hashAdmin = await generateHash('admin123');
  const hashDocente = await generateHash('docente123');

  console.log('📌 COPIA ESTOS HASHES:');
  console.log('\n--- PARA ADMIN ---');
  console.log(`"${hashAdmin}"`);
  console.log('\n--- PARA DOCENTE ---');
  console.log(`"${hashDocente}"`);
  console.log('\n========================================');
};

run();