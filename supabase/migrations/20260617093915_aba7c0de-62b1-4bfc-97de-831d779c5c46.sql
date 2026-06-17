
REVOKE EXECUTE ON FUNCTION public.upsert_streak_for_user(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_streak_for_user(uuid, date) TO authenticated, service_role;
