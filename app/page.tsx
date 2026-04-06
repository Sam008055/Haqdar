'use client'

import { useState } from 'react';
import { submitApplication } from '@/core/actions/submit-application';

export default function PMAYWizard() {
  const [base64File, setBase64File] = useState<string>('');
  const [fileType, setFileType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Hidden form state for the demo
  const [formDataState, setFormDataState] = useState({
    name: 'Kumar Satish',
    father_name: '',
    dob: '1990-01-01',
    state: 'Karnataka',
    district: '',
    income: '150000',
    scheme: 'PM Awas Yojana'
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result?.toString().split(',')[1] || '';
      setBase64File(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDataState({ ...formDataState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!base64File) {
      setStatusMsg({ type: 'error', text: 'Please upload an Official Income Certificate first.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    
    try {
      const formData = new FormData();
      Object.entries(formDataState).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('certificate_base64', base64File);
      formData.append('file_type', fileType);
      
      const response = await submitApplication(formData);
      setStatusMsg({
        type: response.success ? 'success' : 'error',
        text: response.message
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Critical system error during submission.' });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f7f9fb] font-inter">
      {/* Sidebar Navigation */}
      <aside className="w-1/4 bg-[#002147] text-white p-8 hidden md:flex flex-col shadow-2xl z-10">
        <div className="mb-12">
          <div className="w-12 h-12 bg-white flex items-center justify-center mb-6">
            <span className="text-[#002147] font-bold text-xl">HD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 uppercase">HaqDar Portal</h1>
          <p className="text-[#708ab5] text-sm">PM Awas Yojana (PMAY)</p>
        </div>

        <div className="space-y-8 flex-grow">
          {/* Step 1 */}
          <div className="flex gap-4 items-start opacity-50">
            <div className="w-8 h-8 rounded-full bg-[#708ab5] flex items-center justify-center shrink-0 mt-1">
              <svg className="w-4 h-4 text-[#002147]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Scheme Selection</h3>
              <p className="text-sm text-[#708ab5]">PMAY-U 2.0 • Declaration Signed</p>
            </div>
          </div>
          
          <div className="w-0.5 h-10 bg-[#2d476f] ml-4 -mt-6"></div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start opacity-50">
            <div className="w-8 h-8 rounded-full bg-[#708ab5] flex items-center justify-center shrink-0 mt-1">
              <svg className="w-4 h-4 text-[#002147]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Personal Details</h3>
              <p className="text-sm text-[#708ab5]">Aadhaar • Demographic Data</p>
            </div>
          </div>

          <div className="w-0.5 h-10 bg-[#2d476f] ml-4 -mt-6"></div>

          {/* Step 3 Active */}
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-1 border-2 border-white bg-transparent">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">Forensic Audit</h3>
              <p className="text-sm text-[#aec7f6]">Document Verification</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#708ab5] font-mono mt-auto">
          SYSTEM STATUS: ONLINE<br/>
          ENC: AES-256-GCM
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-16 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          
          <div className="mb-10 border-b-2 border-[#002147] pb-4 flex justify-between items-end">
            <h2 className="text-4xl font-bold text-[#191c1e] tracking-tight">Document Verification</h2>
            <span className="bg-[#e0e3e5] text-[#44474e] text-xs font-bold px-3 py-1 uppercase tracking-widest">Step 3 of 3</span>
          </div>

          {/* Applicant Summary Block */}
          <div className="bg-white border md:border-2 border-[#002147] p-6 mb-8 shadow-sm">
            <h3 className="text-[#44474e] text-xs font-bold uppercase tracking-widest mb-4 border-b border-[#eceef0] pb-2">Verified Applicant Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] text-[#74777f] font-bold uppercase tracking-wider block mb-1">Applicant Name</label>
                <input 
                  name="name"
                  value={formDataState.name}
                  onChange={handleFormChange}
                  className="text-lg font-bold text-[#000a1e] border-b border-transparent hover:border-[#c4c6cf] focus:border-[#002147] outline-none transition-colors bg-transparent w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#74777f] font-bold uppercase tracking-wider block mb-1">Father's Name</label>
                <input 
                  name="father_name"
                  value={formDataState.father_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Basawanna"
                  className="text-lg font-bold text-[#000a1e] border-b border-transparent hover:border-[#c4c6cf] focus:border-[#002147] outline-none transition-colors bg-transparent w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#74777f] font-bold uppercase tracking-wider block mb-1">District</label>
                <select 
                  name="district"
                  value={formDataState.district}
                  onChange={handleFormChange as any}
                  className="text-lg font-bold text-[#000a1e] border-b border-transparent hover:border-[#c4c6cf] focus:border-[#002147] outline-none transition-colors bg-transparent w-full appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select District</option>
                  <option value="Bagalkot">Bagalkot</option>
                  <option value="Ballari">Ballari</option>
                  <option value="Belagavi">Belagavi</option>
                  <option value="Bengaluru Rural">Bengaluru Rural</option>
                  <option value="Bengaluru Urban">Bengaluru Urban</option>
                  <option value="Bidar">Bidar</option>
                  <option value="Chamarajanagar">Chamarajanagar</option>
                  <option value="Chikkaballapur">Chikkaballapur</option>
                  <option value="Chikkamagaluru">Chikkamagaluru</option>
                  <option value="Chitradurga">Chitradurga</option>
                  <option value="Dakshina Kannada">Dakshina Kannada</option>
                  <option value="Davanagere">Davanagere</option>
                  <option value="Dharwad">Dharwad</option>
                  <option value="Gadag">Gadag</option>
                  <option value="Hassan">Hassan</option>
                  <option value="Haveri">Haveri</option>
                  <option value="Kalaburagi">Kalaburagi</option>
                  <option value="Kodagu">Kodagu</option>
                  <option value="Kolar">Kolar</option>
                  <option value="Koppal">Koppal</option>
                  <option value="Mandya">Mandya</option>
                  <option value="Mysuru">Mysuru</option>
                  <option value="Raichur">Raichur</option>
                  <option value="Ramanagara">Ramanagara</option>
                  <option value="Shivamogga">Shivamogga</option>
                  <option value="Tumakuru">Tumakuru</option>
                  <option value="Udupi">Udupi</option>
                  <option value="Uttara Kannada">Uttara Kannada</option>
                  <option value="Vijayanagara">Vijayanagara</option>
                  <option value="Vijayapura">Vijayapura</option>
                  <option value="Yadgir">Yadgir</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#74777f] font-bold uppercase tracking-wider block mb-1">Aadhaar (Masked)</label>
                <div className="text-lg font-mono font-semibold text-[#191c1e]">XXXX-XXXX-4016</div>
              </div>
              <div>
                <label className="text-[10px] text-[#74777f] font-bold uppercase tracking-wider block mb-1">Declared Income (₹)</label>
                <input 
                  name="income"
                  value={formDataState.income}
                  onChange={handleFormChange}
                  className="text-lg font-mono font-bold text-[#93000a] bg-[#ffdad6] px-2 py-0.5 border-b border-transparent focus:border-[#93000a] outline-none w-full"
                />
              </div>
            </div>
          </div>

          {statusMsg && (
            <div className={`p-5 mb-8 border-l-4 shadow-sm flex gap-4 ${
              statusMsg.type === 'success' 
              ? 'bg-[#d6e3ff] text-[#001b3d] border-[#002147]' 
              : 'bg-[#ffdad6] text-[#93000a] border-[#93000a]'
            }`}>
              <div className="mt-0.5">
                {statusMsg.type === 'success' ? '✅' : '🚨'}
              </div>
              <div className="font-semibold text-sm leading-relaxed whitespace-pre-wrap">
                {statusMsg.text}
              </div>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="bg-[#f2f4f6] border-2 border-dashed border-[#c4c6cf] relative group transition-colors hover:border-[#002147] hover:bg-[#e6e8ea]">
              <input 
                type="file" 
                accept="image/jpeg, image/png, application/pdf" 
                onChange={handleFile} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              
              <div className="p-16 flex flex-col items-center justify-center text-center">
                {!base64File ? (
                  <>
                    <svg className="w-16 h-16 text-[#002147] opacity-80 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <h4 className="text-xl font-bold text-[#000a1e] mb-2">Upload Official Income Certificate</h4>
                    <p className="text-[#565f70] text-sm">Drag and drop PDF/JPG here, or click to browse files.</p>
                    <div className="mt-6 flex gap-2 justify-center">
                      <span className="bg-white border border-[#c4c6cf] text-[10px] uppercase font-bold text-[#44474e] py-1 px-2">Govt PDF</span>
                      <span className="bg-white border border-[#c4c6cf] text-[10px] uppercase font-bold text-[#44474e] py-1 px-2">High-Res JPG</span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-16 h-16 text-[#002147] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h4 className="text-xl font-bold text-[#002147] mb-2">Document Ready for Cryptographic Scan</h4>
                    <p className="text-[#191c1e] text-sm font-semibold">1 File Attached • {fileType}</p>
                    <p className="text-[#565f70] text-xs mt-4">Click anywhere in this box to replace the file.</p>
                  </>
                )}
              </div>
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-[#002147] hover:bg-[#000a1e] text-white p-6 flex justify-between items-center transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-lg font-bold tracking-wide">Submit Application & Verify Forensically</span>
                <span className="text-xs text-[#708ab5] uppercase tracking-widest mt-1">Initiating Government Database Uplink</span>
              </div>
              
              <div className="w-10 h-10 border-2 border-[#708ab5] flex items-center justify-center shrink-0">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                )}
              </div>
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
