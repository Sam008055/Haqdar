'use server'

import { verifyWithDigiLocker } from '@/core/utils/digilocker-mock';

import { createClient } from '@/core/supabase/server';
import { extractCertificateData } from '@/core/ai/extract';
import { detectQRCode } from '@/core/ai/qr-scanner';
import { z } from 'zod';
import { areDistrictsMatching, similarityScore } from '@/core/utils/fuzzy';
import { normalizeCertificateId } from '@/core/utils/ocr-normalize';
import { getSchemeIncomeLimit } from '@/core/utils/schemes';

const formSchema = z.object({
  name: z.string().min(2),
  father_name: z.string().min(2),
  dob: z.string(),
  district: z.string(),
  state: z.string(),
  income: z.coerce.number().min(0),
  scheme: z.string(),
  certificate_base64: z.string().max(8_000_000).optional().catch(''), // ~6MB base64 text
  file_type: z.string().optional().catch('')
});

export async function submitApplication(formData: FormData) {
  const parsed = formSchema.safeParse({
    name: formData.get('name'),
    father_name: formData.get('father_name'),
    dob: formData.get('dob'),
    district: formData.get('district'),
    state: formData.get('state'),
    income: formData.get('income'),
    scheme: formData.get('scheme'),
    certificate_base64: formData.get('certificate_base64'),
    file_type: formData.get('file_type')
  });

  if (!parsed.success) {
    return { success: false, message: "🚨 Invalid form data payload sent or file was suspiciously large." };
  }

  const { name, father_name: fatherName, dob, district, state, income: incomeDeclared, scheme, certificate_base64: base64Image, file_type } = parsed.data;
  const fileType = file_type || 'image/jpeg';
  
  const supabase = await createClient();

  // --- RATE LIMIT CHECK (DB-BASED) ---
  const { data: recentSub} = await supabase
    .from('applicants')
    .select('created_at')
    .eq('full_name', name)
    .eq('dob', dob)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentSub && new Date(recentSub.created_at).getTime() > Date.now() - 30_000) {
    return { success: false, message: `⏳ Rate limited. Please wait 30 seconds before resubmitting.` };
  }

  let finalStatus = 'verified';
  let flagReason = '';
  let duplicateScore = 0;
  let incomeExtracted = 0;

  // --- STEP 0: EXACT FILE HASHING & MAGIC BYTES ---
  let fileHash = '';
  if (base64Image) {
    const fileBuffer = Buffer.from(base64Image, 'base64');
    
    // Magic bytes checking for JPEG/PNG/PDF (prevent blind binary processing)
    const hex = fileBuffer.subarray(0, 4).toString('hex').toLowerCase();
    const isJPEG = hex.startsWith('ffd8');
    const isPNG = hex.startsWith('89504e47');
    const isPDF = hex.startsWith('25504446'); // %PDF
    if (!isJPEG && !isPNG && !isPDF) {
       return { success: false, message: "🚨 Invalid file signature. Only PDFs, JPEGs, and PNGs are allowed." };
    }

    const crypto = require('crypto');
    fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Check if this EXACT file was already uploaded
    const { data: exactMatch } = await supabase
      .from('applicants')
      .select('full_name, district')
      .eq('file_hash', fileHash)
      .limit(1)
      .single();
      
    if (exactMatch && exactMatch.full_name.toLowerCase() !== name.toLowerCase()) {
      return { 
        success: true, 
        message: `🚫 Flagged for Audit: 🛑 EXACT FILE REUSE. This exact file was already submitted by "${exactMatch.full_name}" from ${exactMatch.district}.`,
        status: 'flagged' 
      };
    }
  }

  // --- STEP 1: QR CODE SCAN (100% local, no API, no assumptions) ---
  let qrDetected = false;
  let qrData = '';
  if (base64Image && fileType.startsWith('image/')) {
    const qrResult = await detectQRCode(base64Image);
    qrDetected = qrResult.found;
    qrData = qrResult.data || '';
    if (qrDetected) {
      flagReason = `${flagReason} | ✅ QR Verified: Digital signature confirmed.`.trim();
    }
  }

  let extractedCertId = '';
  let extractedIssueDateStr = '';

  // --- STEP 2: AI FORENSIC AUDITING ---
  if (base64Image) {
    try {
       const extraction = await extractCertificateData(base64Image, fileType);
       incomeExtracted = extraction.annual_income_inr || 0;
       extractedIssueDateStr = extraction.issue_date || '';
       
       // Clean up extracted Cert ID
       if (extraction.certificate_id && extraction.certificate_id.toLowerCase() !== 'unknown') {
         extractedCertId = normalizeCertificateId(extraction.certificate_id);
       }

       // 1. Authenticity Threshold Check
       if (extraction.authenticity_score < 75) {
           if (qrDetected) {
             flagReason = `${flagReason} | 🔄 AI scored low (${extraction.authenticity_score}%) but QR is present — accepted.`.trim();
           } else {
             finalStatus = 'flagged';
             flagReason = `${flagReason} | 🔴 Forgery Alert: Score ${extraction.authenticity_score}%. ${extraction.forgery_reasoning}`.trim();
           }
       }

       // 2. Missing Official Endorsement Check
       const hasLegitEndorsement = qrDetected || extraction.has_official_stamp || extraction.has_authorized_signature;
       if (!hasLegitEndorsement) {
           finalStatus = 'flagged';
           flagReason = `${flagReason} | ⚠️ Invalid Document: No QR, stamps, or signatures found.`.trim();
       }

       // 3. Father's Name Cross-Validation (Fuzzy Match)
       const isRealValue = (val: string) => val && !['not found', 'unknown', 'n/a', 'none', 'null', ''].includes(val.toLowerCase().trim());
       const extractedFather = extraction.father_name || '';
       if (isRealValue(extractedFather) && fatherName) {
           const sim = similarityScore(extractedFather, fatherName);
           if (sim < 50) { // Require at least 50% match
              finalStatus = 'flagged';
              flagReason = `${flagReason} | 🛑 Identity Mismatch: Form Father doesn't match Document (${Math.round(sim)}% match).`.trim();
           }
       }

       // 4. District Cross-Validation (Synonym and Fuzzy Match)
       const extractedDistrict = extraction.district || '';
       if (isRealValue(extractedDistrict) && district) {
           if (!areDistrictsMatching(district, extractedDistrict)) {
               finalStatus = 'flagged';
               flagReason = `${flagReason} | 📍 District Mismatch: Form says "${district}" but document says "${extraction.district}".`.trim();
           }
       }

       // 5. Income Discrepancy Check
       if (incomeExtracted > (incomeDeclared * 1.1)) {
          finalStatus = 'flagged';
          flagReason = `${flagReason} | 💰 Income Discrepancy (Declared: ₹${incomeDeclared}, Doc Extracted: ₹${incomeExtracted})`.trim();
       }

       if (!flagReason) flagReason = `✅ AI Forgery Pass: Authentic looking document (${extraction.authenticity_score}%).`;
    } catch (e) {
       console.error("AI Forensic Error:", e);
       finalStatus = 'review';
       flagReason = `AI Forensic Auditor Error: ${(e as Error).message}`;
    }
  }

  // --- STEP 3: CERT ID REUSE (Layer 2: The Screenshot Fraudster) ---
  if (extractedCertId) {
    const { data: existingCertId } = await supabase
      .from('applicants')
      .select('full_name, district')
      .eq('certificate_id', extractedCertId)
      .neq('full_name', name) // exclude if same person
      .limit(1)
      .single();

    if (existingCertId) {
      finalStatus = 'flagged';
      flagReason = `${flagReason} | 🔁 Certificate ID Reuse: ID ${extractedCertId} was already submitted by ${existingCertId.full_name}.`.trim();
    }
  } else if (finalStatus !== 'review') {
    // Cannot read Cert ID, maybe faded or forged
    finalStatus = 'flagged';
    flagReason = `${flagReason} | ⚠️ Missing ID: Could not extract a Certificate ID from the document.`.trim();
  }

  // --- STEP 4: STATE REGISTRY LOOKUP (Layer 3: DigiLocker Mock) ---
  if (extractedCertId) {
    const registryRecord = await verifyWithDigiLocker(extractedCertId);

    if (!registryRecord) {
      // It's not in the DB, it might be forged
      finalStatus = 'flagged';
      flagReason = `${flagReason} | 🚨 STATE DB FAIL: Certificate ID ${extractedCertId} NOT FOUND in State Registry! Possible Forgery.`.trim();
    } else {
      // 1. Check Identity (Name Matching)
      const nameMatches = registryRecord.applicantName.toLowerCase().includes(name.toLowerCase().split(' ')[0]) || name.toLowerCase().includes(registryRecord.applicantName.toLowerCase().split(' ')[0]);
      if (!nameMatches) {
        finalStatus = 'flagged';
        flagReason = `${flagReason} | 🚨 TAMPERING DETECTED: Cert ${extractedCertId} actually belongs to ${registryRecord.applicantName}, not ${name}!`.trim();
      } 
      
      // 2. DigiLocker Income Tampering Check
      // If the document extracted income doesn't match the government master record exactly, they photoshopped the number!
      if (registryRecord.annualIncome !== undefined && incomeExtracted > 0 && registryRecord.annualIncome !== incomeExtracted) {
        finalStatus = 'flagged';
        flagReason = `${flagReason} | 🚨 VALUE FORGERY: Document claims ₹${incomeExtracted}, but DigiLocker states true income is ₹${registryRecord.annualIncome}!`.trim();
      }

      // 3. Document Expiry Check & Date Tampering (Valid for 5 years)
      if (registryRecord.issueDate) {
        const dbDate = new Date(registryRecord.issueDate);
        
        // A) Verify extracted date from document matches Database date
        // If the fraudster edited the date on the PDF to bypass the 5-year limit, this catches it!
        if (extractedIssueDateStr && extractedIssueDateStr.toLowerCase() !== 'unknown') {
            const docDate = new Date(extractedIssueDateStr);
            if (!isNaN(docDate.valueOf()) && !isNaN(dbDate.valueOf())) {
                const diffTime = Math.abs(docDate.getTime() - dbDate.getTime());
                if (diffTime > 86400000 * 2) { // Allow 2 days tolerance
                    finalStatus = 'flagged';
                    flagReason = `${flagReason} | 🚨 DATE TAMPERING: Document claims issue date of ${docDate.toISOString().split('T')[0]}, but Database says ${dbDate.toISOString().split('T')[0]}!`.trim();
                }
            }
        }

        // B) Validity Calculation: 5 Years Limit
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        
        if (dbDate < fiveYearsAgo) {
           finalStatus = 'flagged';
           flagReason = `${flagReason} | ⏳ EXPIRED DOCUMENT: Issued on ${registryRecord.issueDate}. Certificates are strictly valid for 5 years only.`.trim();
        } 
        
        if (registryRecord.status === 'REVOKED') {
           finalStatus = 'flagged';
           flagReason = `${flagReason} | 🛑 REVOKED DOCUMENT: The government has revoked certificate ${extractedCertId}.`.trim();
        }
      }

      // If it passed the registry checks, add official details
      if (finalStatus !== 'flagged') {
         flagReason = `✅ State DB Verified: Matches ${registryRecord.applicantName} (₹${registryRecord.annualIncome}). | ${flagReason}`.trim();
      }
    }
  }

  // --- STEP 5: SCHEME ELIGIBILITY (Using Abstracted Policy Limit) ---
  const schemeLimit = getSchemeIncomeLimit(scheme);
  if (incomeExtracted > schemeLimit || incomeDeclared > schemeLimit) {
      finalStatus = 'flagged';
      flagReason = `${flagReason} | 🛑 INELIGIBLE FOR ${scheme}: Income strictly > ₹${schemeLimit.toLocaleString()} threshold.`.trim();
  }

  // --- STEP 6: CROSS-DISTRICT DUPLICATE DETECTION ---
  const { data: scoreData, error: rpcError } = await supabase.rpc('check_fraud_duplicate', {
    p_name: name, p_father: fatherName, p_dob: dob, p_district: district
  });

  if (!rpcError && scoreData > 0.85) {
     finalStatus = 'flagged';
     duplicateScore = scoreData;
     flagReason = `${flagReason} | 📍 Cross-District/Repeat Duplicate Match: ${Math.round(scoreData * 100)}%`.trim();
  }

  // --- LOGGING ---
  const { error: insertError } = await supabase
    .from('applicants')
    .insert([{ 
      full_name: name,
      father_name: fatherName,
      dob: dob,
      district: district,
      income_declared: incomeDeclared,
      income_extracted: incomeExtracted || null,
      scheme: scheme,
      status: finalStatus,
      fraud_score: duplicateScore || 0,
      flag_reason: flagReason || null,
      file_hash: fileHash,
      certificate_id: extractedCertId || null
    }]);

  if (insertError) {
    console.error(insertError);
  }

  return { 
    success: true, 
    message: finalStatus === 'flagged' 
      ? `🚫 Document Verification Failed: System detected discrepancies in the official files. Application has been halted and logged for manual review by the BDO.` 
      : "✅ Application Validation Complete. Document Cryptographically Verified.",
    status: finalStatus
  };
}
