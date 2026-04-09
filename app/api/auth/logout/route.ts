import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('mest_session');
  res.cookies.delete('mest_team');
  res.cookies.delete('mest_admin');
  return res;
}
