import { createClient } from '@/core/supabase/server';
import ClearButton from './ClearButton';

export const dynamic = 'force-dynamic';

export default async function BDODashboard() {
  const supabase = await createClient();

  const { data: applicants, error } = await supabase
    .from('applicants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500 font-mono">CRITICAL DB FAULT: {error.message}</div>;
  }

  const totalApps = applicants?.length || 0;
  const fraudCount = applicants?.filter(a => a.status === 'flagged').length || 0;
  const verifiedCount = applicants?.filter(a => a.status === 'verified').length || 0;
  const fraudRate = totalApps ? ((fraudCount / totalApps) * 100).toFixed(1) : '0.0';
  
  // Unique districts with fraud
  const flaggedDistricts = [...new Set(applicants?.filter(a => a.status === 'flagged').map(a => a.district) || [])];
  
  // Certificate reuse detection
  const certHashes = applicants?.filter(a => a.cert_hash).map(a => a.cert_hash) || [];
  const duplicateCerts = certHashes.filter((hash, i) => certHashes.indexOf(hash) !== i).length;

  // Savings estimate: average scheme value ₹2,00,000 per fraudulent app caught
  const savingsEstimate = fraudCount * 200000;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0d1117 100%)',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 10px #22c55e',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
              System Active • HaqDar Forensic Engine v2.0
            </span>
          </div>
          <h1 style={{
            fontSize: '32px', fontWeight: 800, color: '#f8fafc',
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}>
            Block Development Command Center
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', marginTop: '4px' }}>
            Real-time forensic audit monitoring for BDO officers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ClearButton />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {/* Total Submissions */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
          borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Total Applications
          </p>
          <p style={{ color: '#f8fafc', fontSize: '36px', fontWeight: 800, marginTop: '8px', fontFamily: 'monospace' }}>
            {totalApps}
          </p>
        </div>

        {/* Verified */}
        <div style={{
          background: 'rgba(34, 197, 94, 0.08)', backdropFilter: 'blur(20px)',
          borderRadius: '12px', padding: '20px', border: '1px solid rgba(34, 197, 94, 0.2)',
        }}>
          <p style={{ color: '#4ade80', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            ✅ Verified
          </p>
          <p style={{ color: '#22c55e', fontSize: '36px', fontWeight: 800, marginTop: '8px', fontFamily: 'monospace' }}>
            {verifiedCount}
          </p>
        </div>

        {/* Fraud Intercepted */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)', backdropFilter: 'blur(20px)',
          borderRadius: '12px', padding: '20px', border: '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          <p style={{ color: '#f87171', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            🚨 Fraud Intercepted
          </p>
          <p style={{ color: '#ef4444', fontSize: '36px', fontWeight: 800, marginTop: '8px', fontFamily: 'monospace' }}>
            {fraudCount}
          </p>
        </div>

        {/* Certificate Reuse */}
        <div style={{
          background: 'rgba(249, 115, 22, 0.08)', backdropFilter: 'blur(20px)',
          borderRadius: '12px', padding: '20px', border: '1px solid rgba(249, 115, 22, 0.2)',
        }}>
          <p style={{ color: '#fb923c', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            🔁 Cert Reuse
          </p>
          <p style={{ color: '#f97316', fontSize: '36px', fontWeight: 800, marginTop: '8px', fontFamily: 'monospace' }}>
            {duplicateCerts}
          </p>
        </div>

        {/* Savings */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)', backdropFilter: 'blur(20px)',
          borderRadius: '12px', padding: '20px', border: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <p style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            💰 Est. Savings
          </p>
          <p style={{ color: '#8b5cf6', fontSize: '28px', fontWeight: 800, marginTop: '8px', fontFamily: 'monospace' }}>
            ₹{(savingsEstimate / 100000).toFixed(1)}L
          </p>
        </div>
      </div>

      {/* Threat Bar */}
      {fraudCount > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)', borderRadius: '12px', padding: '16px 20px',
          border: '1px solid rgba(239, 68, 68, 0.15)', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <p style={{ color: '#fbbf24', fontWeight: 700, fontSize: '14px' }}>
              THREAT LEVEL: {fraudRate}% applications flagged for audit
            </p>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              Flagged districts: {flaggedDistricts.join(', ') || 'None'} •
              Certificate reuse incidents: {duplicateCerts}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', textAlign: 'left', fontSize: '13px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '14px 16px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Applicant</th>
              <th style={{ padding: '14px 16px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>District</th>
              <th style={{ padding: '14px 16px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Dup Score</th>
              <th style={{ padding: '14px 16px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Income</th>
              <th style={{ padding: '14px 16px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
              <th style={{ padding: '14px 16px', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Flag Reason</th>
            </tr>
          </thead>
          <tbody>
            {applicants?.map((app) => (
              <tr key={app.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{app.full_name}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>S/O {app.father_name}</div>
                </td>
                <td style={{ padding: '14px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                  {app.district}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px',
                    background: app.fraud_score > 0.7 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.06)',
                    color: app.fraud_score > 0.7 ? '#ef4444' : '#94a3b8',
                  }}>
                    {(app.fraud_score * 100).toFixed(0)}%
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
                  <div style={{ color: '#94a3b8' }}>Dec: <span style={{ color: '#60a5fa' }}>₹{app.income_declared}</span></div>
                  <div style={{ color: '#94a3b8' }}>Ext: <span style={{
                    color: app.income_extracted > (app.income_declared * 1.1) ? '#ef4444' : '#4ade80',
                    fontWeight: app.income_extracted > (app.income_declared * 1.1) ? 700 : 400,
                  }}>₹{app.income_extracted || 'N/A'}</span></div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: app.status === 'verified' 
                      ? 'rgba(34, 197, 94, 0.12)' 
                      : app.status === 'flagged' 
                        ? 'rgba(239, 68, 68, 0.12)' 
                        : 'rgba(249, 115, 22, 0.12)',
                    color: app.status === 'verified' ? '#4ade80' : app.status === 'flagged' ? '#f87171' : '#fb923c',
                  }}>
                    {app.status === 'flagged' ? '🚨 ' : app.status === 'verified' ? '✅ ' : ''}{app.status}
                  </span>
                </td>
                <td style={{
                  padding: '14px 16px', fontSize: '11px', maxWidth: '350px',
                  color: app.status === 'flagged' ? '#fbbf24' : '#64748b',
                  fontWeight: app.status === 'flagged' ? 500 : 400,
                  lineHeight: '1.5',
                }} title={app.flag_reason || ''}>
                  {app.flag_reason 
                    ? app.flag_reason.split('|').map((reason: string, i: number) => (
                        <div key={i} style={{ marginBottom: '2px' }}>{reason.trim()}</div>
                      ))
                    : <span style={{ color: '#374151' }}>—</span>
                  }
                </td>
              </tr>
            ))}
            {totalApps === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎭</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No applications yet</div>
                  <div style={{ fontSize: '13px' }}>Click "Run Fraud Demo" to simulate a live fraud detection scenario</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px', color: '#334155', fontSize: '12px' }}>
        HaqDar Forensic Engine • Powered by AI-driven Certificate Analysis • Built for India&apos;s Welfare System
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
