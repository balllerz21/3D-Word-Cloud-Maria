import { useState } from "react";
import { analyzeArticle } from "./lib/api";
import type { Keyword } from "./lib/types";
import { Globe3D } from "./components/Globe";
import "./App.css";

export default function App() {
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState("");

  function isValidHttpUrl(value: string) {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  const handleAnalyze = async () => {
    const trimmed = url.trim();
    if (!trimmed || isLoading) return;

    if (!isValidHttpUrl(trimmed)) {
      setError("Please enter a valid http(s) URL.");
      setKeywords([]);
      setHasAnalyzed(false);
      return;
    }

    setIsLoading(true);
    setError("");
    setHasAnalyzed(false);
    setKeywords([]);

    try {
      const data = await analyzeArticle(trimmed);
      const words = data.words ?? [];

      if (words.length === 0) {
        setError("No keywords found for this article.");
        setHasAnalyzed(false);
      } else {
        setKeywords(words);
        setHasAnalyzed(true);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to analyze article");
      setHasAnalyzed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const showGlobe =
    hasAnalyzed &&
    !isLoading &&
    !error &&
    keywords.length > 0;

  return (
    <div className="appShell">
      <header className="appHeader">
        <h1 className="title">3D Word Cloud</h1>
        <p className="subtitle">Paste a news article URL to extract topics.</p>
      </header>

      <main className="appMain">
        <div className="controlsRow">
          <input
            className="urlInput"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAnalyze();
            }}
            placeholder="https://..."
            disabled={isLoading}
          />

          <button
            className="analyzeBtn"
            onClick={handleAnalyze}
            disabled={isLoading || !url.trim()}
          >
            {isLoading ? "Analyzing..." : "Analyze Article"}
          </button>
        </div>

        {error && (
          <div className="errorText">
            {error}
          </div>
        )}

        <section className="panel">
          <div className="panelTitle">3D Globe Visualization</div>

          <div className="globeStage">
            {isLoading && (
              <div className="loadingOverlay">
                <div className="spinner" />
                <div className="loadingText">Analyzing…</div>
              </div>
            )}

            {!isLoading && !hasAnalyzed && !error && (
              <div className="emptyState">
                Paste a URL and click Analyze to generate the word cloud.
              </div>
            )}

            {showGlobe && (
              <Globe3D keywords={keywords} isActive={true} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
