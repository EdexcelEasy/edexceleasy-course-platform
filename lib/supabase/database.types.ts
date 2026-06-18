export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_subjects: {
        Row: {
          id: string;
          name: string;
          color: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          color: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_subject_topics: {
        Row: {
          subject_id: string;
          title: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          subject_id: string;
          title: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          subject_id?: string;
          title?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_subject_access: {
        Row: {
          subject_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          subject_id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          subject_id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_units: {
        Row: {
          id: string;
          subject_id: string;
          title: string;
          revision_note_count: number;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          subject_id: string;
          title: string;
          revision_note_count?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          title?: string;
          revision_note_count?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_unit_access: {
        Row: {
          unit_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          unit_id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          unit_id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_topics: {
        Row: {
          id: string;
          unit_id: string;
          title: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          unit_id: string;
          title: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          title?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_subtopics: {
        Row: {
          id: string;
          topic_id: string;
          title: string;
          drive_url: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          topic_id: string;
          title: string;
          drive_url: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          title?: string;
          drive_url?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
