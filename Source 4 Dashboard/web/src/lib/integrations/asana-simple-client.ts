/**
 * Simple Asana API Client
 *
 * Uses fetch API for simpler, more reliable Asana API access
 * Asana v3 SDK has issues - using direct REST API instead
 */

export interface AsanaConfig {
  accessToken: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://app.asana.com/api/1.0';

export class AsanaSimpleClient {
  private accessToken: string;
  private baseUrl: string;

  constructor(config: AsanaConfig) {
    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Asana API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    return json.data;
  }

  /**
   * Get current user info
   */
  async getMe() {
    return this.request('/users/me');
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await this.getMe();
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all workspaces
   */
  async getWorkspaces() {
    return this.request('/workspaces');
  }

  /**
   * Get projects in a workspace
   */
  async getProjects(workspaceGid: string, archived = false) {
    return this.request(`/projects?workspace=${workspaceGid}&archived=${archived}&opt_fields=name,archived,color,notes,created_at,modified_at,workspace,team`);
  }

  /**
   * Get tasks in a project
   */
  async getProjectTasks(projectGid: string) {
    const optFields = [
      'name', 'notes', 'completed', 'completed_at', 'due_on', 'due_at',
      'start_on', 'created_at', 'modified_at', 'assignee', 'assignee.name',
      'projects', 'projects.name', 'parent', 'parent.name', 'workspace',
      'workspace.name', 'tags', 'tags.name', 'custom_fields', 'num_subtasks',
      'num_likes'
    ].join(',');

    return this.request(`/tasks?project=${projectGid}&opt_fields=${optFields}&limit=100`);
  }

  /**
   * Get a specific task
   */
  async getTask(taskGid: string) {
    const optFields = [
      'name', 'notes', 'completed', 'completed_at', 'due_on', 'due_at',
      'start_on', 'created_at', 'modified_at', 'assignee', 'assignee.name',
      'projects', 'projects.name', 'parent', 'parent.name', 'workspace',
      'workspace.name', 'tags', 'tags.name', 'followers', 'followers.name',
      'custom_fields', 'num_subtasks', 'num_likes'
    ].join(',');

    return this.request(`/tasks/${taskGid}?opt_fields=${optFields}`);
  }

  /**
   * Get stories (comments) for a task
   */
  async getTaskStories(taskGid: string) {
    return this.request(`/tasks/${taskGid}/stories?opt_fields=created_at,created_by,created_by.name,resource_subtype,text,is_pinned`);
  }

  /**
   * Get custom field definitions for a workspace
   */
  async getCustomFieldDefinitions(workspaceGid: string) {
    return this.request(`/workspaces/${workspaceGid}/custom_fields?opt_fields=name,resource_type,type,description,precision,enum_options,enum_options.name,enum_options.enabled,enum_options.color`);
  }

  /**
   * Get users in a workspace
   */
  async getWorkspaceUsers(workspaceGid: string) {
    return this.request(`/workspaces/${workspaceGid}/users?opt_fields=name,email,photo,workspaces,workspaces.name`);
  }

  /**
   * Get tasks modified since a date
   */
  async getModifiedTasks(workspaceGid: string, modifiedSince: Date, projectGids?: string[]) {
    const params = new URLSearchParams({
      workspace: workspaceGid,
      modified_since: modifiedSince.toISOString(),
      opt_fields: [
        'name', 'notes', 'completed', 'completed_at', 'due_on', 'due_at',
        'start_on', 'created_at', 'modified_at', 'assignee', 'assignee.name',
        'projects', 'projects.name', 'workspace', 'workspace.name',
        'custom_fields', 'num_subtasks'
      ].join(',')
    });

    if (projectGids && projectGids.length > 0) {
      params.append('projects', projectGids.join(','));
    }

    return this.request(`/tasks?${params}`);
  }
}

/**
 * Factory function to create client from environment
 */
export function createAsanaSimpleClient(): AsanaSimpleClient | null {
  const accessToken = process.env.ASANA_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('ASANA_ACCESS_TOKEN not found in environment variables');
    return null;
  }

  return new AsanaSimpleClient({ accessToken });
}

/**
 * Helper to parse custom fields into a structured object
 */
export function parseCustomFields(customFields?: any[]): Record<string, any> {
  if (!customFields || customFields.length === 0) {
    return {};
  }

  const parsed: Record<string, any> = {};

  for (const field of customFields) {
    const key = field.name;
    let value: any = null;

    if (field.text_value !== undefined && field.text_value !== null) {
      value = field.text_value;
    } else if (field.number_value !== undefined && field.number_value !== null) {
      value = field.number_value;
    } else if (field.enum_value) {
      value = field.enum_value.name;
    } else if (field.multi_enum_values && field.multi_enum_values.length > 0) {
      value = field.multi_enum_values.map((v: any) => v.name).join(', ');
    } else if (field.people_value && field.people_value.length > 0) {
      value = field.people_value.map((p: any) => p.name).join(', ');
    }

    parsed[key] = value;
  }

  return parsed;
}
