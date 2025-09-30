-- Create a simple table to generate types
CREATE TABLE public.app_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_metadata ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows everyone to read (since this is just metadata)
CREATE POLICY "Allow public read access" 
ON public.app_metadata 
FOR SELECT 
USING (true);