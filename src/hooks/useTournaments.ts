import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Tournament {
  id: string;
  title: string;
  game_type: string;
  description: string | null;
  entry_fee: number;
  entry_fee_type: "credits" | "cash" | "both";
  prize_pool: number;
  max_participants: number | null;
  current_participants: number;
  status: "upcoming" | "live" | "completed" | "cancelled";
  starts_at: string;
  ends_at: string | null;
  rules: string | null;
}

export interface TournamentEntry {
  id: string;
  tournament_id: string;
  profile_id: string;
  fee_paid: number;
  fee_type: "credits" | "cash" | "both";
  placement: number | null;
  prize_won: number;
  joined_at: string;
}

export const useTournaments = (
  profileId: string | undefined,
  credits: number = 0,
  cash: number = 0
) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myEntries, setMyEntries] = useState<TournamentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("*")
        .in("status", ["upcoming", "live"])
        .order("starts_at", { ascending: true });

      setTournaments((tournamentsData || []) as Tournament[]);

      if (profileId) {
        const { data: entriesData } = await supabase
          .from("tournament_entries")
          .select("*")
          .eq("profile_id", profileId);

        setMyEntries((entriesData || []) as TournamentEntry[]);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const joinTournament = async (
    tournament: Tournament,
    payWithCredits: boolean = true
  ) => {
    if (!profileId) return;

    const balance = payWithCredits ? credits : cash;
    if (balance < tournament.entry_fee) {
      toast.error(
        `Insufficient ${payWithCredits ? "credits" : "cash"} balance`
      );
      return;
    }

    if (
      tournament.max_participants &&
      tournament.current_participants >= tournament.max_participants
    ) {
      toast.error("Tournament is full");
      return;
    }

    try {
      setJoining(tournament.id);

      // Deduct from wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      if (!wallet) {
        toast.error("Wallet not found");
        return;
      }

      const walletData = wallet as { credits: number; cash: number };
      const updateField = payWithCredits ? "credits" : "cash";
      const currentBalance = payWithCredits
        ? walletData.credits
        : walletData.cash;

      await supabase
        .from("wallets")
        .update({ [updateField]: currentBalance - tournament.entry_fee })
        .eq("profile_id", profileId);

      // Create entry
      await supabase.from("tournament_entries").insert({
        tournament_id: tournament.id,
        profile_id: profileId,
        fee_paid: tournament.entry_fee,
        fee_type: payWithCredits ? "credits" : "cash",
      });

      // Update participant count
      await supabase
        .from("tournaments")
        .update({
          current_participants: tournament.current_participants + 1,
        })
        .eq("id", tournament.id);

      // Record transaction
      await supabase.from("transactions").insert({
        profile_id: profileId,
        type: payWithCredits ? "match_entry_credit" : "match_entry_cash",
        amount: -tournament.entry_fee,
        description: `Tournament entry: ${tournament.title}`,
        reference_id: tournament.id,
      });

      toast.success("Joined tournament!", {
        description: tournament.title,
      });

      await fetchData();
    } catch (err) {
      console.error("Error joining tournament:", err);
      toast.error("Failed to join tournament");
    } finally {
      setJoining(null);
    }
  };

  const hasJoined = (tournamentId: string) => {
    return myEntries.some((e) => e.tournament_id === tournamentId);
  };

  return {
    tournaments,
    myEntries,
    loading,
    joining,
    joinTournament,
    hasJoined,
    refreshTournaments: fetchData,
  };
};
