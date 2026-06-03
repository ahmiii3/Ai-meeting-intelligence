const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');

// Import all models
const models = {
  User: require('./models/User'),
  Workspace: require('./models/Workspace'),
  Meeting: require('./models/Meeting'),
  Transcript: require('./models/Transcript'),
  Task: require('./models/Task'),
  MeetingSummary: require('./models/MeetingSummary'),
  EmailLog: require('./models/EmailLog')
};

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database schema...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Sync models
    await sequelize.sync({ force: false, logging: false });
    console.log('✅ All models synced\n');

    // Check each table
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `, { raw: true });

    console.log('📊 Tables in database:');
    tables[0].forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });

    // Check key tables for data
    console.log('\n📈 Table record counts:');

    const Meeting = require('./models/Meeting');
    const Transcript = require('./models/Transcript');
    const Task = require('./models/Task');
    const MeetingSummary = require('./models/MeetingSummary');

    const meetingCount = await Meeting.count();
    const transcriptCount = await Transcript.count();
    const taskCount = await Task.count();
    const summaryCount = await MeetingSummary.count();

    console.log(`   meetings: ${meetingCount}`);
    console.log(`   transcripts: ${transcriptCount}`);
    console.log(`   tasks: ${taskCount}`);
    console.log(`   meeting_summaries: ${summaryCount}`);

    // Check MeetingSummary table structure
    console.log('\n🔧 MeetingSummary table columns:');
    const summaryColumns = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'meeting_summaries'
      ORDER BY ordinal_position;
    `, { raw: true });

    summaryColumns[0].forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    // Check Task table structure
    console.log('\n🔧 Task table columns:');
    const taskColumns = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `, { raw: true });

    taskColumns[0].forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ Database verification complete!\n');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

verifyDatabase();
