const { Database } = require('./dist/database/Database');

async function checkEvents() {
  try {
    await Database.initialize();
    const db = Database.getInstance();
    const events = await db.all('SELECT * FROM match_events WHERE match_id = ?', ['6d659906-6e4e-42d9-9f36-3bbfe02fd8f2']);
    console.log('Events saved:', events.length);
    console.log('Events:', JSON.stringify(events, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEvents();
