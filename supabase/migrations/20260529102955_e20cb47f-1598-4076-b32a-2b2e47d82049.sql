
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_chapter_mod(uuid, uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.is_chapter_mod(uuid, uuid) to authenticated, service_role;
