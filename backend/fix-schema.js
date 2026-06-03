/**
 * Quick fix script to drop all problematic tables and let Sequelize recreate them
 * Run this once: node fix-schema.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');

async function fixSchema() {
  try {
    console.log('🔧 Starting schema fix...');

    // Drop all Phase 5 + dependent tables (in correct order)
    const tables = [
      'EmailLogs',
      'MeetingSummaries',
      'Tasks',
      'Transcripts',
      'Meetings',  // Must drop after Tasks & Transcripts (foreign keys)
      'Workspaces',
      'Users'
    ];

    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (err) {
        console.log(`⚠️ Could not drop ${table}: ${err.message}`);
      }
    }

    console.log('✅ All tables dropped. Now run: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSchema();
