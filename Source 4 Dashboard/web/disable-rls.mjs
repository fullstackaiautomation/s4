import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tcryasuisocelektmrmb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnlhc3Vpc29jZWxla3Rtcm1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE1ODQ2MCwiZXhwIjoyMDc2NzM0NDYwfQ.HgHPvdDTWuiX1egM7OSsrHmYLfqT6Ijdr1-SPNe8oG0'
)

const { error } = await supabase.rpc('disable_rls', {
  schema_name: 'public',
  table_name: 'sku_ad_spend'
})

if (error) {
  console.log('RPC not available, trying REST API instead...')
  console.log('You need to manually disable RLS in Supabase:')
  console.log('1. Go to Tables > sku_ad_spend > RLS')
  console.log('2. Toggle "Enable RLS" OFF')
  console.log('3. Confirm')
} else {
  console.log('RLS disabled successfully!')
}
