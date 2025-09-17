import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase server environment variables');
}

// Server-side Supabase client (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: string;
          logo: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: string;
          logo?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: string;
          logo?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subaccounts: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          slug: string;
          status: string;
          logo: string | null;
          website: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          slug: string;
          status?: string;
          logo?: string | null;
          website?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          name?: string;
          slug?: string;
          status?: string;
          logo?: string | null;
          website?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subaccount_settings: {
        Row: {
          id: string;
          subaccount_id: string;
          google_review_link: string | null;
          review_threshold: number;
          thank_you_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subaccount_id: string;
          google_review_link?: string | null;
          review_threshold?: number;
          thank_you_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subaccount_id?: string;
          google_review_link?: string | null;
          review_threshold?: number;
          thank_you_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          subaccount_id: string;
          rating: number;
          subject: string;
          comment: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subaccount_id: string;
          rating: number;
          subject: string;
          comment: string;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subaccount_id?: string;
          rating?: number;
          subject?: string;
          comment?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          password: string | null;
          phone: string | null;
          locale: string;
          preferences: any | null;
          email_verified: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          image?: string | null;
          password?: string | null;
          phone?: string | null;
          locale?: string;
          preferences?: any | null;
          email_verified?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          image?: string | null;
          password?: string | null;
          phone?: string | null;
          locale?: string;
          preferences?: any | null;
          email_verified?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_agency_memberships: {
        Row: {
          id: string;
          user_id: string;
          agency_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agency_id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agency_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subaccount_users: {
        Row: {
          id: string;
          user_id: string;
          subaccount_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subaccount_id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subaccount_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}