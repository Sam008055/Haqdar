# HaqDar Project Analysis

## What is this project about?
HaqDar is an **AI-powered forensic auditing and fraud detection engine** designed for Indian Government Welfare Schemes (such as PM Awas Yojana, PM-KISAN, and Post-Matric Scholarships). 

It acts as an "Operator Portal" where government officials or proxy agents can submit beneficiary details alongside official documents (like Income Certificates). The system intercepts these applications and subjects them to a robust pipeline to detect forged documents, modified entries, exact duplicates, and policy violations before writing them to the database.

## 🟩 Where it is doing good (Strengths)
1. **Defense in Depth**: The verification pipeline doesn't rely on a single point of failure. It employs:
   - **Cryptographic Hashing:** Instantly catches literal file re-uploads.
   - **Local QR Scanning:** Independently verifies digital signatures without relying on OCR.
   - **Multimodal AI Auditing:** Looks for visual hallmarks of forgery and extracts structured data.
   - **State Registry Lookups:** Cross-references extracted Certificate IDs against a simulated active DigiLocker/Government database.
   - **Cross-District Duplicate Detection:** Utilizes a Supabase RPC to catch fraudsters trying to apply across multiple districts. 
2. **Extreme AI Resilience**: The `extract.ts` AI pipeline is built to survive API outages. It seamlessly waterfalls from OpenAI → Groq → Gemini → Together AI → Claude → Free OCR Space, and even features a hybrid OCR + Text Gen fallback for complex PDFs containing Indian regional scripts.
3. **Secure Execution**: Key logic is housed inside Server Actions (`use server` in `submit-application.ts`), keeping the keys and verification logic out of the client browser.

## 🟥 Where it is failing (The Holes)
The system has several critical flaws that prevent it from being production-ready or completely rigid:

1. **In-Memory Rate Limiting**: The `RATE_LIMIT_MAP` in `submit-application.ts` is an in-memory `Map`. Because this is a Next.js application designed to run on serverless functions (like Vercel), this map is wiped clean between requests or across different container instances, rendering the rate limiter entirely ineffective.
2. **Naive String Matching**: 
   - **Names:** The cross-validation for Father's Name checks if the first word of the extracted name matches the first word of the declared name. This fails on names like "M. Rajesh" vs "Rajesh M" or generic prefixes that bypass normalization.
   - **Districts:** Using `!extractedDistrict.includes(declaredDistrict.split(' ')[0])` will flag "Bangalore Urban" versus "Bengaluru", resulting in high false positives.
3. **Zero Backend Payload Validation**: The server action blindly accepts `formData.get('certificate_base64')` without enforcing a maximum size limit or verifying the magic bytes of the file. A malicious operator could send a 2GB text string, crashing the server with an OOM error when creating the `Buffer`.
4. **Brittle Certificate ID Lookups**: The database lookup demands an exact match on `certificate_id` (only stripped of whitespace). OCR commonly confuses `0` with `O`, `1` with `I` or `l`, or `8` with `B`. If the AI misreads one character, the legitimate document is flagged as "STATE DB FAIL: Possible Forgery."
5. **Hardcoded Policy Logic**: The core action hardcodes scheme rules: `if (scheme === 'PM Awas Yojana') {  if (incomeExtracted > 300000) ... }`. If policy limits change, engineers have to rewrite and redeploy the backend instead of updating a database row or configuration file.

## 🛠️ How to improve the holes and make it rigid

To make HaqDar highly resilient for a hackathon finals or production rollout, implement the following:

### 1. Robust Schema & Input Validation (Zod)
Install and leverage `zod` inside the Server Action to definitively type-check the payload.
```typescript
const ApplicationSchema = z.object({
  name: z.string().min(2),
  income: z.coerce.number().min(0),
  base64Image: z.string().max(5_000_000) // limit to ~5MB to prevent DoS
});
```

### 2. Distributed Rate Limiting
Replace the ES6 `Map` with Upstash Redis or a Supabase table tracking submission timestamps per IP Address and Aadhaar/Applicant Name.

### 3. Implement Fuzzy Matching & OCR Normalization
Instead of crude `.includes()`, use a specialized library to calculate **Levenshtein distance** to determine if a name or district is a match.
Before looking up the `certificate_id`, run an OCR normalizer that handles standard ambiguities:
```typescript
const normalizeCertId = (id) => id.replace(/\s+/g, '').replace(/O/g, '0').replace(/[Il]/g, '1').toUpperCase();
```

### 4. Verify Magic Bytes
Do not trust the frontend `file_type`. Use a lightweight utility (like `file-type` or regex checking the base64 preamble) to evaluate the actual binary signature of the file before passing it to AI and Hash algorithms.

### 5. Policy Abstraction
Extract business logic (like income thresholds) out of `submit-application.ts`. Query a `welfare_schemes` table to dynamically retrieve the `max_income_threshold` based on the selected scheme, comparing extracted values dynamically.
