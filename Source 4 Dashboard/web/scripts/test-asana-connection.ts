/**
 * Test Asana Connection
 *
 * Tests the Asana API connection and displays basic information
 * Run with: npx tsx scripts/test-asana-connection.ts
 */

import * as dotenv from 'dotenv';
import { AsanaClient } from '../src/lib/integrations/asana-client';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAsanaConnection() {
  console.log('🔍 Testing Asana Connection...\n');

  // Check for token
  const token = process.env.ASANA_ACCESS_TOKEN;
  if (!token) {
    console.error('❌ ASANA_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('✅ Token found');

  // Create client
  const client = new AsanaClient({ accessToken: token });

  // Test connection
  console.log('\n📡 Testing API connection...');
  const connectionTest = await client.testConnection();

  if (!connectionTest.success) {
    console.error('❌ Failed to connect to Asana:', connectionTest.error);
    process.exit(1);
  }

  console.log('✅ Connected successfully!');
  console.log('\n👤 Authenticated User:');
  console.log(`   Name: ${connectionTest.user.name}`);
  console.log(`   Email: ${connectionTest.user.email}`);
  console.log(`   GID: ${connectionTest.user.gid}`);

  // Get workspaces
  console.log('\n📁 Fetching workspaces...');
  const workspaces = await client.getWorkspaces();

  console.log(`\n✅ Found ${workspaces.length} workspace(s):\n`);

  for (const workspace of workspaces) {
    console.log(`   📂 ${workspace.name} (${workspace.gid})`);
    console.log(`      Type: ${workspace.is_organization ? 'Organization' : 'Personal'}`);

    // Get projects in this workspace
    console.log(`\n      Fetching projects...`);
    try {
      const projects = await client.getProjects(workspace.gid, false);
      console.log(`      Found ${projects.length} active projects:\n`);

      // Show first 10 projects
      const displayProjects = projects.slice(0, 10);
      for (const project of displayProjects) {
        console.log(`         📋 ${project.name} (${project.gid})`);
      }

      if (projects.length > 10) {
        console.log(`         ... and ${projects.length - 10} more projects`);
      }

      // Get sample tasks from first project
      if (projects.length > 0) {
        const firstProject = projects[0];
        console.log(`\n      📝 Sample tasks from "${firstProject.name}":`);

        try {
          const tasks = await client.getProjectTasks(firstProject.gid);
          console.log(`      Found ${tasks.length} tasks\n`);

          // Show first 5 tasks
          const displayTasks = tasks.slice(0, 5);
          for (const task of displayTasks) {
            const status = task.completed ? '✓' : '○';
            const assignee = task.assignee ? ` (${task.assignee.name})` : '';
            const customFieldsCount = task.custom_fields?.length || 0;

            console.log(`         ${status} ${task.name}${assignee}`);
            console.log(`            Created: ${new Date(task.created_at).toLocaleDateString()}`);
            console.log(`            Custom Fields: ${customFieldsCount}`);

            if (customFieldsCount > 0) {
              console.log(`            Fields:`);
              for (const field of task.custom_fields || []) {
                let value = '';
                if (field.text_value) value = field.text_value;
                else if (field.number_value !== undefined) value = field.number_value.toString();
                else if (field.enum_value) value = field.enum_value.name;

                console.log(`               - ${field.name}: ${value || '(empty)'}`);
              }
            }
            console.log('');
          }

          if (tasks.length > 5) {
            console.log(`         ... and ${tasks.length - 5} more tasks`);
          }

        } catch (error: any) {
          console.error(`      ❌ Error fetching tasks: ${error.message}`);
        }
      }

      // Get custom fields
      console.log(`\n      🔧 Custom Fields in workspace:`);
      try {
        const customFields = await client.getCustomFieldDefinitions(workspace.gid);
        console.log(`      Found ${customFields.length} custom fields:\n`);

        for (const field of customFields) {
          console.log(`         📝 ${field.name}`);
          console.log(`            Type: ${field.type}`);
          if (field.enum_options && field.enum_options.length > 0) {
            const options = field.enum_options.map(o => o.name).join(', ');
            console.log(`            Options: ${options}`);
          }
        }
      } catch (error: any) {
        console.error(`      ❌ Error fetching custom fields: ${error.message}`);
      }

    } catch (error: any) {
      console.error(`      ❌ Error fetching projects: ${error.message}`);
    }

    console.log('\n' + '='.repeat(70) + '\n');
  }

  console.log('✅ Connection test complete!\n');
  console.log('📊 Summary:');
  console.log(`   - ${workspaces.length} workspace(s) accessible`);
  console.log(`   - Ready to sync data to Supabase`);
  console.log('\n💡 Next steps:');
  console.log('   1. Run the database schema: Document Storage/SQL/asana_schema.sql');
  console.log('   2. Trigger a sync: POST /api/sync/asana');
  console.log('   3. View dashboard at: http://localhost:3000/dashboards/asana\n');
}

testAsanaConnection().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
