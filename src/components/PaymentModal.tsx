import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldAlert, Sparkles, Loader2, QrCode, CreditCard, Landmark } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: () => void;
}

type PaymentMethod = 'qr' | 'card' | 'transfer';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<PaymentMethod>('qr');
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [error, setError] = useState('');
  
  // QR & Transfer common fields
  const [refCode, setRefCode] = useState('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);

  // Success animations
  useEffect(() => {
    if (step === 'success') {
      const colors = ['#d4af37', '#e5c06e', '#f3e5ab', '#10b981', '#ffffff', '#c5a059'];
      const items = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setConfetti(items);
      
      const timer = setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validations based on active tab
    if (activeTab === 'qr' || activeTab === 'transfer') {
      if (!refCode.trim()) {
        setError('Por favor, ingrese el código de referencia o número de transacción.');
        return;
      }
    } else if (activeTab === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Número de tarjeta inválido. Debe tener 16 dígitos.');
        return;
      }
      if (!cardHolder.trim()) {
        setError('Por favor, ingrese el nombre del titular de la tarjeta.');
        return;
      }
      if (cardExpiry.length < 5) {
        setError('Fecha de vencimiento inválida. Use el formato MM/AA.');
        return;
      }
      if (cardCvv.length < 3) {
        setError('CVV inválido. Debe tener al menos 3 dígitos.');
        return;
      }
    }

    setStep('loading');
    setTimeout(() => {
      setStep('success');
    }, 2200);
  };

  // Card input helpers for formatting
  const handleCardNumberChange = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(v);
    }
  };

  const handleExpiryChange = (value: string) => {
    let clean = value.replace(/[^0-9]/g, '');
    if (clean.length > 2) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
    setCardExpiry(clean.slice(0, 5));
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={step === 'loading' ? undefined : onClose}>
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
          maxWidth: '520px',
          padding: '30px',
          position: 'relative',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
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

        {step === 'form' && (
          <>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
              Procesar <span className="text-gradient">Pago Seguro</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Monto total a transferir: <strong style={{ color: 'var(--text-primary)' }}>Bs. {amount.toFixed(2)}</strong>
            </p>

            {/* Selector Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '26px'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('qr'); setError(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  background: activeTab === 'qr' ? 'var(--accent-gradient)' : 'transparent',
                  color: activeTab === 'qr' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <QrCode size={15} />
                Pago QR
              </button>
              
              <button
                type="button"
                onClick={() => { setActiveTab('card'); setError(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  background: activeTab === 'card' ? 'var(--accent-gradient)' : 'transparent',
                  color: activeTab === 'card' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={15} />
                Tarjeta
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('transfer'); setError(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  background: activeTab === 'transfer' ? 'var(--accent-gradient)' : 'transparent',
                  color: activeTab === 'transfer' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Landmark size={15} />
                Banco
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              {/* TAB 1: QR Payment (Bolivia Simple QR) */}
              {activeTab === 'qr' && (
                <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Escanea con Yape, Plin o el aplicativo de tu banco boliviano mediante Simple QR.
                  </p>
                  
                  {/* QR Box mockup */}
                  <div style={{
                    margin: '0 auto 20px auto',
                    width: '180px',
                    height: '180px',
                    padding: '8px',
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-md)',
                    border: '3px solid var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="150" height="150" viewBox="0 0 100 100" style={{ fill: '#0f172a' }}>
                      <rect x="0" y="0" width="22" height="22" rx="1.5" />
                      <rect x="3" y="3" width="16" height="16" rx="1" fill="#fff" />
                      <rect x="6" y="6" width="10" height="10" rx="0.5" />
                      
                      <rect x="78" y="0" width="22" height="22" rx="1.5" />
                      <rect x="81" y="3" width="16" height="16" rx="1" fill="#fff" />
                      <rect x="84" y="6" width="10" height="10" rx="0.5" />
                      
                      <rect x="0" y="78" width="22" height="22" rx="1.5" />
                      <rect x="3" y="81" width="16" height="16" rx="1" fill="#fff" />
                      <rect x="84" y="84" width="10" height="10" rx="0.5" />
                      
                      <rect x="30" y="5" width="10" height="5" />
                      <rect x="55" y="5" width="10" height="10" fill="var(--accent-primary)" />
                      <rect x="40" y="20" width="20" height="5" />
                      <rect x="15" y="35" width="5" height="15" />
                      <rect x="30" y="40" width="15" height="15" fill="var(--accent-secondary)" />
                      <rect x="65" y="30" width="10" height="10" />
                      <rect x="50" y="55" width="15" height="5" />
                      <rect x="5" y="60" width="15" height="5" />
                      <rect x="35" y="65" width="15" height="15" />
                      <rect x="70" y="65" width="10" height="15" />
                      <rect x="60" y="85" width="15" height="5" />
                    </svg>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="qr-ref">Código de Operación Simple / Yape</label>
                    <input
                      id="qr-ref"
                      type="text"
                      className="form-control"
                      placeholder="Ej: 928312"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Credit Card Payment Form with animated mock card preview */}
              {activeTab === 'card' && (
                <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                  {/* Visual Credit Card Preview */}
                  <div style={{
                    width: '100%',
                    height: '170px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '20px',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Metallic card chip */}
                    <div style={{
                      width: '40px',
                      height: '30px',
                      borderRadius: '5px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }} />

                    {/* Card Number display */}
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '2.5px', marginTop: '10px' }}>
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Titular</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px' }}>{cardHolder.toUpperCase() || 'TITULAR DE LA TARJETA'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vence</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cardExpiry || 'MM/AA'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="card-num">Número de Tarjeta</label>
                    <input
                      id="card-num"
                      type="text"
                      className="form-control"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="card-name">Nombre en la Tarjeta</label>
                    <input
                      id="card-name"
                      type="text"
                      className="form-control"
                      placeholder="Ej: ALEJANDRO RAMIREZ"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="card-exp">Vencimiento (MM/AA)</label>
                      <input
                        id="card-exp"
                        type="text"
                        className="form-control"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="card-cvv">Código CVV</label>
                      <input
                        id="card-cvv"
                        type="password"
                        className="form-control"
                        placeholder="123"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Direct Bank Transfer Details */}
              {activeTab === 'transfer' && (
                <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Realiza el depósito directo en nuestra cuenta bancaria en Bolivia y registra el número de comprobante abajo.
                  </p>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    lineHeight: '1.6'
                  }}>
                    <div>Banco: <strong>Banco Nacional de Bolivia (BNB)</strong></div>
                    <div>Tipo: <strong>Cuenta de Ahorros Bs.</strong></div>
                    <div>Titular: <strong>Alex Store Bolivia S.R.L.</strong></div>
                    <div>Número de Cuenta: <strong>100-0382910</strong></div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="trans-ref">Código de Operación o Depósito</label>
                    <input
                      id="trans-ref"
                      type="text"
                      className="form-control"
                      placeholder="Ej: Depósito BNB 481029"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '18px'
                }}>
                  <ShieldAlert size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', height: '48px', justifyContent: 'center', marginTop: '10px' }}
              >
                Confirmar y Registrar Pago
              </button>
            </form>
          </>
        )}

        {/* LOADING PROCESSING INDICATOR */}
        {step === 'loading' && (
          <div style={{ padding: '40px 0' }} className="animate-fade-in">
            <Loader2 
              size={52} 
              color="var(--accent-primary)" 
              style={{
                animation: 'spin 1.5s linear infinite',
                margin: '0 auto 24px auto'
              }} 
            />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
              Procesando su Pago...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Verificando las credenciales y la solvencia bancaria. Por favor, no cierre esta ventana.
            </p>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* PAYMENT SUCCESS COMPLETED CELEBRATION */}
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
            
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              ¡Compra Exitosa! <Sparkles size={22} color="#f59e0b" />
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Hemos registrado su pago en bolivianos de forma exitosa.<br />
              {activeTab === 'card' 
                ? 'El cobro se ha debitado de su cuenta y estamos preparando su pedido.'
                : `Se ha registrado su código de operación: ${refCode}.`
              }
              <br />¡Muchas gracias por su preferencia!
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              Limpiando el carrito y regresando...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
