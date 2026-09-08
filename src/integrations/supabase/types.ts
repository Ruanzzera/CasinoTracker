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
      bet_and_win_entries: {
        Row: {
          account: string[]
          bet_value: number
          casino_entry_id: string | null
          created_at: string
          entry_date: string
          entry_time: string
          final_bankroll: number
          finalized_month: string | null
          game: string
          house: string
          id: string
          initial_bankroll: number
          prize_game: string
          required_bets: number
          spin_bet: number
          spin_count: number
          spin_prize: number
          user_id: string
        }
        Insert: {
          account?: string[]
          bet_value?: number
          casino_entry_id?: string | null
          created_at?: string
          entry_date?: string
          entry_time?: string
          final_bankroll?: number
          finalized_month?: string | null
          game?: string
          house: string
          id?: string
          initial_bankroll?: number
          prize_game?: string
          required_bets?: number
          spin_bet?: number
          spin_count?: number
          spin_prize?: number
          user_id: string
        }
        Update: {
          account?: string[]
          bet_value?: number
          casino_entry_id?: string | null
          created_at?: string
          entry_date?: string
          entry_time?: string
          final_bankroll?: number
          finalized_month?: string | null
          game?: string
          house?: string
          id?: string
          initial_bankroll?: number
          prize_game?: string
          required_bets?: number
          spin_bet?: number
          spin_count?: number
          spin_prize?: number
          user_id?: string
        }
        Relationships: []
      }
      casino_entries: {
        Row: {
          account: string
          amount: number
          created_at: string
          game: string
          house: string
          id: string
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          account?: string
          amount: number
          created_at?: string
          game: string
          house: string
          id?: string
          notes?: string | null
          type: string
          user_id: string
        }
        Update: {
          account?: string
          amount?: number
          created_at?: string
          game?: string
          house?: string
          id?: string
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      casino_goals: {
        Row: {
          created_at: string
          id: string
          target_amount: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_amount: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_amount?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      casino_reminders: {
        Row: {
          created_at: string
          days_of_week: number[]
          description: string | null
          house: string
          id: string
          is_active: boolean
          reminder_time: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          description?: string | null
          house: string
          id?: string
          is_active?: boolean
          reminder_time: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          description?: string | null
          house?: string
          id?: string
          is_active?: boolean
          reminder_time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_task_completions: {
        Row: {
          account: string
          created_at: string
          done_date: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          account: string
          created_at?: string
          done_date: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          account?: string
          created_at?: string
          done_date?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          accounts: string[]
          created_at: string
          description: string | null
          entry_type: string | null
          house: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accounts?: string[]
          created_at?: string
          description?: string | null
          entry_type?: string | null
          house?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accounts?: string[]
          created_at?: string
          description?: string | null
          entry_type?: string | null
          house?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_balances: {
        Row: {
          account: string
          amount: number
          closed_at: string | null
          created_at: string
          house: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account: string
          amount?: number
          closed_at?: string | null
          created_at?: string
          house: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string
          amount?: number
          closed_at?: string | null
          created_at?: string
          house?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_sent_log: {
        Row: {
          alert_key: string
          created_at: string
          id: string
          sent_date: string
          user_id: string
        }
        Insert: {
          alert_key: string
          created_at?: string
          id?: string
          sent_date?: string
          user_id: string
        }
        Update: {
          alert_key?: string
          created_at?: string
          id?: string
          sent_date?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roulette_matches: {
        Row: {
          bet_value: number
          created_at: string
          finished_at: string | null
          id: string
          match_date: string
          mode_id: string | null
          mode_name: string
          payout_multiplier: number
          profit: number
          project_id: string
          score: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_value?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          match_date?: string
          mode_id?: string | null
          mode_name?: string
          payout_multiplier?: number
          profit?: number
          project_id: string
          score?: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_value?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          match_date?: string
          mode_id?: string | null
          mode_name?: string
          payout_multiplier?: number
          profit?: number
          project_id?: string
          score?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roulette_modes: {
        Row: {
          created_at: string
          default_bet: number
          id: string
          is_default: boolean
          match_rounds: number
          max_gales: number
          name: string
          payout_multiplier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_bet?: number
          id?: string
          is_default?: boolean
          match_rounds?: number
          max_gales?: number
          name: string
          payout_multiplier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_bet?: number
          id?: string
          is_default?: boolean
          match_rounds?: number
          max_gales?: number
          name?: string
          payout_multiplier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roulette_projects: {
        Row: {
          bet_value: number
          created_at: string
          current_bankroll: number
          id: string
          initial_bankroll: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_value?: number
          created_at?: string
          current_bankroll?: number
          id?: string
          initial_bankroll?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_value?: number
          created_at?: string
          current_bankroll?: number
          id?: string
          initial_bankroll?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roulette_spins: {
        Row: {
          bet_value: number
          created_at: string
          gale_count: number
          gale_stake: number | null
          id: string
          is_gale: boolean
          match_id: string
          played_at: string
          profit: number
          project_id: string
          result: string
          round_index: number
          user_id: string
        }
        Insert: {
          bet_value?: number
          created_at?: string
          gale_count?: number
          gale_stake?: number | null
          id?: string
          is_gale?: boolean
          match_id: string
          played_at?: string
          profit?: number
          project_id: string
          result: string
          round_index: number
          user_id: string
        }
        Update: {
          bet_value?: number
          created_at?: string
          gale_count?: number
          gale_stake?: number | null
          id?: string
          is_gale?: boolean
          match_id?: string
          played_at?: string
          profit?: number
          project_id?: string
          result?: string
          round_index?: number
          user_id?: string
        }
        Relationships: []
      }
      tip_jar_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source_entry_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source_entry_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source_entry_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tournament_entries: {
        Row: {
          amount_spent: number
          amount_won: number
          created_at: string
          end_date: string
          finalized_month: string | null
          house: string
          id: string
          prize_description: string | null
          slot: string
          start_date: string
          user_id: string
        }
        Insert: {
          amount_spent?: number
          amount_won?: number
          created_at?: string
          end_date: string
          finalized_month?: string | null
          house: string
          id?: string
          prize_description?: string | null
          slot?: string
          start_date: string
          user_id: string
        }
        Update: {
          amount_spent?: number
          amount_won?: number
          created_at?: string
          end_date?: string
          finalized_month?: string | null
          house?: string
          id?: string
          prize_description?: string | null
          slot?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      tournament_schedule: {
        Row: {
          created_at: string
          day_of_week: number | null
          house: string
          id: string
          is_active: boolean
          name: string
          schedule_type: string
          specific_date: string | null
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          house?: string
          id?: string
          is_active?: boolean
          name?: string
          schedule_type?: string
          specific_date?: string | null
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          house?: string
          id?: string
          is_active?: boolean
          name?: string
          schedule_type?: string
          specific_date?: string | null
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tournament_sessions: {
        Row: {
          bet_value: number
          created_at: string
          final_bankroll: number
          id: string
          initial_bankroll: number
          rollover_game: string
          session_date: string
          spins_count: number
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_value?: number
          created_at?: string
          final_bankroll?: number
          id?: string
          initial_bankroll?: number
          rollover_game?: string
          session_date?: string
          spins_count?: number
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_value?: number
          created_at?: string
          final_bankroll?: number
          id?: string
          initial_bankroll?: number
          rollover_game?: string
          session_date?: string
          spins_count?: number
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_sessions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          actual_winnings: number | null
          created_at: string
          current_position: number
          end_date: string
          finalized_month: string | null
          house: string
          id: string
          initial_points: number
          initial_position: number
          manual_invested: number | null
          name: string
          points_per_real: number
          points_player_above: number
          points_player_below: number
          prize_cash_value: number
          prize_position_cutoff: number
          prize_spins_count: number
          prize_spins_value: number
          prize_type: string
          rollover_game: string
          start_date: string
          target_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_winnings?: number | null
          created_at?: string
          current_position?: number
          end_date?: string
          finalized_month?: string | null
          house: string
          id?: string
          initial_points?: number
          initial_position?: number
          manual_invested?: number | null
          name?: string
          points_per_real?: number
          points_player_above?: number
          points_player_below?: number
          prize_cash_value?: number
          prize_position_cutoff?: number
          prize_spins_count?: number
          prize_spins_value?: number
          prize_type?: string
          rollover_game?: string
          start_date?: string
          target_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_winnings?: number | null
          created_at?: string
          current_position?: number
          end_date?: string
          finalized_month?: string | null
          house?: string
          id?: string
          initial_points?: number
          initial_position?: number
          manual_invested?: number | null
          name?: string
          points_per_real?: number
          points_player_above?: number
          points_player_below?: number
          prize_cash_value?: number
          prize_position_cutoff?: number
          prize_spins_count?: number
          prize_spins_value?: number
          prize_type?: string
          rollover_game?: string
          start_date?: string
          target_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bet_and_win_create: {
        Args: {
          p_account?: string[]
          p_bet_value: number
          p_created_at: string
          p_entry_date: string
          p_entry_time: string
          p_final_bankroll: number
          p_house: string
          p_initial_bankroll: number
          p_prize_game: string
          p_required_bets: number
          p_rollover_game: string
          p_spin_bet: number
          p_spin_count: number
          p_spin_prize: number
        }
        Returns: {
          account: string[]
          bet_value: number
          casino_entry_id: string | null
          created_at: string
          entry_date: string
          entry_time: string
          final_bankroll: number
          finalized_month: string | null
          game: string
          house: string
          id: string
          initial_bankroll: number
          prize_game: string
          required_bets: number
          spin_bet: number
          spin_count: number
          spin_prize: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bet_and_win_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bet_and_win_delete: { Args: { p_id: string }; Returns: undefined }
      bet_and_win_update: {
        Args: {
          p_account?: string[]
          p_bet_value: number
          p_created_at: string
          p_entry_date: string
          p_entry_time: string
          p_final_bankroll: number
          p_house: string
          p_id: string
          p_initial_bankroll: number
          p_prize_game: string
          p_required_bets: number
          p_rollover_game: string
          p_spin_bet: number
          p_spin_count: number
          p_spin_prize: number
        }
        Returns: {
          account: string[]
          bet_value: number
          casino_entry_id: string | null
          created_at: string
          entry_date: string
          entry_time: string
          final_bankroll: number
          finalized_month: string | null
          game: string
          house: string
          id: string
          initial_bankroll: number
          prize_game: string
          required_bets: number
          spin_bet: number
          spin_count: number
          spin_prize: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "bet_and_win_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dashboard_summary: { Args: never; Returns: Json }
      library_names: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
