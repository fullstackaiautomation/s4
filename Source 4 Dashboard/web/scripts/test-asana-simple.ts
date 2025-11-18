/**
 * Test Asana Connection with Simple Client
 *
 * Run with: npx tsx scripts/test-asana-simple.ts
 */

import * as dotenv from 'dotenv';
import { AsanaSimpleClient } from '../src/lib/integrations/asana-simple-client';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAsana() {
  console.log('🔍 Testing Asana Connection (Simple Client)...\n');

  const token = process.env.ASANA_ACCESS_TOKEN;
  if (!token) {
    console.error('❌ ASANA_ACCESS_TOKEN not found');
    process.exit(1);
  }

  const client = new AsanaSimpleClient({ accessToken: token });

  // Test connection
  console.log('📡 Testing connection...');
  const test = await client.testConnection();

  if (!test.success) {
    console.error('❌ Failed:', test.error);
    process.exit(1);
  }

  console.log('✅ Connected!');
  console.log(`\n👤 User: ${test.user.name} (${test.user.email})`);

  // Get workspaces
  console.log('\n📁 Fetching workspaces...');
  const workspaces = await client.getWorkspaces();

  console.log(`\nFound ${workspaces.length} workspace(s):\n`);

  for (const ws of workspaces) {
    console.log(`📂 ${ws.name} (${ws.gid})`);

    // Get projects
    console.log('   Fetching projects...');
    const projects = await client.getProjects(ws.gid);
    console.log(`   Found ${projects.length} projects`);

    // Show first 10 projects
    for (const proj of projects.slice(0, 10)) {
      console.log(`      📋 ${proj.name} (${proj.gid})`);
    }

    if (projects.length > 10) {
      console.log(`      ... and ${projects.length - 10} more`);
    }

    // Get tasks from first project
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log(`\n   📝 Tasks in "${firstProject.name}":`);
      const tasks = await client.getProjectTasks(firstProject.gid);
      console.log(`   Found ${tasks.length} tasks\n`);

      for (const task of tasks.slice(0, 5)) {
        const status = task.completed ? '✓' : '○';
        const assignee = task.assignee ? ` (${task.assignee.name})` : '';
        console.log(`      ${status} ${task.name}${assignee}`);

        if (task.custom_fields && task.custom_fields.length > 0) {
          console.log(`         Custom Fields:`);
          for (const field of task.custom_fields) {
            let value = field.text_value || field.number_value || field.enum_value?.name || '(empty)';
            console.log(`            - ${field.name}: ${value}`);
          }
        }
      }

      if (tasks.length > 5) {
        console.log(`\n      ... and ${tasks.length - 5} more tasks`);
      }
    }

    // Get custom fields
    console.log(`\n   🔧 Custom fields:`);
    const customFields = await client.getCustomFieldDefinitions(ws.gid);
    console.log(`   Found ${customFields.length} custom fields`);

    for (const field of customFields.slice(0, 10)) {
      console.log(`      📝 ${field.name} (${field.type})`);
      if (field.enum_options && field.enum_options.length > 0) {
        const options = field.enum_options.map((o: any) => o.name).join(', ');
        console.log(`         Options: ${options}`);
      }
    }

    if (customFields.length > 10) {
      console.log(`      ... and ${customFields.length - 10} more`);
    }

    console.log('\n' + '='.repeat(70));
  }

  console.log('\n✅ Test complete!\n');
  console.log('Next steps:');
  console.log('1. Run database schema in Supabase');
  console.log('2. POST /api/sync/asana to sync data');
  console.log('3. View dashboard\n');
}

testAsana().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
