import { auth } from "./firebase";

/**
 * Get authorization headers with Firebase ID token for edge function calls.
 * This sends the actual Firebase JWT for server-side verification,
 * preventing UID spoofing attacks.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
