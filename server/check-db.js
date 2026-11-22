// Checks the Supabase connection from .env:  npm run db:check
// Prints which key type is configured and which Fastop tables exist. Never prints secrets.
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✖ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set in .env')
  process.exit(1)
}

let role = 'unknown'
try {
  role = JSON.parse(Buffer.from(SUPABASE_SERVICE_ROLE_KEY.split('.')[1], 'base64url').toString()).role
} catch {
  if (SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')) role = 'service_role (new secret key format)'
  else if (SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_publishable_')) role = 'anon (publishable)'
}
console.log(`Project URL : ${SUPABASE_URL}`)
console.log(`Key type    : ${role}${/service_role/.test(role) ? '  ✔' : '  ✖ use the service_role / secret key'}`)

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const tables = ['app_users', 'verification_codes', 'shops', 'products', 'sales', 'expenses', 'enquiries', 'favorites', 'activity', 'settings']
let missing = 0
for (const t of tables) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
  if (error) {
    missing++
    console.log(`  ✖ ${t.padEnd(20)} ${error.message}`)
  } else console.log(`  ✔ ${t.padEnd(20)} ${count} rows`)
}
for (const fn of ['record_sale', 'void_sale', 'increment_product_views']) {
  const { error } = await sb.rpc(fn, fn === 'void_sale' ? { p_id: '__check__', p_restock: false } : fn === 'increment_product_views' ? { p_id: '__check__' } : { p_id: '__chk', p_shop_id: '__none__', p_items: [], p_payment_method: 'x', p_customer_name: '' })
  const ok = !error || /foreign key|violates/i.test(error.message)
  if (!ok) missing++
  console.log(`  ${ok ? '✔' : '✖'} function ${fn.padEnd(25)} ${ok ? '' : error.message}`)
}
console.log(missing ? `\n${missing} item(s) missing → run supabase/migrations/20261122000000_fastop_schema.sql in the Supabase SQL Editor.` : '\nDatabase is ready.')
