import { Extension } from '@tiptap/core';
import { InputRule } from '@tiptap/core';
import { resolveBookId } from '@/lib/bible/books';

// 전역 성경 데이터 타입
interface BibleVerse {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

declare global {
  interface Window {
    bibleData?: BibleVerse[];
  }
}

export const BibleVerseExtension = Extension.create({
  name: 'bibleVerse',

  addInputRules() {
    return [
      // 단일 구절: /창1:1 + 스페이스
      new InputRule({
        find: /\/([가-힣]+)(\d+):(\d+)\s$/,
        handler: ({ state, range, match, commands }) => {
          const [fullMatch, bookName, chapter, verse] = match;
          
          // 전역 데이터 확인
          if (!window.bibleData) {
            return null;
          }
          
          // 책 ID 찾기
          const bookId = resolveBookId(bookName);
          
          if (!bookId) {
            return null;
          }
          
          // 성경 구절 찾기
          const verseData = window.bibleData.find(v => 
            v.bookId === bookId && 
            v.chapter === parseInt(chapter) &&
            v.verse === parseInt(verse)
          );
          
          if (!verseData) {
            return null;
          }
          
          // 구절 텍스트 생성
          const reference = `${verseData.bookName} ${chapter}:${verse}`;
          const replacement = `[${reference}] ${verseData.text} `;
          
          // 슬래시 명령어를 구절로 교체 - commands 사용
          commands.insertContentAt(
            { from: range.from, to: range.to },
            replacement
          );
        }
      }),
      
      // 범위 구절: /창1:1-4 + 스페이스
      new InputRule({
        find: /\/([가-힣]+)(\d+):(\d+)-(\d+)\s$/,
        handler: ({ state, range, match, commands }) => {
          const [fullMatch, bookName, chapter, startVerse, endVerse] = match;
          
          // 전역 데이터 확인
          if (!window.bibleData) {
            return null;
          }
          
          // 책 ID 찾기
          const bookId = resolveBookId(bookName);
          
          if (!bookId) {
            return null;
          }
          
          // 성경 구절들 찾기
          const verses = window.bibleData.filter(v => 
            v.bookId === bookId && 
            v.chapter === parseInt(chapter) &&
            v.verse >= parseInt(startVerse) &&
            v.verse <= parseInt(endVerse)
          );
          
          if (verses.length === 0) {
            return null;
          }
          
          // 구절 텍스트 생성
          const verseText = verses.map(v => `${v.verse}. ${v.text}`).join(' ');
          const reference = `${verses[0].bookName} ${chapter}:${startVerse}-${endVerse}`;
          const replacement = `[${reference}] ${verseText} `;
          
          // 슬래시 명령어를 구절로 교체 - commands 사용
          commands.insertContentAt(
            { from: range.from, to: range.to },
            replacement
          );
        }
      })
    ];
  }
});