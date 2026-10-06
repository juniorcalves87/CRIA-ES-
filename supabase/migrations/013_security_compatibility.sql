-- ELITE QR 013 — compatibility correction for functions that use composite/table names
alter function public.ensure_billing_settings(uuid) set search_path='public';
alter function public.save_my_pix_settings(text,text,text,text) set search_path='public';
alter function public.master_overview() set search_path='public';
alter function public.master_payment_requests() set search_path='public';
alter function public.master_approve_payment(uuid,text) set search_path='public';
alter function public.master_reject_payment(uuid,text) set search_path='public';
alter function public.save_my_onboarding(text,text,text,text,text,integer,boolean) set search_path='public';
alter function public.get_my_onboarding() set search_path='public';
