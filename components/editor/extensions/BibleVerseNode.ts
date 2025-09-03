import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { nodeInputRule } from '@tiptap/core'
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
      nodeInputRule({
        find: /\/([가-힣]+)(\d+):(\d+)\s$/,
        type: this.type,
        getAttributes: (match) => {
          const [_, bookName, chapter, verse] = match
          const bookId = resolveBookId(bookName)
          
          if (!bookId || !window.bibleData) return null
          
          const verseData = window.bibleData.find(v => 
            v.bookId === bookId && 
            v.chapter === parseInt(chapter) &&
            v.verse === parseInt(verse)
          )
          
          if (!verseData) return null
          
          return {
            reference: `${verseData.bookName} ${chapter}:${verse}`,
            bookId,
            chapter: parseInt(chapter),
            startVerse: parseInt(verse),
            endVerse: null,
            verseText: verseData.text
          }
        }
      }),
      
      // 패턴 2: 범위구절 /창1:1-4 또는 /창세기1:1-4
      nodeInputRule({
        find: /\/([가-힣]+)(\d+):(\d+)-(\d+)\s$/,
        type: this.type,
        getAttributes: (match) => {
          const [_, bookName, chapter, startVerse, endVerse] = match
          const bookId = resolveBookId(bookName)
          
          if (!bookId || !window.bibleData) return null
          
          const verses = window.bibleData.filter(v => 
            v.bookId === bookId && 
            v.chapter === parseInt(chapter) &&
            v.verse >= parseInt(startVerse) &&
            v.verse <= parseInt(endVerse)
          )
          
          if (verses.length === 0) return null
          
          const verseText = verses.map(v => `${v.verse}. ${v.text}`).join(' ')
          const reference = `${verses[0].bookName} ${chapter}:${startVerse}-${endVerse}`
          
          // 노드 생성을 위한 속성 반환
          return {
            reference,
            bookId,
            chapter: parseInt(chapter),
            startVerse: parseInt(startVerse),
            endVerse: parseInt(endVerse),
            verseText
          }
        }
      })
    ]
  }
})