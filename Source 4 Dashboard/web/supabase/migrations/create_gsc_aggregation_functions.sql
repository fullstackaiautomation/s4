-- Function to get top GSC queries aggregated by query
create or replace function get_gsc_top_queries(
  start_date date,
  end_date date,
  limit_count int
)
returns table (
  query text,
  clicks bigint,
  impressions bigint,
  ctr float,
  "position" float
)
language plpgsql
as $$
begin
  return query
  select
    g.query,
    sum(g.clicks) as clicks,
    sum(g.impressions) as impressions,
    case when sum(g.impressions) > 0 then sum(g.clicks)::float / sum(g.impressions) else 0 end as ctr,
    (sum(g.position * g.impressions) / nullif(sum(g.impressions), 0))::float as "position"
  from
    gsc_search_queries g
  where
    g.date >= start_date and g.date <= end_date
  group by
    g.query
  order by
    clicks desc
  limit
    limit_count;
end;
$$;

-- Function to get top GSC pages aggregated by page
create or replace function get_gsc_top_pages(
  start_date date,
  end_date date,
  limit_count int
)
returns table (
  page text,
  clicks bigint,
  impressions bigint,
  ctr float,
  "position" float
)
language plpgsql
as $$
begin
  return query
  select
    g.page,
    sum(g.clicks) as clicks,
    sum(g.impressions) as impressions,
    case when sum(g.impressions) > 0 then sum(g.clicks)::float / sum(g.impressions) else 0 end as ctr,
    (sum(g.position * g.impressions) / nullif(sum(g.impressions), 0))::float as "position"
  from
    gsc_page_performance g
  where
    g.date >= start_date and g.date <= end_date
  group by
    g.page
  order by
    clicks desc
  limit
    limit_count;
end;
$$;
