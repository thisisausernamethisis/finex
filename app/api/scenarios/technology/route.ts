import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { ScenarioType } from '@prisma/client';
import { logger } from '@/lib/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const routeLogger = logger.child({ route: '/api/scenarios/technology' });

/**
 * GET /api/scenarios/technology
 * Returns technology-focused scenarios for MetaMap analysis
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeline = searchParams.get('timeline'); // Filter by timeline if provided
    const limit = parseInt(searchParams.get('limit') || '50');

    routeLogger.debug('Fetching technology scenarios', { 
      userId: user.id, 
      timeline,
      limit 
    });

    // Build query filters
    const whereClause: any = {
      OR: [
        { userId: user.id }, // User's own scenarios
        { isPublic: true }   // Public scenarios
      ],
      type: ScenarioType.TECHNOLOGY // Only technology scenarios
    };

    // Add timeline filter if provided
    if (timeline) {
      whereClause.timeline = {
        contains: timeline,
        mode: 'insensitive'
      };
    }

    const scenarios = await prisma.scenario.findMany({
      where: whereClause,
      include: {
        themes: {
          include: {
            cards: {
              select: {
                id: true,
                title: true,
                importance: true
              }
            }
          }
        },
        _count: {
          select: {
            matrixResults: true
          }
        }
      },
      orderBy: [
        { probability: 'desc' }, // Higher probability scenarios first
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Transform response to include metadata useful for MetaMap
    const enhancedScenarios = scenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      type: scenario.type,
      timeline: scenario.timeline,
      probability: scenario.probability,
      isPublic: scenario.isPublic,
      themeCount: scenario.themes.length,
      cardCount: scenario.themes.reduce((total, theme) => total + theme.cards.length, 0),
      matrixAnalysisCount: scenario._count.matrixResults,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt,
      // Include theme names for quick overview
      themeNames: scenario.themes.map(theme => theme.name)
    }));

    routeLogger.info('Technology scenarios retrieved successfully', {
      userId: user.id,
      count: enhancedScenarios.length,
      timeline
    });

    return NextResponse.json({
      scenarios: enhancedScenarios,
      count: enhancedScenarios.length,
      filters: {
        type: 'TECHNOLOGY',
        timeline: timeline || 'all'
      },
      metadata: {
        avgProbability: enhancedScenarios.length > 0 
          ? enhancedScenarios.reduce((sum, s) => sum + (s.probability || 0), 0) / enhancedScenarios.length 
          : 0,
        timelineDistribution: enhancedScenarios.reduce((acc: any, s) => {
          const timeline = s.timeline || 'unknown';
          acc[timeline] = (acc[timeline] || 0) + 1;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    routeLogger.error('Error fetching technology scenarios', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to fetch technology scenarios' },
      { status: 500 }
    );
  }
} 