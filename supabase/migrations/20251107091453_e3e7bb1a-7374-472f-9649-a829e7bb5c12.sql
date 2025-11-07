-- Drop the overly permissive public ticket viewing policy
-- This policy uses 'OR true' which bypasses all authentication checks
-- and exposes sensitive customer data to anyone on the internet
DROP POLICY IF EXISTS "Public ticket viewing" ON public.tickets;

-- The existing "Admins can view all tickets" policy remains active
-- and provides proper admin access with has_role(auth.uid(), 'admin'::app_role)