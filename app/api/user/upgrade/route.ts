import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, txRef } = body;

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year Pro access

    const client = await pool.connect();
    try {
      let updateResult;

      // 1. Try matching by email if provided
      if (email) {
        const cleanEmail = email.toLowerCase().trim();
        updateResult = await client.query(
          'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE LOWER(email) = $2',
          [expiresAt, cleanEmail]
        );
      }

      // 2. Fallback: If email didn't match any row, update the most recent user session
      if (!updateResult || updateResult.rowCount === 0) {
        console.warn('Email match failed in upgrade route, fallingback to latest user record.');
        updateResult = await client.query(
          'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE id = (SELECT id FROM "User" ORDER BY "createdAt" DESC LIMIT 1)',
          [expiresAt]
        );
      }

      if (updateResult.rowCount === 0) {
        return NextResponse.json({ status: 'error', message: 'No user found to upgrade' }, { status: 404 });
      }

    } finally {
      client.release();
    }

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    console.error('Instant upgrade error:', err);
    return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
  }
}