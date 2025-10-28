# Automation Decision Matrix
## Quick Reference Guide for Choosing the Right Approach

---

## The 60-Second Decision Tree

```
┌─ START: What are you trying to automate? ─┐
│                                             │
├─ Need repeatable formatting/generation?    │
│  └─→ USE SKILL                             │
│                                             │
├─ Need multi-step workflow with decisions?  │
│  └─→ USE AGENT PIPELINE                    │
│                                             │
├─ Need to connect to external service?      │
│  └─→ USE MCP                                │
│                                             │
├─ Need to react to database changes?        │
│  └─→ USE WEBHOOK                            │
│                                             │
├─ Need to ensure command always runs?       │
│  └─→ USE HOOK                               │
│                                             │
└─ Need semantic search/recommendations?     │
   └─→ USE EMBEDDINGS                         │
```

---

## Real-World Scenarios

### Personal CRM / Life Dashboard

| Task | Solution | Example |
|------|----------|---------|
| Generate weekly review | **Skill** | `@weekly-review-skill` |
| Process meeting notes → action items | **Agent** | Meeting summarizer agent |
| Sync with Google Calendar | **MCP** | `@google-calendar-mcp` |
| New email → categorize & flag urgent | **Webhook + Agent** | Email monitoring webhook |
| Auto-format all notes | **Hook** | PostToolUse hook on Write |
| Search past conversations | **Embeddings** | Voyage-3 on conversation history |

---

### Capital Dashboard (Current Client)

| Feature | Solution | Implementation |
|---------|----------|----------------|
| Daily portfolio report | **Skill** | `capital-report-skill.md` |
| Risk assessment workflow | **Agent Pipeline** | risk-analyzer → reporter → alerter |
| Pull stock data | **MCP** | Financial data MCP |
| New trade → compliance check | **Webhook** | Supabase trigger on trades table |
| Auto-calculate metrics | **Hook** | PostToolUse on data updates |
| Find similar past trades | **Embeddings** | Voyage-finance-2 |

---

### Service SaaS (Roofing/Plumbing)

| Automation | Solution | Why |
|------------|----------|-----|
| Brand-consistent quotes | **Skill** | Same format every time |
| Lead → qualify → route | **Agent Pipeline** | Complex decision making |
| Send SMS/Email | **MCP** | Twilio/SendGrid API |
| New lead form → qualification | **Webhook** | Instant response needed |
| Format all estimates | **Hook** | Consistent output |
| Match to similar past jobs | **Embeddings** | Historical job search |

---

## Architecture Pattern Selector

### Pattern 1: Simple Task Automation
**Use When:** Consistent, repeatable output needed  
**Solution:** **SKILL**  
**Examples:**
- Generate branded documents
- Format code consistently
- Create standard reports
- Apply templates

**Setup:**
```markdown
/.claude/skills/
  └─ your-skill/
      └─ SKILL.md
```

**Invoke:** Automatic when relevant, or manual with `/skill`

---

### Pattern 2: Multi-Step Workflow
**Use When:** Complex process with decisions and branching  
**Solution:** **AGENT + SUB-AGENTS**  
**Examples:**
- Feature development (spec → architect → code → test)
- Content pipeline (research → draft → edit → publish)
- Lead processing (intake → qualify → route → follow-up)

**Setup:**
```markdown
/.claude/agents/
  ├─ orchestrator.md          # Main coordinator
  └─ sub-agents/
      ├─ specialist-1.md
      ├─ specialist-2.md
      └─ specialist-3.md
```

**Invoke:** `/agent orchestrator` or automatic trigger

---

### Pattern 3: External Service Integration
**Use When:** Need to interact with external APIs/services  
**Solution:** **MCP SERVER**  
**Examples:**
- Database queries (Supabase)
- Cloud storage (Google Drive)
- Communication (Slack, Discord)
- Version control (GitHub)
- Payments (Stripe)

**Setup:**
```json
// .mcp.json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.composio.dev/supabase"
    }
  }
}
```

**Invoke:** Available as tools in any agent/skill

---

### Pattern 4: Real-Time Event Response
**Use When:** Database changes trigger automation  
**Solution:** **WEBHOOK → EDGE FUNCTION → AGENT**  
**Examples:**
- New user signup → onboarding sequence
- Payment received → fulfillment workflow
- Form submitted → qualification process
- Appointment booked → confirmation emails

**Setup:**
```sql
-- Supabase webhook
CREATE TRIGGER new_record_trigger
  AFTER INSERT ON your_table
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://your-function-url',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
```

**Invoke:** Automatic on database events

---

### Pattern 5: Guaranteed Execution
**Use When:** Command MUST run at specific times  
**Solution:** **HOOKS**  
**Examples:**
- Auto-format after file edits
- Run tests after code changes
- Commit after session ends
- Deploy after build

**Setup:**
```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "prettier --write $CLAUDE_FILE_PATHS"
      }]
    }]
  }
}
```

**Invoke:** Automatic on event triggers

---

### Pattern 6: Semantic Understanding
**Use When:** Need similarity, search, or recommendations  
**Solution:** **EMBEDDINGS + VECTOR DB**  
**Examples:**
- Smart document search
- Similar customer matching
- Recommendation engines
- Duplicate detection

**Setup:**
```python
import voyageai

vo = voyageai.Client()

# Create embeddings
embeddings = vo.embed(
    texts=["your", "documents"],
    model="voyage-3-large",
    input_type="document"
)

# Store in vector DB (Supabase pgvector)
# Query for similar items
```

**Invoke:** Via API or MCP tool

---

## Combination Patterns

Most real-world use cases combine multiple patterns:

### Example 1: Intelligent Lead System

```
NEW LEAD SUBMITTED
       ↓
[WEBHOOK] Supabase trigger fires
       ↓
[EDGE FUNCTION] Receives lead data
       ↓
[AGENT] Lead qualification agent
       ├─→ [MCP] Query similar past leads (Embeddings)
       ├─→ [MCP] Check calendar availability
       └─→ [SKILL] Generate personalized email
       ↓
[WEBHOOK] Update database with results
       ↓
[MCP] Send SMS/Email notifications
```

**Components Used:**
- Webhook (trigger)
- Agent (intelligence)
- MCP (external services)
- Skill (formatted output)
- Embeddings (similarity search)

---

### Example 2: Automated Development Pipeline

```
FEATURE REQUEST SUBMITTED
       ↓
[ORCHESTRATOR AGENT] Coordinates workflow
       ↓
[SUB-AGENT 1] PM Spec Agent
   └─→ [SKILL] Specification template
       ↓
[SUB-AGENT 2] Architect Agent
   └─→ [MCP] Review existing codebase (GitHub)
       ↓
[SUB-AGENT 3] Developer Agent
   └─→ [HOOK] Auto-format on file write
       ↓
[SUB-AGENT 4] Tester Agent
   └─→ [HOOK] Auto-run tests after code change
       ↓
[MCP] Create pull request on GitHub
```

**Components Used:**
- Agent Pipeline (workflow)
- Sub-Agents (specialization)
- Skills (templates)
- MCPs (external services)
- Hooks (automation)

---

## Cost Considerations

### Claude API Pricing (as of Oct 2025)

| Model | Input | Output | Best For |
|-------|-------|--------|----------|
| Claude Sonnet 4.5 | $3/MTok | $15/MTok | Complex agents |
| Claude Haiku 3.5 | $0.80/MTok | $4/MTok | Simple tasks |

### When to Use Each

**Use Sonnet 4.5 for:**
- Complex decision making
- Multi-step reasoning
- Quality-critical outputs
- Customer-facing content

**Use Haiku 3.5 for:**
- Simple classifications
- Data extraction
- Quick validations
- High-volume tasks

**Optimization Tips:**
1. Use prompt caching (up to 90% cost reduction)
2. Use Haiku for sub-agents when possible
3. Batch similar requests
4. Cache embedding results
5. Use hooks to avoid unnecessary API calls

---

## Monitoring & Debugging

### Hook Debugging
```bash
# View hook logs
tail -f ~/.claude/logs/hooks.log

# Test hook manually
bash -x your-hook-script.sh

# Disable hooks temporarily
# Edit .claude/settings.json → remove hooks
```

### Agent Debugging
```bash
# View agent session logs
claude logs

# Test agent in isolation
claude agent test pm-spec-agent

# View loaded skills
# In Claude: type /memory
```

### MCP Debugging
```bash
# List connected MCPs
claude mcp list

# Test MCP connection
claude mcp test supabase

# View MCP logs
claude mcp logs supabase
```

### Webhook Debugging
```sql
-- View webhook call history
SELECT * FROM net._http_response
ORDER BY created_at DESC
LIMIT 10;

-- Check for failures
SELECT * FROM net._http_response
WHERE status_code >= 400
ORDER BY created_at DESC;
```

---

## Migration Checklist

### From n8n/Zapier to Claude Native

- [ ] **Document** existing workflows
  - List all active workflows
  - Note triggers and actions
  - Identify dependencies

- [ ] **Map** to new architecture
  - Which should be Skills?
  - Which need Agent pipelines?
  - Which require MCPs?
  - Which need Webhooks?

- [ ] **Build** in parallel
  - Don't disable old system yet
  - Test thoroughly
  - Compare outputs

- [ ] **Validate** functionality
  - Test all edge cases
  - Check error handling
  - Verify performance

- [ ] **Cutover** gradually
  - Start with non-critical
  - Monitor closely
  - Keep rollback ready

- [ ] **Optimize** and enhance
  - Add features not possible before
  - Improve based on usage
  - Build reusable components

---

## Templates Library

### Skill Template
```markdown
# [Skill Name]

## Purpose
[What does this skill do?]

## Instructions
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Tools Needed
- [Tool 1]
- [Tool 2]

## Input Format
[Expected input]

## Output Format
[Expected output]

## Examples
[Usage examples]
```

### Agent Template
```markdown
# [Agent Name]

## Role
[What is this agent's specialty?]

## System Prompt
[Detailed instructions for behavior]

## Workflow
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Tools
- [Tool 1]
- [Tool 2]

## Sub-Agents
- [Sub-agent 1]: [Purpose]
- [Sub-agent 2]: [Purpose]

## Success Criteria
[How to know if task completed successfully]
```

### Hook Template
```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command --with-args",
            "timeout": 30,
            "run_in_background": false
          }
        ]
      }
    ]
  }
}
```

### Webhook + Edge Function Template
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Initialize clients
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    })
    
    // Your logic here
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: "Your system prompt",
      messages: [{
        role: "user",
        content: `Process this: ${JSON.stringify(record)}`
      }]
    })
    
    // Update database
    await supabase
      .from('your_table')
      .update({ processed: true })
      .eq('id', record.id)
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

---

## Quick Wins

### Implement These First (Easy → High Impact)

1. **Auto-formatting Hook** (5 minutes)
   - PostToolUse → prettier/black
   - Immediate code quality improvement

2. **Document Generation Skill** (30 minutes)
   - Branded report template
   - Consistent client deliverables

3. **Supabase MCP** (15 minutes)
   - Database query capability
   - Foundation for everything else

4. **Simple Webhook** (1 hour)
   - New record → send notification
   - Learn the pattern

5. **Lead Qualifier Agent** (2 hours)
   - Immediate business value
   - Demonstrates AI power

---

## Common Gotchas

### ❌ Don't Do This

1. **Don't use hooks for everything**
   - Hooks are for deterministic actions
   - Let agents make decisions when appropriate

2. **Don't create mega-agents**
   - Split into specialized sub-agents
   - Easier to debug and maintain

3. **Don't ignore error handling**
   - Webhooks can fail
   - MCPs can timeout
   - Always handle gracefully

4. **Don't skip testing**
   - Test each component independently
   - Test integration flows
   - Test edge cases

5. **Don't commit secrets**
   - Use environment variables
   - Use .env files (gitignored)
   - Use Supabase Vault

### ✅ Do This Instead

1. **Start simple, iterate**
   - One skill, test it
   - One agent, test it
   - Add complexity gradually

2. **Document as you build**
   - Future you will thank you
   - Team can understand
   - Easy to maintain

3. **Version control everything**
   - Skills, agents, hooks
   - Track changes
   - Easy rollback

4. **Monitor performance**
   - API usage
   - Webhook success rates
   - Agent completion times

5. **Share patterns**
   - Create templates
   - Reuse what works
   - Build library

---

## Your Next 10 Actions

1. [ ] Read full architecture guide
2. [ ] Set up Claude Code + Supabase
3. [ ] Create your first skill
4. [ ] Configure Supabase MCP
5. [ ] Build simple webhook
6. [ ] Create 2-agent pipeline
7. [ ] Set up auto-format hook
8. [ ] Test embeddings for search
9. [ ] Document current n8n workflows
10. [ ] Build first client feature

---

## Quick Reference URLs

- **Documentation:** https://docs.claude.com
- **MCP Servers:** https://github.com/modelcontextprotocol/servers
- **Agent SDK:** https://docs.claude.com/en/api/agent-sdk/overview
- **Supabase Docs:** https://supabase.com/docs
- **This Guide:** `AUTOMATION_ARCHITECTURE_GUIDE.md`

---

**Remember:** The best automation is the one you actually build and use.  
Start small, learn the patterns, then scale up.

You've got this! 🚀
