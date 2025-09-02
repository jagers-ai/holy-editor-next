const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '개역성경.xlsx');

console.log('📖 Excel 파일 구조 확인 중...\n');

try {
  const workbook = XLSX.readFile(excelPath);
  
  console.log('시트 목록:');
  workbook.SheetNames.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
  
  // 첫 번째 시트 분석
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`\n첫 번째 시트 "${sheetName}" 분석:`);
  console.log(`  - 총 행 수: ${data.length}`);
  
  if (data.length > 0) {
    console.log('\n컬럼 목록:');
    const columns = Object.keys(data[0]);
    columns.forEach(col => {
      console.log(`  - "${col}"`);
    });
    
    console.log('\n처음 3개 행 샘플:');
    data.slice(0, 3).forEach((row, index) => {
      console.log(`\n행 ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}`);
      });
    });
  }
  
} catch (error) {
  console.error('❌ 오류:', error.message);
}