import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ status: 'error', message: 'Email required' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year Pro access

    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE LOWER(email) = $2',
        [expiresAt, email.toLowerCase().trim()]
      );
    } finally {
      client.release();
    }

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    console.error('Instant upgrade error:', err);
    return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
  }
}