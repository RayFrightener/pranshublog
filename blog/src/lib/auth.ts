export function checkAuth(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("journal-auth") === "authenticated";
}

export function setAuth(password: string): boolean {
  // Simple password check - change this to your desired password
  const correctPassword =
    process.env.NEXT_PUBLIC_JOURNAL_PASSWORD || "your-password-here";
  if (password === correctPassword) {
    localStorage.setItem("journal-auth", "authenticated");
    return true;
  }
  return false;
}

export function clearAuth() {
  localStorage.removeItem("journal-auth");
}
