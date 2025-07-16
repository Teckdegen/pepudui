
-- Create domains table for storing .pepu domain registrations
CREATE TABLE public.domains (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  expiry TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year'),
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_domains_owner ON public.domains(owner);
CREATE INDEX idx_domains_paid ON public.domains(paid);
CREATE INDEX idx_domains_name ON public.domains(name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can check domain availability)
CREATE POLICY "Anyone can view domains" 
  ON public.domains 
  FOR SELECT 
  USING (true);

-- Create policy for inserting new domains (for now, anyone can register)
CREATE POLICY "Anyone can register domains" 
  ON public.domains 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for updating domains (only the owner can update)
CREATE POLICY "Owners can update their domains" 
  ON public.domains 
  FOR UPDATE 
  USING (owner = current_setting('request.headers')::json->>'x-wallet-address');

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_domains_updated_at 
    BEFORE UPDATE ON public.domains 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
