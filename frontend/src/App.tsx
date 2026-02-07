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

  const handleAnalyze = async () => {
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setHasAnalyzed(false);
    setError("");

    try {
      const data = await analyzeArticle(url.trim());
      setKeywords(data.words ?? []);
      setHasAnalyzed(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to analyze article");
      setKeywords([]);
    } finally {
      setIsLoading(false);
    }
  };

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
            Analyze Article
          </button>
        </div>

        {error ? <div className="errorText">{error}</div> : null}

        <section className="panel">
          <div className="panelTitle">3D Globe Visualization</div>

          <div className="globeStage">
            {isLoading && (
              <div className="loadingOverlay">
                <div className="spinner" />
                <div className="loadingText">Analyzing…</div>
              </div>
            )}

            {!isLoading && !hasAnalyzed && (
              <div className="emptyState">
                Paste a URL and click Analyze to generate the word cloud.
              </div>
            )}

            {hasAnalyzed && (
  <Globe3D keywords={keywords} isActive={!isLoading && keywords.length > 0} />
)}
          </div>
        </section>
      </main>
    </div>
  );
}
