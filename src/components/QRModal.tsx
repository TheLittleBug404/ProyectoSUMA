import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess
}) => {
  if (!isOpen) return null;

  const [operationCode, setOperationCode] = useState('');
  const [step, setStep] = useState<'scan' | 'loading' | 'success'>('scan');
  const [error, setError] = useState('');
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);

  // Generate confetti items for success animation
  useEffect(() => {
    if (step === 'success') {
      const colors = ['#d4af37', '#e5c06e', '#f3e5ab', '#10b981', '#ffffff', '#c5a059'];
      const items = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setConfetti(items);
      
      // Auto success redirect after 3.5s
      const timer = setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationCode.trim()) {
      setError('Por favor, ingrese el número de operación de su transferencia.');
      return;
    }
    
    setError('');
    setStep('loading');

    // Simulate verification
    setTimeout(() => {
      setStep('success');
    }, 2000);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={step === 'loading' ? undefined : onClose}>
      {/* Confetti canvas */}
      {step === 'success' && (
        <div className="confetti-container">
          {confetti.map((c) => (
            <div 
              key={c.id} 
              className="confetti"
              style={{
                left: `${c.left}%`,
                animationDelay: `${c.delay}s`,
                backgroundColor: c.color
              }}
            />
          ))}
        </div>
      )}

      <div 
        className="glass-card animate-scale-up" 
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '30px',
          position: 'relative',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {step !== 'loading' && (
          <button 
            onClick={onClose}
            className="btn btn-secondary" 
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              borderRadius: '50%',
              padding: '8px',
              zIndex: 20
            }}
          >
            <X size={18} />
          </button>
        )}

        {step === 'scan' && (
          <>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>
              Pago por <span className="text-gradient">Código QR</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Escanea con Yape, Plin o tu banca móvil preferida
            </p>

            {/* Simulated QR Code wrapper with elegant styling */}
            <div style={{
              margin: '0 auto 24px auto',
              width: '220px',
              height: '220px',
              padding: '12px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 8px 30px rgba(170, 59, 255, 0.2)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid var(--accent-primary)'
            }}>
              {/* Outer frame styling */}
              <div style={{
                position: 'absolute',
                top: '-6px', left: '-6px', right: '-6px', bottom: '-6px',
                border: '2px solid var(--accent-secondary)',
                borderRadius: '20px',
                pointerEvents: 'none'
              }} />

              {/* QR Image placeholder using standard SVG design for a highly premium layout */}
              <svg width="180" height="180" viewBox="0 0 100 100" style={{ fill: '#0b0b0f' }}>
                {/* QR corners */}
                <rect x="0" y="0" width="25" height="25" rx="2" />
                <rect x="3" y="3" width="19" height="19" rx="1" fill="#fff" />
                <rect x="7" y="7" width="11" height="11" rx="0.5" />
                
                <rect x="75" y="0" width="25" height="25" rx="2" />
                <rect x="78" y="3" width="19" height="19" rx="1" fill="#fff" />
                <rect x="82" y="7" width="11" height="11" rx="0.5" />
                
                <rect x="0" y="75" width="25" height="25" rx="2" />
                <rect x="3" y="78" width="19" height="19" rx="1" fill="#fff" />
                <rect x="82" y="82" width="11" height="11" rx="0.5" />

                {/* Random QR blocks to look fully realistic */}
                <rect x="35" y="5" width="10" height="5" />
                <rect x="55" y="10" width="5" height="10" />
                <rect x="45" y="20" width="15" height="5" />
                <rect x="10" y="35" width="5" height="15" />
                <rect x="20" y="45" width="15" height="10" />
                <rect x="40" y="40" width="20" height="20" fill="var(--accent-primary)" />
                <rect x="45" y="45" width="10" height="10" fill="#fff" />
                
                <rect x="65" y="35" width="15" height="5" />
                <rect x="75" y="45" width="5" height="20" />
                <rect x="5" y="60" width="20" height="5" />
                <rect x="35" y="65" width="10" height="15" />
                <rect x="65" y="70" width="15" height="10" />
                <rect x="60" y="85" width="25" height="5" />
                <rect x="85" y="60" width="5" height="20" />
                <rect x="40" y="90" width="10" height="10" />
              </svg>
            </div>

            {/* Total display */}
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '20px'
            }}>
              Monto a Pagar: <span className="text-gradient">S/. {amount.toFixed(2)}</span>
            </div>

            {/* Operation input */}
            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="op-code">Número de Operación / Referencia</label>
                <input
                  id="op-code"
                  type="text"
                  className="form-control"
                  placeholder="Ej: 83920192"
                  value={operationCode}
                  onChange={(e) => setOperationCode(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '14px'
                }}>
                  <ShieldAlert size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', height: '48px', justifyContent: 'center' }}
              >
                Confirmar Pago
              </button>
            </form>
          </>
        )}

        {/* Verification Loader Step */}
        {step === 'loading' && (
          <div style={{ padding: '40px 0' }} className="animate-fade-in">
            <Loader2 
              size={56} 
              color="var(--accent-primary)" 
              style={{
                animation: 'spin 1.5s linear infinite',
                margin: '0 auto 24px auto'
              }} 
            />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>
              Verificando Transacción...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Estamos validando su pago con la red bancaria. Por favor espere.
            </p>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Success confirmation step */}
        {step === 'success' && (
          <div style={{ padding: '30px 10px' }} className="animate-scale-up">
            <div style={{
              display: 'inline-flex',
              padding: '16px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              marginBottom: '20px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle size={56} />
            </div>
            
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              ¡Pago Exitoso! <Sparkles size={22} color="#f59e0b" />
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Su compra ha sido procesada con éxito.<br />
              Número de Operación registrado: <strong>{operationCode}</strong>.<br />
              ¡Gracias por elegir Alex Store!
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              Redireccionando a la tienda...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
