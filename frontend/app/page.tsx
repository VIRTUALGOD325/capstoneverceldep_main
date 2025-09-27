"use client";

import React, { useState, useRef } from 'react';

type AnalysisResult = any;

interface ProcessingInfo {
  semantic_engine_available?: boolean;
  cross_encoder_available?: boolean;
  stylometry_available?: boolean;
  semantic_model?: {
    source: string;
    path: string;
    use_fine_tuned_flag?: boolean;
  };
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function analyzeFile(fileToAnalyze: File) {
    setError(null);
    setResult(null);
    setProgress('Uploading file...');
    
    const form = new FormData();
    form.append('file', fileToAnalyze);
    setLoading(true);
    
    try {
      setProgress('Analyzing document... This may take a few minutes.');
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = 'Request failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.detail || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      setProgress('Processing results...');
      const json = await res.json();
      setResult(json);
      setProgress('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setProgress('');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file first.');
      return;
    }
    await analyzeFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (!ext || !['pdf', 'docx', 'txt'].includes(ext)) {
        setError('Please select a PDF, DOCX, or TXT file.');
        return;
      }
      setFile(droppedFile);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ color: '#1a365d', marginBottom: 8 }}>📄 DocInsight</h1>
        <p style={{ fontSize: 18, color: '#4a5568', margin: 0 }}>Document Originality Analysis</p>
        <p style={{ color: '#718096', marginTop: 8 }}>Upload a document to analyze its originality and detect potential plagiarism</p>
      </header>
      
      <div style={{ maxWidth: 600, margin: '0 auto', marginBottom: 32 }}>
        <div 
          style={{
            border: dragOver ? '2px dashed #3182ce' : '2px dashed #cbd5e0',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            backgroundColor: dragOver ? '#ebf8ff' : '#f7fafc',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: 24, marginBottom: 16 }}>📁</div>
          {file ? (
            <div>
              <p style={{ fontWeight: 'bold', color: '#2d3748', marginBottom: 4 }}>{file.name}</p>
              <p style={{ color: '#718096', fontSize: 14 }}>Ready to analyze • {(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: 8, color: '#4a5568' }}>Drop your document here or click to browse</p>
              <p style={{ fontSize: 14, color: '#718096' }}>Supports PDF, DOCX, and TXT files</p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
        
        {file && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button 
              onClick={() => analyzeFile(file)}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#a0aec0' : '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              {loading ? '🔄 Analyzing...' : '🚀 Analyze Document'}
            </button>
            {file && !loading && (
              <button
                onClick={() => setFile(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#718096',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontSize: 16,
                  marginLeft: 12,
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
      
      {loading && progress && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#ebf8ff',
            borderRadius: 8,
            color: '#2c5aa0'
          }}>
            <div style={{ marginRight: 12, animation: 'spin 1s linear infinite' }}>⚙️</div>
            {progress}
          </div>
        </div>
      )}
      
      {error && (
        <div style={{
          backgroundColor: '#fed7d7',
          borderLeft: '4px solid #f56565',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          maxWidth: 800,
          margin: '0 auto 24px auto'
        }}>
          <div style={{ color: '#c53030', fontWeight: 'bold' }}>❌ Error</div>
          <div style={{ color: '#742a2a', marginTop: 4 }}>{error}</div>
        </div>
      )}
      
      {result && <AnalysisView result={result} />}
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AnalysisView({ result }: { result: any }) {
  const originality = result?.originality_analysis?.originality_metrics ?? {};
  const sentenceResults = result?.sentence_results ?? [];
  const topSpans = result?.originality_analysis?.top_risk_spans ?? [];
  const distribution = originality?.sentence_distribution ?? {};
  const processingInfo: ProcessingInfo = result?.processing_info ?? {};
  
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#1a365d', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, marginBottom: 24 }}>📊 Originality Analysis</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16,
          marginBottom: 24
        }}>
          <MetricCard 
            label="Originality Score" 
            value={percent(originality.originality_score)} 
            color={getScoreColor(originality.originality_score)}
            description="Overall document originality"
          />
          <MetricCard 
            label="Plagiarism Coverage" 
            value={percent(originality.plagiarized_coverage)} 
            color={getCoverageColor(originality.plagiarized_coverage)}
            description="Percentage of content flagged"
          />
          <MetricCard 
            label="Severity Index" 
            value={fixed(originality.severity_index, 3)} 
            color="#4a5568"
            description="Average severity of matches"
          />
          <MetricCard 
            label="Total Sentences" 
            value={originality.total_sentences ?? '—'} 
            color="#2d3748"
            description="Sentences analyzed"
          />
          <MetricCard 
            label="Plagiarism Factor" 
            value={fixed(originality.plagiarism_factor, 3, '—')} 
            color="#4a5568"
            description="Composite risk score"
          />
        </div>
        
        {originality.plagiarism_components && (
          <details style={{ backgroundColor: '#f7fafc', padding: 16, borderRadius: 8, marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2d3748' }}>🔬 Plagiarism Factor Breakdown</summary>
            <div style={{ marginTop: 12, color: '#4a5568' }}>
              <p>The plagiarism factor combines weighted components:</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li>• Coverage Component: <strong>{originality.plagiarism_components.coverage_component?.toFixed(4) ?? 'N/A'}</strong></li>
                <li>• Severity Component: <strong>{originality.plagiarism_components.severity_component?.toFixed(4) ?? 'N/A'}</strong></li>
                <li>• Span Ratio Component: <strong>{originality.plagiarism_components.span_ratio_component?.toFixed(4) ?? 'N/A'}</strong></li>
              </ul>
              {originality.plagiarism_components.weights && (
                <p style={{ fontSize: 14, color: '#718096', marginTop: 8 }}>
                  Weights: α={originality.plagiarism_components.weights.alpha} β={originality.plagiarism_components.weights.beta} γ={originality.plagiarism_components.weights.gamma}
                </p>
              )}
              <p style={{ fontSize: 14, fontStyle: 'italic', color: '#718096' }}>Originality Score = 1 - Plagiarism Factor (clamped ≥ 0)</p>
            </div>
          </details>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, marginBottom: 32 }}>
        <section>
          <h3 style={{ color: '#1a365d', marginBottom: 16 }}>📈 Risk Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <RiskMetric label="🔴 High Risk" value={distribution.HIGH ?? 0} color="#f56565" />
            <RiskMetric label="🟡 Medium Risk" value={distribution.MEDIUM ?? 0} color="#ed8936" />
            <RiskMetric label="🟢 Low Risk" value={distribution.LOW ?? 0} color="#48bb78" />
          </div>
        </section>
        
        <ProcessingInfoSection processingInfo={processingInfo} />
      </div>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ color: '#1a365d', marginBottom: 16 }}>⚠️ Top Risk Spans</h3>
        {topSpans.length === 0 ? (
          <div style={{ 
            padding: 24, 
            textAlign: 'center', 
            backgroundColor: '#f0fff4', 
            borderRadius: 8, 
            color: '#38a169' 
          }}>
            ✅ No significant risk spans detected.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topSpans.map((span: any, i: number) => (
              <div key={i} style={{
                border: `2px solid ${span.risk_level === 'HIGH' ? '#f56565' : '#ed8936'}`,
                borderRadius: 8,
                backgroundColor: span.risk_level === 'HIGH' ? '#fed7d7' : '#feebc8',
                overflow: 'hidden'
              }}>
                <details style={{ width: '100%' }}>
                  <summary style={{
                    padding: 16,
                    cursor: 'pointer',
                    backgroundColor: span.risk_level === 'HIGH' ? '#feb2b2' : '#fbd38d',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span>{span.risk_level === 'HIGH' ? '🔴' : '🟡'}</span>
                    <span>Risk Span {i + 1}</span>
                    <span style={{ fontSize: 14, fontWeight: 'normal' }}>({span.risk_level})</span>
                    <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 'normal' }}>Score: {fixed(span.avg_score, 3)}</span>
                  </summary>
                  <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>Preview</h4>
                      <p style={{ 
                        backgroundColor: 'white', 
                        padding: 12, 
                        borderRadius: 4, 
                        fontStyle: 'italic',
                        border: '1px solid #e2e8f0'
                      }}>
                        {span.preview_text ?? 'No preview available'}
                      </p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#718096' }}>Sentences</div>
                        <div style={{ fontWeight: 'bold' }}>{span.sentences?.length ?? 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#718096' }}>Token Count</div>
                        <div style={{ fontWeight: 'bold' }}>{span.token_count}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#718096' }}>Position</div>
                        <div style={{ fontWeight: 'bold' }}>{span.start_index}-{span.end_index}</div>
                      </div>
                    </div>
                    {Array.isArray(span.sentences) && span.sentences.length > 0 && (
                      <details style={{ marginTop: 16 }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2d3748' }}>Show {span.sentences.length} sentences</summary>
                        <div style={{ marginTop: 12 }}>
                          {span.sentences.map((s: any, j: number) => (
                            <div key={j} style={{ 
                              padding: 12, 
                              marginBottom: 8, 
                              backgroundColor: 'white',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{ fontWeight: '500', marginBottom: 4 }}>{j + 1}. {s.sentence}</div>
                              {s.best_match && (
                                <div style={{ fontSize: 13, color: '#718096', fontStyle: 'italic' }}>
                                  Similar to: {s.best_match} (confidence: {fixed(s.confidence_score, 3)})
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </details>
              </div>
            ))}
          </div>
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

function MetricCard({ label, value, color, description }: { label: string; value: string | number; color: string; description?: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: 16,
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ fontSize: 12, color: '#718096', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color, marginBottom: 4 }}>{value}</div>
      {description && <div style={{ fontSize: 11, color: '#a0aec0' }}>{description}</div>}
    </div>
  );
}

function RiskMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ minWidth: 120, fontSize: 14 }}>{label}</div>
      <div style={{ flex: 1, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ 
          height: '100%', 
          backgroundColor: color, 
          width: `${Math.min(value / Math.max(1, value) * 100, 100)}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>
      <div style={{ fontWeight: 'bold', minWidth: 32, textAlign: 'right' }}>{value}</div>
    </div>
  );
}

function ProcessingInfoSection({ processingInfo }: { processingInfo: ProcessingInfo }) {
  return (
    <section>
      <h3 style={{ color: '#1a365d', marginBottom: 16 }}>🔧 Processing Information</h3>
      <div style={{ backgroundColor: '#f7fafc', borderRadius: 8, padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#2d3748', fontSize: 14 }}>Available Components</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ComponentStatus 
              name="Semantic Search Engine" 
              available={processingInfo.semantic_engine_available ?? false} 
            />
            <ComponentStatus 
              name="Cross-Encoder Reranker" 
              available={processingInfo.cross_encoder_available ?? false} 
            />
            <ComponentStatus 
              name="Stylometry Analyzer" 
              available={processingInfo.stylometry_available ?? false} 
            />
          </div>
        </div>
        
        {processingInfo.semantic_model && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: 14 }}>Semantic Model</h4>
            <div style={{ fontSize: 13, color: '#4a5568' }}>
              <div>Source: <strong>{processingInfo.semantic_model.source}</strong></div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Path: {processingInfo.semantic_model.path}</div>
              {processingInfo.semantic_model.use_fine_tuned_flag !== undefined && (
                <div style={{ fontSize: 12, color: '#718096' }}>Fine-tuned: {processingInfo.semantic_model.use_fine_tuned_flag ? 'Yes' : 'No'}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ComponentStatus({ name, available }: { name: string; available: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{available ? '✅' : '❌'}</span>
      <span style={{ fontSize: 13, color: available ? '#38a169' : '#e53e3e' }}>{name}</span>
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

function getScoreColor(score?: number): string {
  if (typeof score !== 'number') return '#4a5568';
  if (score >= 0.8) return '#48bb78'; // Green
  if (score >= 0.6) return '#ed8936'; // Orange
  return '#f56565'; // Red
}

function getCoverageColor(coverage?: number): string {
  if (typeof coverage !== 'number') return '#4a5568';
  if (coverage <= 0.1) return '#48bb78'; // Green
  if (coverage <= 0.3) return '#ed8936'; // Orange
  return '#f56565'; // Red
}
