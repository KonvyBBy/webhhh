"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Mail, ArrowLeft, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface Letter {
  letter_id?: number;
  id?: number;
  subject?: string;
  title?: string;
  from?: string;
  sender?: string;
  date?: string;
  received_date?: string;
  body?: string;
  text?: string;
  html?: string;
}

export default function LettersPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [emailUrl, setEmailUrl] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.orders) {
          const order = d.orders.find((o: { id: number }) => String(o.id) === orderId);
          if (order) {
            // Extract emailLoginUrl from credentials
            try {
              const creds = JSON.parse(order.credentials);
              const item = creds.status === "ok" ? creds.item : creds;
              const ed = item.emailLoginData || {};
              setEmailUrl(ed.emailLoginUrl || item.emailLoginUrl || "");
            } catch { /* */ }
            return fetch(`/api/letters/${order.item_id}`);
          }
        }
        throw new Error("Order not found");
      })
      .then((r) => r && r.json())
      .then((d) => {
        if (d && d.letters) setLetters(d.letters);
        if (d && d.error) setError(d.error);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <div className="max-w-[800px] mx-auto px-4 py-12 text-center text-[#8b949e] text-sm">Loading letters...</div>
  );

  if (error) return (
    <div className="max-w-[800px] mx-auto px-4 py-12">
      <Link href="/orders" className="inline-flex items-center gap-1 text-xs text-[#58a6ff] hover:underline mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to orders
      </Link>
      <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg p-4 text-sm text-[#f85149]">
        <p className="font-medium mb-1">Could not fetch letters</p>
        <p className="text-xs text-[#8b949e]">This feature requires the &quot;letters&quot; scope on your API token. You can enable it at LZT.</p>
        {emailUrl && (
          <a href={emailUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg transition-colors">
            Login to email provider instead
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">
      <Link href="/orders" className="inline-flex items-center gap-1 text-xs text-[#58a6ff] hover:underline mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to orders
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-[#58a6ff]" />
        <h1 className="text-lg font-semibold text-white">Account Letters</h1>
        <span className="text-xs text-[#8b949e]">({letters.length} letters)</span>
      </div>

      {letters.length === 0 ? (
        <div className="text-center py-16 bg-[#161b22] border border-[#30363d] rounded-lg">
          <Mail className="w-10 h-10 text-[#8b949e] mx-auto mb-3" />
          <p className="text-[#8b949e] text-sm">No letters found</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {letters.map((letter, i) => {
            const id = letter.letter_id || letter.id || i;
            const subject = letter.subject || letter.title || "(No subject)";
            const sender = letter.from || letter.sender || "Unknown";
            const date = letter.date || letter.received_date || "";
            const body = letter.body || letter.text || letter.html || "";
            const open = expandedId === id;

            return (
              <div key={id} className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                <button onClick={() => setExpandedId(open ? null : id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#21262d]/50 transition-colors text-left">
                  <div className="w-7 h-7 bg-[#21262d] rounded flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-[#8b949e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{subject}</p>
                    <p className="text-xs text-[#8b949e] truncate">{sender}</p>
                  </div>
                  {date && (
                    <span className="text-xs text-[#8b949e] shrink-0">{date.slice(0, 10)}</span>
                  )}
                  {open ? <ChevronUp className="w-3.5 h-3.5 text-[#8b949e]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8b949e]" />}
                </button>
                {open && body && (
                  <div className="border-t border-[#30363d] p-3">
                    <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 max-h-[400px] overflow-y-auto">
                      <pre className="text-xs text-[#c9d1d9] whitespace-pre-wrap font-sans leading-relaxed">{body}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
