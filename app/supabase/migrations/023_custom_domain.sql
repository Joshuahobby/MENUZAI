-- Custom domain mapping for Business plan restaurants
alter table restaurants
  add column if not exists custom_domain varchar(255);

create unique index if not exists restaurants_custom_domain_idx
  on restaurants (custom_domain)
  where custom_domain is not null;

comment on column restaurants.custom_domain is
  'e.g. "menu.kigaligrill.com". Business plan only. Used by the public menu route to serve the menu on a custom hostname.';
