-- ELITE QR schema smoke tests.
-- Run with: supabase test db
begin;

select plan(18);

select has_table('public','companies','companies exists');
select has_table('public','profiles','profiles exists');
select has_table('public','user_roles','user_roles exists');
select has_table('public','teams','teams exists');
select has_table('public','locations','locations exists');
select has_table('public','assets','assets exists');
select has_table('public','reports','reports exists');
select has_table('public','work_orders','work_orders exists');
select has_table('public','inspections','inspections exists');
select has_table('public','work_order_updates','work_order_updates exists');
select has_table('public','audit_logs','audit_logs exists');
select has_table('public','attachments','attachments exists');
select has_function('public','current_company_id','current_company_id exists');
select has_function('public','my_company','my_company exists');
select has_function('public','public_asset_by_qr','public QR function exists');
select has_function('public','create_company_invite','invite function exists');
select has_index('public','assets','uq_assets_company_tag','asset uniqueness index exists');

select is(
  (select relrowsecurity from pg_class where oid='public.attachments'::regclass),
  true,
  'attachments has RLS enabled'
);

select * from finish();
rollback;
