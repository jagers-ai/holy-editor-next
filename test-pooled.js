const { Client } = require('pg');

async function testPooledConnections() {
  console.log("🔍 Testing different pooled connection formats...\n");
  
  // 형식 1: postgres.project-ref
  const format1 = new Client({
    connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });
  
  // 형식 2: postgres만 사용
  const format2 = new Client({
    connectionString: "postgresql://postgres:kjhkjs0807!@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });
  
  // 형식 3: 다른 리전 테스트 (ap-southeast-1)
  const format3 = new Client({
    connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });

  // 테스트 1
  try {
    await format1.connect();
    console.log("✅ Format 1 (postgres.project-ref) successful!");
    await format1.end();
  } catch (err) {
    console.log("❌ Format 1 failed:", err.message);
  }
  
  // 테스트 2
  try {
    await format2.connect();
    console.log("✅ Format 2 (postgres only) successful!");
    await format2.end();
  } catch (err) {
    console.log("❌ Format 2 failed:", err.message);
  }
  
  // 테스트 3
  try {
    await format3.connect();
    console.log("✅ Format 3 (different region) successful!");
    await format3.end();
  } catch (err) {
    console.log("❌ Format 3 failed:", err.message);
  }
}

testPooledConnections();