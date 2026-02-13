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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          last_login_date: string | null
          longest_streak: number | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_login_date?: string | null
          longest_streak?: number | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_login_date?: string | null
          longest_streak?: number | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_streaks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          transaction_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_name: string | null
          account_number: string
          id: string
          is_active: boolean | null
          min_deposit: number | null
          min_withdrawal: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          id?: string
          is_active?: boolean | null
          min_deposit?: number | null
          min_withdrawal?: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          id?: string
          is_active?: boolean | null
          min_deposit?: number | null
          min_withdrawal?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          firebase_uid: string
          id: string
          is_banned: boolean | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          firebase_uid: string
          id?: string
          is_banned?: boolean | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          firebase_uid?: string
          id?: string
          is_banned?: boolean | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_credited: boolean | null
          created_at: string
          deposit_bonus_credited: boolean | null
          id: string
          referred_id: string
          referrer_id: string
          total_commission: number | null
        }
        Insert: {
          bonus_credited?: boolean | null
          created_at?: string
          deposit_bonus_credited?: boolean | null
          id?: string
          referred_id: string
          referrer_id: string
          total_commission?: number | null
        }
        Update: {
          bonus_credited?: boolean | null
          created_at?: string
          deposit_bonus_credited?: boolean | null
          id?: string
          referred_id?: string
          referrer_id?: string
          total_commission?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spin_history: {
        Row: {
          created_at: string
          credits_won: number
          id: string
          profile_id: string
          spin_date: string
        }
        Insert: {
          created_at?: string
          credits_won: number
          id?: string
          profile_id: string
          spin_date?: string
        }
        Update: {
          created_at?: string
          credits_won?: number
          id?: string
          profile_id?: string
          spin_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "spin_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_claims: {
        Row: {
          claimed_at: string
          credits_earned: number
          id: string
          ip_address: unknown
          profile_id: string
          task_id: string
        }
        Insert: {
          claimed_at?: string
          credits_earned: number
          id?: string
          ip_address?: unknown
          profile_id: string
          task_id: string
        }
        Update: {
          claimed_at?: string
          credits_earned?: number
          id?: string
          ip_address?: unknown
          profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_claims_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reward_credits: number
          sort_order: number | null
          step_url: string | null
          task_id: string
          title: string
          verification_seconds: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reward_credits?: number
          sort_order?: number | null
          step_url?: string | null
          task_id: string
          title: string
          verification_seconds?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reward_credits?: number
          sort_order?: number | null
          step_url?: string | null
          task_id?: string
          title?: string
          verification_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_steps_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          cooldown_hours: number | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_claims_per_period: number | null
          reset_type: Database["public"]["Enums"]["reset_type"]
          reward_credits: number
          sort_order: number | null
          task_type: Database["public"]["Enums"]["task_type"]
          task_url: string | null
          title: string
          verification_seconds: number | null
        }
        Insert: {
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_claims_per_period?: number | null
          reset_type?: Database["public"]["Enums"]["reset_type"]
          reward_credits?: number
          sort_order?: number | null
          task_type?: Database["public"]["Enums"]["task_type"]
          task_url?: string | null
          title: string
          verification_seconds?: number | null
        }
        Update: {
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_claims_per_period?: number | null
          reset_type?: Database["public"]["Enums"]["reset_type"]
          reward_credits?: number
          sort_order?: number | null
          task_type?: Database["public"]["Enums"]["task_type"]
          task_url?: string | null
          title?: string
          verification_seconds?: number | null
        }
        Relationships: []
      }
      tournament_entries: {
        Row: {
          fee_paid: number
          fee_type: Database["public"]["Enums"]["entry_fee_type"]
          id: string
          joined_at: string
          placement: number | null
          prize_won: number | null
          profile_id: string
          tournament_id: string
        }
        Insert: {
          fee_paid: number
          fee_type: Database["public"]["Enums"]["entry_fee_type"]
          id?: string
          joined_at?: string
          placement?: number | null
          prize_won?: number | null
          profile_id: string
          tournament_id: string
        }
        Update: {
          fee_paid?: number
          fee_type?: Database["public"]["Enums"]["entry_fee_type"]
          id?: string
          joined_at?: string
          placement?: number | null
          prize_won?: number | null
          profile_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_entries_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          current_participants: number | null
          description: string | null
          ends_at: string | null
          entry_fee: number
          entry_fee_type: Database["public"]["Enums"]["entry_fee_type"]
          game_type: string
          id: string
          max_participants: number | null
          prize_pool: number
          room_id: string | null
          room_password: string | null
          rules: string | null
          starts_at: string
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
        }
        Insert: {
          created_at?: string
          current_participants?: number | null
          description?: string | null
          ends_at?: string | null
          entry_fee?: number
          entry_fee_type?: Database["public"]["Enums"]["entry_fee_type"]
          game_type: string
          id?: string
          max_participants?: number | null
          prize_pool?: number
          room_id?: string | null
          room_password?: string | null
          rules?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
        }
        Update: {
          created_at?: string
          current_participants?: number | null
          description?: string | null
          ends_at?: string | null
          entry_fee?: number
          entry_fee_type?: Database["public"]["Enums"]["entry_fee_type"]
          game_type?: string
          id?: string
          max_participants?: number | null
          prize_pool?: number
          room_id?: string | null
          room_password?: string | null
          rules?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string
          description: string | null
          id: string
          profile_id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          description?: string | null
          id?: string
          profile_id: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_task_steps: {
        Row: {
          completed_at: string
          credits_earned: number
          id: string
          profile_id: string
          task_step_id: string
        }
        Insert: {
          completed_at?: string
          credits_earned?: number
          id?: string
          profile_id: string
          task_step_id: string
        }
        Update: {
          completed_at?: string
          credits_earned?: number
          id?: string
          profile_id?: string
          task_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_steps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_task_steps_task_step_id_fkey"
            columns: ["task_step_id"]
            isOneToOne: false
            referencedRelation: "task_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          claims_today: number | null
          created_at: string
          id: string
          is_claimed: boolean | null
          is_completed: boolean | null
          last_claimed_at: string | null
          profile_id: string
          progress: number | null
          task_id: string
          updated_at: string
        }
        Insert: {
          claims_today?: number | null
          created_at?: string
          id?: string
          is_claimed?: boolean | null
          is_completed?: boolean | null
          last_claimed_at?: string | null
          profile_id: string
          progress?: number | null
          task_id: string
          updated_at?: string
        }
        Update: {
          claims_today?: number | null
          created_at?: string
          id?: string
          is_claimed?: boolean | null
          is_completed?: boolean | null
          last_claimed_at?: string | null
          profile_id?: string
          progress?: number | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          cash: number
          created_at: string
          credits: number
          id: string
          profile_id: string
          total_earned: number
          updated_at: string
        }
        Insert: {
          cash?: number
          created_at?: string
          credits?: number
          id?: string
          profile_id: string
          total_earned?: number
          updated_at?: string
        }
        Update: {
          cash?: number
          created_at?: string
          credits?: number
          id?: string
          profile_id?: string
          total_earned?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_number: string
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_at: string | null
          processed_by: string | null
          profile_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          account_number: string
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          processed_by?: string | null
          profile_id: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          account_number?: string
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          processed_by?: string | null
          profile_id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      deposit_status: "pending" | "approved" | "rejected"
      entry_fee_type: "credits" | "cash" | "both"
      payment_method: "bkash" | "nagad" | "rocket" | "binance"
      reset_type: "daily" | "weekly" | "never"
      task_type: "daily" | "achievement" | "special"
      tournament_status: "upcoming" | "live" | "completed" | "cancelled"
      transaction_type:
        | "credit_earn"
        | "cash_deposit"
        | "cash_withdraw"
        | "match_entry_credit"
        | "match_entry_cash"
        | "prize_won"
        | "referral_bonus"
        | "spin_win"
        | "quiz_win"
      withdrawal_status: "pending" | "processing" | "completed" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      deposit_status: ["pending", "approved", "rejected"],
      entry_fee_type: ["credits", "cash", "both"],
      payment_method: ["bkash", "nagad", "rocket", "binance"],
      reset_type: ["daily", "weekly", "never"],
      task_type: ["daily", "achievement", "special"],
      tournament_status: ["upcoming", "live", "completed", "cancelled"],
      transaction_type: [
        "credit_earn",
        "cash_deposit",
        "cash_withdraw",
        "match_entry_credit",
        "match_entry_cash",
        "prize_won",
        "referral_bonus",
        "spin_win",
        "quiz_win",
      ],
      withdrawal_status: ["pending", "processing", "completed", "rejected"],
    },
  },
} as const
