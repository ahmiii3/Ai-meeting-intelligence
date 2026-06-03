const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    const result = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Existing tables:');
    result[0].forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (result[0].length === 0) {
      console.log('  (none)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
