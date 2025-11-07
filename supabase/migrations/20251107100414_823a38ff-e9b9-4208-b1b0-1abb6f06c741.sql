-- Drop the overly permissive ticket update policy
-- This policy allowed any authenticated user to update any ticket
DROP POLICY IF EXISTS "Allow ticket updates" ON public.tickets;

-- The following policies remain in effect:
-- 1. "Admins can update all tickets" - for admin dashboard
-- 2. "Public ticket creation" - for user ticket submission
-- 3. Edge functions use service role key (bypasses RLS)
-- This ensures proper access control while maintaining functionality