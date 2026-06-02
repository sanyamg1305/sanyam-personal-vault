-- 1. Main vault table (replaces all Firestore collections)
CREATE TABLE vault_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collection TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Row Level Security (users only see their own data)
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own data" ON vault_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Index for fast queries
CREATE INDEX idx_vault_user_col ON vault_items(user_id, collection);

-- 4. Auto-update updated_at on every edit
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE vault_items;

-- 6. Storage bucket policies (create bucket 'vault-documents' in Storage UI first)
CREATE POLICY "Users upload own docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vault-documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Users view own docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'vault-documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Users delete own docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vault-documents' AND auth.uid()::text = (string_to_array(name, '/'))[1]);
