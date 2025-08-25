const { Client } = require('pg');

async function testDirectConnection() {
  console.log("🔍 Testing direct connection with different approaches...\n");
  
  // 접근 1: SSL 모드 추가
  const client1 = new Client({
    connectionString: "postgresql://postgres:kjhkjs0807!@db.lezednoabgdwgczvkiza.supabase.co:5432/postgres?sslmode=require"
  });
  
  // 접근 2: 개별 파라미터 사용
  const client2 = new Client({
    host: 'db.lezednoabgdwgczvkiza.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'kjhkjs0807!',
    ssl: { rejectUnauthorized: false }
  });

  // 테스트 1
  try {
    console.log("Trying connection with SSL mode...");
    await client1.connect();
    console.log("✅ Direct connection with SSL successful!");
    const result = await client1.query('SELECT NOW()');
    console.log("Current time from DB:", result.rows[0].now);
    await client1.end();
    return true;
  } catch (err) {
    console.log("❌ SSL connection failed:", err.message);
  }
  
  // 테스트 2
  try {
    console.log("\nTrying connection with individual parameters...");
    await client2.connect();
    console.log("✅ Direct connection with params successful!");
    const result = await client2.query('SELECT NOW()');
    console.log("Current time from DB:", result.rows[0].now);
    await client2.end();
    return true;
  } catch (err) {
    console.log("❌ Params connection failed:", err.message);
  }
  
  return false;
}

testDirectConnection();