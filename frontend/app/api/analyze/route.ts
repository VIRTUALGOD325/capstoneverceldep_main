import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const backend = process.env.BACKEND_URL; // e.g., https://your-backend.example.com
    if (!backend) {
      // Mocked response shape compatible with the UI
      return NextResponse.json({
        originality_analysis: {
          originality_metrics: {
            originality_score: 0.87,
            plagiarized_coverage: 0.12,
            severity_index: 0.042,
            total_sentences: 3,
            plagiarism_factor: 0.13,
            sentence_distribution: { HIGH: 1, MEDIUM: 1, LOW: 1 }
          },
          top_risk_spans: [
            {
              risk_level: 'HIGH',
              avg_score: 0.91,
              token_count: 120,
              start_index: 1,
              end_index: 3,
              preview_text: 'Example preview of a risky span...',
              sentences: [
                { sentence: 'Example sentence 1', confidence_score: 0.92, best_match: 'Some source' },
                { sentence: 'Example sentence 2', confidence_score: 0.88 }
              ]
            }
          ]
        },
        sentence_results: [
          { sentence: 'This is a test sentence.', risk_level: 'LOW', confidence_score: 0.1 },
          { sentence: 'This looks similar to existing content.', risk_level: 'MEDIUM', confidence_score: 0.45 },
          { sentence: 'This is likely plagiarized.', risk_level: 'HIGH', confidence_score: 0.9, best_match: 'Source A' }
        ]
      });
    }

    // Forward to backend
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });

    const forwarded = new FormData();
    forwarded.append('file', blob, file.name);

    const url = `${backend.replace(/\/$/, '')}/analyze`;
    const res = await fetch(url, {
      method: 'POST',
      body: forwarded as any
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || 'Backend error' }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
