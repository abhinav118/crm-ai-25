import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nzsflibcvrisxjlzuxjn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56c2ZsaWJjdnJpc3hqbHp1eGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTczMTksImV4cCI6MjA1NzY5MzMxOX0.Xfrp1zxJUFy2NEg_ZJJkf6aHj6v94_JHQ26BuZNsMis'
);

// Check messages columns
const { data: msg } = await supabase.from('messages').select('*').limit(1);
console.log('messages columns:', msg?.[0] ? Object.keys(msg[0]) : 'no rows');

// Check profiles table
const { data: prof, error: pe } = await supabase.from('profiles').select('*').limit(3);
console.log('profiles:', prof ? JSON.stringify(prof) : 'error: ' + pe?.message);

// Check user_logins
const { data: ul, error: ule } = await supabase.from('user_logins').select('*').limit(1);
console.log('user_logins:', ul ? JSON.stringify(ul) : 'error: ' + ule?.message);

// Check messages for the specific contact_id from error
const { data: msgs, error: me } = await supabase
  .from('messages')
  .select('*')
  .eq('contact_id', 'aba76ec4-c1f1-42a9-a8c4-746252d30f7a')
  .limit(3);
console.log('messages for contact:', msgs ? JSON.stringify(msgs) : 'error: ' + me?.message);

// Check profiles for id
const { data: p2, error: p2e } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', '03aa1bcd-5cb3-47b3-b5af-138bc4802f2b');
console.log('profile by id:', p2 ? JSON.stringify(p2) : 'error: ' + p2e?.message);
