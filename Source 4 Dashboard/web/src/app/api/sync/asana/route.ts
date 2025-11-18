/**
 * API Route: Sync Asana Data
 *
 * POST /api/sync/asana
 *
 * Triggers an Asana data sync
 * Supports full sync or incremental sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAsanaSyncService } from '@/lib/integrations/asana-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel Pro

export async function POST(request: NextRequest) {
  try {
    // Parse request body for sync options
    const body = await request.json().catch(() => ({}));
    const {
      fullSync = false,
      workspaceGids,
      projectGids,
      syncStories = false,
    } = body;

    // Create sync service
    const syncService = createAsanaSyncService();

    if (!syncService) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asana sync service not configured. Please check environment variables.'
        },
        { status: 500 }
      );
    }

    // Run sync
    console.log('[Asana Sync API] Starting sync...', { fullSync, workspaceGids, projectGids });
    const result = await syncService.sync({
      fullSync,
      workspaceGids,
      projectGids,
      syncStories
    });

    console.log('[Asana Sync API] Sync completed:', result);

    // Return result
    return NextResponse.json({
      success: result.success,
      syncId: result.syncId,
      recordsSynced: result.recordsSynced,
      recordsCreated: result.recordsCreated,
      recordsUpdated: result.recordsUpdated,
      errors: result.errors,
      duration: result.duration,
      message: result.success
        ? `Successfully synced ${result.recordsSynced} records in ${(result.duration / 1000).toFixed(1)}s`
        : `Sync completed with ${result.errors.length} errors`
    });

  } catch (error: any) {
    console.error('[Asana Sync API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync Asana data'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Asana Sync API',
    usage: 'POST /api/sync/asana with optional body: { fullSync: boolean, workspaceGids?: string[], projectGids?: string[] }',
    status: 'ready'
  });
}
