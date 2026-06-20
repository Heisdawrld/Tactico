import { db } from '../src/index';

async function main() {
  console.log('🚀 Initializing database schema...');
  try {
    await db.initializeDatabase();
    console.log('✅ Database schema initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

main();
