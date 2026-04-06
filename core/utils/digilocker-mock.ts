/**
 * Mock DigiLocker / State Database API
 * In a real production environment, this would be an API call to a state government
 * database holding the definitive, authentic details of issued certificates.
 */

export interface DigiLockerRecord {
  certificateId: string;
  applicantName: string;
  fatherName: string;
  annualIncome: number;
  district: string;
  issueDate: string; // YYYY-MM-DD
  isActive: boolean;
  status: "VALID" | "REVOKED" | "EXPIRED";
}

const MOCK_REGISTRY: Record<string, DigiLockerRecord> = {
  "RD1219003014905": {
    certificateId: "RD1219003014905",
    applicantName: "Sahajananda Bolad",
    fatherName: "Basawanna Bolad",
    annualIncome: 40000,
    district: "Kalaburagi",
    issueDate: "2024-02-07",
    isActive: true,
    status: "VALID"
  },
  "RD3456789012345": {
    certificateId: "RD3456789012345",
    applicantName: "Ramesh Kumar",
    fatherName: "Suresh Kumar",
    annualIncome: 120000,
    district: "Bengaluru Urban",
    issueDate: "2023-01-15", // Older than 1 year (will trigger expiry logic)
    isActive: true,
    status: "VALID"
  },
  "RD0000000000000": {
    certificateId: "RD0000000000000",
    applicantName: "Fraudulent User",
    fatherName: "Fake Father",
    annualIncome: 0,
    district: "Fake District",
    issueDate: "2024-01-01",
    isActive: false,
    status: "REVOKED"
  },
  "RD0039003340161": {
    certificateId: "RD0039003340161",
    applicantName: "Kumar Satish",
    fatherName: "Unknown", // Can be anything, system just needs to verify
    annualIncome: 500000,  // The REAL income (the image fraudulently says 150000)
    district: "Unknown",
    issueDate: "2022-08-16", // Valid for 5 years per user constraint
    isActive: true,
    status: "VALID"
  }
};

/**
 * Simulates or executes a secure fetch to the DigiLocker records.
 */
export async function verifyWithDigiLocker(certificateId: string): Promise<DigiLockerRecord | null> {
  if (!certificateId) return null;
  const normalizedQuery = certificateId.replace(/\s+/g, '').toUpperCase();

  // Try Sandbox API if API variables are present
  const apiKey = process.env.DIGILOCKER_API_KEY;
  const apiSecret = process.env.DIGILOCKER_API_SECRET;
  const apiUrl = process.env.DIGILOCKER_API_URL;

  if (apiKey && apiSecret && apiUrl) {
    try {
      console.log(`[DigiLocker Sandbox] Fetching exact record for: ${normalizedQuery}...`);
      
      const res = await fetch(`${apiUrl}/api/v1/certificate/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-api-secret": apiSecret
        },
        body: JSON.stringify({ certificateId: normalizedQuery }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[DigiLocker Sandbox] API Response Data:`, data);
        
        if (data && data.certificateId) {
            return {
              certificateId: data.certificateId,
              applicantName: data.applicantName || "Unknown",
              fatherName: data.fatherName || "Unknown",
              annualIncome: data.annualIncome || 0,
              district: data.district || "Unknown",
              issueDate: data.issueDate || new Date().toISOString().split('T')[0],
              isActive: data.isActive !== undefined ? data.isActive : true,
              status: data.status || "VALID"
            } as DigiLockerRecord;
        }
      } else {
        console.warn(`[DigiLocker Sandbox] API returned status ${res.status}. Falling back to MOCK_REGISTRY.`);
      }
    } catch (error) {
      console.error("[DigiLocker Sandbox] API Fetch failed. Falling back to MOCK_REGISTRY:", error);
    }
  } else {
    // Simulate network latency for realism in the demo when using exclusively mock
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log(`[DigiLocker Sandbox] Using MOCK_REGISTRY fallback for ${normalizedQuery}`);
  return MOCK_REGISTRY[normalizedQuery] || null;
}
