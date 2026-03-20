import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data } = await s
    .from('products')
    .select('name, brand, model, specifications')
    .eq('is_active', true)
    .limit(5);
  console.log(JSON.stringify(data, null, 2));
}
main().catch(console.error);
