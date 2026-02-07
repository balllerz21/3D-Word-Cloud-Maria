import { useState } from "react";

type WordItem = {
  word: string;
  weight: number;
};

export default function App() {
  const [url, setUrl] = useState<string>("https://example.com");
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status}`);
      }

      const data = await res.json();
      setWords(data.words ?? []);
    } catch (e: any) {
      setError(e.message ?? "Request failed");
      setWords([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32, fontFamily: "system-ui" }}>
      <h1>3D Word Cloud</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste article URL"
          style={{ width: 520, padding: 10 }}
        />
        <button onClick={analyze} disabled={loading || !url}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <div style={{ marginTop: 16 }}>
        {words.map((w) => (
          <div key={w.word}>
            {w.word} — {w.weight.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
