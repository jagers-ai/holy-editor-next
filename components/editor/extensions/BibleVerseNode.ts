import { Node, InputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import BibleVerseComponent from './BibleVerseComponent'
import { resolveBookId } from '@/lib/bible/books'

declare global {
  interface Window {
    bibleData?: any[];
  }
}

export const BibleVerseNode = Node.create({
  name: 'bibleVerse',
  group: 'inline',
  inline: true,
  content: 'text*',  // 편집 가능한 텍스트 콘텐츠
  
  addAttributes() {
    return {
      reference: { default: null },    // "창세기 1:1"
      bookId: { default: null },       // "GEN"
      chapter: { default: null },      // 1
      startVerse: { default: null },   // 1
      endVerse: { default: null },     // 범위 구절용
      verseText: { default: null }     // 실제 성경 구절 텍스트
    }
  },
  
  parseHTML() {
    return [{
      tag: 'bible-verse',
      getAttrs: (dom: HTMLElement) => ({
        reference: dom.getAttribute('data-reference'),
        bookId: dom.getAttribute('data-book-id'),
        chapter: dom.getAttribute('data-chapter'),
        startVerse: dom.getAttribute('data-start-verse'),
        endVerse: dom.getAttribute('data-end-verse'),
        verseText: dom.getAttribute('data-verse-text')
      })
    }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['bible-verse', HTMLAttributes, 0]
  },
  
  addNodeView() {
    // React 컴포넌트 렌더링
    return ReactNodeViewRenderer(BibleVerseComponent)
  },
  
  addInputRules() {
    return [
      // 패턴 1: 단일구절 /창1:1 또는 /창세기1:1
      new InputRule({
        find: /\/([가-힣]+)(\d+):(\d+)\s$/,
        handler: ({ state, range, match, commands }) => {
          const [_, bookName, chapter, verse] = match
          console.log('[BibleVerse] Input detected:', { bookName, chapter, verse })
          
          const bookId = resolveBookId(bookName)
          console.log('[BibleVerse] Book resolved:', bookId)
          
          // 기본 속성
          const attrs = {
            reference: `${bookName} ${chapter}:${verse}`,
            bookId: bookId || 'UNKNOWN',
            chapter: parseInt(chapter),
            startVerse: parseInt(verse),
            endVerse: null as number | null,
            verseText: null as string | null
          }
          
          let textContent = '(성경 구절을 불러올 수 없습니다)'
          
          // 성경 데이터 찾기 시도
          if (bookId && window.bibleData) {
            const verseData = window.bibleData.find(v => 
              v.bookId === bookId && 
              v.chapter === parseInt(chapter) &&
              v.verse === parseInt(verse)
            )
            
            if (verseData) {
              console.log('[BibleVerse] Verse found:', verseData.text)
              attrs.reference = `${verseData.bookName} ${chapter}:${verse}`
              attrs.verseText = verseData.text
              textContent = verseData.text
            } else {
              console.log('[BibleVerse] Verse not found in data')
              textContent = '(성경 구절을 불러오는 중...)'
            }
          } else {
            console.log('[BibleVerse] Bible data not loaded or bookId not found')
          }
          
          // content를 포함한 노드 생성
          const node = this.type.create(attrs, state.schema.text(textContent))
          
          // commands를 통해 노드 삽입 (Transaction 반환하지 않음)
          commands.deleteRange(range)
          commands.insertContent(node.toJSON())
        }
      }),
      
      // 패턴 2: 범위구절 /창1:1-4 또는 /창세기1:1-4
      new InputRule({
        find: /\/([가-힣]+)(\d+):(\d+)-(\d+)\s$/,
        handler: ({ state, range, match, commands }) => {
          const [_, bookName, chapter, startVerse, endVerse] = match
          console.log('[BibleVerse] Range input detected:', { bookName, chapter, startVerse, endVerse })
          
          const bookId = resolveBookId(bookName)
          console.log('[BibleVerse] Book resolved:', bookId)
          
          // 기본 속성
          const attrs = {
            reference: `${bookName} ${chapter}:${startVerse}-${endVerse}`,
            bookId: bookId || 'UNKNOWN',
            chapter: parseInt(chapter),
            startVerse: parseInt(startVerse),
            endVerse: parseInt(endVerse),
            verseText: null as string | null
          }
          
          let textContent = '(성경 구절을 불러올 수 없습니다)'
          
          // 성경 데이터 찾기 시도
          if (bookId && window.bibleData) {
            const verses = window.bibleData.filter(v => 
              v.bookId === bookId && 
              v.chapter === parseInt(chapter) &&
              v.verse >= parseInt(startVerse) &&
              v.verse <= parseInt(endVerse)
            )
            
            if (verses.length > 0) {
              console.log('[BibleVerse] Verses found:', verses.length)
              const verseText = verses.map(v => `${v.verse}. ${v.text}`).join(' ')
              attrs.reference = `${verses[0].bookName} ${chapter}:${startVerse}-${endVerse}`
              attrs.verseText = verseText
              textContent = verseText
            } else {
              console.log('[BibleVerse] Verses not found in data')
              textContent = '(성경 구절을 불러오는 중...)'
            }
          } else {
            console.log('[BibleVerse] Bible data not loaded or bookId not found')
          }
          
          // content를 포함한 노드 생성
          const node = this.type.create(attrs, state.schema.text(textContent))
          
          // commands를 통해 노드 삽입 (Transaction 반환하지 않음)
          commands.deleteRange(range)
          commands.insertContent(node.toJSON())
        }
      })
    ]
  }
})