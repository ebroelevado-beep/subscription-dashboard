const { Client } = require("pg");

const SOURCE_URL = process.env.SOURCE_URL || "postgresql://user:pass@host:port/dbname";
const TARGET_URL = process.env.TARGET_URL || "postgresql://user:pass@host:port/dbname";

const TABLES = [
  "users",
  "verification_tokens",
  "accounts",
  "sessions",
  "platforms",
  "plans",
  "subscriptions",
  "clients",
  "client_subscriptions",
  "renewal_logs",
  "platform_renewals"
];

async function migrate() {
  console.log("🚀 Starting manual migration (JS)...");
  
  const sourceClient = new Client({ connectionString: SOURCE_URL });
  const targetClient = new Client({ connectionString: TARGET_URL });

  try {
    await sourceClient.connect();
    console.log("✅ Connected to Source (Railway)");
    
    await targetClient.connect();
    console.log("✅ Connected to Target (Dokploy/Local)");

    // 1. Disable triggers to handle foreign keys easily
    console.log("⏳ Disabling triggers on target...");
    await targetClient.query("SET session_replication_role = 'replica';");

    // 2. Clear target tables (except migrations)
    console.log("🧹 Cleaning target tables...");
    for (const table of [...TABLES].reverse()) {
      await targetClient.query(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    // 3. Migrate data
    for (const table of TABLES) {
      console.log(`📦 Migrating table: ${table}...`);
      const { rows } = await sourceClient.query(`SELECT * FROM "${table}"`);
      
      if (rows.length === 0) {
        console.log(`   (Skipping ${table}, no data)`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const columnNames = columns.map(c => `"${c}"`).join(", ");
      
      for (const row of rows) {
        const values = columns.map(c => row[c]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        
        await targetClient.query(
          `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`,
          values
        );
      }
      console.log(`   ✅ Migrated ${rows.length} rows to ${table}`);
    }

    // 4. Re-enable triggers
    console.log("⏳ Re-enabling triggers on target...");
    await targetClient.query("SET session_replication_role = 'origin';");

    console.log("\n✨ Migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);
    
    // Attempt to re-enable triggers on failure
    try {
      await targetClient.query("SET session_replication_role = 'origin';");
    } catch (e) {}

  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

migrate();
