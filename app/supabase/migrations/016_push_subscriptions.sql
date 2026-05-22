-- Migration 016: Push notification subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_restaurant_idx ON push_subscriptions(restaurant_id);

-- Only the restaurant owner/staff can manage their own subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
      UNION
      SELECT restaurant_id FROM restaurant_staff WHERE user_id = auth.uid()
    )
  );
