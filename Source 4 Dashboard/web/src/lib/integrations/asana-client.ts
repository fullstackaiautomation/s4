/**
 * Asana API Client
 *
 * Handles authentication and data fetching from Asana API
 * Supports workspaces, projects, tasks, custom fields, and stories
 */

const Asana = require('asana');

export interface AsanaConfig {
  accessToken: string;
  baseUrl?: string;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  is_organization: boolean;
}

export interface AsanaProject {
  gid: string;
  name: string;
  archived: boolean;
  color?: string;
  notes?: string;
  created_at: string;
  modified_at: string;
  workspace?: {
    gid: string;
    name: string;
  };
  team?: {
    gid: string;
    name: string;
  };
}

export interface AsanaCustomFieldValue {
  gid: string;
  name: string;
  resource_type: string;
  type?: string;
  text_value?: string;
  number_value?: number;
  enum_value?: {
    gid: string;
    name: string;
    enabled: boolean;
    color?: string;
  };
  multi_enum_values?: Array<{
    gid: string;
    name: string;
    enabled: boolean;
    color?: string;
  }>;
  people_value?: Array<{
    gid: string;
    name: string;
  }>;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  completed: boolean;
  completed_at?: string;
  due_on?: string;
  due_at?: string;
  start_on?: string;
  created_at: string;
  modified_at: string;
  assignee?: {
    gid: string;
    name: string;
  };
  projects?: Array<{
    gid: string;
    name: string;
  }>;
  parent?: {
    gid: string;
    name: string;
  };
  workspace: {
    gid: string;
    name: string;
  };
  tags?: Array<{
    gid: string;
    name: string;
  }>;
  followers?: Array<{
    gid: string;
    name: string;
  }>;
  custom_fields?: AsanaCustomFieldValue[];
  num_subtasks?: number;
  num_likes?: number;
}

export interface AsanaStory {
  gid: string;
  created_at: string;
  created_by?: {
    gid: string;
    name: string;
  };
  resource_subtype: string;
  text?: string;
  is_pinned?: boolean;
}

export interface AsanaUser {
  gid: string;
  name: string;
  email?: string;
  photo?: {
    image_128x128?: string;
    image_60x60?: string;
  };
  workspaces?: Array<{
    gid: string;
    name: string;
  }>;
}

export interface AsanaCustomFieldDefinition {
  gid: string;
  name: string;
  resource_type: string;
  type: string;
  description?: string;
  precision?: number;
  enum_options?: Array<{
    gid: string;
    name: string;
    enabled: boolean;
    color?: string;
  }>;
}

export class AsanaClient {
  private workspacesApi: any;
  private projectsApi: any;
  private tasksApi: any;
  private usersApi: any;
  private customFieldsApi: any;
  private storiesApi: any;
  private config: AsanaConfig;

  constructor(config: AsanaConfig) {
    this.config = config;

    // Initialize API client
    const apiClient = new Asana.ApiClient();
    apiClient.authentications['token'].accessToken = config.accessToken;

    // Create API instances
    this.workspacesApi = new Asana.WorkspacesApi(apiClient);
    this.projectsApi = new Asana.ProjectsApi(apiClient);
    this.tasksApi = new Asana.TasksApi(apiClient);
    this.usersApi = new Asana.UsersApi(apiClient);
    this.customFieldsApi = new Asana.CustomFieldsApi(apiClient);
    this.storiesApi = new Asana.StoriesApi(apiClient);
  }

  /**
   * Get all workspaces for the authenticated user
   */
  async getWorkspaces(): Promise<AsanaWorkspace[]> {
    try {
      const response = await this.workspacesApi.getWorkspaces();
      return response.data;
    } catch (error) {
      console.error('Error fetching Asana workspaces:', error);
      throw error;
    }
  }

  /**
   * Get all projects in a workspace
   */
  async getProjects(workspaceGid: string, includeArchived = false): Promise<AsanaProject[]> {
    try {
      const projects = await this.client.projects.getProjects({
        workspace: workspaceGid,
        archived: includeArchived,
        opt_fields: 'name,archived,color,notes,created_at,modified_at,workspace,team'
      });

      const allProjects: AsanaProject[] = [];
      for await (const project of projects) {
        allProjects.push(project);
      }

      return allProjects;
    } catch (error) {
      console.error(`Error fetching Asana projects for workspace ${workspaceGid}:`, error);
      throw error;
    }
  }

  /**
   * Get all tasks in a project
   */
  async getProjectTasks(projectGid: string): Promise<AsanaTask[]> {
    try {
      const tasks = await this.client.tasks.getTasksForProject(projectGid, {
        opt_fields: [
          'name',
          'notes',
          'completed',
          'completed_at',
          'due_on',
          'due_at',
          'start_on',
          'created_at',
          'modified_at',
          'assignee',
          'assignee.name',
          'projects',
          'projects.name',
          'parent',
          'parent.name',
          'workspace',
          'workspace.name',
          'tags',
          'tags.name',
          'followers',
          'followers.name',
          'custom_fields',
          'num_subtasks',
          'num_likes'
        ].join(',')
      });

      const allTasks: AsanaTask[] = [];
      for await (const task of tasks) {
        allTasks.push(task);
      }

      return allTasks;
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectGid}:`, error);
      throw error;
    }
  }

  /**
   * Get tasks modified since a specific date
   */
  async getModifiedTasks(
    workspaceGid: string,
    modifiedSince: Date,
    projectGids?: string[]
  ): Promise<AsanaTask[]> {
    try {
      const params: any = {
        workspace: workspaceGid,
        modified_since: modifiedSince.toISOString(),
        opt_fields: [
          'name',
          'notes',
          'completed',
          'completed_at',
          'due_on',
          'due_at',
          'start_on',
          'created_at',
          'modified_at',
          'assignee',
          'assignee.name',
          'projects',
          'projects.name',
          'parent',
          'parent.name',
          'workspace',
          'workspace.name',
          'tags',
          'tags.name',
          'custom_fields',
          'num_subtasks',
          'num_likes'
        ].join(',')
      };

      if (projectGids && projectGids.length > 0) {
        params.projects = projectGids;
      }

      const tasks = await this.client.tasks.getTasks(params);

      const allTasks: AsanaTask[] = [];
      for await (const task of tasks) {
        allTasks.push(task);
      }

      return allTasks;
    } catch (error) {
      console.error(`Error fetching modified tasks since ${modifiedSince}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific task with full details
   */
  async getTask(taskGid: string): Promise<AsanaTask> {
    try {
      const task = await this.client.tasks.getTask(taskGid, {
        opt_fields: [
          'name',
          'notes',
          'completed',
          'completed_at',
          'due_on',
          'due_at',
          'start_on',
          'created_at',
          'modified_at',
          'assignee',
          'assignee.name',
          'projects',
          'projects.name',
          'parent',
          'parent.name',
          'workspace',
          'workspace.name',
          'tags',
          'tags.name',
          'followers',
          'followers.name',
          'custom_fields',
          'num_subtasks',
          'num_likes'
        ].join(',')
      });

      return task;
    } catch (error) {
      console.error(`Error fetching task ${taskGid}:`, error);
      throw error;
    }
  }

  /**
   * Get stories (comments/activity) for a task
   */
  async getTaskStories(taskGid: string): Promise<AsanaStory[]> {
    try {
      const stories = await this.client.stories.getStoriesForTask(taskGid, {
        opt_fields: 'created_at,created_by,created_by.name,resource_subtype,text,is_pinned'
      });

      const allStories: AsanaStory[] = [];
      for await (const story of stories) {
        allStories.push(story);
      }

      return allStories;
    } catch (error) {
      console.error(`Error fetching stories for task ${taskGid}:`, error);
      throw error;
    }
  }

  /**
   * Get custom field definitions for a workspace
   */
  async getCustomFieldDefinitions(workspaceGid: string): Promise<AsanaCustomFieldDefinition[]> {
    try {
      const customFields = await this.client.customFields.getCustomFieldsForWorkspace(workspaceGid, {
        opt_fields: 'name,resource_type,type,description,precision,enum_options,enum_options.name,enum_options.enabled,enum_options.color'
      });

      const allCustomFields: AsanaCustomFieldDefinition[] = [];
      for await (const field of customFields) {
        allCustomFields.push(field);
      }

      return allCustomFields;
    } catch (error) {
      console.error(`Error fetching custom fields for workspace ${workspaceGid}:`, error);
      throw error;
    }
  }

  /**
   * Get users in a workspace
   */
  async getWorkspaceUsers(workspaceGid: string): Promise<AsanaUser[]> {
    try {
      const users = await this.client.users.getUsersForWorkspace(workspaceGid, {
        opt_fields: 'name,email,photo,workspaces,workspaces.name'
      });

      const allUsers: AsanaUser[] = [];
      for await (const user of users) {
        allUsers.push(user);
      }

      return allUsers;
    } catch (error) {
      console.error(`Error fetching users for workspace ${workspaceGid}:`, error);
      throw error;
    }
  }

  /**
   * Test connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await this.usersApi.getUser('me');
      return {
        success: true,
        user: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Asana'
      };
    }
  }
}

/**
 * Helper function to create Asana client from environment variable
 */
export function createAsanaClient(): AsanaClient | null {
  const accessToken = process.env.ASANA_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('ASANA_ACCESS_TOKEN not found in environment variables');
    return null;
  }

  return new AsanaClient({ accessToken });
}

/**
 * Helper to parse custom fields into a structured object
 */
export function parseCustomFields(customFields?: AsanaCustomFieldValue[]): Record<string, any> {
  if (!customFields || customFields.length === 0) {
    return {};
  }

  const parsed: Record<string, any> = {};

  for (const field of customFields) {
    const key = field.name;

    // Determine value based on field type
    let value: any = null;

    if (field.text_value !== undefined) {
      value = field.text_value;
    } else if (field.number_value !== undefined) {
      value = field.number_value;
    } else if (field.enum_value) {
      value = field.enum_value.name;
    } else if (field.multi_enum_values && field.multi_enum_values.length > 0) {
      value = field.multi_enum_values.map(v => v.name).join(', ');
    } else if (field.people_value && field.people_value.length > 0) {
      value = field.people_value.map(p => p.name).join(', ');
    }

    parsed[key] = value;
  }

  return parsed;
}
