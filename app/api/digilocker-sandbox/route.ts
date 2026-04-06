import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { document_uri, aadhaar_hash } = body;

    // Simulate standard DigiLocker response delay (Govt APIs are not instantaneous)
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!document_uri || !aadhaar_hash) {
      return NextResponse.json(
        { error: 'Missing required API contract fields' },
        { status: 400 }
      );
    }

    // Mock response simulating an Income Certificate metadata return
    return NextResponse.json({
      status: 'authentic',
      issuer: 'NIC_CERTIFICATE_ISSUANCE',
      document_type: 'INCOME_CERTIFICATE_023',
      timestamp: new Date().toISOString(),
      metadata: {
        verified_by: 'DigiLocker Mock Sandbox v1.0',
        confidence: 0.99
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal Sandbox Error' },
      { status: 500 }
    );
  }
}
