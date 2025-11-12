# Full-Stack AI Automation Architecture Guide
## Your Complete System Orchestration Playbook

**Last Updated:** October 28, 2025  
**Tech Stack:** GitHub + Supabase + Claude Code + Claude API  
**Business Model:** Personal CRM → Capital Dashboard → AI Automation Agency → Service SaaS

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Decision Framework: When to Use What](#decision-framework)
3. [Architecture Patterns](#architecture-patterns)
4. [Your Current Tech Stack Integration](#tech-stack-integration)
5. [Migration Path: n8n/Zapier → Claude Native](#migration-path)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Security & Best Practices](#security-best-practices)
8. [Service SaaS Blueprint](#service-saas-blueprint)

---

## 1. System Overview

### The Four Pillars of Your Automation Stack

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR AUTOMATION STACK                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ SKILLS   │  │  AGENTS  │  │   MCPs   │  │ WEBHOOKS│ │
│  │          │  │          │  │          │  │         │ │
│  │Task-     │  │Complex   │  │External  │  │Database │ │
│  │specific  │  │workflows │  │services  │  │triggers │ │
│  │knowledge │  │Sub-agents│  │APIs      │  │Events   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
   [GitHub Pages]      [Supabase DB]      [Claude Code/API]
```

### What Each Component Does

#### **SKILLS** - Task-Specific Instructions
- **What:** Markdown files with instructions and scripts
- **Where:** `.claude/skills/` directory
- **When to use:** Repeatable tasks that need consistent execution
- **Examples:**
  - Document creation with brand guidelines
  - Data analysis workflows
  - Report generation templates
  - Email template formatting

#### **AGENTS & SUB-AGENTS** - Complex Multi-Step Workflows
- **What:** Autonomous AI assistants with specialized roles
- **Where:** `.claude/agents/` directory
- **When to use:** Complex tasks requiring multiple steps and decisions
- **Examples:**
  - PM Spec → Architect → Developer → Tester pipeline
  - Research → Draft → Edit → Publish workflow
  - Lead intake → Qualification → Routing → Follow-up

#### **MCPs (Model Context Protocol)** - External Service Connections
- **What:** Standardized protocol for connecting Claude to external systems
- **Where:** `.mcp.json` configuration file
- **When to use:** Need to interact with external APIs or services
- **Examples:**
  - Supabase database operations
  - GitHub repository management
  - Slack/Discord messaging
  - Google Drive/Calendar access
  - Payment processing (Stripe, PayPal)

#### **WEBHOOKS** - Database Event Triggers
- **What:** HTTP callbacks triggered by database events
- **Where:** Supabase Database → Edge Functions
- **When to use:** Real-time reactions to data changes
- **Examples:**
  - New customer signup → Send welcome email
  - Invoice paid → Update CRM
  - Lead form submitted → Trigger qualification workflow
  - Appointment booked → Send confirmation + add to calendar

#### **EMBEDDINGS/VECTOR DBs** - Semantic Search & RAG
- **What:** Vector representations for semantic similarity
- **When to use:** Search, recommendations, knowledge retrieval
- **Models:** Voyage-3-large, voyage-code-3, voyage-law-2
- **Examples:**
  - Customer support knowledge base
  - Document similarity search
  - Intelligent recommendation systems
  - Code search and analysis

---

## 2. Decision Framework: When to Use What

### The Decision Tree

```
START: What type of automation do you need?

├─ Is it a REPEATABLE TASK with consistent steps?
│  └─ YES → Use a SKILL
│     Examples:
│     - Format documents to brand guidelines
│     - Run specific data analysis
│     - Generate reports with standard structure
│
├─ Is it a COMPLEX WORKFLOW with multiple stages?
│  └─ YES → Use AGENTS & SUB-AGENTS
│     Examples:
│     - Multi-stage development pipeline
│     - Content creation workflow
│     - Lead qualification process
│
├─ Do you need to CONNECT TO EXTERNAL SERVICES?
│  └─ YES → Use MCP
│     Examples:
│     - Access Supabase database
│     - Read/write to Google Drive
│     - Send Slack notifications
│     - Process payments
│
├─ Do you need REAL-TIME DATABASE TRIGGERS?
│  └─ YES → Use WEBHOOKS
│     Examples:
│     - User signup triggers onboarding
│     - Payment received triggers fulfillment
│     - Form submission triggers lead routing
│
└─ Do you need SEMANTIC SEARCH or KNOWLEDGE RETRIEVAL?
   └─ YES → Use EMBEDDINGS + VECTOR DB
      Examples:
      - Smart document search
      - Recommendation engines
      - Customer support knowledge base
```

### Quick Reference Table

| Use Case | Solution | Why |
|----------|----------|-----|
| Create branded PowerPoint | **Skill** | Repeatable task with specific format |
| Build feature from spec → code → test | **Agent Pipeline** | Multi-stage workflow with decisions |
| Query customer data from Supabase | **MCP** | External service integration |
| New lead submitted → qualify → route | **Webhook → Agent** | Database trigger + complex workflow |
| Search 10,000 support tickets | **Embeddings** | Semantic similarity search |
| Format all code files | **Skill + Hook** | Repeatable task + automated trigger |
| Generate SEO-optimized blog post | **Agent** | Complex multi-step creative process |
| Sync data to third-party CRM | **MCP + Webhook** | External API + database trigger |

---

## 3. Architecture Patterns

### Pattern 1: Simple Automation (Skills)

**When:** Consistent, repeatable tasks

```
User Request
     ↓
Claude loads relevant SKILL
     ↓
Executes predefined workflow
     ↓
Returns consistent output
```

**Example: Monthly Report Generation**
```markdown
# Monthly Report Skill

## Instructions
1. Query Supabase for last 30 days data
2. Calculate key metrics (MRR, churn, CAC)
3. Generate charts using matplotlib
4. Format as branded PDF report
5. Save to /outputs directory

## Tools Needed
- Supabase MCP for data
- Python for calculations
- PDF creation skill
```

---

### Pattern 2: Multi-Agent Pipeline (Agents + Sub-Agents)

**When:** Complex workflows requiring specialization and orchestration

```
Orchestrator Agent
     ↓
     ├─→ Sub-Agent 1 (PM/Spec)
     │        ↓
     ├─→ Sub-Agent 2 (Architect)
     │        ↓
     ├─→ Sub-Agent 3 (Developer)
     │        ↓
     └─→ Sub-Agent 4 (Tester)
          ↓
     Final Output
```

**Example: Feature Development Pipeline**

**Orchestrator Agent** (`/feature-dev-orchestrator.md`):
```markdown
# Feature Development Orchestrator

## Role
Coordinate feature development from spec to deployment

## Workflow
1. Invoke pm-spec sub-agent for requirements
2. Wait for READY_FOR_ARCH status
3. Invoke architect sub-agent for design
4. Wait for READY_FOR_BUILD status
5. Invoke implementer sub-agent for code
6. Invoke tester sub-agent for validation
7. Mark as READY_FOR_DEPLOY

## Sub-Agents
- pm-spec: Requirements gathering
- architect: Design validation
- implementer: Code implementation
- tester: Test validation
```

**PM Spec Sub-Agent** (`/.claude/agents/pm-spec.md`):
```markdown
# PM Spec Sub-Agent

## Role
Gather requirements and write technical specifications

## Workflow
1. Read feature request from /features/pending
2. Ask clarifying questions about:
   - User personas
   - Acceptance criteria
   - Edge cases
   - Performance requirements
3. Write formal spec in /specs directory
4. Update status to READY_FOR_ARCH

## Tools
- File read/write
- User interaction
```

---

### Pattern 3: Real-Time Event Automation (Webhooks → Agents)

**When:** Database events trigger complex workflows

```
Database Event (INSERT/UPDATE/DELETE)
     ↓
Supabase Webhook fires
     ↓
Edge Function receives payload
     ↓
Calls Claude API with Agent
     ↓
Agent executes workflow
     ↓
Updates database with results
```

**Example: Lead Intake System**

**Supabase Webhook Setup:**
```sql
-- Create webhook trigger
CREATE TRIGGER new_lead_webhook
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://your-edge-function.supabase.co/lead-intake',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);
```

**Edge Function** (`supabase/functions/lead-intake/index.ts`):
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Anthropic from "@anthropic-ai/sdk"

serve(async (req) => {
  const { record } = await req.json()
  
  const client = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY")
  })
  
  // Call Lead Qualification Agent
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a lead qualification agent.
    
    Analyze the lead data and:
    1. Score lead quality (1-10)
    2. Identify business type
    3. Determine urgency
    4. Route to appropriate team member
    5. Draft personalized outreach email
    
    Lead Data: ${JSON.stringify(record)}`,
    messages: [{
      role: "user",
      content: "Qualify this lead and provide routing recommendation"
    }]
  })
  
  // Update database with qualification results
  // ... Supabase update logic
  
  return new Response(JSON.stringify({ success: true }))
})
```

---

### Pattern 4: External Integration (MCP Servers)

**When:** Need to interact with external services and APIs

```
Claude Code/API
     ↓
MCP Server (standardized interface)
     ↓
External Service (Supabase, Slack, etc.)
```

**Example: Supabase MCP Configuration**

**`.mcp.json`:**
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.composio.dev/supabase",
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "github": {
      "type": "sse",
      "url": "https://mcp.github.com/sse",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Usage in Agent:**
```markdown
# Customer Analytics Agent

## Tools Available
- Supabase MCP: Query customer database
- GitHub MCP: Fetch code metrics

## Workflow
1. Use Supabase MCP to fetch customer data:
   - @supabase:query://customers?status=active
2. Calculate analytics
3. Use GitHub MCP to correlate with feature usage
4. Generate insights report
```

---

### Pattern 5: Automation Hooks (Deterministic Triggers)

**When:** Need guaranteed execution of specific commands at specific times

```
Claude Code Event
     ↓
Hook Trigger (PreToolUse, PostToolUse, Stop, etc.)
     ↓
Shell Command Executes
     ↓
Automated Action
```

**Example: Auto-formatting + Testing Pipeline**

**`.claude/settings.json`:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write $CLAUDE_FILE_PATHS",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npm test",
            "timeout": 60
          },
          {
            "type": "command",
            "command": "git add . && git commit -m 'Auto-commit: Claude Code session complete'",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**Hook Events Available:**
- `PreToolUse`: Before Claude uses a tool
- `PostToolUse`: After tool completes successfully
- `UserPromptSubmit`: When user submits a prompt
- `Notification`: When Claude sends notification
- `Stop`: When agent finishes response
- `SubagentStop`: When sub-agent completes
- `SessionStart`: When session begins

---

## 4. Tech Stack Integration

### Your Current Stack

```
┌─────────────────────────────────────────────────┐
│             PRESENTATION LAYER                   │
│  GitHub Pages / Vercel (Static Web Apps)        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│             APPLICATION LAYER                    │
│  Claude Code + Claude API + Agent SDK           │
│  ├─ Skills (.claude/skills/)                    │
│  ├─ Agents (.claude/agents/)                    │
│  ├─ MCPs (.mcp.json)                            │
│  └─ Hooks (.claude/settings.json)               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│             DATA LAYER                           │
│  Supabase (PostgreSQL + Auth + Storage)         │
│  ├─ Database Webhooks                           │
│  ├─ Edge Functions                              │
│  ├─ Realtime Subscriptions                      │
│  └─ Row Level Security (RLS)                    │
└──────────────────────────────────────────────────┘
```

### GitHub Integration Pattern

**Repository Structure:**
```
your-project/
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Auto-deploy to GitHub Pages
│       └── test.yml            # Run tests on PR
├── .claude/
│   ├── agents/                 # Sub-agent definitions
│   ├── skills/                 # Skill libraries
│   ├── commands/               # Slash commands
│   └── settings.json           # Hook configurations
├── .mcp.json                   # MCP server configs
├── CLAUDE.md                   # Project memory
├── src/                        # Your application code
├── supabase/
│   ├── functions/              # Edge Functions
│   └── migrations/             # Database migrations
└── README.md
```

**GitHub Actions for Auto-Deploy:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

### Supabase Integration Pattern

**Database Schema Design for Multi-Tenant SaaS:**

```sql
-- Organizations table (your clients)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (for service businesses)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  service_type TEXT,
  status TEXT DEFAULT 'new',
  qualification_score INTEGER,
  assigned_to UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org leads"
  ON leads FOR SELECT
  USING (organization_id = (
    SELECT organization_id FROM users 
    WHERE id = auth.uid()
  ));

-- Webhook trigger for new leads
CREATE TRIGGER new_lead_automation
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://[your-project].supabase.co/functions/v1/lead-qualification',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
```

**Supabase Edge Function Template:**
```typescript
// supabase/functions/lead-qualification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

serve(async (req) => {
  try {
    const { record, old_record, type } = await req.json()
    
    // Initialize clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    })
    
    // Call Claude for lead qualification
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are a lead qualification expert for ${record.service_type} businesses.
      
      Analyze the lead and provide:
      1. Quality score (1-10)
      2. Urgency level (low/medium/high)
      3. Recommended next action
      4. Draft outreach message
      
      Output as JSON.`,
      messages: [{
        role: "user",
        content: `Qualify this lead: ${JSON.stringify(record)}`
      }]
    })
    
    const qualification = JSON.parse(response.content[0].text)
    
    // Update lead with qualification results
    await supabase
      .from('leads')
      .update({
        qualification_score: qualification.score,
        status: 'qualified',
        metadata: {
          ...record.metadata,
          qualification,
          qualified_at: new Date().toISOString()
        }
      })
      .eq('id', record.id)
    
    return new Response(
      JSON.stringify({ success: true, qualification }),
      { headers: { "Content-Type": "application/json" } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

---

## 5. Migration Path: n8n/Zapier → Claude Native

### Current n8n/Zapier Workflows → New Architecture

| Current Workflow | n8n/Zapier | New Solution | Why Better |
|------------------|------------|--------------|------------|
| Form submission → Email | Webhook → Email node | Supabase Webhook → Edge Function → Agent | More intelligent, context-aware responses |
| New customer → CRM update | Zapier trigger → CRM API | Database trigger → MCP → Agent pipeline | Multi-step workflows, error handling |
| Daily reports | Scheduled trigger → API calls | Skill + Cron job or Hook | Version controlled, customizable |
| Data sync | Polling → Transform → Push | MCP bidirectional sync | Real-time, efficient |
| Lead scoring | Manual rules in Zapier | Agent with contextual analysis | Smarter, adaptive scoring |

### Migration Strategy

**Phase 1: Parallel Running (Weeks 1-2)**
- Keep existing n8n/Zapier workflows active
- Build equivalent Claude solutions
- Test thoroughly in staging
- Compare outputs

**Phase 2: Gradual Cutover (Weeks 3-4)**
- Move non-critical workflows first
- Monitor for errors
- Keep n8n/Zapier as fallback
- Build confidence

**Phase 3: Full Migration (Week 5)**
- Disable n8n/Zapier workflows
- Monitor performance
- Optimize based on usage
- Document new patterns

**Phase 4: Enhancement (Week 6+)**
- Add capabilities not possible with n8n/Zapier
- Implement sub-agent pipelines
- Build custom skills
- Create reusable templates

---

## 6. Implementation Roadmap

### Month 1: Foundation

**Week 1: Setup & Configuration**
- [ ] Install Claude Code CLI
- [ ] Configure GitHub repository structure
- [ ] Set up Supabase project
- [ ] Create `.mcp.json` with essential MCPs
- [ ] Document current n8n/Zapier workflows

**Week 2: First Skills**
- [ ] Create 3-5 essential skills:
  - Document generation
  - Data analysis
  - Report creation
- [ ] Test skills with real data
- [ ] Create CLAUDE.md with project guidelines

**Week 3: First Agent Pipeline**
- [ ] Build simple 2-agent pipeline
- [ ] Test with non-critical workflow
- [ ] Document learnings
- [ ] Refine based on feedback

**Week 4: Webhooks Integration**
- [ ] Set up first Supabase webhook
- [ ] Create Edge Function
- [ ] Connect to Claude Agent
- [ ] Test end-to-end flow

---

### Month 2: Capital Dashboard (First Client)

**Week 1: Database Design**
- [ ] Design multi-tenant schema
- [ ] Implement RLS policies
- [ ] Create migrations
- [ ] Set up authentication

**Week 2: Core Features**
- [ ] Build dashboard agents:
  - Data ingestion agent
  - Analytics agent
  - Reporting agent
- [ ] Create custom skills for client needs
- [ ] Set up webhooks for real-time updates

**Week 3: Integration**
- [ ] Connect external data sources via MCPs
- [ ] Build automation workflows
- [ ] Test with client data
- [ ] Iterate based on feedback

**Week 4: Polish & Deploy**
- [ ] User testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Training for 3 users

---

### Month 3: Service SaaS MVP

**Week 1: Template Architecture**
- [ ] Design reusable SaaS template
- [ ] Create industry-specific agents:
  - Lead qualification agent
  - Scheduling agent
  - Follow-up agent
- [ ] Build skill libraries

**Week 2: First Industry (Roofing)**
- [ ] Customize template for roofers
- [ ] Build industry-specific workflows
- [ ] Create demo environment
- [ ] Test with sample data

**Week 3: Feature Building**
- [ ] Phone integration (inbound/outbound)
- [ ] SEO automation
- [ ] Content generation
- [ ] Advertising analysis

**Week 4: Beta Testing**
- [ ] Onboard 2-3 beta clients
- [ ] Gather feedback
- [ ] Fix critical issues
- [ ] Refine workflows

---

## 7. Security & Best Practices

### Security Checklist

**API Keys & Secrets:**
- [ ] Use environment variables (`.env` files)
- [ ] Never commit secrets to Git
- [ ] Use Supabase Vault for sensitive data
- [ ] Rotate keys regularly
- [ ] Use service role keys only in Edge Functions

**Database Security:**
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Implement proper auth policies
- [ ] Use prepared statements (prevent SQL injection)
- [ ] Audit logs for sensitive operations
- [ ] Regular backups

**Agent Security:**
- [ ] Limit agent tool permissions
- [ ] Use hooks to validate dangerous operations
- [ ] Sandbox external code execution
- [ ] Rate limit API calls
- [ ] Monitor for abuse

**Network Security:**
- [ ] HTTPS only
- [ ] CORS properly configured
- [ ] Webhook signature verification
- [ ] IP whitelisting where appropriate

---

### Best Practices

**1. Agent Design:**
- Keep agents single-purpose
- Use sub-agents for complex workflows
- Always include error handling
- Test with edge cases
- Version control all agents

**2. Skill Creation:**
- Document inputs and outputs clearly
- Make skills composable
- Test independently
- Include usage examples
- Keep skills DRY (Don't Repeat Yourself)

**3. MCP Usage:**
- Use official MCPs when available
- Cache frequently accessed data
- Implement retry logic
- Monitor API rate limits
- Log all external calls

**4. Webhook Design:**
- Always acknowledge webhooks immediately
- Process async in background
- Implement idempotency
- Handle failures gracefully
- Monitor webhook failures

**5. Code Organization:**
```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── orchestrators/      # Main workflow coordinators
│   │   ├── specialists/        # Single-purpose sub-agents
│   │   └── utilities/          # Helper agents
│   ├── skills/
│   │   ├── documents/          # Document generation
│   │   ├── analysis/           # Data analysis
│   │   └── integrations/       # External service skills
│   └── settings.json
├── .mcp.json
├── CLAUDE.md
└── README.md
```

---

## 8. Service SaaS Blueprint

### Architecture for Local Service Businesses

**Target Customers:**
- Roofers
- Plumbers
- Spray Foam Installers
- HVAC
- Electricians
- Landscaping

**Core Features Needed:**
1. Lead management
2. Scheduling/calendar
3. Phone integration (inbound/outbound)
4. Estimates/invoicing
5. Follow-up automation
6. SEO/local marketing
7. Review management
8. Job tracking

---

### Multi-Tenant SaaS Architecture

```
┌──────────────────────────────────────────────┐
│          SAAS CONTROL PLANE                   │
│  (Your Management Dashboard)                  │
└────────────────┬─────────────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
┌────▼────────┐    ┌────────▼────┐
│ Client 1    │    │ Client 2    │
│ (Roofer)    │    │ (Plumber)   │
│             │    │             │
│ - Agents    │    │ - Agents    │
│ - Skills    │    │ - Skills    │
│ - Data      │    │ - Data      │
│ - Webhooks  │    │ - Webhooks  │
└─────────────┘    └─────────────┘
```

**Database Schema:**
```sql
-- Tenants (your clients)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  business_name TEXT,
  industry TEXT, -- 'roofing', 'plumbing', etc.
  subdomain TEXT UNIQUE,
  settings JSONB,
  agent_config JSONB, -- Industry-specific agent settings
  created_at TIMESTAMPTZ
);

-- Leads (per tenant)
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  source TEXT, -- 'website', 'google', 'facebook', etc.
  status TEXT, -- 'new', 'contacted', 'qualified', 'scheduled', etc.
  ai_score INTEGER, -- AI-generated lead quality score
  ai_notes JSONB, -- Agent analysis and recommendations
  assigned_to UUID,
  created_at TIMESTAMPTZ
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  scheduled_at TIMESTAMPTZ,
  service_type TEXT,
  status TEXT,
  ai_summary TEXT, -- AI-generated appointment summary
  created_at TIMESTAMPTZ
);

-- Phone call logs
CREATE TABLE call_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  direction TEXT, -- 'inbound', 'outbound'
  duration INTEGER,
  transcript TEXT,
  ai_summary TEXT, -- AI-generated call summary
  sentiment_score FLOAT,
  created_at TIMESTAMPTZ
);
```

---

### Industry-Specific Agent Templates

**Roofing Industry Agent Configuration:**

**`/.claude/agents/roofing-lead-qualifier.md`:**
```markdown
# Roofing Lead Qualification Agent

## Role
Qualify inbound roofing leads and determine urgency

## Context
You are analyzing leads for a roofing company. Key factors:
- Leak issues are URGENT (score high)
- Full roof replacement is HIGH VALUE (score high)
- Repair-only is MEDIUM VALUE
- Just shopping around is LOW VALUE

## Workflow
1. Analyze lead data:
   - What type of roofing need?
   - Timeline (urgent leak vs future planning)?
   - Property type (residential/commercial)?
   - Location (in service area)?
   
2. Score lead 1-10:
   - 9-10: Emergency leak, high-value project
   - 7-8: Full replacement, near-term timeline
   - 5-6: Repairs, flexible timeline
   - 3-4: Just researching, distant timeline
   - 1-2: Out of area or not serious

3. Generate action items:
   - For 8-10: "Call immediately - potential emergency"
   - For 6-7: "Schedule estimate within 24 hours"
   - For 4-5: "Follow up within 3 days"
   - For 1-3: "Add to nurture campaign"

4. Draft personalized response email

## Output Format
Return JSON:
{
  "score": 8,
  "urgency": "high",
  "service_type": "full_replacement",
  "estimated_value": 15000,
  "action": "call_immediately",
  "notes": "Customer mentioned active leak in multiple places",
  "draft_email": "..."
}
```

**Phone Integration Agent:**
```markdown
# Phone Call Handler Agent

## Role
Process incoming phone calls, extract information, create leads

## Integration
- Receives call transcript from Twilio/Vonage
- Uses speech-to-text API
- Analyzes conversation

## Workflow
1. Receive call data:
   - Transcript
   - Duration
   - Caller ID

2. Extract information:
   - Customer name
   - Property address
   - Service needed
   - Timeline/urgency
   - How they found us

3. Sentiment analysis:
   - Customer mood
   - Likelihood to convert
   - Objections mentioned

4. Create/update lead in database

5. Generate follow-up actions

## Tools
- Supabase MCP for database
- SMS API for instant follow-up
- Calendar API for scheduling
```

---

### Automation Workflows for Service Businesses

**Workflow 1: Lead Intake → Qualification → Routing**

```
Website Form Submit
     ↓
Supabase Webhook fires
     ↓
Edge Function: lead-intake
     ↓
Qualification Agent analyzes lead
     ↓
[HIGH SCORE] → Immediate SMS to owner + Auto-schedule callback
[MEDIUM SCORE] → Add to CRM + Schedule follow-up in 24h
[LOW SCORE] → Add to nurture email sequence
     ↓
Update lead status in database
     ↓
Send confirmation email to customer
```

**Workflow 2: Estimate Request → AI-Generated Quote**

```
Customer requests estimate
     ↓
Estimate Request Agent:
  - Analyzes property details
  - Checks historical pricing data
  - Considers current material costs
  - Factors in competition
     ↓
Generates preliminary quote with ranges
     ↓
Formats professional estimate PDF
     ↓
Sends to customer via email
     ↓
Schedules follow-up call
```

**Workflow 3: Review Management**

```
Job completed
     ↓
Auto-send review request
     ↓
Monitor review sites (Google, Yelp, etc.)
     ↓
[POSITIVE REVIEW] → Thank customer + Share on social
[NEGATIVE REVIEW] → Alert owner + Draft response + Offer resolution
     ↓
Update customer sentiment score
```

---

### Implementation for First Service Business Client

**Week 1: Setup**
```bash
# Create project structure
mkdir roofing-saas
cd roofing-saas

# Initialize Git
git init

# Create Claude structure
mkdir -p .claude/agents
mkdir -p .claude/skills

# Create Supabase project
npx supabase init

# Install dependencies
npm install @supabase/supabase-js @anthropic-ai/sdk
```

**Week 2: Core Agents**
1. Create lead qualification agent
2. Create scheduling agent
3. Create follow-up agent
4. Test with sample data

**Week 3: Integrations**
1. Set up phone integration (Twilio)
2. Connect to Google Calendar
3. Set up email (SendGrid/Postmark)
4. Connect payment processing

**Week 4: Polish**
1. Build client dashboard
2. Add reporting
3. User testing
4. Documentation

---

## Quick Start Commands

### Initialize New Project
```bash
# Create project structure
mkdir my-ai-automation
cd my-ai-automation

# Initialize Git
git init

# Create Claude directories
mkdir -p .claude/agents
mkdir -p .claude/skills
mkdir -p .claude/commands

# Create base files
touch .mcp.json
touch CLAUDE.md
touch .claude/settings.json

# Initialize Supabase
npx supabase init
```

### Add Your First Skill
```bash
# Create skill directory
mkdir -p .claude/skills/report-generator

# Create skill definition
cat > .claude/skills/report-generator/SKILL.md << 'EOF'
# Monthly Report Generator

## Purpose
Generate monthly performance reports from database data

## Instructions
1. Query Supabase for last 30 days of data
2. Calculate key metrics
3. Generate charts
4. Format as PDF

## Tools Needed
- Supabase MCP
- Python (pandas, matplotlib)
- PDF generation
EOF
```

### Add Your First Agent
```bash
# Create agent
cat > .claude/agents/lead-qualifier.md << 'EOF'
# Lead Qualification Agent

## Role
Analyze and score incoming leads

## Workflow
1. Read lead data
2. Score 1-10 based on criteria
3. Generate follow-up recommendations
4. Update database

## Tools
- Supabase MCP for data access
- Scoring algorithm
EOF
```

### Configure MCP
```bash
# Add Supabase MCP
claude mcp add --transport http supabase https://mcp.composio.dev/supabase \
  --env SUPABASE_URL=your_url \
  --env SUPABASE_KEY=your_key
```

### Set Up Hooks
```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write $CLAUDE_FILE_PATHS"
          }
        ]
      }
    ]
  }
}
```

---

## Troubleshooting

### Common Issues

**1. MCP Connection Failures**
```bash
# Check MCP status
claude mcp list

# Test MCP connection
claude mcp test supabase

# Reset MCP configurations
claude mcp reset-project-choices
```

**2. Agent Not Loading Skills**
- Ensure skill is in correct directory
- Check SKILL.md format
- Verify skill is referenced in agent config
- Use `/memory` command to check loaded skills

**3. Webhook Not Firing**
- Check Supabase webhook logs in `net` schema
- Verify Edge Function is deployed
- Test webhook URL manually with curl
- Check database trigger is active

**4. Slow Performance**
- Use prompt caching for repeated contexts
- Implement context compaction
- Limit tool permissions
- Use sub-agents to parallelize work

---

## Resources

### Documentation
- [Claude API Docs](https://docs.claude.com)
- [Agent SDK Overview](https://docs.claude.com/en/api/agent-sdk/overview)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Supabase Docs](https://supabase.com/docs)

### Community
- [Claude Discord](https://discord.gg/anthropic)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [Awesome Claude Code Subagents](https://github.com/anthropics/awesome-claude-code-subagents)

### Tools
- [Claude Code CLI](https://claude.ai/download)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [n8n](https://n8n.io) (during migration)

---

## Next Steps

1. **Today**: Set up your first project structure
2. **This Week**: Build your first skill and test it
3. **This Month**: Create a simple agent pipeline
4. **Next Month**: Launch your capital dashboard
5. **Quarter**: Beta test service SaaS platform

---

## Your Competitive Advantage

This architecture gives you:

✅ **Speed**: Deploy new features in hours, not weeks  
✅ **Intelligence**: Every workflow is AI-powered and adaptive  
✅ **Scalability**: Add new clients with configuration, not code  
✅ **Reliability**: Deterministic hooks + agent oversight  
✅ **Cost-Effective**: No per-operation pricing like Zapier  
✅ **Customization**: Tailor everything to industry needs  

---

**The future of automation isn't no-code.**  
**It's natural language code with AI agents.**  
**You're building that future.**

---

*Last Updated: October 28, 2025*  
*Questions? Issues? Ideas? Keep iterating with Claude Code!*
