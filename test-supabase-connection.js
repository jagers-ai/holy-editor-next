const { Client } = require('pg');

// Supabase 연결 정보
const configs = [
  {
    name: 'Pooler Connection (6543)',
    connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
  },
  {
    name: 'Direct Connection (5432)',
    connectionString: "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres",
  }
];

async function testConnection(config) {
  console.log(`\n🔍 Testing: ${config.name}`);
  console.log(`📍 URL: ${config.connectionString.replace(/:[^@]+@/, ':****@')}`);
  
  const client = new Client({
    connectionString: config.connectionString,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    connectionTimeoutMillis: 10000, // 10초 타임아웃
  });

  try {
    console.log('⏳ Connecting...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    // 간단한 쿼리 테스트
    const result = await client.query('SELECT NOW() as current_time, current_database() as database');
    console.log('📊 Query result:', result.rows[0]);
    
    // 테이블 목록 확인
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      LIMIT 5
    `);
    console.log('📋 Public tables:', tables.rows.map(r => r.tablename));
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🌐 DNS resolution failed - check the hostname');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏱️ Connection timeout - server may be unreachable');
    } else if (error.code === '28P01') {
      console.error('🔐 Authentication failed - check credentials');
    }
  } finally {
    await client.end();
  }
}

// DNS 확인
const dns = require('dns').promises;

async function checkDNS() {
  console.log('\n🌐 DNS Resolution Check:');
  try {
    const addresses = await dns.resolve4('aws-1-ap-northeast-2.pooler.supabase.com');
    console.log('✅ DNS resolved to:', addresses);
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
  }
}

// 메인 실행
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Supabase Connection Test');
  console.log('='.repeat(60));
  
  // DNS 먼저 확인
  await checkDNS();
  
  // 각 연결 테스트
  for (const config of configs) {
    await testConnection(config);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test completed');
}

main().catch(console.error);