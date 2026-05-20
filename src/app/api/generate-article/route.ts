import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    const body = await request.json();
    const { sportSlug, sport, topic, category } = body;

    // Support both "sport" and "sportSlug" field names
    const sportValue = sportSlug || sport;
    if (!sportValue || !topic) {
      return NextResponse.json(
        { success: false, error: 'sport and topic are required' },
        { status: 400 }
      );
    }

    console.log(`🤖 Generating AI article via v3 pipeline: sport=${sportValue}, topic=${topic}`);

    // Use the v3 pipeline endpoint for better quality articles
    const response = await fetch(`${backendUrl}/api/v1/generate-article-v3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sport: sportValue,
        topic: topic,
        category: category || 'news',
      }),
      signal: AbortSignal.timeout(300000), // 5 minutes timeout for AI generation
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Backend generate-article-v3 error:', errText);
      // Fallback to v2 endpoint if v3 fails
      console.log('Trying v2 fallback...');
      const v2Response = await fetch(`${backendUrl}/api/v1/generate-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: sportValue,
          topic: topic,
          category: category || 'news',
        }),
        signal: AbortSignal.timeout(300000),
      });

      if (!v2Response.ok) {
        const v2ErrText = await v2Response.text();
        console.error('Backend generate-article v2 error:', v2ErrText);
        return NextResponse.json(
          { success: false, error: `Article generation failed: ${v2ErrText}` },
          { status: v2Response.status }
        );
      }

      const v2Data = await v2Response.json();
      return NextResponse.json(v2Data);
    }

    const data = await response.json();
    console.log(`✅ Article generated: "${data.article?.title}" by ${data.article?.author}`);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Generate article error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to generate article: ${error.message}` },
      { status: 500 }
    );
  }
}