-- TravelMateNE read-only RLS audit for the existing public tables.
-- Run in the Supabase SQL Editor. This query reads PostgreSQL catalog metadata only.
-- It does not read application rows, create objects, change policies, or change schema.
-- Owner-scope checks are text heuristics over policy expressions; review expressions
-- flagged below manually, especially if policies use helper functions or aliases.

with expected_tables(table_name, is_private, owner_column) as (
  values
    ('profiles'::text, true,  'id'::text),
    ('favorites'::text, true, 'user_id'::text),
    ('itineraries'::text, true, 'user_id'::text),
    ('destinations'::text, false, null::text)
),
table_status as (
  select
    e.table_name,
    e.is_private,
    e.owner_column,
    c.oid as table_oid,
    c.oid is not null as table_exists,
    coalesce(c.relrowsecurity, false) as rls_enabled,
    coalesce(c.relforcerowsecurity, false) as rls_forced
  from expected_tables e
  left join pg_namespace n on n.nspname = 'public'
  left join pg_class c
    on c.relnamespace = n.oid
   and c.relname = e.table_name
   and c.relkind in ('r', 'p')
),
api_role_status as (
  select
    expected.role_name,
    r.rolname is not null as role_exists,
    coalesce(r.rolbypassrls, false) as bypasses_rls,
    coalesce(r.rolsuper, false) as is_superuser
  from (values ('anon'::name), ('authenticated'::name)) as expected(role_name)
  left join pg_roles r on r.rolname = expected.role_name
),
policy_metadata as (
  select
    e.table_name,
    e.is_private,
    e.owner_column,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check,
    (
      e.is_private
      and position('auth.uid()' in lower(coalesce(p.qual, ''))) > 0
      and position(lower(e.owner_column) in lower(coalesce(p.qual, ''))) > 0
    ) as using_mentions_owner_uid,
    (
      e.is_private
      and position('auth.uid()' in lower(coalesce(p.with_check, p.qual, ''))) > 0
      and position(lower(e.owner_column) in lower(coalesce(p.with_check, p.qual, ''))) > 0
    ) as check_mentions_owner_uid,
    position(' or ' in ' ' || regexp_replace(lower(coalesce(p.qual, '')), '\s+', ' ', 'g') || ' ') > 0 as using_contains_or,
    position(' or ' in ' ' || regexp_replace(lower(coalesce(p.with_check, p.qual, '')), '\s+', ' ', 'g') || ' ') > 0 as check_contains_or
  from expected_tables e
  join pg_policies p
    on p.schemaname = 'public'
   and p.tablename = e.table_name
),
commands(command_name) as (
  values ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text), ('DELETE'::text)
),
private_command_coverage as (
  select
    t.table_name,
    c.command_name,
    t.table_exists,
    t.rls_enabled,
    coalesce(bool_or(
      p.policyname is not null
      and p.permissive = 'PERMISSIVE'
      and p.cmd in ('ALL', c.command_name)
      and ('authenticated' = any(p.roles) or 'public' = any(p.roles))
      and case c.command_name
        when 'INSERT' then p.check_mentions_owner_uid
        when 'UPDATE' then p.using_mentions_owner_uid and p.check_mentions_owner_uid
        else p.using_mentions_owner_uid
      end
    ), false) as has_owner_scoped_policy
  from table_status t
  cross join commands c
  left join policy_metadata p
    on p.table_name = t.table_name
   and t.is_private
   and p.cmd in ('ALL', c.command_name)
  where t.is_private
  group by t.table_name, c.command_name, t.table_exists, t.rls_enabled
),
findings as (
  -- Missing tables or RLS disabled on a private table are high-priority findings.
  select
    'HIGH' as severity,
    table_name as object_name,
    case
      when not table_exists then 'Expected public table is missing.'
      else 'RLS is disabled on a private table; client access is not row-filtered by RLS.'
    end as finding
  from table_status
  where not table_exists or (is_private and not rls_enabled)

  union all

  select
    'HIGH' as severity,
    'role.' || role_name::text as object_name,
    'The ' || role_name::text || ' API role has BYPASSRLS or superuser privileges.' as finding
  from api_role_status
  where role_exists and (bypasses_rls or is_superuser)

  union all

  -- Without a qualifying policy, RLS normally denies the operation; the app may fail.
  select
    'REVIEW' as severity,
    table_name || ' / ' || command_name as object_name,
    'No authenticated owner-scoped policy was detected for this operation. RLS may deny the app operation; check grants and policy intent.' as finding
  from private_command_coverage
  where table_exists and rls_enabled and not has_owner_scoped_policy

  union all

  -- Permissive policies combine with OR, so one broad policy can defeat a scoped one.
  select
    'HIGH' as severity,
    p.table_name || ' / ' || p.policyname as object_name,
    'Permissive private-table policy for a client role does not visibly constrain ' ||
      case
        when p.cmd = 'INSERT' then 'WITH CHECK'
        when p.cmd = 'UPDATE' then 'both USING and WITH CHECK'
        else 'USING'
      end || ' with auth.uid() and the expected owner column (' || p.owner_column || '), or it contains a possible OR bypass. Review for cross-user access.' as finding
  from policy_metadata p
  where p.is_private
    and p.permissive = 'PERMISSIVE'
    and p.cmd in ('ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE')
    and (
      'authenticated' = any(p.roles)
      or 'anon' = any(p.roles)
      or 'public' = any(p.roles)
    )
    and case p.cmd
      when 'INSERT' then not p.check_mentions_owner_uid or p.check_contains_or
      when 'UPDATE' then not (p.using_mentions_owner_uid and p.check_mentions_owner_uid) or p.using_contains_or or p.check_contains_or
      when 'ALL' then not (p.using_mentions_owner_uid and p.check_mentions_owner_uid) or p.using_contains_or or p.check_contains_or
      else not p.using_mentions_owner_uid or p.using_contains_or
    end

  union all

  -- A private policy assigned to anon/PUBLIC deserves explicit scrutiny.
  select
    'REVIEW' as severity,
    p.table_name || ' / ' || p.policyname as object_name,
    'Policy applies to anon or PUBLIC. Confirm its UID predicate prevents anonymous access.' as finding
  from policy_metadata p
  where p.is_private
    and ('anon' = any(p.roles) or 'public' = any(p.roles))

  union all

  -- With RLS enabled, public destinations need a SELECT policy that includes anon/PUBLIC.
  select
    'REVIEW' as severity,
    'destinations / SELECT' as object_name,
    'No SELECT policy for anon or PUBLIC was detected; unauthenticated destination browsing may be denied.' as finding
  from table_status t
  where t.table_name = 'destinations'
    and t.table_exists
    and t.rls_enabled
    and not exists (
      select 1
      from policy_metadata p
      where p.table_name = 'destinations'
        and p.cmd in ('ALL', 'SELECT')
        and ('anon' = any(p.roles) or 'public' = any(p.roles))
    )

  union all

  -- Public destinations are intended to be read-only by browser clients.
  select
    'REVIEW' as severity,
    p.table_name || ' / ' || p.policyname as object_name,
    'Client-facing role has a write-capable policy on public destinations; confirm it is intentional and appropriately restricted.' as finding
  from policy_metadata p
  where p.table_name = 'destinations'
    and p.cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    and ('anon' = any(p.roles) or 'authenticated' = any(p.roles) or 'public' = any(p.roles))
)
select
  section,
  object_name,
  status,
  details
from (
  -- Result section 1: RLS flags for the four expected public tables.
  select
    1 as section_order,
    'RLS STATUS'::text as section,
    'public.' || t.table_name as object_name,
    case
      when not t.table_exists then 'MISSING TABLE'
      when t.rls_enabled then 'RLS ON'
      else 'RLS OFF'
    end as status,
    'row_security=' || t.rls_enabled::text || '; force_row_security=' || t.rls_forced::text ||
      '; anon_grants=' || case when t.table_exists then concat_ws(',',
        case when has_table_privilege('anon', t.table_oid, 'SELECT') then 'SELECT' end,
        case when has_table_privilege('anon', t.table_oid, 'INSERT') then 'INSERT' end,
        case when has_table_privilege('anon', t.table_oid, 'UPDATE') then 'UPDATE' end,
        case when has_table_privilege('anon', t.table_oid, 'DELETE') then 'DELETE' end
      ) else '(table missing)' end ||
      '; authenticated_grants=' || case when t.table_exists then concat_ws(',',
        case when has_table_privilege('authenticated', t.table_oid, 'SELECT') then 'SELECT' end,
        case when has_table_privilege('authenticated', t.table_oid, 'INSERT') then 'INSERT' end,
        case when has_table_privilege('authenticated', t.table_oid, 'UPDATE') then 'UPDATE' end,
        case when has_table_privilege('authenticated', t.table_oid, 'DELETE') then 'DELETE' end
      ) else '(table missing)' end as details
  from table_status t

  union all

  select
    1,
    'API ROLE STATUS',
    'role.' || r.role_name::text,
    case when not r.role_exists then 'ROLE MISSING' when r.bypasses_rls or r.is_superuser then 'PRIVILEGED' else 'NO RLS BYPASS' end,
    'bypassrls=' || r.bypasses_rls::text || '; superuser=' || r.is_superuser::text
  from api_role_status r

  union all

  -- Result section 2: existing policy definitions and heuristic owner-scope indicators.
  select
    2,
    'POLICY',
    'public.' || p.table_name || ' / ' || p.policyname,
    p.cmd || ' / ' || p.permissive || ' / roles=' || p.roles::text,
    'USING=' || coalesce(p.qual, '(not specified)') ||
      '; WITH CHECK=' || coalesce(p.with_check, '(not specified)') ||
      case when p.is_private then
        '; heuristic_using_owner_uid=' || p.using_mentions_owner_uid::text ||
        '; heuristic_check_owner_uid=' || p.check_mentions_owner_uid::text
      else '' end
  from policy_metadata p

  union all

  -- Result section 3: command-by-command owner-scoped policy coverage for private tables.
  select
    3,
    'PRIVATE COMMAND COVERAGE',
    'public.' || c.table_name || ' / ' || c.command_name,
    case
      when not c.table_exists then 'TABLE MISSING'
      when not c.rls_enabled then 'RLS OFF'
      when c.has_owner_scoped_policy then 'OWNER-SCOPED POLICY DETECTED'
      else 'NO OWNER-SCOPED POLICY DETECTED'
    end,
    'Requires a permissive policy for authenticated/PUBLIC and the expected owner column compared with auth.uid(); UPDATE requires both predicates.'
  from private_command_coverage c

  union all

  -- Result section 4: likely risks and items requiring policy-owner review.
  select
    4,
    'FINDING',
    f.object_name,
    f.severity,
    f.finding
  from findings f
) audit
order by section_order, object_name;
