# Visual Workflow Examples
## Real-World Automation Patterns with Code

---

## Table of Contents

1. [Personal CRM Workflows](#personal-crm)
2. [Capital Dashboard Workflows](#capital-dashboard)
3. [Service SaaS Workflows](#service-saas)
4. [Common Patterns Library](#common-patterns)

---

## Personal CRM Workflows

### Workflow 1: Daily Standup Generator

```
Morning (7:00 AM) ──→ Cron Job Trigger
                           ↓
                    Orchestrator Agent
                           ↓
         ┌─────────────────┴─────────────────┐
         ↓                                    ↓
    Calendar Agent                       Email Agent
    - Get today's meetings               - Check priority emails
    - Extract action items               - Summarize threads
         ↓                                    ↓
         └─────────────────┬─────────────────┘
                           ↓
                    Standup Report Skill
                    - Format as markdown
                    - Include priorities
                           ↓
                    Send to Slack/Email
```

**Implementation:**

```markdown
# /.claude/agents/daily-standup-orchestrator.md

# Daily Standup Orchestrator

## Role
Generate comprehensive daily standup report

## Workflow
1. Invoke calendar-analyzer sub-agent
2. Invoke email-analyzer sub-agent  
3. Invoke task-prioritizer sub-agent
4. Compile results with standup-report-skill
5. Send via notification-skill

## Schedule
Runs at 7:00 AM daily via cron

## Output
Markdown report with:
- Today's meetings
- Priority emails
- Top 3 tasks
- Blockers
```

```typescript
// supabase/functions/daily-standup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

serve(async (req) => {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })
  
  // Call orchestrator agent
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `Load and execute daily-standup-orchestrator agent.
    
    Available sub-agents:
    - calendar-analyzer
    - email-analyzer
    - task-prioritizer
    
    Available skills:
    - standup-report-skill
    - notification-skill`,
    messages: [{
      role: "user",
      content: "Generate my daily standup report"
    }]
  })
  
  // Send to Slack/Email
  // ... notification logic
  
  return new Response(JSON.stringify({ success: true }))
})
```

---

### Workflow 2: Meeting Notes → Action Items

```
Meeting Ends
     ↓
Upload meeting recording/notes
     ↓
Transcription Agent
     ↓
Meeting Analyzer Agent
     ├─→ Extract action items
     ├─→ Identify decisions
     ├─→ List attendees
     └─→ Summarize key points
     ↓
Action Item Agent
     ├─→ Create tasks in Asana/Linear (MCP)
     ├─→ Assign to attendees
     └─→ Set due dates
     ↓
Send summary email to all attendees
```

**Implementation:**

```markdown
# /.claude/agents/meeting-processor.md

# Meeting Processor Agent

## Role
Process meeting notes into actionable tasks

## Workflow
1. Receive meeting transcript
2. Extract action items with assignees
3. Identify decisions made
4. Create summary
5. Create tasks via Linear MCP
6. Send email to attendees

## Tools
- Linear MCP (task creation)
- Email MCP (SendGrid)
- Meeting-summary-skill

## Output Format
- Summary document
- Tasks created in Linear
- Email sent to attendees
```

---

### Workflow 3: Weekly Review Automation

```
Friday 4:00 PM ──→ Scheduled Trigger
                        ↓
                  Review Orchestrator
                        ↓
          ┌─────────────┴─────────────┐
          ↓                           ↓
    Accomplishments Agent         Metrics Agent
    - Completed tasks             - Time tracking
    - Meetings held               - Goals progress
          ↓                           ↓
          └─────────────┬─────────────┘
                        ↓
                Weekly Review Skill
                - Format report
                - Generate insights
                        ↓
                Save to Google Drive (MCP)
```

---

## Capital Dashboard Workflows

### Workflow 1: Real-Time Risk Monitoring

```
Portfolio Position Changes (Supabase)
               ↓
         Webhook Trigger
               ↓
         Risk Assessment Agent
               ↓
    ┌──────────┴──────────┐
    ↓                     ↓
VaR Calculator      Stress Tester
    ↓                     ↓
    └──────────┬──────────┘
               ↓
    Risk Report Generator
               ↓
         ┌─────┴─────┐
         ↓           ↓
    [LOW RISK]   [HIGH RISK]
    Log only     Alert team
                 + Email report
```

**Implementation:**

```sql
-- Supabase webhook on positions table
CREATE TRIGGER position_change_monitor
  AFTER UPDATE ON portfolio_positions
  FOR EACH ROW
  WHEN (OLD.quantity != NEW.quantity OR OLD.price != NEW.price)
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://your-project.supabase.co/functions/v1/risk-assessment',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
```

```typescript
// supabase/functions/risk-assessment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

serve(async (req) => {
  const { record, old_record } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Get full portfolio context
  const { data: portfolio } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('portfolio_id', record.portfolio_id)
  
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })
  
  // Risk assessment agent
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a portfolio risk assessment agent.
    
    Analyze portfolio for:
    1. Concentration risk
    2. Sector exposure
    3. Correlation risk
    4. Volatility changes
    5. Stress scenarios
    
    Output risk level: LOW/MEDIUM/HIGH
    
    Portfolio data: ${JSON.stringify(portfolio)}
    Changed position: ${JSON.stringify(record)}
    Previous state: ${JSON.stringify(old_record)}`,
    messages: [{
      role: "user",
      content: "Assess current risk level and provide recommendations"
    }]
  })
  
  const assessment = JSON.parse(response.content[0].text)
  
  // Log assessment
  await supabase
    .from('risk_assessments')
    .insert({
      portfolio_id: record.portfolio_id,
      risk_level: assessment.risk_level,
      analysis: assessment,
      created_at: new Date().toISOString()
    })
  
  // If high risk, alert
  if (assessment.risk_level === 'HIGH') {
    // Send alert via email/Slack
    // ... notification logic
  }
  
  return new Response(JSON.stringify({ success: true, assessment }))
})
```

---

### Workflow 2: Automated Compliance Reporting

```
End of Trading Day ──→ Scheduled Trigger (4:00 PM EST)
                              ↓
                    Compliance Report Orchestrator
                              ↓
         ┌────────────────────┼────────────────────┐
         ↓                    ↓                    ↓
   Trade Validator      Position Checker     Risk Calculator
   - Check limits       - Verify holdings     - Calculate metrics
   - Flag violations    - Reconcile          - Generate reports
         ↓                    ↓                    ↓
         └────────────────────┼────────────────────┘
                              ↓
                    Compliance Report Skill
                    - Format per regulations
                    - Include all metrics
                              ↓
                    Store in Supabase + Google Drive
                              ↓
                    Email to compliance team
```

**Implementation:**

```markdown
# /.claude/agents/compliance-orchestrator.md

# Compliance Reporting Orchestrator

## Role
Generate end-of-day compliance reports

## Workflow
1. Invoke trade-validator sub-agent
   - Check all trades against limits
   - Flag violations
   
2. Invoke position-checker sub-agent
   - Verify all positions
   - Reconcile with custodian
   
3. Invoke risk-calculator sub-agent
   - Calculate VaR, Greeks, etc.
   - Assess portfolio risk
   
4. Compile with compliance-report-skill
   - Format per SEC requirements
   - Include all required metrics
   
5. Store report (Supabase + Google Drive MCP)

6. Email to compliance team

## Schedule
Daily at 4:00 PM EST

## Sub-Agents
- trade-validator
- position-checker
- risk-calculator

## Skills
- compliance-report-skill
- email-notification-skill

## MCPs
- Supabase (data access)
- Google Drive (storage)
- SendGrid (email)
```

---

## Service SaaS Workflows

### Workflow 1: Lead Intake & Qualification

```
Website Form Submitted
         ↓
   Supabase Webhook
         ↓
   Lead Intake Agent
         ↓
   ┌─────┴─────┐
   ↓           ↓
Data          Qualification
Validation    Agent
   ↓           ├─→ Check service area (MCP: Google Maps)
   ↓           ├─→ Score urgency
   ↓           ├─→ Estimate value
   ↓           └─→ Search similar leads (Embeddings)
   ↓           ↓
   └─────┬─────┘
         ↓
   [SCORE >= 8]  [SCORE 5-7]  [SCORE < 5]
         ↓             ↓            ↓
   Immediate      Schedule     Nurture
   Phone Call     Follow-up    Campaign
         ↓             ↓            ↓
   SMS to         Email +      Email
   Owner          CRM Task     Sequence
```

**Implementation:**

```sql
-- Supabase trigger
CREATE TRIGGER new_lead_processor
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://your-project.supabase.co/functions/v1/lead-qualification',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
```

```typescript
// supabase/functions/lead-qualification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"
import voyageai from "https://esm.sh/voyageai"

serve(async (req) => {
  const { record } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // 1. Get similar historical leads using embeddings
  const voyage = new voyageai.Client()
  
  const embedding = await voyage.embed({
    texts: [JSON.stringify(record)],
    model: "voyage-3-large",
    input_type: "query"
  })
  
  const { data: similarLeads } = await supabase.rpc(
    'match_leads',
    {
      query_embedding: embedding.embeddings[0],
      match_threshold: 0.78,
      match_count: 5
    }
  )
  
  // 2. Qualification agent
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })
  
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are a lead qualification expert for roofing businesses.
    
    Analyze this lead considering:
    - Service type urgency (leak = URGENT)
    - Project value (full replacement > repair)
    - Timeline (immediate > planning)
    - Location (in service area?)
    - Similar past leads: ${JSON.stringify(similarLeads)}
    
    Score 1-10 and provide routing recommendation.
    
    Output JSON:
    {
      "score": 8,
      "urgency": "high",
      "estimated_value": 15000,
      "action": "call_immediately",
      "reasoning": "...",
      "draft_message": "..."
    }`,
    messages: [{
      role: "user",
      content: `Qualify this lead: ${JSON.stringify(record)}`
    }]
  })
  
  const qualification = JSON.parse(response.content[0].text)
  
  // 3. Update lead with qualification
  await supabase
    .from('leads')
    .update({
      qualification_score: qualification.score,
      estimated_value: qualification.estimated_value,
      status: 'qualified',
      metadata: {
        ...record.metadata,
        qualification,
        qualified_at: new Date().toISOString()
      }
    })
    .eq('id', record.id)
  
  // 4. Route based on score
  if (qualification.score >= 8) {
    // High priority - immediate action
    await fetch('https://api.twilio.com/2010-04-01/Accounts/.../Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(Deno.env.get('TWILIO_SID') + ':' + Deno.env.get('TWILIO_TOKEN'))}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: Deno.env.get('OWNER_PHONE'),
        From: Deno.env.get('TWILIO_PHONE'),
        Body: `🚨 HIGH PRIORITY LEAD (Score: ${qualification.score})
        
Name: ${record.name}
Service: ${record.service_type}
Urgency: ${qualification.urgency}
Value: $${qualification.estimated_value}

Reason: ${qualification.reasoning}

Call now: ${record.phone}`
      })
    })
    
  } else if (qualification.score >= 5) {
    // Medium priority - schedule follow-up
    await supabase
      .from('tasks')
      .insert({
        type: 'follow_up_lead',
        lead_id: record.id,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium'
      })
      
  } else {
    // Low priority - add to nurture campaign
    await supabase
      .from('email_campaigns')
      .insert({
        lead_id: record.id,
        campaign_type: 'nurture',
        status: 'active'
      })
  }
  
  // 5. Send confirmation email to customer
  // ... email logic
  
  return new Response(
    JSON.stringify({ success: true, qualification }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

### Workflow 2: Appointment Scheduling & Confirmation

```
Customer Books Appointment (Cal.com/Calendly webhook)
                    ↓
              Supabase Webhook
                    ↓
          Appointment Processor Agent
                    ↓
      ┌─────────────┴─────────────┐
      ↓                           ↓
Validation Agent            Route Optimizer
- Check availability        - Assign technician
- Verify service area       - Plan route
- Confirm details           - Check availability
      ↓                           ↓
      └─────────────┬─────────────┘
                    ↓
          Confirmation Skill
          - Generate email
          - Create calendar event
          - Prepare service ticket
                    ↓
      ┌─────────────┴─────────────┐
      ↓             ↓             ↓
Email to        SMS to       Calendar
Customer      Technician      Event
```

**Implementation:**

```typescript
// supabase/functions/appointment-processor/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

serve(async (req) => {
  const { record } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })
  
  // Get available technicians
  const { data: technicians } = await supabase
    .from('technicians')
    .select('*')
    .eq('available', true)
  
  // Get existing appointments for route optimization
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .gte('scheduled_at', record.scheduled_at)
    .lte('scheduled_at', new Date(new Date(record.scheduled_at).getTime() + 86400000).toISOString())
  
  // Appointment processor agent
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are an appointment scheduling optimization agent.
    
    Consider:
    - Technician skills vs service type
    - Geographic proximity for route efficiency
    - Existing schedule to minimize drive time
    - Urgency of service
    
    Available technicians: ${JSON.stringify(technicians)}
    Today's appointments: ${JSON.stringify(appointments)}
    New appointment: ${JSON.stringify(record)}
    
    Assign best technician and generate:
    1. Technician assignment with reasoning
    2. Optimized route suggestion
    3. Customer confirmation message
    4. Technician briefing
    
    Output JSON.`,
    messages: [{
      role: "user",
      content: "Process this appointment and assign technician"
    }]
  })
  
  const assignment = JSON.parse(response.content[0].text)
  
  // Update appointment
  await supabase
    .from('appointments')
    .update({
      technician_id: assignment.technician_id,
      status: 'confirmed',
      route_details: assignment.route,
      metadata: {
        ...record.metadata,
        assignment
      }
    })
    .eq('id', record.id)
  
  // Send confirmations
  // Customer email
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: { email: 'appointments@yourcompany.com' },
      personalizations: [{
        to: [{ email: record.customer_email }],
        subject: 'Appointment Confirmed'
      }],
      content: [{
        type: 'text/html',
        value: assignment.customer_message
      }]
    })
  })
  
  // Technician SMS
  await fetch('https://api.twilio.com/2010-04-01/Accounts/.../Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(Deno.env.get('TWILIO_SID') + ':' + Deno.env.get('TWILIO_TOKEN'))}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: assignment.technician_phone,
      From: Deno.env.get('TWILIO_PHONE'),
      Body: assignment.technician_briefing
    })
  })
  
  return new Response(
    JSON.stringify({ success: true, assignment }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

### Workflow 3: Post-Job Review Request

```
Job Marked Complete (by technician)
            ↓
      Supabase Webhook
            ↓
    Job Completion Agent
            ↓
   ┌────────┴────────┐
   ↓                 ↓
Quality           Invoice
Checker           Generator
   ↓                 ↓
   └────────┬────────┘
            ↓
    [Wait 2 hours]
            ↓
   Review Request Agent
            ↓
    Generate personalized
    review request email
            ↓
       Send via Email
            ↓
    [Monitor responses]
            ↓
   ┌────────┴────────┐
   ↓                 ↓
[POSITIVE]      [NEGATIVE]
Share on        Alert owner
Social          + Draft response
```

**Implementation:**

```sql
-- Trigger on job completion
CREATE TRIGGER job_completion_processor
  AFTER UPDATE ON jobs
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://your-project.supabase.co/functions/v1/job-completion',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
```

```typescript
// supabase/functions/job-completion/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from "https://esm.sh/@anthropic-ai/sdk"

serve(async (req) => {
  const { record } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Get customer and job details
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', record.customer_id)
    .single()
  
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })
  
  // Generate personalized review request
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are a review request specialist.
    
    Create a warm, personalized review request email for a roofing customer.
    
    Customer: ${customer.name}
    Service: ${record.service_type}
    Technician: ${record.technician_name}
    Date: ${record.completed_at}
    
    Include:
    - Thank them for their business
    - Mention specific service details
    - Ask for review on Google
    - Make it easy (direct link)
    - Keep it friendly and brief
    
    Output: Just the email HTML (no JSON wrapper)`,
    messages: [{
      role: "user",
      content: "Generate review request email"
    }]
  })
  
  const emailContent = response.content[0].text
  
  // Schedule email for 2 hours later
  await supabase
    .from('scheduled_emails')
    .insert({
      to: customer.email,
      subject: `Thanks for choosing us, ${customer.name}!`,
      html_content: emailContent,
      scheduled_for: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      type: 'review_request',
      job_id: record.id
    })
  
  return new Response(JSON.stringify({ success: true }))
})

// Separate function runs every 5 minutes to send scheduled emails
```

---

## Common Patterns Library

### Pattern: Data Validation Pipeline

```
Input Data
    ↓
Validation Agent
    ├─→ Format checker
    ├─→ Required fields
    ├─→ Data type validation
    └─→ Business logic rules
    ↓
[VALID]         [INVALID]
    ↓               ↓
Process         Return errors
Further         + Suggestions
```

### Pattern: Approval Workflow

```
Request Submitted
        ↓
    Analysis Agent
        ↓
[Value < $1000]  [Value >= $1000]
        ↓               ↓
    Auto-approve   Requires approval
        ↓               ↓
    Execute       Send notification
                        ↓
                  Wait for response
                        ↓
                  [Approved/Rejected]
```

### Pattern: Error Handling

```
Operation Start
      ↓
  Try Execute
      ↓
[SUCCESS]    [FAILURE]
      ↓           ↓
   Return     Log error
   Result         ↓
           Retry Logic
           (3 attempts)
                ↓
           [Still fails]
                ↓
           Alert human
           + Provide context
```

### Pattern: Parallel Processing

```
Large Dataset
      ↓
Chunk into batches
      ↓
┌─────┼─────┐
↓     ↓     ↓
Agent Agent Agent
1     2     3
↓     ↓     ↓
└─────┼─────┘
      ↓
Aggregate Results
      ↓
Final Output
```

---

## Tips for Building Workflows

### 1. Start Simple
```
❌ Don't build this first:
   Complex 10-agent pipeline with error handling

✅ Do build this first:
   Simple 1-agent workflow
   Add complexity after testing
```

### 2. Test Each Component
```
Test order:
1. Skills independently
2. Single agents
3. Agent pipelines
4. Full workflow
5. Error scenarios
```

### 3. Monitor and Iterate
```
Add logging at each step:
- Agent start/end
- Tool calls
- Decisions made
- Errors encountered

Review logs weekly
Optimize based on patterns
```

### 4. Use Hooks Wisely
```
Good hook usage:
- Auto-format code
- Run tests
- Validate outputs
- Log operations

Bad hook usage:
- Complex logic
- Decision making
- External API calls (use agents)
```

### 5. Design for Failure
```
Every workflow should handle:
- API timeouts
- Invalid data
- Missing dependencies
- Rate limits
- Partial failures

Always have fallback plan
Always notify on critical errors
```

---

## Next Steps

1. **Pick one workflow** from above that matches your needs
2. **Implement it** step by step
3. **Test thoroughly** with real data
4. **Monitor performance** for a week
5. **Iterate and improve** based on learnings
6. **Build the next workflow**

Remember: The best workflow is the one that's actually deployed and working!

---

*For more patterns and implementation details, see:*
- `AUTOMATION_ARCHITECTURE_GUIDE.md`
- `QUICK_DECISION_MATRIX.md`
