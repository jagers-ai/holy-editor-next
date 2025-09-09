const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function searchDocument() {
  try {
    console.log('🔍 데이터베이스에서 문서 검색 중...\n');
    
    // 모든 문서 조회
    const allDocuments = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log(`📚 전체 문서 개수: ${allDocuments.length}개\n`);
    
    // "내 삶에 하나님이 비치다" 검색
    const searchTitle = "내 삶에 하나님이 비치다";
    console.log(`🎯 검색 중인 제목: "${searchTitle}"\n`);
    
    // 제목으로 직접 검색
    const exactMatch = allDocuments.filter(doc => 
      doc.title === searchTitle
    );
    
    // content 내부의 sermonInfo.title 검색
    const contentMatches = allDocuments.filter(doc => {
      if (doc.content && typeof doc.content === 'object') {
        const sermonInfo = doc.content.sermonInfo;
        return sermonInfo && sermonInfo.title === searchTitle;
      }
      return false;
    });
    
    // 부분 일치 검색
    const partialMatches = allDocuments.filter(doc => {
      const titleMatch = doc.title && doc.title.includes("하나님이 비치다");
      const contentMatch = doc.content && typeof doc.content === 'object' && 
        doc.content.sermonInfo && 
        doc.content.sermonInfo.title && 
        doc.content.sermonInfo.title.includes("하나님이 비치다");
      return titleMatch || contentMatch;
    });
    
    console.log('=== 검색 결과 ===\n');
    
    if (exactMatch.length > 0) {
      console.log('✅ 정확히 일치하는 문서 (title 필드):');
      exactMatch.forEach(doc => {
        console.log(`  - ID: ${doc.id}`);
        console.log(`    제목: ${doc.title}`);
        console.log(`    생성일: ${doc.createdAt}`);
        console.log(`    수정일: ${doc.updatedAt}\n`);
      });
    }
    
    if (contentMatches.length > 0) {
      console.log('✅ 정확히 일치하는 문서 (content.sermonInfo.title):');
      contentMatches.forEach(doc => {
        console.log(`  - ID: ${doc.id}`);
        console.log(`    DB 제목: ${doc.title}`);
        console.log(`    설교 제목: ${doc.content.sermonInfo.title}`);
        console.log(`    생성일: ${doc.createdAt}`);
        console.log(`    수정일: ${doc.updatedAt}\n`);
      });
    }
    
    if (exactMatch.length === 0 && contentMatches.length === 0) {
      console.log('❌ "내 삶에 하나님이 비치다" 제목의 문서를 찾을 수 없습니다.\n');
      
      if (partialMatches.length > 0) {
        console.log('💡 비슷한 제목의 문서:');
        partialMatches.forEach(doc => {
          const title = doc.title || (doc.content?.sermonInfo?.title) || '제목 없음';
          console.log(`  - "${title}" (ID: ${doc.id})`);
        });
      }
    }
    
    // 모든 문서의 제목 목록 출력
    console.log('\n📋 저장된 모든 문서 목록:');
    allDocuments.forEach((doc, index) => {
      const title = doc.title || 
        (doc.content?.sermonInfo?.title) || 
        '제목 없음';
      const date = new Date(doc.updatedAt).toLocaleDateString('ko-KR');
      console.log(`${index + 1}. "${title}" - ${date} (ID: ${doc.id.substring(0, 8)}...)`);
    });
    
  } catch (error) {
    console.error('❌ 검색 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchDocument();