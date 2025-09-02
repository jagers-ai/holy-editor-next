const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Excel 파일 경로
const excelPath = path.join(__dirname, '개역성경.xlsx');
const outputPath = path.join(__dirname, 'bible-real.json');

// 성경 책 약어를 전체 이름으로 매핑
const BOOK_NAME_MAPPING = {
  // 구약
  '창': { id: 'GEN', name: '창세기' },
  '출': { id: 'EXO', name: '출애굽기' },
  '레': { id: 'LEV', name: '레위기' },
  '민': { id: 'NUM', name: '민수기' },
  '신': { id: 'DEU', name: '신명기' },
  '수': { id: 'JOS', name: '여호수아' },
  '삿': { id: 'JDG', name: '사사기' },
  '룻': { id: 'RUT', name: '룻기' },
  '삼상': { id: '1SA', name: '사무엘상' },
  '삼하': { id: '2SA', name: '사무엘하' },
  '왕상': { id: '1KI', name: '열왕기상' },
  '왕하': { id: '2KI', name: '열왕기하' },
  '대상': { id: '1CH', name: '역대상' },
  '대하': { id: '2CH', name: '역대하' },
  '스': { id: 'EZR', name: '에스라' },
  '느': { id: 'NEH', name: '느헤미야' },
  '에': { id: 'EST', name: '에스더' },
  '욥': { id: 'JOB', name: '욥기' },
  '시': { id: 'PSA', name: '시편' },
  '잠': { id: 'PRO', name: '잠언' },
  '전': { id: 'ECC', name: '전도서' },
  '아': { id: 'SNG', name: '아가' },
  '사': { id: 'ISA', name: '이사야' },
  '렘': { id: 'JER', name: '예레미야' },
  '애': { id: 'LAM', name: '예레미야애가' },
  '겔': { id: 'EZK', name: '에스겔' },
  '단': { id: 'DAN', name: '다니엘' },
  '호': { id: 'HOS', name: '호세아' },
  '욜': { id: 'JOL', name: '요엘' },
  '암': { id: 'AMO', name: '아모스' },
  '옵': { id: 'OBA', name: '오바댜' },
  '욘': { id: 'JON', name: '요나' },
  '미': { id: 'MIC', name: '미가' },
  '나': { id: 'NAH', name: '나훔' },
  '합': { id: 'HAB', name: '하박국' },
  '습': { id: 'ZEP', name: '스바냐' },
  '학': { id: 'HAG', name: '학개' },
  '슥': { id: 'ZEC', name: '스가랴' },
  '말': { id: 'MAL', name: '말라기' },
  
  // 신약
  '마': { id: 'MAT', name: '마태복음' },
  '막': { id: 'MRK', name: '마가복음' },
  '눅': { id: 'LUK', name: '누가복음' },
  '요': { id: 'JHN', name: '요한복음' },
  '행': { id: 'ACT', name: '사도행전' },
  '롬': { id: 'ROM', name: '로마서' },
  '고전': { id: 'CO1', name: '고린도전서' },
  '고후': { id: 'CO2', name: '고린도후서' },
  '갈': { id: 'GAL', name: '갈라디아서' },
  '엡': { id: 'EPH', name: '에베소서' },
  '빌': { id: 'PHP', name: '빌립보서' },
  '골': { id: 'COL', name: '골로새서' },
  '살전': { id: 'TH1', name: '데살로니가전서' },
  '살후': { id: 'TH2', name: '데살로니가후서' },
  '딤전': { id: 'TI1', name: '디모데전서' },
  '딤후': { id: 'TI2', name: '디모데후서' },
  '딛': { id: 'TIT', name: '디도서' },
  '몬': { id: 'PHM', name: '빌레몬서' },
  '히': { id: 'HEB', name: '히브리서' },
  '약': { id: 'JAS', name: '야고보서' },
  '벧전': { id: 'PE1', name: '베드로전서' },
  '벧후': { id: 'PE2', name: '베드로후서' },
  '요일': { id: 'JO1', name: '요한일서' },
  '요이': { id: 'JO2', name: '요한이서' },
  '요삼': { id: 'JO3', name: '요한삼서' },
  '유': { id: 'JUD', name: '유다서' },
  '계': { id: 'REV', name: '요한계시록' }
};

console.log('📖 실제 개역개정 성경 데이터 변환 중...\n');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['성경'];
  
  if (!sheet) {
    throw new Error('"성경" 시트를 찾을 수 없습니다.');
  }
  
  // 헤더 포함하여 raw 데이터로 읽기
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`총 ${rawData.length - 1}개의 구절을 처리 중...`);
  
  const verses = [];
  let unknownBooks = new Set();
  
  // 첫 번째 행은 헤더이므로 스킵
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // 컬럼: [색인(책약어), 장, 절, 장절, 내용]
    const bookAbbr = row[0];
    const chapter = parseInt(row[1]);
    const verse = parseInt(row[2]);
    const text = row[4];
    
    if (bookAbbr && chapter && verse && text) {
      const bookInfo = BOOK_NAME_MAPPING[bookAbbr];
      
      if (bookInfo) {
        verses.push({
          bookId: bookInfo.id,
          bookName: bookInfo.name,
          chapter: chapter,
          verse: verse,
          text: text.trim()
        });
      } else {
        unknownBooks.add(bookAbbr);
      }
    }
  }
  
  if (unknownBooks.size > 0) {
    console.log('\n⚠️ 매핑되지 않은 책 약어:', Array.from(unknownBooks).join(', '));
  }
  
  console.log(`\n✅ ${verses.length}개의 구절을 성공적으로 변환했습니다!`);
  
  // JSON 파일로 저장
  fs.writeFileSync(outputPath, JSON.stringify(verses, null, 2));
  console.log(`📁 ${outputPath}에 저장되었습니다.`);
  
  // 샘플 출력
  console.log('\n📝 샘플 구절:');
  console.log('창세기 1:1 -', verses[0]?.text);
  console.log('갈라디아서 2:20 -', verses.find(v => v.bookId === 'GAL' && v.chapter === 2 && v.verse === 20)?.text);
  console.log('요한복음 3:16 -', verses.find(v => v.bookId === 'JHN' && v.chapter === 3 && v.verse === 16)?.text);
  
  // 통계
  const bookStats = {};
  verses.forEach(v => {
    if (!bookStats[v.bookName]) {
      bookStats[v.bookName] = 0;
    }
    bookStats[v.bookName]++;
  });
  
  console.log('\n📊 책별 구절 수:');
  console.log('  구약:', Object.entries(bookStats).slice(0, 39).reduce((sum, [, count]) => sum + count, 0), '구절');
  console.log('  신약:', Object.entries(bookStats).slice(39).reduce((sum, [, count]) => sum + count, 0), '구절');
  
} catch (error) {
  console.error('❌ 변환 중 오류 발생:', error.message);
}