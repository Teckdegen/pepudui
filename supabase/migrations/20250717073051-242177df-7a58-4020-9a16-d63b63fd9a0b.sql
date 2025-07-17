
-- Add transaction_hash column to existing domains table for RPC verification
ALTER TABLE public.domains 
ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- Create index for faster transaction hash lookups
CREATE INDEX IF NOT EXISTS idx_domains_transaction_hash ON public.domains(transaction_hash);

-- Update RLS policies to be more permissive for the registration flow
DROP POLICY IF EXISTS "Owners can update their domains" ON public.domains;

-- Create new policy that allows updates during registration process
CREATE POLICY "Allow updates during registration" 
  ON public.domains 
  FOR UPDATE 
  USING (true);
