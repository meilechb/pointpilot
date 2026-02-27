-- Fix: scan_usage needs INSERT policy for scan metering to work
-- Without this, inserts via anon key + user token silently fail due to RLS
create policy "Users can insert own scans" on scan_usage
  for insert with check (auth.uid() = user_id);
