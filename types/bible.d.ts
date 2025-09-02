declare module '@/data/bible-real.json' {
  interface BibleVerse {
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  }
  
  const value: BibleVerse[];
  export default value;
}