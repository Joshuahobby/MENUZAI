-- Allow Business plan users to own multiple restaurant rows.
-- The unique constraint on user_id prevented this.
-- We keep the index for fast lookups but drop the uniqueness.
alter table restaurants drop constraint if exists restaurants_user_id_key;

comment on column restaurants.user_id is
  'Owner user ID. No longer unique — Business plan owners may have multiple restaurants (locations).';
