'use client';

import { useState } from 'react';
import { runFraudDemo } from '@/core/actions/demo-mode';

export default function DemoButton() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);

  async function handleDemo() {
    if (!confirm('🎭 Run Fraud Simulation?\n\nThis will:\n1. Clear existing records\n2. Insert a verified application\n3. Insert a certificate-reuse fraud\n4. Insert a cross-district duplicate\n\nPerfect for your hackathon demo!')) return;
    
    setRunning(true);
    setStep(1);
    
    // Animate steps
    const stepTimer1 = setTimeout(() => setStep(2), 1500);
    const stepTimer2 = setTimeout(() => setStep(3), 3000);
    
    try {
      await runFraudDemo();
      setTimeout(() => {
        setStep(0);
        setRunning(false);
        window.location.reload();
      }, 4000);
    } catch {
      setRunning(false);
      setStep(0);
    }

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    };
  }

  const stepLabels = [
    '',
    '📝 Inserting legitimate application...',
    '🔁 Inserting certificate reuse fraud...',
    '🛑 Inserting cross-district duplicate...',
  ];

  return (
    <button
      onClick={handleDemo}
      disabled={running}
      style={{
        padding: '10px 20px',
        background: running 
          ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
          : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: running ? 'wait' : 'pointer',
        fontSize: '14px',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(109, 40, 217, 0.3)',
      }}
    >
      {running ? stepLabels[step] || '⏳ Running...' : '🎭 Run Fraud Demo'}
    </button>
  );
}
