import { supabase } from '@/integrations/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  if (!name) return Response.json({ exists: false });
  const { data } = await supabase
    .from('domains')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  return Response.json({ exists: !!data });
} 
