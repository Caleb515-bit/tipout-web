import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    // Automatically grabs your current Vercel domain or falls back locally
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    console.log(`Webhook active on: ${baseUrl}/api/flutterwave/webhook`);

    const event = await req.json();

    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const customerEmail = event.data.customer.email;
      const amountPaid = event.data.amount;

      const expiresAt = new Date();
      if (amountPaid >= 35) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const client = await pool.connect();
      await client.query(
        'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE email = $2',
        [expiresAt, customerEmail]
      );
      client.release();

      console.log(`Upgraded ${customerEmail} until ${expiresAt}`);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
  }
}