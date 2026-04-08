export type Database = {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      subjects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string;
          updated_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          front: string;
          back: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          front: string;
          back: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          front?: string;
          back?: string;
          tags?: string[];
          updated_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          ease_factor: number;
          interval: number;
          repetitions: number;
          next_review: string;
          last_reviewed: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          ease_factor?: number;
          interval?: number;
          repetitions?: number;
          next_review?: string;
          last_reviewed?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          ease_factor?: number;
          interval?: number;
          repetitions?: number;
          next_review?: string;
          last_reviewed?: string | null;
        };
      };
      quiz_results: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          total_cards: number;
          correct_count: number;
          quiz_mode: string;
          duration_seconds: number | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          total_cards: number;
          correct_count: number;
          quiz_mode: string;
          duration_seconds?: number | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          total_cards?: number;
          correct_count?: number;
          quiz_mode?: string;
          duration_seconds?: number | null;
        };
      };
    };
  };
};
