export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_reflections: {
        Row: {
          created_at: string
          ecosystem_delta: number | null
          energy_mindful: boolean | null
          estimated_kg_co2_today: number | null
          id: string
          meals: string | null
          mood: string | null
          notes: string | null
          reflection_date: string
          transport_mode: string | null
          updated_at: string
          user_id: string
          waste_mindful: boolean | null
          water_mindful: boolean | null
        }
        Insert: {
          created_at?: string
          ecosystem_delta?: number | null
          energy_mindful?: boolean | null
          estimated_kg_co2_today?: number | null
          id?: string
          meals?: string | null
          mood?: string | null
          notes?: string | null
          reflection_date?: string
          transport_mode?: string | null
          updated_at?: string
          user_id: string
          waste_mindful?: boolean | null
          water_mindful?: boolean | null
        }
        Update: {
          created_at?: string
          ecosystem_delta?: number | null
          energy_mindful?: boolean | null
          estimated_kg_co2_today?: number | null
          id?: string
          meals?: string | null
          mood?: string | null
          notes?: string | null
          reflection_date?: string
          transport_mode?: string | null
          updated_at?: string
          user_id?: string
          waste_mindful?: boolean | null
          water_mindful?: boolean | null
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          ai_extraction: Json | null
          baseline_kg_co2_per_month: number | null
          bill_image_path: string | null
          climate_goal: string | null
          created_at: string
          diet: string | null
          energy_source: string | null
          home_type: string | null
          household_size: number | null
          monthly_bill_amount: number | null
          motivation: string | null
          notification_preference: string | null
          transport: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_extraction?: Json | null
          baseline_kg_co2_per_month?: number | null
          bill_image_path?: string | null
          climate_goal?: string | null
          created_at?: string
          diet?: string | null
          energy_source?: string | null
          home_type?: string | null
          household_size?: number | null
          monthly_bill_amount?: number | null
          motivation?: string | null
          notification_preference?: string | null
          transport?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_extraction?: Json | null
          baseline_kg_co2_per_month?: number | null
          bill_image_path?: string | null
          climate_goal?: string | null
          created_at?: string
          diet?: string | null
          energy_source?: string | null
          home_type?: string | null
          household_size?: number | null
          monthly_bill_amount?: number | null
          motivation?: string | null
          notification_preference?: string | null
          transport?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string | null
          onboarding_completed: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string | null
          onboarding_completed?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string | null
          onboarding_completed?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          created_at: string
          current_streak: number
          last_reflection_date: string | null
          longest_streak: number
          total_reflections: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_reflection_date?: string | null
          longest_streak?: number
          total_reflections?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_reflection_date?: string | null
          longest_streak?: number
          total_reflections?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string
          document_date: string | null
          estimated_kg_co2: number | null
          extraction: Json | null
          file_path: string
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["document_status"]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_date?: string | null
          estimated_kg_co2?: number | null
          extraction?: Json | null
          file_path: string
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_date?: string | null
          estimated_kg_co2?: number | null
          extraction?: Json | null
          file_path?: string
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upsert_streak_for_user: {
        Args: { _today: string; _user_id: string }
        Returns: {
          created_at: string
          current_streak: number
          last_reflection_date: string | null
          longest_streak: number
          total_reflections: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
      document_kind:
        | "electricity_bill"
        | "fuel_receipt"
        | "grocery_receipt"
        | "water_bill"
        | "other"
      document_status: "processing" | "processed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      document_kind: [
        "electricity_bill",
        "fuel_receipt",
        "grocery_receipt",
        "water_bill",
        "other",
      ],
      document_status: ["processing", "processed", "failed"],
    },
  },
} as const
