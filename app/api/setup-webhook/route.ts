import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Dynamically grab your current deployment URL
    const host = request.headers.get('host') || 'your-app.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const currentWebhookUrl = `${protocol}://${host}/api/flutterwave/webhook`;

    // Call Flutterwave's Webhook API to register this URL automatically
    const response = await fetch('https://api.flutterwave.com/v3/webhooks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: currentWebhookUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Webhook successfully auto-registered to ${currentWebhookUrl}`,
      data 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}