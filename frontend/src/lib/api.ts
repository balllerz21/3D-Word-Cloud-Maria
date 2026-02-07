import type { AnalyzeResponse } from "./types";

const API_BASE = "http://127.0.0.1:8000";

export async function analyzeArticle(url: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error: ${res.status}${text ? ` — ${text}` : ""}`);
  }

  return (await res.json()) as AnalyzeResponse;
}
