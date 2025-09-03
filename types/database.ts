// Supabase 데이터베이스 타입 정의
// 실제 프로덕션에서는 'supabase gen types typescript' 명령으로 자동 생성 권장

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          title: string;
          content: any; // JSON type
          userId: string | null;
          isPublic: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: any;
          userId?: string | null;
          isPublic?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: any;
          userId?: string | null;
          isPublic?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      bible_references: {
        Row: {
          id: string;
          documentId: string;
          book: string;
          chapter: number;
          verseStart: number;
          verseEnd: number | null;
          text: string | null;
          version: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          documentId: string;
          book: string;
          chapter: number;
          verseStart: number;
          verseEnd?: number | null;
          text?: string | null;
          version?: string;
          createdAt?: string;
        };
        Update: {
          id?: string;
          documentId?: string;
          book?: string;
          chapter?: number;
          verseStart?: number;
          verseEnd?: number | null;
          text?: string | null;
          version?: string;
          createdAt?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          createdAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          createdAt?: string;
        };
      };
      document_tags: {
        Row: {
          documentId: string;
          tagId: string;
          createdAt: string;
        };
        Insert: {
          documentId: string;
          tagId: string;
          createdAt?: string;
        };
        Update: {
          documentId?: string;
          tagId?: string;
          createdAt?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          content: any;
          category: string;
          isPublic: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          content: any;
          category: string;
          isPublic?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          content?: any;
          category?: string;
          isPublic?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};