"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAuth, checkAuth } from "@/lib/auth";

export default function JournalAuthPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    if (checkAuth()) {
      router.push("/dashboard");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (setAuth(password)) {
      router.push("/dashboard");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <div className="text-[#D0CCCC]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center">
      <div className="bg-[#867979]/10 border border-[#867979]/30 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-6 text-white text-center">
          Dashboard Access
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#D0CCCC] mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#171717] border border-[#867979]/30 rounded-lg px-4 py-2 text-[#D0CCCC] focus:outline-none focus:border-[#867979]"
              placeholder="Enter password"
              autoFocus
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#867979] hover:bg-[#756868] rounded-lg text-white transition"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
