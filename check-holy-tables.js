const { Client } = require('pg');

const connectionString = "postgresql://postgres.lezednoabgdwgczvkiza:kjhkjs0807!@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

async function checkTables() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase\n');
    
    // 모든 테이블 확인
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('📋 현재 테이블 목록:');
    console.log('='.repeat(50));
    tables.rows.forEach(row => {
      console.log(`  • ${row.tablename}`);
    });
    
    // 각 테이블의 컬럼 확인
    console.log('\n📊 테이블 구조:');
    console.log('='.repeat(50));
    
    const tableNames = tables.rows.map(r => r.tablename);
    
    for (const tableName of tableNames) {
      if (tableName === '_prisma_migrations') continue;
      
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`\n🗂️ ${tableName}:`);
      columns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        console.log(`    - ${col.column_name}: ${col.data_type} ${nullable}`);
      });
    }
    
    // 기존 BREAD 데이터 확인
    console.log('\n🔍 이전 BREAD 테이블 확인:');
    console.log('='.repeat(50));
    const breadTables = ['ingredients', 'recipes', 'recipe_ingredients'];
    let foundBreadTables = false;
    
    for (const table of breadTables) {
      if (tableNames.includes(table)) {
        console.log(`  ⚠️ ${table} - 아직 존재함`);
        foundBreadTables = true;
      } else {
        console.log(`  ✅ ${table} - 제거됨`);
      }
    }
    
    if (!foundBreadTables) {
      console.log('\n🎉 모든 BREAD 테이블이 성공적으로 제거되었습니다!');
      console.log('✨ Holy Editor 스키마가 정상적으로 적용되었습니다!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables().catch(console.error);