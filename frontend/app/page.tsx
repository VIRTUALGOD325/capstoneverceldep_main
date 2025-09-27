"use client";

import React, { useState } from 'react';

type AnalysisResult = any;

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError('Please choose a file first.');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Request failed');
      }
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>📄 DocInsight - Document Originality Analysis</h1>
      <p>Upload a document to analyze its originality and detect potential plagiarism.</p>
      <form onSubmit={onSubmit} style={{ marginTop: 16, marginBottom: 24 }}>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={loading} style={{ marginLeft: 12 }}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson' }}>❌ {error}</p>}
      {result && <AnalysisView result={result} />}
    </div>
  );
}

function AnalysisView({ result }: { result: any }) {
  const originality = result?.originality_analysis?.originality_metrics ?? {};
  const sentenceResults = result?.sentence_results ?? [];
  const topSpans = result?.originality_analysis?.top_risk_spans ?? [];
  const distribution = originality?.sentence_distribution ?? {};
  return (
    <div>
      <section>
        <h2>📊 Originality Analysis</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Metric label="Originality Score" value={percent(originality.originality_score)} />
          <Metric label="Plag. Coverage" value={percent(originality.plagiarized_coverage)} />
          <Metric label="Severity Index" value={fixed(originality.severity_index, 3)} />
          <Metric label="Sentences" value={originality.total_sentences ?? '—'} />
          <Metric label="Plagiarism Factor" value={fixed(originality.plagiarism_factor, 3, '—')} />
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>📈 Risk Distribution</h3>
        <div style={{ display: 'flex', gap: 24 }}>
          <Metric label="🔴 High Risk" value={distribution.HIGH ?? 0} />
          <Metric label="🟡 Medium Risk" value={distribution.MEDIUM ?? 0} />
          <Metric label="🟢 Low Risk" value={distribution.LOW ?? 0} />
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>⚠️ Top Risk Spans</h3>
        {topSpans.length === 0 ? (
          <p>No significant risk spans detected.</p>
        ) : (
          <ul>
            {topSpans.map((span: any, i: number) => (
              <li key={i} style={{ marginBottom: 12 }}>
                <details>
                  <summary>
                    {(span.risk_level === 'HIGH' ? '🔴' : '🟡')}{' '}
                    Risk Span {i + 1} - {span.risk_level} (Score: {fixed(span.avg_score, 3)})
                  </summary>
                  <div style={{ marginTop: 8 }}>
                    <p><strong>Preview:</strong> {span.preview_text ?? 'No preview available'}</p>
                    <ul>
                      <li>Sentences: {span.sentences?.length ?? 0}</li>
                      <li>Token count: {span.token_count}</li>
                      <li>Position: {span.start_index}-{span.end_index}</li>
                    </ul>
                    {Array.isArray(span.sentences) && span.sentences.length > 0 && (
                      <details style={{ marginTop: 8 }}>
                        <summary>Show sentences</summary>
                        <ol>
                          {span.sentences.map((s: any, j: number) => (
                            <li key={j} style={{ margin: '8px 0' }}>
                              <div>{s.sentence}</div>
                              {s.best_match && (
                                <div style={{ fontSize: 13, color: '#555' }}>
                                  Similar to: {s.best_match} (confidence: {fixed(s.confidence_score, 3)})
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>📝 Sentence Analysis Details</h3>
        {sentenceResults.length === 0 ? (
          <p>No sentences to display.</p>
        ) : (
          <ul>
            {sentenceResults.slice(0, 100).map((r: any, i: number) => {
              const risk = r.risk_level ?? 'LOW';
              const color =
                risk === 'HIGH' ? '#ffebee' : risk === 'MEDIUM' ? '#fff8e1' : '#e8f5e8';
              const icon = risk === 'HIGH' ? '🔴' : risk === 'MEDIUM' ? '🟡' : '🟢';
              return (
                <li key={i} style={{ background: color, borderRadius: 6, padding: 10, margin: '8px 0' }}>
                  <strong>{icon} Sentence {i + 1} ({risk})</strong>
                  <div style={{ marginTop: 6 }}>{r.sentence}</div>
                  {r.best_match && (
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <div>Most similar: {r.best_match}</div>
                      <div>Confidence (fused): {fixed(r.confidence_score, 3)}</div>
                      {r.match_strength && (
                        <div>Match strength: {r.match_strength} {r.reason ? `⟶ ${r.reason}` : ''}</div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {sentenceResults.length > 100 && (
          <p style={{ fontSize: 13, color: '#666' }}>
            Showing first 100 of {sentenceResults.length} sentences to prevent UI overload.
          </p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function percent(v?: number) {
  if (typeof v !== 'number') return '—';
  return `${(v * 100).toFixed(1)}%`;
}
function fixed(v?: number, n = 2, fallback = '—') {
  if (typeof v !== 'number') return fallback;
  return v.toFixed(n);
}
