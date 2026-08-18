import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
);

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx ts-node scripts/get-admin-token.ts <email> <password>');
    process.exit(1);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Login failed:', error.message);
    process.exit(1);
  }

  console.log('\nAccess token (paste into Authorization: Bearer <token>):\n');
  console.log(data.session?.access_token);
  console.log('\n');
}

main();