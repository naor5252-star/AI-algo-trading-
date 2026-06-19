import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, app: 'PaperLab AI', mode: 'iPhone PWA', timestamp: new Date().toISOString() });
}
