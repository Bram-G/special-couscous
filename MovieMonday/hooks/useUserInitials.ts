import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook to get user initials from username
 * For single word usernames, it returns first two letters
 * For multiple words, it returns first letter of first two words
 * Returns "?" if no username is available
 */
export const useUserInitials = () => {
  const { user } = useAuth();

  if (!user || !user.username) {
    return "?";
  }

  const username = user.username;

  // For single word usernames, take first two letters
  if (!username.includes(" ")) {
    return username.substring(0, 2).toUpperCase();
  }

  // For multiple words, take first letter of each word
  const nameParts = username.split(" ");

  return (nameParts[0][0] + (nameParts[1]?.[0] || "")).toUpperCase();
};

export default useUserInitials;
