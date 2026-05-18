import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sportSlug, topic } = body;

    if (!sportSlug || !topic) {
      return NextResponse.json({ error: 'sportSlug and topic are required' }, { status: 400 });
    }

    const categories = ['preview', 'analysis', 'news', 'opinion'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    console.log(`🚀 Calling Python backend 5-layer Gemini pipeline for ${sportSlug}: "${topic}"...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 300s timeout for 5-layer pipeline

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

      const res = await fetch(`${backendUrl}/api/v1/generate-article-v3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: sportSlug,
          topic,
          category,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.text();
        console.error('Python backend error response:', errData);
        throw new Error(`Python backend returned status ${res.status}: ${errData}`);
      }

      const data = await res.json();
      console.log('✅ Python backend successfully generated article:', data);
      return NextResponse.json(data);
    } catch (backendErr: any) {
      console.error('❌ Failed to call Python backend 5-layer pipeline:', backendErr);
      const errMsg = backendErr.name === 'AbortError' 
        ? '5-layer Gemini AI pipeline took longer than 5 minutes to complete. Please check the Python backend console for Gemini API status.'
        : `Failed to connect to Python backend (${process.env.BACKEND_URL || 'http://localhost:8000'}): ${backendErr.message}`;
      return NextResponse.json(
        { success: false, error: errMsg }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Generate article error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate article' }, { status: 500 });
  }
}
