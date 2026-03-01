import { NextResponse } from 'next/server';

/**
 * Twilio Voice Entry Point.
 * Gathers 6-digit PIN via DTMF (keypad) then routes to recording.
 * Zero-indentation enforced to prevent parsing errors.
 */
export async function POST(req: Request) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Welcome to Shohor Kotha Community Intelligence System.</Say>
  <Gather action="/api/twilio/record" method="POST" numDigits="6" timeout="10">
    <Say voice="Polly.Amy">Please enter your six digit pincode using your keypad.</Say>
  </Gather>
  <Say voice="Polly.Amy">Signal timeout. Please try again later. Goodbye.</Say>
</Response>`;

  return new NextResponse(twiml.trim(), {
    headers: { 
      'Content-Type': 'text/xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
  });
}
