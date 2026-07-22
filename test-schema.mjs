import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    envVars[key.trim()] = value.join('=').trim().replace(/"/g, '');
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || '';
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSchemas() {
  console.log("Testing emergency_reports...");
  let res1 = await supabase.from('emergency_reports').insert([{}]).select();
  console.log("reports error:", res1.error);

  console.log("\nTesting hospital_searches...");
  let res2 = await supabase.from('hospital_searches').insert([{}]).select();
  console.log("hospitals error:", res2.error);

  console.log("\nTesting feedback...");
  let res3 = await supabase.from('feedback').insert([{}]).select();
  console.log("feedback error:", res3.error);
}

testSchemas();
