const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Excel 파일 경로
const excelPath = path.join(__dirname, '개역성경.xlsx');
const outputPath = path.join(__dirname, 'bible-real.json');

// 성경 책 매핑
const BOOK_MAPPING = {
  // 구약
  '창세기': { id: 'GEN', name: '창세기' },
  '출애굽기': { id: 'EXO', name: '출애굽기' },
  '레위기': { id: 'LEV', name: '레위기' },
  '민수기': { id: 'NUM', name: '민수기' },
  '신명기': { id: 'DEU', name: '신명기' },
  '여호수아': { id: 'JOS', name: '여호수아' },
  '사사기': { id: 'JDG', name: '사사기' },
  '룻기': { id: 'RUT', name: '룻기' },
  '사무엘상': { id: '1SA', name: '사무엘상' },
  '사무엘하': { id: '2SA', name: '사무엘하' },
  '열왕기상': { id: '1KI', name: '열왕기상' },
  '열왕기하': { id: '2KI', name: '열왕기하' },
  '역대상': { id: '1CH', name: '역대상' },
  '역대하': { id: '2CH', name: '역대하' },
  '에스라': { id: 'EZR', name: '에스라' },
  '느헤미야': { id: 'NEH', name: '느헤미야' },
  '에스더': { id: 'EST', name: '에스더' },
  '욥기': { id: 'JOB', name: '욥기' },
  '시편': { id: 'PSA', name: '시편' },
  '잠언': { id: 'PRO', name: '잠언' },
  '전도서': { id: 'ECC', name: '전도서' },
  '아가': { id: 'SNG', name: '아가' },
  '이사야': { id: 'ISA', name: '이사야' },
  '예레미야': { id: 'JER', name: '예레미야' },
  '예레미야애가': { id: 'LAM', name: '예레미야애가' },
  '에스겔': { id: 'EZK', name: '에스겔' },
  '다니엘': { id: 'DAN', name: '다니엘' },
  '호세아': { id: 'HOS', name: '호세아' },
  '요엘': { id: 'JOL', name: '요엘' },
  '아모스': { id: 'AMO', name: '아모스' },
  '오바댜': { id: 'OBA', name: '오바댜' },
  '요나': { id: 'JON', name: '요나' },
  '미가': { id: 'MIC', name: '미가' },
  '나훔': { id: 'NAH', name: '나훔' },
  '하박국': { id: 'HAB', name: '하박국' },
  '스바냐': { id: 'ZEP', name: '스바냐' },
  '학개': { id: 'HAG', name: '학개' },
  '스가랴': { id: 'ZEC', name: '스가랴' },
  '말라기': { id: 'MAL', name: '말라기' },
  
  // 신약
  '마태복음': { id: 'MAT', name: '마태복음' },
  '마가복음': { id: 'MRK', name: '마가복음' },
  '누가복음': { id: 'LUK', name: '누가복음' },
  '요한복음': { id: 'JHN', name: '요한복음' },
  '사도행전': { id: 'ACT', name: '사도행전' },
  '로마서': { id: 'ROM', name: '로마서' },
  '고린도전서': { id: 'CO1', name: '고린도전서' },
  '고린도후서': { id: 'CO2', name: '고린도후서' },
  '갈라디아서': { id: 'GAL', name: '갈라디아서' },
  '에베소서': { id: 'EPH', name: '에베소서' },
  '빌립보서': { id: 'PHP', name: '빌립보서' },
  '골로새서': { id: 'COL', name: '골로새서' },
  '데살로니가전서': { id: 'TH1', name: '데살로니가전서' },
  '데살로니가후서': { id: 'TH2', name: '데살로니가후서' },
  '디모데전서': { id: 'TI1', name: '디모데전서' },
  '디모데후서': { id: 'TI2', name: '디모데후서' },
  '디도서': { id: 'TIT', name: '디도서' },
  '빌레몬서': { id: 'PHM', name: '빌레몬서' },
  '히브리서': { id: 'HEB', name: '히브리서' },
  '야고보서': { id: 'JAS', name: '야고보서' },
  '베드로전서': { id: 'PE1', name: '베드로전서' },
  '베드로후서': { id: 'PE2', name: '베드로후서' },
  '요한일서': { id: 'JO1', name: '요한일서' },
  '요한이서': { id: 'JO2', name: '요한이서' },
  '요한삼서': { id: 'JO3', name: '요한삼서' },
  '유다서': { id: 'JUD', name: '유다서' },
  '요한계시록': { id: 'REV', name: '요한계시록' }
};

console.log('📖 Excel 파일을 읽는 중...');

try {
  // Excel 파일 읽기
  const workbook = XLSX.readFile(excelPath);
  
  // 첫 번째 시트 가져오기
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // 데이터를 JSON으로 변환
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`총 ${rawData.length}개의 행을 발견했습니다.`);
  
  // 데이터 변환
  const verses = [];
  let currentBook = null;
  let currentChapter = null;
  
  for (const row of rawData) {
    // Excel 컬럼명에 따라 조정이 필요할 수 있습니다
    // 일반적인 형식: 책이름, 장, 절, 내용
    const bookName = row['책'] || row['Book'] || row['성경'] || row[Object.keys(row)[0]];
    const chapter = parseInt(row['장'] || row['Chapter'] || row[Object.keys(row)[1]]);
    const verse = parseInt(row['절'] || row['Verse'] || row[Object.keys(row)[2]]);
    const text = row['내용'] || row['Text'] || row['구절'] || row[Object.keys(row)[3]];
    
    if (bookName && chapter && verse && text) {
      const bookInfo = BOOK_MAPPING[bookName];
      if (bookInfo) {
        verses.push({
          bookId: bookInfo.id,
          bookName: bookInfo.name,
          chapter: chapter,
          verse: verse,
          text: text.trim()
        });
      } else {
        console.warn(`알 수 없는 책 이름: ${bookName}`);
      }
    }
  }
  
  console.log(`✅ ${verses.length}개의 구절을 변환했습니다.`);
  
  // JSON 파일로 저장
  fs.writeFileSync(outputPath, JSON.stringify(verses, null, 2));
  console.log(`📁 ${outputPath}에 저장되었습니다.`);
  
  // 샘플 출력
  console.log('\n📝 샘플 구절:');
  console.log(verses.slice(0, 3));
  
} catch (error) {
  console.error('❌ 변환 중 오류 발생:', error);
}