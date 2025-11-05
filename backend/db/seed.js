import { initDB, getDB } from './db.js';

async function seed() {
  await initDB();
  const db = getDB();

  const existingKB = await db.get('SELECT COUNT(*) as count FROM knowledge_base');

  if (existingKB.count === 0) {
    console.log('Seeding knowledge base with sample data...');

    await db.run(
      `INSERT INTO knowledge_base (question_pattern, answer_text)
       VALUES (?, ?)`,
      ['business hours', 'We are open Monday-Friday 9am-5pm EST']
    );

    await db.run(
      `INSERT INTO knowledge_base (question_pattern, answer_text)
       VALUES (?, ?)`,
      ['contact', 'You can reach us at support@example.com or call 1-800-555-0100']
    );

    console.log('Knowledge base seeded!');
  } else {
    console.log('Knowledge base already has data, skipping seed');
  }

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
