import { useState } from "react";
import { analyzeArticle } from "./lib/api";
import type { Keyword } from "./lib/types";
import { GlobeVisualization } from "./components/Globe";

export default function App() {
  const [url, setUrl] = useState<string>("https://example.com");
  const [words, setWords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function analyze() {
    setLoading(true);
    setError("");

    try {
      const data = await analyzeArticle(url);
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

      {words.length > 0 && (
        <div style={{ height: 500, marginTop: 20 }}>
          <GlobeVisualization keywords={words} />
        </div>
      )}
    </div>
  );
}
