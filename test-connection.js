const { Client } = require('pg');

// Direct URL 테스트
const client = new Client({
  connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@db.lezednoabgdwgczvkiza.supabase.co:5432/postgres"
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Direct connection successful!");
    const result = await client.query('SELECT version()');
    console.log("Database version:", result.rows[0].version);
    await client.end();
  } catch (err) {
    console.log("❌ Direct connection failed:", err.message);
    
    // Pooled URL 테스트
    const poolClient = new Client({
      connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    });
    
    try {
      await poolClient.connect();
      console.log("✅ Pooled connection successful!");
      const result = await poolClient.query('SELECT version()');
      console.log("Database version:", result.rows[0].version);
      await poolClient.end();
    } catch (poolErr) {
      console.log("❌ Pooled connection also failed:", poolErr.message);
    }
  }
}

testConnection();
