// lib/supabase.js
// Supabase 클라이언트 초기화
// 모든 페이지에서 이 파일을 import해서 사용합니다

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] 환경변수가 설정되지 않았습니다. Vercel에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가해주세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
