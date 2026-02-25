const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://fruta:nuez1234567@158.179.210.240:5432/macedonia'
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query('SELECT current_database();');
    console.log('Current DB:', res.rows[0]);
    
    console.log('Checking columns in users table:');
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';`);
    console.log(cols.rows);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
