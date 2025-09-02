import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with full Bible data...');
  
  // 기존 데이터 삭제
  console.log('🗑️ Cleaning existing data...');
  await prisma.bibleVerse.deleteMany();
  await prisma.document.deleteMany();
  
  // 실제 개역개정 성경 데이터 로드
  const dataPath = path.join(__dirname, '../data/bible-real.json');
  const bibleData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  console.log(`📖 Loading ${bibleData.length} verses...`);
  
  // 배치로 나누어 삽입 (한 번에 너무 많이 삽입하면 메모리 문제 발생 가능)
  const batchSize = 1000;
  let insertedCount = 0;
  
  for (let i = 0; i < bibleData.length; i += batchSize) {
    const batch = bibleData.slice(i, i + batchSize);
    
    const result = await prisma.bibleVerse.createMany({
      data: batch.map((verse: any) => ({
        ...verse,
        version: 'KRV', // 한글개역
      })),
      skipDuplicates: true,
    });
    
    insertedCount += result.count;
    console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(bibleData.length / batchSize)} (${insertedCount} verses total)`);
  }
  
  console.log(`✅ Successfully inserted ${insertedCount} bible verses`);
  
  // 샘플 문서 생성
  const sampleDocument = await prisma.document.create({
    data: {
      title: '성경 구절 에디터 테스트',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'HolyEditor - 성경 구절 에디터' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '슬래시 명령어를 사용하여 성경 구절을 삽입할 수 있습니다.' },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '사용 방법' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '다음과 같이 입력해보세요: ' },
              { type: 'text', marks: [{ type: 'bold' }], text: '/갈2:20' },
              { type: 'text', text: ' 또는 ' },
              { type: 'text', marks: [{ type: 'bold' }], text: '/창1:1' },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '창세기: /창' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '갈라디아서: /갈' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '요한복음: /요' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  });
  
  console.log(`✅ Created sample document: ${sampleDocument.title}`);
  
  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });