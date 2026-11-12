-- The AI image limit is kept by the server with the secret key (lib/actions/design-assistant.ts).
-- Visitors could call these directly and hand their own attempts back, so they lose access.
-- Apply only once the site that uses the secret key for this is live.

revoke execute on function public.claim_ai_use(text, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.release_ai_use(text, text) from public, anon, authenticated;
grant execute on function public.claim_ai_use(text, text, integer, integer) to service_role;
grant execute on function public.release_ai_use(text, text) to service_role;
