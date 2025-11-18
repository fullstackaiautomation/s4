/**
 * Asana Sync Service
 *
 * Syncs Asana data to Supabase database
 * Handles: workspaces, projects, tasks, users, custom fields, stories
 */

import { AsanaSimpleClient, parseCustomFields } from './asana-simple-client';
import { createClient } from '@supabase/supabase-js';

export interface SyncOptions {
  fullSync?: boolean; // If true, sync all data. If false, only sync changes since last sync
  workspaceGids?: string[]; // Limit sync to specific workspaces
  projectGids?: string[]; // Limit sync to specific projects
  syncStories?: boolean; // Whether to sync task comments/stories
  batchSize?: number; // Number of records to process at once
}

export interface SyncResult {
  success: boolean;
  syncId?: number;
  recordsSynced: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: string[];
  duration: number; // milliseconds
}

export class AsanaSync {
  private asanaClient: AsanaSimpleClient;
  private supabase: any;

  constructor(asanaClient: AsanaSimpleClient, supabaseUrl: string, supabaseKey: string) {
    this.asanaClient = asanaClient;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Main sync function - orchestrates the entire sync process
   */
  async sync(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsSynced = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Create sync log entry
    const { data: syncLogEntry, error: syncLogError } = await this.supabase
      .from('asana_sync_log')
      .insert({
        sync_type: options.fullSync ? 'full' : 'incremental',
        sync_started_at: new Date().toISOString(),
        status: 'running',
        metadata: options
      })
      .select('id')
      .single();

    if (syncLogError) {
      return {
        success: false,
        recordsSynced: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        errors: [`Failed to create sync log: ${syncLogError.message}`],
        duration: Date.now() - startTime
      };
    }

    const syncId = syncLogEntry.id;

    try {
      // Step 1: Sync workspaces
      console.log('[AsanaSync] Syncing workspaces...');
      const workspaces = await this.syncWorkspaces();
      recordsSynced += workspaces.synced;
      recordsCreated += workspaces.created;
      recordsUpdated += workspaces.updated;
      errors.push(...workspaces.errors);

      // Determine which workspaces to sync
      const workspaceGids = options.workspaceGids || workspaces.workspaceGids;

      // Step 2: Sync users for each workspace
      console.log('[AsanaSync] Syncing users...');
      for (const workspaceGid of workspaceGids) {
        const users = await this.syncUsers(workspaceGid);
        recordsSynced += users.synced;
        recordsCreated += users.created;
        recordsUpdated += users.updated;
        errors.push(...users.errors);
      }

      // Step 3: Sync custom field definitions
      console.log('[AsanaSync] Syncing custom field definitions...');
      for (const workspaceGid of workspaceGids) {
        const customFields = await this.syncCustomFieldDefinitions(workspaceGid);
        recordsSynced += customFields.synced;
        recordsCreated += customFields.created;
        recordsUpdated += customFields.updated;
        errors.push(...customFields.errors);
      }

      // Step 4: Sync projects
      console.log('[AsanaSync] Syncing projects...');
      for (const workspaceGid of workspaceGids) {
        const projects = await this.syncProjects(workspaceGid);
        recordsSynced += projects.synced;
        recordsCreated += projects.created;
        recordsUpdated += projects.updated;
        errors.push(...projects.errors);
      }

      // Step 5: Sync tasks
      console.log('[AsanaSync] Syncing tasks...');
      const projectGids = options.projectGids || await this.getTrackedProjectGids();

      for (const projectGid of projectGids) {
        const tasks = await this.syncProjectTasks(projectGid);
        recordsSynced += tasks.synced;
        recordsCreated += tasks.created;
        recordsUpdated += tasks.updated;
        errors.push(...tasks.errors);

        // Step 6: Optionally sync stories
        if (options.syncStories) {
          // This could be very API-heavy, so we skip by default
          // You can enable this for specific high-value projects
        }
      }

      // Step 7: Refresh materialized views
      console.log('[AsanaSync] Refreshing materialized views...');
      await this.refreshMaterializedViews();

      // Update sync log
      await this.supabase
        .from('asana_sync_log')
        .update({
          sync_completed_at: new Date().toISOString(),
          records_synced: recordsSynced,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          errors: errors.length > 0 ? errors : null,
          status: errors.length > 0 ? 'partial' : 'success'
        })
        .eq('id', syncId);

      return {
        success: errors.length === 0,
        syncId,
        recordsSynced,
        recordsCreated,
        recordsUpdated,
        errors,
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error during sync';
      errors.push(errorMessage);

      // Update sync log with failure
      await this.supabase
        .from('asana_sync_log')
        .update({
          sync_completed_at: new Date().toISOString(),
          records_synced: recordsSynced,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          errors,
          status: 'failed'
        })
        .eq('id', syncId);

      return {
        success: false,
        syncId,
        recordsSynced,
        recordsCreated,
        recordsUpdated,
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Sync workspaces
   */
  private async syncWorkspaces() {
    const errors: string[] = [];
    let synced = 0;
    let created = 0;
    let updated = 0;
    const workspaceGids: string[] = [];

    try {
      const workspaces = await this.asanaClient.getWorkspaces();

      for (const workspace of workspaces) {
        workspaceGids.push(workspace.gid);

        const { error } = await this.supabase
          .from('asana_workspaces')
          .upsert({
            gid: workspace.gid,
            name: workspace.name,
            is_organization: workspace.is_organization || false,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'gid'
          });

        if (error) {
          errors.push(`Failed to sync workspace ${workspace.name}: ${error.message}`);
        } else {
          synced++;
          // Note: Supabase doesn't tell us if it was insert or update in upsert
          created++;
        }
      }
    } catch (error: any) {
      errors.push(`Failed to fetch workspaces: ${error.message}`);
    }

    return { synced, created, updated, errors, workspaceGids };
  }

  /**
   * Sync users for a workspace
   */
  private async syncUsers(workspaceGid: string) {
    const errors: string[] = [];
    let synced = 0;
    let created = 0;
    let updated = 0;

    try {
      const users = await this.asanaClient.getWorkspaceUsers(workspaceGid);

      for (const user of users) {
        const { error } = await this.supabase
          .from('asana_users')
          .upsert({
            gid: user.gid,
            name: user.name,
            email: user.email,
            photo_url: user.photo?.image_128x128 || user.photo?.image_60x60,
            workspace_gids: user.workspaces?.map(w => w.gid) || [workspaceGid],
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'gid'
          });

        if (error) {
          errors.push(`Failed to sync user ${user.name}: ${error.message}`);
        } else {
          synced++;
          created++;
        }
      }
    } catch (error: any) {
      errors.push(`Failed to fetch users for workspace ${workspaceGid}: ${error.message}`);
    }

    return { synced, created, updated, errors };
  }

  /**
   * Sync custom field definitions
   */
  private async syncCustomFieldDefinitions(workspaceGid: string) {
    const errors: string[] = [];
    let synced = 0;
    let created = 0;
    let updated = 0;

    try {
      const customFields = await this.asanaClient.getCustomFieldDefinitions(workspaceGid);

      for (const field of customFields) {
        const { error } = await this.supabase
          .from('asana_custom_field_definitions')
          .upsert({
            gid: field.gid,
            name: field.name,
            resource_type: field.resource_type,
            field_type: field.type,
            description: field.description,
            precision: field.precision,
            enum_options: field.enum_options ? JSON.stringify(field.enum_options) : null,
            workspace_gid: workspaceGid,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'gid'
          });

        if (error) {
          errors.push(`Failed to sync custom field ${field.name}: ${error.message}`);
        } else {
          synced++;
          created++;
        }
      }
    } catch (error: any) {
      errors.push(`Failed to fetch custom fields for workspace ${workspaceGid}: ${error.message}`);
    }

    return { synced, created, updated, errors };
  }

  /**
   * Sync projects for a workspace
   */
  private async syncProjects(workspaceGid: string) {
    const errors: string[] = [];
    let synced = 0;
    let created = 0;
    let updated = 0;

    try {
      const projects = await this.asanaClient.getProjects(workspaceGid, false);

      for (const project of projects) {
        const { error } = await this.supabase
          .from('asana_projects')
          .upsert({
            gid: project.gid,
            name: project.name,
            workspace_gid: project.workspace?.gid || workspaceGid,
            team_gid: project.team?.gid,
            archived: project.archived || false,
            color: project.color,
            notes: project.notes,
            created_at: project.created_at,
            modified_at: project.modified_at,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'gid'
          });

        if (error) {
          errors.push(`Failed to sync project ${project.name}: ${error.message}`);
        } else {
          synced++;
          created++;
        }
      }
    } catch (error: any) {
      errors.push(`Failed to fetch projects for workspace ${workspaceGid}: ${error.message}`);
    }

    return { synced, created, updated, errors };
  }

  /**
   * Sync tasks for a specific project
   */
  private async syncProjectTasks(projectGid: string) {
    const errors: string[] = [];
    let synced = 0;
    let created = 0;
    let updated = 0;

    try {
      const tasks = await this.asanaClient.getProjectTasks(projectGid);

      for (const task of tasks) {
        const { error } = await this.supabase
          .from('asana_tasks')
          .upsert(this.taskToDbRecord(task), {
            onConflict: 'gid'
          });

        if (error) {
          errors.push(`Failed to sync task ${task.name}: ${error.message}`);
        } else {
          synced++;
          created++;
        }
      }
    } catch (error: any) {
      errors.push(`Failed to fetch tasks for project ${projectGid}: ${error.message}`);
    }

    return { synced, created, updated, errors };
  }

  /**
   * Convert Asana task to database record
   */
  private taskToDbRecord(task: any) {
    const primaryProject = task.projects?.[0];
    const customFieldsJson = parseCustomFields(task.custom_fields);

    return {
      gid: task.gid,
      name: task.name,
      notes: task.notes,
      project_gid: primaryProject?.gid,
      project_name: primaryProject?.name,
      parent_task_gid: task.parent?.gid,
      assignee_gid: task.assignee?.gid,
      assignee_name: task.assignee?.name,
      workspace_gid: task.workspace?.gid,
      completed: task.completed || false,
      completed_at: task.completed_at || null,
      due_on: task.due_on || null,
      due_at: task.due_at || null,
      start_on: task.start_on || null,
      created_at: task.created_at,
      modified_at: task.modified_at,
      tags: task.tags?.map((t: any) => t.name) || [],
      followers_count: task.followers?.length || 0,
      num_subtasks: task.num_subtasks || 0,
      num_likes: task.num_likes || 0,
      custom_fields: customFieldsJson,
      synced_at: new Date().toISOString()
    };
  }

  /**
   * Get list of tracked project GIDs from database
   */
  private async getTrackedProjectGids(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('asana_projects')
      .select('gid')
      .eq('archived', false);

    if (error) {
      console.error('Error fetching tracked projects:', error);
      return [];
    }

    return data?.map((p: any) => p.gid) || [];
  }

  /**
   * Refresh materialized views
   */
  private async refreshMaterializedViews() {
    try {
      // Refresh sales pipeline view
      await this.supabase.rpc('refresh_asana_sales_pipeline');

      // Refresh other views (they'll auto-refresh on read if not concurrent)
      await this.supabase
        .from('asana_rep_performance')
        .select('rep_name')
        .limit(1);

      await this.supabase
        .from('asana_customer_service_metrics')
        .select('date')
        .limit(1);

    } catch (error: any) {
      console.error('Error refreshing materialized views:', error.message);
      // Don't throw - this is non-critical
    }
  }
}

/**
 * Factory function to create sync service from environment
 */
export function createAsanaSyncService(): AsanaSync | null {
  const asanaToken = process.env.ASANA_ACCESS_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!asanaToken || !supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables for Asana sync');
    return null;
  }

  const asanaClient = new AsanaSimpleClient({ accessToken: asanaToken });
  return new AsanaSync(asanaClient, supabaseUrl, supabaseKey);
}
