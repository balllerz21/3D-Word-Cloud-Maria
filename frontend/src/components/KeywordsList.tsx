import type { Keyword } from "../lib/types";

export function KeywordsList(props: {
  keywords: Keyword[];
  isLoading: boolean;
}) {
  const { keywords, isLoading } = props;

  if (isLoading) return <div style={{ opacity: 0.7 }}>Loading…</div>;
  if (!keywords.length) return <div style={{ opacity: 0.7 }}>No keywords yet.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {keywords.map((k) => (
        <div
          key={k.word}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span>{k.word}</span>
          <span style={{ opacity: 0.7 }}>{k.weight.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
