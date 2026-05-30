-- Performance indexes for high-traffic query patterns.
-- Each index covers the exact (table, columns) used in the most frequent queries.

-- analytics_events: restaurant + time range (analytics dashboard, 7/30/90-day windows)
create index if not exists analytics_events_restaurant_time_idx
  on analytics_events(restaurant_id, created_at desc);

-- orders: restaurant + status filter (orders dashboard live view, realtime feed)
create index if not exists orders_restaurant_status_time_idx
  on orders(restaurant_id, status, created_at desc);

-- menus: restaurant + recency (bootstrap loads most-recently-updated menu on login)
create index if not exists menus_restaurant_updated_idx
  on menus(restaurant_id, updated_at desc);

-- reviews: restaurant + recency (reviews dashboard)
create index if not exists reviews_restaurant_time_idx
  on reviews(restaurant_id, created_at desc);
