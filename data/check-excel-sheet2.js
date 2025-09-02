const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '개역성경.xlsx');

console.log('📖 "성경" 시트 구조 확인 중...\n');

try {
  const workbook = XLSX.readFile(excelPath);
  
  // "성경" 시트 분석
  const sheetName = '성경';
  const sheet = workbook.Sheets[sheetName];
  
  if (!sheet) {
    console.log('성경 시트를 찾을 수 없습니다.');
    return;
  }
  
  // header 옵션 없이 raw 데이터로 읽기
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`"성경" 시트 분석:`);
  console.log(`  - 총 행 수: ${data.length}`);
  
  console.log('\n처음 10개 행 샘플:');
  data.slice(0, 10).forEach((row, index) => {
    console.log(`행 ${index}: [${row.slice(0, 6).map(cell => 
      cell ? String(cell).substring(0, 20) : 'null'
    ).join(' | ')}]`);
  });
  
} catch (error) {
  console.error('❌ 오류:', error.message);
}