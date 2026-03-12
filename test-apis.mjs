import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nzsflibcvrisxjlzuxjn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56c2ZsaWJjdnJpc3hqbHp1eGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTczMTksImV4cCI6MjA1NzY5MzMxOX0.Xfrp1zxJUFy2NEg_ZJJkf6aHj6v94_JHQ26BuZNsMis'
);

async function test(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    const { data, error } = await fn();
    if (error) {
      // Try to extract actual response body from FunctionsHttpError
      const ctx = error.context;
      let body = null;
      try { body = ctx?.json ? await ctx.json() : (ctx?.text ? await ctx.text() : null); } catch(_) {}
      if (!body && ctx instanceof Response) {
        try { body = await ctx.clone().text(); } catch(_) {}
      }
      console.log('STATUS: ERROR');
      console.log('error name:', error.name);
      console.log('error message:', error.message);
      console.log('response body:', body ?? JSON.stringify(error));
    } else {
      console.log('STATUS: OK');
      console.log('data:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('THROWN:', e.message);
    if (e.context) {
      try { console.log('context body:', await e.context.text()); } catch(_) {}
    }
  }
}

// Test: fetch-telnyx-messaging-profiles
await test('fetch-telnyx-messaging-profiles', () =>
  supabase.functions.invoke('fetch-telnyx-messaging-profiles', { method: 'POST', body: {} })
);

// Test: ai-suggestions - valid
await test('ai-suggestions (valid: type=sms_text)', () =>
  supabase.functions.invoke('ai-suggestions', { body: { type: 'sms_text', brand: 'Test Brand' } })
);

// Test: ai-suggestions - missing type (should 400)
await test('ai-suggestions (missing type)', () =>
  supabase.functions.invoke('ai-suggestions', { body: {} })
);

// Test: ai-generation - valid
await test('ai-generation (valid)', () =>
  supabase.functions.invoke('ai-generation', { body: { prompt: 'Short SMS for restaurant', type: 'sms' } })
);

// Test: send-via-telnyx - missing fields (should 400)
await test('send-via-telnyx (missing text)', () =>
  supabase.functions.invoke('send-via-telnyx', { body: { to: '+12345678910' } })
);

// Test: send-via-telnyx - scheduled but no schedule_time (should 400)
await test('send-via-telnyx (schedule_type=later, no schedule_time)', () =>
  supabase.functions.invoke('send-via-telnyx', { body: { to: '+12345678910', text: 'Hello', schedule_type: 'later' } })
);

// Test: sync-unassigned-segment - missing contact
await test('sync-unassigned-segment (missing contact)', () =>
  supabase.functions.invoke('sync-unassigned-segment', { body: {} })
);

// Test: sync-unassigned-segment - valid contact
await test('sync-unassigned-segment (valid contact)', () =>
  supabase.functions.invoke('sync-unassigned-segment', {
    body: {
      contact: {
        id: '088f06ee-0dc9-44c1-9167-65582b3b7086',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@company.com',
        phone: '+1234567891',
        company: 'Marketing Inc',
        status: 'active'
      }
    }
  })
);

// Test: send-bulk-sms-via-telnyx - missing fields (should 400)
await test('send-bulk-sms-via-telnyx (missing fields)', () =>
  supabase.functions.invoke('send-bulk-sms-via-telnyx', { body: { segment_name: 'ALL' } })
);
