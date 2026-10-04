import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, teamId } = body;

    if (!matchId || !teamId) {
      return NextResponse.json({ error: 'matchId and teamId are required' }, { status: 400 });
    }

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Determine which team was voted for
    const isHomeTeam = teamId === match.homeTeamId;
    const isAwayTeam = teamId === match.awayTeamId;

    if (!isHomeTeam && !isAwayTeam) {
      return NextResponse.json({ error: 'Invalid team for this match' }, { status: 400 });
    }

    // Get IP for duplicate check
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Check for existing vote
    const existingVote = await db.vote.findUnique({
      where: { matchId_ipAddress: { matchId, ipAddress: ip } },
    });

    if (existingVote) {
      // Return current percentages without recording
      const totalVotes = match.homeVotes + match.awayVotes;
      return NextResponse.json({
        message: 'Already voted',
        homeVotes: match.homeVotes,
        awayVotes: match.awayVotes,
        homePercentage: totalVotes > 0 ? Math.round((match.homeVotes / totalVotes) * 100) : 50,
        awayPercentage: totalVotes > 0 ? Math.round((match.awayVotes / totalVotes) * 100) : 50,
        alreadyVoted: true,
      });
    }

    // Record vote
    await db.vote.create({
      data: {
        matchId,
        teamId,
        ipAddress: ip,
      },
    });

    // Update match vote counts
    const updatedMatch = await db.match.update({
      where: { id: matchId },
      data: {
        homeVotes: isHomeTeam ? { increment: 1 } : undefined,
        awayVotes: isAwayTeam ? { increment: 1 } : undefined,
      },
    });

    const totalVotes = updatedMatch.homeVotes + updatedMatch.awayVotes;

    return NextResponse.json({
      success: true,
      homeVotes: updatedMatch.homeVotes,
      awayVotes: updatedMatch.awayVotes,
      homePercentage: totalVotes > 0 ? Math.round((updatedMatch.homeVotes / totalVotes) * 100) : 50,
      awayPercentage: totalVotes > 0 ? Math.round((updatedMatch.awayVotes / totalVotes) * 100) : 50,
      alreadyVoted: false,
    });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
