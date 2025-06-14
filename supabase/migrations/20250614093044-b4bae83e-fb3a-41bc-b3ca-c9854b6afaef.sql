
SELECT
  cron.schedule(
    'update-campaign-status-every-minute',
    '* * * * *', -- every minute
    $$
    SELECT
      net.http_post(
          url:='https://nzsflibcvrisxjlzuxjn.supabase.co/functions/v1/update-campaign-status',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56c2ZsaWJjdnJpc3hqbHp1eGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTczMTksImV4cCI6MjA1NzY5MzMxOX0.Xfrp1zxJUFy2NEg_ZJJkf6aHj6v94_JHQ26BuZNsMis"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );
