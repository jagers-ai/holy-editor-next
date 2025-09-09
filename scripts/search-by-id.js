const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function searchById() {
  try {
    const documentId = '1757382002303';
    console.log(`🔍 문서 ID로 검색: ${documentId}\n`);
    
    // ID로 직접 검색
    const document = await prisma.document.findUnique({
      where: {
        id: documentId
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    if (document) {
      console.log('✅ 문서를 찾았습니다!\n');
      console.log('=== 문서 정보 ===');
      console.log(`ID: ${document.id}`);
      console.log(`제목: ${document.title}`);
      if (document.content?.sermonInfo) {
        console.log(`설교 제목: ${document.content.sermonInfo.title}`);
        console.log(`설교자: ${document.content.sermonInfo.pastor}`);
        console.log(`성경 구절: ${document.content.sermonInfo.verse}`);
      }
      console.log(`소유자: ${document.user?.email || 'Unknown'}`);
      console.log(`생성일: ${document.createdAt}`);
      console.log(`수정일: ${document.updatedAt}`);
    } else {
      console.log(`❌ ID가 ${documentId}인 문서를 찾을 수 없습니다.\n`);
      console.log('가능한 원인:');
      console.log('1. 문서가 localStorage에만 저장되어 있음');
      console.log('2. 문서가 다른 사용자 소유임');
      console.log('3. 문서가 삭제됨');
    }
    
    // 모든 사용자의 문서 개수 확인
    const totalDocuments = await prisma.document.count();
    console.log(`\n📊 데이터베이스 통계:`);
    console.log(`전체 문서 수: ${totalDocuments}개`);
    
    // 모든 사용자 확인
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            documents: true
          }
        }
      }
    });
    
    console.log(`\n👥 사용자별 문서 수:`);
    users.forEach(user => {
      console.log(`- ${user.email}: ${user._count.documents}개 문서`);
    });
    
    // 최근 문서 목록
    const recentDocs = await prisma.document.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        userId: true,
        updatedAt: true
      }
    });
    
    if (recentDocs.length > 0) {
      console.log(`\n📄 최근 수정된 문서:`);
      recentDocs.forEach(doc => {
        const date = new Date(doc.updatedAt).toLocaleString('ko-KR');
        console.log(`- ID: ${doc.id}, 제목: ${doc.title || '제목 없음'}, 수정: ${date}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 검색 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchById();