import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      archives: {
        Row: Archive;
        Insert: Omit<Archive, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Archive, 'id' | 'created_at'>>;
      };
      districts: {
        Row: District;
      };
      categories: {
        Row: Category;
      };
      departments: {
        Row: Department;
      };
      favorites: {
        Row: Favorite;
        Insert: Omit<Favorite, 'id' | 'created_at'>;
      };
      collections: {
        Row: Collection;
        Insert: Omit<Collection, 'id' | 'created_at' | 'updated_at'>;
      };
      search_logs: {
        Row: SearchLog;
        Insert: Omit<SearchLog, 'id' | 'created_at'>;
      };
    };
  };
};

export interface Archive {
  id: string;
  title: string;
  title_kannada?: string;
  description?: string;
  description_kannada?: string;
  category_id?: string;
  district_id?: string;
  department_id?: string;
  document_type: string;
  file_url?: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  page_count?: number;
  year?: number;
  decade?: string;
  date_recorded?: string;
  date_digitized?: string;
  accession_number?: string;
  reference_number?: string;
  language?: string;
  status?: string;
  access_level?: string;
  tags?: string[];
  keywords?: string[];
  subjects?: string[];
  source?: string;
  author?: string;
  publisher?: string;
  location?: string;
  taluk?: string;
  village?: string;
  survey_number?: string;
  view_count?: number;
  download_count?: number;
  bookmark_count?: number;
  relevance_score?: number;
  is_featured?: boolean;
  has_ocr?: boolean;
  has_embedding?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  // Joined fields
  categories?: Category;
  districts?: District;
  departments?: Department;
}

export interface District {
  id: string;
  name: string;
  name_kannada: string;
  division: string;
  headquarter: string;
  taluk_count?: number;
  area_sqkm?: number;
  population?: number;
  description?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_kannada: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  record_count?: number;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  name_kannada: string;
  code: string;
  description?: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  archive_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public?: boolean;
  cover_image?: string;
  created_at: string;
  updated_at?: string;
}

export interface SearchLog {
  id: string;
  query: string;
  user_id?: string;
  results_count?: number;
  filters?: Record<string, unknown>;
  response_time_ms?: number;
  clicked_archive_id?: string;
  session_id?: string;
  created_at: string;
}
