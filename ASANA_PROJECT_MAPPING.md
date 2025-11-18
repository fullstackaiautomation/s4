# Asana Project Mapping - Source 4 Industries

## 📋 Project Identification

### Sales / Quotes Projects:

#### 1. **Shopify Orders**
- **Purpose:** Orders from Shopify with POs
- **Data:** E-commerce orders, POs
- **Dashboard:** Shopify Sales Pipeline
- **Key Metrics:** Order value, status, fulfillment

#### 2. **Orders Not Shopify**
- **Purpose:** Non-Shopify orders (Sales Orders, Invoices, POs)
- **Data:** B2B orders, wholesale, custom quotes
- **Dashboard:** B2B Sales Pipeline
- **Key Metrics:** Order value, status, payment terms

### Customer Service:

#### 3. **CUSTOMER SERVICE**
- **Purpose:** Customer support issues and tickets
- **Dashboard:** Customer Service Metrics
- **Key Metrics:** Response time, resolution time, issue type, priority

### Key Custom Fields (ALL TRACKED):

**All 48 custom fields** will be parsed and stored, including:
- ✅ Order Value (number)
- ✅ Status (enum)
- ✅ Priority (enum)
- ✅ Risk Assessment Status (enum)
- ✅ Data Sensitivity (enum)
- ✅ Vendor Type (enum)
- ✅ Point of Contact (text)
- ✅ Contact Email Address (text)
- ✅ Vendor Category (enum)
- ✅ Contract Status (enum)
- ✅ Percent Change (number)
- ... and 37 more fields!

---

## 🎯 Dashboard Structure

### Dashboard 1: Shopify Orders Pipeline
```
┌─────────────────────────────────────────────────┐
│  SHOPIFY ORDERS                    $125K Today  │
├──────────┬──────────┬─────────┬────────────────┤
│ Pending  │Processing│ Shipped │  Delivered     │
│  $45K    │  $35K    │  $30K   │    $15K        │
│  (18)    │  (12)    │  (8)    │    (5)         │
└──────────┴──────────┴─────────┴────────────────┘

Top Products Today:
• Product A: $12K (8 orders)
• Product B: $8K (5 orders)
• Product C: $6K (12 orders)

⚠️ Alerts:
• 3 orders pending >24hrs
• 2 shipping delays
• 1 high-value order ($5K+) needs review
```

### Dashboard 2: B2B Sales Pipeline (Orders Not Shopify)
```
┌─────────────────────────────────────────────────┐
│  B2B PIPELINE                    $2.4M weighted │
├──────────┬──────────┬─────────┬────────────────┤
│  Quote   │ Proposal │ Negotiat│    Closed      │
│  $850K   │  $600K   │  $450K  │    $500K MTD   │
│  (25)    │  (15)    │  (8)    │    (12)        │
└──────────┴──────────┴─────────┴────────────────┘

Recent Wins:
✓ $85K - TechCorp Equipment Order
✓ $62K - Industrial Supply Co
✓ $48K - Warehouse Solutions Inc

Open Opportunities:
• $120K - Major Distribution Center (Quote stage)
• $95K - Manufacturing Plant (Proposal sent)
• $75K - Logistics Company (Negotiating)

⚠️ Alerts:
• 5 quotes pending >7 days
• $280K in opportunities need follow-up
• 3 high-value deals stalled >30 days
```

### Dashboard 3: Customer Service Metrics
```
┌──────────────────────────────────────────────┐
│ CUSTOMER SERVICE          Avg: 2.3 hrs       │
├──────────┬──────────┬──────────┬────────────┤
│ Critical │  High    │  Medium  │    Low     │
│    2     │    8     │    14    │     6      │
└──────────┴──────────┴──────────┴────────────┘

Resolution Performance:
Today:     1.8 hrs ✅ (target: 2.0)
This Week: 2.1 hrs ✅
This Month: 2.5 hrs ⚠️

Top Issues:
1. Product Questions (12 tickets, 1.5hr avg)
2. Order Status (8 tickets, 2.0hr avg)
3. Shipping Delays (6 tickets, 3.2hr avg)
4. Returns/Exchanges (4 tickets, 2.8hr avg)

Rep Performance:
• Alice: 15 tickets, 1.9hr avg ⭐
• Bob: 12 tickets, 2.2hr avg
• Carol: 18 tickets, 2.0hr avg ⭐
```

---

## 🔧 Custom Field Usage Recommendations

### For Shopify Orders:
- **Order Value** → Track order size
- **Status** → Pending, Processing, Shipped, Delivered
- **Priority** → Rush orders, standard
- **Point of Contact** → Customer name/email

### For Orders Not Shopify (B2B):
- **Order Value** → Quote/order amount
- **Status** → Quote, Proposal, Negotiation, Won, Lost
- **Priority** → Deal urgency
- **Contract Status** → Active, Pending, Renewal
- **Vendor Type** → Customer type (retail, wholesale, etc.)
- **Point of Contact** → Decision maker
- **Contact Email Address** → Primary contact

### For Customer Service:
- **Priority** → Critical, High, Medium, Low
- **Status** → Open, In Progress, Waiting, Resolved
- **Data Sensitivity** → For privacy-related issues
- **Point of Contact** → Customer contact

---

## 📊 SQL Queries for Your Projects

### Get all Shopify orders:
```sql
SELECT
  t.name as order_name,
  t.custom_fields->>'Order Value' as order_value,
  t.custom_fields->>'Status' as status,
  t.custom_fields->>'Priority' as priority,
  t.assignee_name,
  t.created_at,
  t.completed
FROM asana_tasks t
JOIN asana_projects p ON t.project_gid = p.gid
WHERE p.name = 'Shopify Orders'
ORDER BY t.created_at DESC;
```

### Get all B2B opportunities:
```sql
SELECT
  t.name as opportunity,
  t.quote_amount, -- Auto-parsed from "Order Value"
  t.task_status,
  t.priority,
  t.assignee_name as sales_rep,
  t.due_on as expected_close,
  t.created_at,
  t.completed
FROM asana_tasks t
JOIN asana_projects p ON t.project_gid = p.gid
WHERE p.name = 'Orders Not Shopify'
  AND t.quote_amount IS NOT NULL
ORDER BY t.quote_amount DESC;
```

### Get customer service metrics:
```sql
SELECT
  t.priority,
  COUNT(*) as ticket_count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at)) / 3600)::NUMERIC(10,1) as avg_hours,
  COUNT(*) FILTER (WHERE t.completed = true) as resolved,
  COUNT(*) FILTER (WHERE t.completed = false) as open
FROM asana_tasks t
JOIN asana_projects p ON t.project_gid = p.gid
WHERE p.name = 'CUSTOMER SERVICE'
GROUP BY t.priority
ORDER BY
  CASE t.priority
    WHEN 'Critical' THEN 1
    WHEN 'High' THEN 2
    WHEN 'Medium' THEN 3
    WHEN 'Low' THEN 4
    ELSE 5
  END;
```

---

## 🚀 Next Steps

### Step 1: Run Database Schema ✅
(You're about to do this)

### Step 2: Run First Sync
This will import all tasks from:
- Shopify Orders project
- Orders Not Shopify project
- CUSTOMER SERVICE project
- All 73 other projects

**Expected data:**
- 76 projects
- Hundreds/thousands of tasks
- All 48 custom fields parsed

### Step 3: Build Custom Dashboards
Once data is synced, I'll build:

1. **Shopify Orders Dashboard** (E-commerce operations)
2. **B2B Sales Pipeline** (Non-Shopify sales tracking)
3. **Customer Service Dashboard** (Support metrics)
4. **Combined Sales Overview** (Shopify + B2B together)

---

## 💡 Integration Ideas

### Combine Asana + Shopify:
Once Shopify integration is live, we can:
- Match Asana "Shopify Orders" tasks to actual Shopify orders
- Auto-create Asana tasks for new Shopify orders
- Update task status based on Shopify fulfillment
- Flag discrepancies between systems

### Combine Asana + CBOS:
Once CBOS integration is live, we can:
- Match "Orders Not Shopify" tasks to CBOS sales orders
- Pull real-time cost/profit data for each order
- Calculate actual margin vs quoted margin
- Alert on margin compression

### Combine Asana + Email (Klaviyo):
- Track customer service response via email
- Link email campaigns to sales opportunities
- Measure email effectiveness by order conversion

---

## 🎯 Success Metrics

### For Shopify Orders:
- Average time from order to shipment
- Order completion rate
- High-value order turnaround
- Daily order volume trends

### For B2B Sales:
- Pipeline coverage (open pipeline / monthly target)
- Win rate by rep
- Average deal size
- Time to close by stage
- Quote-to-close conversion rate

### For Customer Service:
- First response time
- Average resolution time
- Resolution rate %
- Customer satisfaction (if tracked)
- Tickets per category

---

Ready to sync! Once you run the database schema and first sync, I'll start building these custom dashboards immediately! 🚀
