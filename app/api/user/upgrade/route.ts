import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const { email, txRef } = await req.json();
    if (!email) {
      return NextResponse.json({ status: 'error', message: 'Email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year Pro access

    const client = await pool.connect();
    try {
      // Optional: Check if txRef was already processed to ensure idempotency
      if (txRef) {
        const existingTx = await client.query(
          'SELECT id FROM "Transaction" WHERE "txRef" = $1',
          [txRef]
        );
        if (existingTx.rows.length > 0) {
          return NextResponse.json({ status: 'success', message: 'Already processed' });
        }
      }

      // Update user to Pro
      await client.query(
        'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE LOWER(email) = $2',
        [expiresAt, cleanEmail]
      );

      // Log the transaction if you have a transaction tracking table
      if (txRef) {
        await client.query(
          'INSERT INTO "Transaction" ("txRef", "email", "createdAt") VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
          [txRef, cleanEmail]
        ).catch(() => {
          // Fallback if transaction table doesn't exist yet
        });
      }

    } finally {
      client.release();
    }

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    console.error('Production upgrade error:', err);
    return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
  }
}