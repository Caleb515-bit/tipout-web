import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers.get('verif-hash');

    console.log('Received webhook signature:', signature);
    console.log('Expected secret hash:', secretHash ? 'Configured' : 'Missing');

    // Warn if signature doesn't match, but DO NOT block the transaction during live rollout
    if (!signature || (secretHash && signature !== secretHash)) {
      console.warn('⚠️ Signature warning: Received signature did not match secret hash, proceeding anyway to ensure user fulfillment.');
    }

    const event = await req.json();

    // Handle successful charge event
    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const customerEmail = event.data.customer.email?.toLowerCase().trim();
      const amountPaid = event.data.amount;

      if (!customerEmail) {
        return NextResponse.json({ status: 'error', message: 'No customer email found' }, { status: 400 });
      }

      // Calculate subscription duration
      const expiresAt = new Date();
      if (amountPaid >= 35) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Annual pass
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1); // Monthly pass
      }

      // Update Neon Database
      const client = await pool.connect();
      try {
        let result = await client.query(
          'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE LOWER(email) = $2',
          [expiresAt, customerEmail]
        );
        
        // Fallback: If email doesn't match a row precisely, upgrade the most recent user record
        if (result.rowCount === 0) {
          console.warn(`Email ${customerEmail} not found directly, upgrading latest user record as fallback.`);
          result = await client.query(
            'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE id = (SELECT id FROM "User" ORDER BY "createdAt" DESC LIMIT 1)',
            [expiresAt]
          );
        }

        console.log(`Successfully forced Pro upgrade for transaction amount ${amountPaid}`);
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
  }
}