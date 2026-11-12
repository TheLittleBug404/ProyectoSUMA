import React from 'react';
import { Printer, CheckCircle2, X, MessageCircle } from 'lucide-react';
import type { Sale } from '../../types/domain';

interface TicketReceiptModalProps {
  sale: Sale | null;
  cashierName: string;
  branchName: string;
  onClose: () => void;
}

export const TicketReceiptModal: React.FC<TicketReceiptModalProps> = ({
  sale,
  cashierName,
  branchName,
  onClose
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.fecha).toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const handleSendWhatsApp = () => {
    let targetPhone = sale.clienteTelefono || '';
    if (!targetPhone) {
      const input = window.prompt('Ingresa el número de WhatsApp del cliente (ej: 70123456):');
      if (!input) return;
      targetPhone = input;
    }

    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const itemsText = sale.items
      .map(i => `• ${i.cantidad}x ${i.nombreProducto}${i.talla ? ` [Talla ${i.talla}]` : ''} - Bs. ${i.subtotal.toFixed(2)}`)
      .join('\n');

    const msg = `👗 *SAMU Moda Femenina*
*Ticket de Venta:* ${sale.numeroTicket}
*Fecha:* ${formattedDate}
*Sucursal:* ${branchName}
*Cajero:* ${cashierName}
${sale.clienteNombre ? `*Cliente:* ${sale.clienteNombre}\n` : ''}--------------------------------
*Prendas:*
${itemsText}
--------------------------------
${sale.descuentoMonto ? `Subtotal: Bs. ${(sale.subtotal || sale.total).toFixed(2)}\nDescuento: -Bs. ${sale.descuentoMonto.toFixed(2)}\n` : ''}*TOTAL COBRADO:* Bs. ${sale.total.toFixed(2)}
*Método de Pago:* ${sale.metodoPago}

¡Muchas gracias por su preferencia! Conserve este mensaje para cualquier cambio de prenda.`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181820] border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Venta Registrada</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Ticket Content */}
        <div id="thermal-ticket-print" className="p-6 bg-white text-zinc-900 font-mono text-xs">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-zinc-400">
            <h2 className="font-serif text-lg font-black tracking-widest text-black">SAMU</h2>
            <p className="text-[10px] tracking-wider text-zinc-600 uppercase font-sans">Samara Muriel • Moda Femenina</p>
            <p className="text-[10px] text-zinc-600 mt-1">Sucursal: {branchName}</p>
            <p className="text-[10px] text-zinc-600">Av. 16 de Julio (El Prado), Nº 1420</p>
            <p className="text-[10px] text-zinc-600">Tel: +591 70123456</p>
          </div>

          {/* Ticket metadata */}
          <div className="py-3 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-600">Ticket:</span>
              <span className="font-bold">{sale.numeroTicket}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Fecha:</span>
              <span>{formattedDate}</span>
            </div>
            {sale.clienteNombre && (
              <div className="flex justify-between">
                <span className="text-zinc-600">Cliente:</span>
                <span className="font-bold">{sale.clienteNombre}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-600">Atendido por:</span>
              <span className="font-semibold">{cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Método de Pago:</span>
              <span className="font-semibold">{sale.metodoPago}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-zinc-400">
            <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase mb-2">
              <span>Cant. / Prenda</span>
              <span>Subtotal</span>
            </div>
            <div className="space-y-2">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="pr-2">
                    <p className="font-bold text-black line-clamp-1">{item.nombreProducto}</p>
                    <p className="text-[10px] text-zinc-600">
                      {item.cantidad} x Bs. {item.precioUnitario.toFixed(2)} {item.talla ? `[Talla ${item.talla}]` : ''}
                    </p>
                  </div>
                  <span className="font-bold shrink-0">Bs. {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Discounts */}
          <div className="py-3 border-b border-dashed border-zinc-400 space-y-1">
            {sale.descuentoMonto && sale.descuentoMonto > 0 ? (
              <>
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>Bs. {(sale.subtotal || sale.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Descuento ({sale.descuentoPorcentaje || 0}%):</span>
                  <span>- Bs. {sale.descuentoMonto.toFixed(2)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between text-base font-black text-black pt-1">
              <span>TOTAL:</span>
              <span>Bs. {sale.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer message */}
          <div className="pt-4 text-center text-[10px] text-zinc-600 space-y-1 font-sans">
            <p className="font-bold text-zinc-800">¡GRACIAS POR SU PREFERENCIA!</p>
            <p>Prendas exclusivas garantizadas.</p>
            <p className="text-[9px] text-zinc-400 mt-2 font-mono">Conserve este comprobante para cambios.</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 bg-[#181820] border-t border-zinc-800 flex flex-col gap-2 print:hidden">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir Ticket
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer text-center"
          >
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
};
