import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hiiayscqqcvcwmcpfkeh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_JYzD9Yk6nOn-AocwSQzkEg_0vjLrAAW'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
