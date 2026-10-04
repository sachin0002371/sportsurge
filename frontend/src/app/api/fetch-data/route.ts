import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    console.log(`🚀 [Step 1/4] Calling Python backend (${backendUrl}) to fetch ESPN data...`);
    const fetchRes = await fetch(`${backendUrl}/api/v1/fetch-data`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(300000), // 5 minutes timeout
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      console.error('Python backend fetch-data error:', errText);
      throw new Error(`Python backend fetch-data failed (${fetchRes.status})`);
    }

    const fetchData = await fetchRes.json();
    console.log('✅ ESPN data fetched successfully:', fetchData);

    // Article generation pipeline is disabled during data fetch per user request.
    // Use the dedicated 'Generate AI Article' button in the UI to generate articles.

    // [Step 2/3] Trigger Match Summaries generation
    console.log('🚀 [Step 2/3] Triggering AI Match Summaries for finished matches...');
    try {
      const summaryRes = await fetch(`${backendUrl}/api/v1/generate-summaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(300000),
      });
      if (summaryRes.ok) {
        console.log('✅ AI Match Summaries completed:', await summaryRes.json());
      } else {
        console.error('⚠️ AI Match Summaries failed:', await summaryRes.text());
      }
    } catch (summaryErr) {
      console.error('⚠️ Error during Step 2 (match summaries):', summaryErr);
    }

    // [Step 3/3] Trigger YouTube video updates
    console.log('🚀 [Step 3/3] Triggering YouTube video updates for recent matches...');
    try {
      const youtubeRes = await fetch(`${backendUrl}/api/v1/batch-youtube?limit=5`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(300000),
      });
      if (youtubeRes.ok) {
        console.log('✅ YouTube video updates completed:', await youtubeRes.json());
      } else {
        console.error('⚠️ YouTube video updates failed:', await youtubeRes.text());
      }
    } catch (youtubeErr) {
      console.error('⚠️ Error during Step 3 (youtube updates):', youtubeErr);
    }

    // Map Python response format to what DevFetchButton expects
    const results: Record<string, number> = {};
    if (fetchData.results) {
      for (const [sport, data] of Object.entries(fetchData.results as Record<string, any>)) {
        results[sport] = typeof data === 'number' ? data : data?.matches || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ESPN Live Match Data Fetched Successfully!',
      results,
      totalMatches: fetchData.total_matches || Object.values(results).reduce((a, b) => a + b, 0),
    });

  } catch (error: any) {
    console.error('Fetch data & pipeline error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to connect to Python backend (${backendUrl}): ${error.message}` 
      },
      { status: 500 }
    );
  }
}
