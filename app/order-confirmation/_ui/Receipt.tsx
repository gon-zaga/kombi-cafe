'use client'

import type { OrderSummary } from '@/app/lib/types'

interface ReceiptProps {
  order: OrderSummary
  reference: string
}

// Explicit color values to avoid html2canvas issues with Tailwind v4 modern colors (lab, oklab, etc.)
const colors = {
  white: '#ffffff',
  black: '#000000',
  darkGray: '#1f2937',      // gray-800
  mediumGray: '#4b5563',    // gray-600
  lightGray: '#9ca3af',     // gray-400
  borderGray: '#d1d5db',    // gray-300
  amber: '#92400e',         // amber-800
  amberLight: '#fef3c7',    // amber-50
  amberBorder: '#fcd34d',   // amber-300
  emerald: '#065f46',       // emerald-800
  emeraldLight: '#ecfdf5',  // emerald-50
  emeraldBorder: '#6ee7b7', // emerald-300
}

export default function Receipt({ order, reference }: ReceiptProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatPrice = (n: number) => `₱${n.toFixed(2)}`

  const getItemTotal = (item: OrderSummary['items'][0]) => {
    const addOnTotal = item.addOns.reduce((sum, a) => sum + a.price * a.quantity, 0)
    return (item.unitPrice + addOnTotal) * item.quantity
  }

  const subtotal = order.items.reduce((sum, item) => sum + getItemTotal(item), 0)

  const containerStyle: React.CSSProperties = {
    width: '320px',
    backgroundColor: colors.white,
    color: colors.black,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '24px',
    boxSizing: 'border-box',
  }

  const hrStyle: React.CSSProperties = {
    border: 'none',
    borderTop: `1px solid ${colors.borderGray}`,
    margin: '12px 0',
  }

  const hrDashedStyle: React.CSSProperties = {
    border: 'none',
    borderTop: `1px dashed ${colors.borderGray}`,
    margin: '12px 0',
  }

  const hrThickStyle: React.CSSProperties = {
    border: 'none',
    borderTop: `2px solid ${colors.borderGray}`,
    margin: '16px 0',
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '12px',
  }

  const pStyle: React.CSSProperties = { margin: 0 }

  return (
    <div id="receipt-content" style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ ...pStyle, fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.05em' }}>KOMBI CAFE</p>
        <hr style={hrStyle} />
      </div>

      <div style={{ marginBottom: '12px', fontSize: '12px' }}>
        <div style={rowStyle}>
          <span>Ref:</span>
          <span style={{ fontWeight: 'bold' }}>{reference}</span>
        </div>
        <div style={{ ...rowStyle, marginTop: '4px' }}>
          <span>Date:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        {order.tableNumber && (
          <div style={{ ...rowStyle, marginTop: '4px' }}>
            <span>Table:</span>
            <span>{order.tableNumber}</span>
          </div>
        )}
        <div style={{ ...rowStyle, marginTop: '4px' }}>
          <span>Payment:</span>
          <span style={{ textTransform: 'capitalize' }}>{order.paymentMethod ?? 'counter'}</span>
        </div>
        {order.paymentMethod === 'gcash' && order.gcashReference && (
          <div style={{ ...rowStyle, marginTop: '4px', fontSize: '11px' }}>
            <span>GCash Ref:</span>
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.gcashReference}</span>
          </div>
        )}
      </div>

      <hr style={hrDashedStyle} />

      <div style={{ marginBottom: '12px' }}>
        {order.items.map((item, idx) => (
          <div key={`${item.name}-${item.size}-${idx}`} style={{ marginBottom: '12px' }}>
            <div style={rowStyle}>
              <span style={{ fontWeight: '500' }}>{item.name}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(getItemTotal(item))}</span>
            </div>
            <div style={{ ...rowStyle, fontSize: '11px', color: colors.mediumGray, marginTop: '2px' }}>
              <span>{item.size} x {item.quantity}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(item.unitPrice)} each</span>
            </div>
            {item.addOns.length > 0 && (
              <div style={{ marginTop: '4px', marginLeft: '8px' }}>
                {item.addOns.map((addon, ai) => (
                  <div key={ai} style={{ ...rowStyle, fontSize: '11px', color: colors.lightGray, marginBottom: '2px' }}>
                    <span>+ {addon.name}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(addon.price * addon.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <hr style={hrDashedStyle} />

      <div style={{ fontSize: '12px' }}>
        <div style={rowStyle}>
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div style={{ ...rowStyle, fontWeight: 'bold', fontSize: '14px', borderTop: `1px solid ${colors.borderGray}`, paddingTop: '8px', marginTop: '4px' }}>
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <hr style={hrThickStyle} />

      <div style={{ textAlign: 'center', fontSize: '11px', color: colors.mediumGray }}>
        <p style={pStyle}>Thank you for your order!</p>
        <p style={{ ...pStyle, marginTop: '4px' }}>Please show this at the counter.</p>
      </div>
    </div>
  )
}