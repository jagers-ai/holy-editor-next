// 성경 66권 매핑 데이터

export interface BibleBook {
  id: string;      // 영문 약어 (GEN, EXO 등)
  name: string;    // 한글 정식명 (창세기, 출애굽기 등)
  aliases: string[]; // 한글 별칭들 (창, 창세, 출, 출애 등)
  chapters: number;  // 총 장 수
}

// 구약 39권
const OLD_TESTAMENT: BibleBook[] = [
  { id: 'GEN', name: '창세기', aliases: ['창', '창세'], chapters: 50 },
  { id: 'EXO', name: '출애굽기', aliases: ['출', '출애'], chapters: 40 },
  { id: 'LEV', name: '레위기', aliases: ['레', '레위'], chapters: 27 },
  { id: 'NUM', name: '민수기', aliases: ['민', '민수'], chapters: 36 },
  { id: 'DEU', name: '신명기', aliases: ['신', '신명'], chapters: 34 },
  { id: 'JOS', name: '여호수아', aliases: ['수', '여호수아'], chapters: 24 },
  { id: 'JDG', name: '사사기', aliases: ['삿', '사사'], chapters: 21 },
  { id: 'RUT', name: '룻기', aliases: ['룻'], chapters: 4 },
  { id: '1SA', name: '사무엘상', aliases: ['삼상', '사무엘상'], chapters: 31 },
  { id: '2SA', name: '사무엘하', aliases: ['삼하', '사무엘하'], chapters: 24 },
  { id: '1KI', name: '열왕기상', aliases: ['왕상', '열왕상'], chapters: 22 },
  { id: '2KI', name: '열왕기하', aliases: ['왕하', '열왕하'], chapters: 25 },
  { id: '1CH', name: '역대상', aliases: ['대상', '역대상'], chapters: 29 },
  { id: '2CH', name: '역대하', aliases: ['대하', '역대하'], chapters: 36 },
  { id: 'EZR', name: '에스라', aliases: ['스', '에스라'], chapters: 10 },
  { id: 'NEH', name: '느헤미야', aliases: ['느', '느헤미야'], chapters: 13 },
  { id: 'EST', name: '에스더', aliases: ['에', '에스더'], chapters: 10 },
  { id: 'JOB', name: '욥기', aliases: ['욥'], chapters: 42 },
  { id: 'PSA', name: '시편', aliases: ['시'], chapters: 150 },
  { id: 'PRO', name: '잠언', aliases: ['잠'], chapters: 31 },
  { id: 'ECC', name: '전도서', aliases: ['전', '전도'], chapters: 12 },
  { id: 'SNG', name: '아가', aliases: ['아'], chapters: 8 },
  { id: 'ISA', name: '이사야', aliases: ['사', '이사야'], chapters: 66 },
  { id: 'JER', name: '예레미야', aliases: ['렘', '예레미야'], chapters: 52 },
  { id: 'LAM', name: '예레미야애가', aliases: ['애', '애가'], chapters: 5 },
  { id: 'EZK', name: '에스겔', aliases: ['겔', '에스겔'], chapters: 48 },
  { id: 'DAN', name: '다니엘', aliases: ['단', '다니엘'], chapters: 12 },
  { id: 'HOS', name: '호세아', aliases: ['호', '호세아'], chapters: 14 },
  { id: 'JOL', name: '요엘', aliases: ['욜', '요엘'], chapters: 3 },
  { id: 'AMO', name: '아모스', aliases: ['암', '아모스'], chapters: 9 },
  { id: 'OBA', name: '오바댜', aliases: ['옵', '오바댜'], chapters: 1 },
  { id: 'JON', name: '요나', aliases: ['욘', '요나'], chapters: 4 },
  { id: 'MIC', name: '미가', aliases: ['미', '미가'], chapters: 7 },
  { id: 'NAH', name: '나훔', aliases: ['나', '나훔'], chapters: 3 },
  { id: 'HAB', name: '하박국', aliases: ['합', '하박국'], chapters: 3 },
  { id: 'ZEP', name: '스바냐', aliases: ['습', '스바냐'], chapters: 3 },
  { id: 'HAG', name: '학개', aliases: ['학', '학개'], chapters: 2 },
  { id: 'ZEC', name: '스가랴', aliases: ['슥', '스가랴'], chapters: 14 },
  { id: 'MAL', name: '말라기', aliases: ['말', '말라기'], chapters: 4 },
];

// 신약 27권
const NEW_TESTAMENT: BibleBook[] = [
  { id: 'MAT', name: '마태복음', aliases: ['마', '마태'], chapters: 28 },
  { id: 'MRK', name: '마가복음', aliases: ['막', '마가'], chapters: 16 },
  { id: 'LUK', name: '누가복음', aliases: ['눅', '누가'], chapters: 24 },
  { id: 'JHN', name: '요한복음', aliases: ['요', '요한'], chapters: 21 },
  { id: 'ACT', name: '사도행전', aliases: ['행', '사도'], chapters: 28 },
  { id: 'ROM', name: '로마서', aliases: ['롬', '로마'], chapters: 16 },
  { id: 'CO1', name: '고린도전서', aliases: ['고전', '고린도전'], chapters: 16 },
  { id: 'CO2', name: '고린도후서', aliases: ['고후', '고린도후'], chapters: 13 },
  { id: 'GAL', name: '갈라디아서', aliases: ['갈', '갈라', '갈라디아'], chapters: 6 },
  { id: 'EPH', name: '에베소서', aliases: ['엡', '에베소'], chapters: 6 },
  { id: 'PHP', name: '빌립보서', aliases: ['빌', '빌립보'], chapters: 4 },
  { id: 'COL', name: '골로새서', aliases: ['골', '골로새'], chapters: 4 },
  { id: 'TH1', name: '데살로니가전서', aliases: ['살전', '데살로니가전'], chapters: 5 },
  { id: 'TH2', name: '데살로니가후서', aliases: ['살후', '데살로니가후'], chapters: 3 },
  { id: 'TI1', name: '디모데전서', aliases: ['딤전', '디모데전'], chapters: 6 },
  { id: 'TI2', name: '디모데후서', aliases: ['딤후', '디모데후'], chapters: 4 },
  { id: 'TIT', name: '디도서', aliases: ['딛', '디도'], chapters: 3 },
  { id: 'PHM', name: '빌레몬서', aliases: ['몬', '빌레몬'], chapters: 1 },
  { id: 'HEB', name: '히브리서', aliases: ['히', '히브리'], chapters: 13 },
  { id: 'JAS', name: '야고보서', aliases: ['약', '야고보'], chapters: 5 },
  { id: 'PE1', name: '베드로전서', aliases: ['벧전', '베드로전'], chapters: 5 },
  { id: 'PE2', name: '베드로후서', aliases: ['벧후', '베드로후'], chapters: 3 },
  { id: 'JO1', name: '요한일서', aliases: ['요일', '요한1서'], chapters: 5 },
  { id: 'JO2', name: '요한이서', aliases: ['요이', '요한2서'], chapters: 1 },
  { id: 'JO3', name: '요한삼서', aliases: ['요삼', '요한3서'], chapters: 1 },
  { id: 'JUD', name: '유다서', aliases: ['유', '유다'], chapters: 1 },
  { id: 'REV', name: '요한계시록', aliases: ['계', '계시', '계시록'], chapters: 22 },
];

// 전체 66권
export const BIBLE_BOOKS: BibleBook[] = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

// 별칭으로 책 ID 찾기
export function resolveBookId(input: string): string | null {
  const normalized = input.trim();
  
  // 1단계: 정확한 전체 이름 매칭
  for (const book of BIBLE_BOOKS) {
    if (book.name === normalized) {
      return book.id;
    }
  }
  
  // 2단계: 정확한 약어 매칭
  for (const book of BIBLE_BOOKS) {
    if (book.aliases.includes(normalized)) {
      return book.id;
    }
  }
  
  // 3단계: 부분 매칭은 제거 (혼란을 방지하기 위해)
  // 사용자는 정확한 약어나 전체 이름을 입력해야 함
  
  return null;
}

// 책 정보 가져오기
export function getBookInfo(bookId: string): BibleBook | null {
  return BIBLE_BOOKS.find(book => book.id === bookId) || null;
}