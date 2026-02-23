const { Client } = require("pg");
const fs = require("fs");

const SOURCE_URL = process.env.SOURCE_URL || "postgresql://postgres:PASSWORD@proxy.rlwy.net:PORT/railway";

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

async function dump() {
  console.log("📦 Dumping data from Railway...");
  const client = new Client({ connectionString: SOURCE_URL });
  let sql = "-- Manual Migration Dump from Railway\n";
  sql += "SET session_replication_role = 'replica';\n\n";

  try {
    await client.connect();
    
    for (const table of TABLES) {
      console.log(`读取 ${table}...`);
      const { rows } = await client.query(`SELECT * FROM "${table}"`);
      
      if (rows.length === 0) continue;

      sql += `-- Table: ${table}\n`;
      sql += `TRUNCATE TABLE "${table}" CASCADE;\n`;

      const columns = Object.keys(rows[0]);
      const columnNames = columns.map(c => `"${c}"`).join(", ");

      for (const row of rows) {
        const values = columns.map(c => {
          const val = row[c];
          if (val === null) return "NULL";
          if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return val;
        });
        sql += `INSERT INTO "${table}" (${columnNames}) VALUES (${values.join(", ")});\n`;
      }
      sql += "\n";
    }

    sql += "SET session_replication_role = 'origin';\n";
    fs.writeFileSync("railway_data_dump.sql", sql);
    console.log("✨ Dump complete! Created railway_data_dump.sql");

  } catch (error) {
    console.error("❌ Dump failed:", error.message);
  } finally {
    await client.end();
  }
}

dump();
