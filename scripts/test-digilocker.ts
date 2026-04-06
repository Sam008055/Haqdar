import { config } from 'dotenv';
import { verifyWithDigiLocker } from '../core/utils/digilocker-mock';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testDigiLocker() {
  console.log("Starting DigiLocker integration test...");
  
  // Test with an ID that should trigger the API
  const testId = "RD1219003014905";
  
  console.log(`Testing with Certificate ID: ${testId}`);
  const result = await verifyWithDigiLocker(testId);
  
  console.log("\n================ TEST RESULT ================\n");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n=============================================\n");
  
  if (result) {
    if (result.applicantName !== "Unknown" && result.applicantName !== "Sahajananda Bolad") {
      console.log("✅ SUCCESS: Data was successfully pulled from the Sandbox API!");
    } else if (result.applicantName === "Sahajananda Bolad") {
      console.log("⚠️ NOTICE: Returned the exact Mock Registry data. The API call may have failed and triggered the fallback.");
    }
  } else {
    console.log("❌ FAILED: No record found or function returned null.");
  }
}

testDigiLocker();
