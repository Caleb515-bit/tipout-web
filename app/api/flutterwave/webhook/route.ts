import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  try {
    // 1. SECURITY CHECK: Verify the Webhook Signature (verif-hash)
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers.get('verif-hash');

    if (!signature || signature !== secretHash) {
      console.warn('Unauthorized webhook attempt detected.');
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
console.log('Received signature:', signature);
    console.log('Expected secret hash length:', secretHash ? secretHash.length : 'undefined');

    if (!signature || signature !== secretHash) {
      console.warn('Unauthorized webhook attempt detected. Signature mismatch.');
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
    const event = await req.json();

    // 2. Handle successful charge event
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

      // 3. Update Neon Database (using LOWER() to prevent case mismatch issues)
      const client = await pool.connect();
      try {
        const result = await client.query(
          'UPDATE "User" SET "isPro" = true, "proExpiresAt" = $1 WHERE LOWER(email) = $2',
          [expiresAt, customerEmail]
        );
        
        if (result.rowCount === 0) {
          console.warn(`Webhook received for email ${customerEmail}, but no user found in database.`);
        } else {
          console.log(`Successfully upgraded ${customerEmail} until ${expiresAt}`);
        }
      } finally {
        client.release();
      }
    }

    // Always return 200 OK quickly so Flutterwave knows it was received successfully
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
  }
}