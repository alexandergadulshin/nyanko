"use client";

/**
 * MessageHandler — shows a transient banner when a `?message=...` query
 * param is present. Split out of the home page so the rest of the page
 * can be a server component.
 */

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function MessageHandler() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const messageParam = searchParams.get("message");
    if (messageParam) {
      setMessage(messageParam);
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg border border-green-500/30 backdrop-blur-sm">
      {message}
    </div>
  );
}
