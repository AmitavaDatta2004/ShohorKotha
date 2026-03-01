import { NextResponse } from 'next/server';

/**
 * Twilio Record Handler.
 * Receives gathered PIN and starts voice recording.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const pincode = (formData.get('Digits') as string) || "unknown";

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Thank you. Now, please describe the urban issue clearly. Press any key when finished.</Say>
  <Record action="/api/twilio/callback?pincode=${pincode}" method="POST" maxLength="60" finishOnKey="*" playBeep="true"/>
  <Say voice="Polly.Amy">Signal lost. Goodbye.</Say>
</Response>`;

    return new NextResponse(twiml.trim(), {
      headers: { 
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error) {
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Amy">System error. Please call back later.</Say></Response>`;
    return new NextResponse(errorTwiml, { headers: { 'Content-Type': 'text/xml' } });
  }
}
