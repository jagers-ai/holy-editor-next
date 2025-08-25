const { Client } = require('pg');

async function testFinalConnection() {
  console.log("🚀 Testing with correct region (ap-northeast-2) and server (aws-1)...\n");
  
  // Transaction Pooler (DATABASE_URL)
  const transactionClient = new Client({
    connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });
  
  // Session Pooler (DIRECT_URL)
  const sessionClient = new Client({
    connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
  });

  // Transaction Pooler 테스트
  try {
    console.log("📊 Testing Transaction Pooler (port 6543)...");
    await transactionClient.connect();
    console.log("✅ Transaction Pooler connection successful!");
    const result = await transactionClient.query('SELECT NOW()');
    console.log("Current time:", result.rows[0].now);
    await transactionClient.end();
  } catch (err) {
    console.log("❌ Transaction Pooler failed:", err.message);
  }
  
  // Session Pooler 테스트
  try {
    console.log("\n📊 Testing Session Pooler (port 5432)...");
    await sessionClient.connect();
    console.log("✅ Session Pooler connection successful!");
    const result = await sessionClient.query('SELECT version()');
    console.log("PostgreSQL version:", result.rows[0].version);
    await sessionClient.end();
  } catch (err) {
    console.log("❌ Session Pooler failed:", err.message);
  }
}

testFinalConnection();