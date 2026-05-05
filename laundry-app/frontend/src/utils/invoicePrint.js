import { generateBarcodeSvg } from './barcode.js'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function money(value) {
  return Number(value || 0).toLocaleString('en-PK')
}

function pieceLabel(value) {
  const pieces = Number(value) > 0 ? Number(value) : 1
  return `${pieces} pc${pieces === 1 ? '' : 's'}`
}

function dateLabel(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeLabel(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

export function printOrderInvoicePdf({ order, customerName, customerPhone }) {
  if (!order) throw new Error('Order data is missing')

  const items = (order.items || []).filter(item => item && item.item_name)
  if (!items.length) throw new Error('No invoice items found')

  const invoiceNumber = order.token || String(order.id || '').slice(0, 8).toUpperCase() || '-'
  const createdAt = order.created_at || Date.now()
  const issueDate = dateLabel(createdAt)
  const issueTime = timeLabel(createdAt)
  const dueDate = dateLabel(order.due_date)
  const dueDateLong = order.due_date
    ? new Date(order.due_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' })
    : '-'
  const dueTime = timeLabel(order.due_date)
  const displayName = customerName || order.customer_name || 'Walk-in Customer'
  const displayPhone = customerPhone || order.customer_phone || '-'
  const urgentService = Boolean(order.urgent_service)
  const urgentExtra = Number(order.urgent_extra_pkr || 0)
  const subtotalPkr = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unit_price_pkr) || 0
    return sum + (quantity * unitPrice)
  }, 0)
  const totalPkr = Number(order.total_pkr || (subtotalPkr + urgentExtra))
  const advance = 0
  const balanceDue = totalPkr - advance
  const totalPcs = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const pcs = Number(item.pieces) > 0 ? Number(item.pieces) : 1
    return sum + (qty * pcs)
  }, 0)

  const barcodeSrc = generateBarcodeSvg(invoiceNumber, {
    width: 1.6,
    height: 36,
    fontSize: 11,
    margin: 4,
  })

  const itemRows = items.map((item, index) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unit_price_pkr) || 0
    const lineTotal = quantity * unitPrice
    return `
      <tr>
        <td class="particular-cell">
          <div class="item-main">${escapeHtml(item.item_name.toUpperCase())}</div>
          <div class="item-sub">Color: -, Remark: ${escapeHtml(order.notes || 'Standard service')}</div>
        </td>
        <td>DRY CLEANING</td>
        <td class="right">${quantity}</td>
        <td class="right">${money(unitPrice)}</td>
        <td class="right">${money(lineTotal)}</td>
        <td class="right">${money(lineTotal)}</td>
      </tr>
    `
  }).join('')

  const invoiceHtml = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>National Dry Cleaners - Invoice ${escapeHtml(invoiceNumber)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #edf1f3;
      font-family: "Times New Roman", Georgia, serif;
      color: #111;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      padding: 8mm;
      border: 1px solid #babec4;
      position: relative;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      pointer-events: none;
      font-size: 180px;
      font-weight: 800;
      letter-spacing: 6px;
      color: rgba(43, 127, 55, 0.05);
      transform: translateY(30px);
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #6b7280;
      padding: 4mm 2mm 3mm;
    }
    .logo-left {
      width: 26mm;
      text-align: center;
      color: #2f7f3a;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .brand-center {
      flex: 1;
      text-align: center;
      color: #2f7f3a;
    }
    .brand-center h1 {
      margin: 0;
      font-size: 21px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .tagline {
      margin: 1px 0;
      display: inline-block;
      font-size: 10px;
      border: 1px solid #2f7f3a;
      padding: 0 6px;
      border-radius: 10px;
      font-weight: 700;
    }
    .brand-center p {
      margin: 1px 0;
      font-size: 10px;
      font-weight: 600;
    }
    .since {
      width: 28mm;
      text-align: center;
      color: #2f7f3a;
      font-size: 22px;
      line-height: 1.05;
      font-weight: 700;
    }
    .thanks-line {
      text-align: center;
      font-size: 9px;
      padding: 4px 0;
      border-bottom: 1px solid #9ca3af;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      border-bottom: 1px solid #9ca3af;
    }
    .info-cell {
      min-height: 54px;
      padding: 6px 8px;
      border-right: 1px solid #d1d5db;
      font-size: 10px;
    }
    .info-cell:last-child {
      border-right: 0;
    }
    .token {
      font-size: 40px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }
    .datetime {
      font-size: 11px;
      line-height: 1.35;
    }
    .barcode-img {
      display: block;
      width: 100%;
      max-height: 54px;
      object-fit: contain;
      object-position: left top;
    }
    .customer-name {
      font-size: 11px;
      font-weight: 700;
      text-transform: lowercase;
      margin-top: 8px;
    }
    .customer-meta {
      font-size: 10px;
      margin-top: 4px;
      text-transform: lowercase;
    }
    .money-grid {
      display: grid;
      grid-template-columns: 1fr 42px 1fr 42px 1fr;
      border-bottom: 1px solid #9ca3af;
      align-items: stretch;
    }
    .money-cell {
      padding: 6px 8px;
      text-align: center;
      font-size: 11px;
      border-right: 1px solid #d1d5db;
    }
    .money-cell:last-child {
      border-right: 0;
    }
    .money-num {
      font-size: 31px;
      line-height: 1;
      margin: 6px 0;
      color: #2d3748;
    }
    .money-amount {
      font-size: 26px;
      line-height: 1;
      margin: 4px 0;
      font-weight: 700;
    }
    .summary-line {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 6px 8px;
      border-bottom: 1px solid #9ca3af;
      font-size: 11px;
    }
    .summary-line b {
      font-size: 12px;
    }
    .line-right {
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #9ca3af;
      font-size: 10px;
    }
    th {
      text-align: left;
      border-bottom: 1px solid #9ca3af;
      padding: 6px 6px;
      font-size: 10px;
    }
    td {
      padding: 7px 6px;
      vertical-align: top;
      border-bottom: 1px dotted #c4c8ce;
      font-size: 10px;
    }
    tr:last-child td {
      border-bottom: 0;
    }
    .particular-cell {
      width: 40%;
    }
    .item-main {
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .item-sub {
      font-size: 10px;
      color: #1f2937;
    }
    .right {
      text-align: right;
      white-space: nowrap;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 10px;
      margin-top: 4px;
    }
    .box {
      border-top: 1px solid #9ca3af;
      padding-top: 6px;
      min-height: 88px;
    }
    .box h4 {
      margin: 0 0 4px;
      font-size: 10px;
      font-weight: 700;
    }
    .box p {
      margin: 2px 0;
      line-height: 1.3;
    }
    .totals {
      border-left: 1px solid #d1d5db;
      padding-left: 8px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dotted #c4c8ce;
      font-size: 11px;
    }
    .totals-row:last-child {
      border-bottom: 0;
      font-weight: 700;
      font-size: 13px;
    }
    .bottom-meta {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #9ca3af;
      font-size: 10px;
      line-height: 1.35;
    }
    .location-line {
      margin-top: 4px;
      font-size: 9px;
      color: #374151;
    }
    .small-green {
      color: #2f7f3a;
      font-weight: 700;
    }
    .no-print {
      width: 210mm;
      margin: 10px auto 18px;
      text-align: right;
    }
    .no-print button {
      background: #2f7f3a;
      color: #fff;
      border: 0;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 13px;
      cursor: pointer;
    }
    @page { size: A4; margin: 8mm; }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        border: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print"><button onclick="window.print()">Print / Save PDF</button></div>
  <div class="page">
    <div class="watermark">NDC</div>
    <div class="top-header">
      <div class="logo-left">NDC</div>
      <div class="brand-center">
        <h1>NATIONAL</h1>
        <div class="tagline">DRY CLEANERS &amp; STEAM LAUNDERS</div>
        <p>12/1 Wahdat Road, Lahore Tel: 042-35865008</p>
        <p>Cell: 0304-7591040, www.ndc.com.pk</p>
      </div>
      <div class="since">Since<br/>1967</div>
    </div>
    <div class="thanks-line">Thank you &amp; Don't worry, your clothes are in SAFE HANDS.</div>

    <div class="info-grid">
      <div class="info-cell">
        <div class="token">${escapeHtml(invoiceNumber)}</div>
        <div class="datetime">${escapeHtml(issueDate)}<br/>${escapeHtml(issueTime)}</div>
      </div>
      <div class="info-cell">
        <img class="barcode-img" src="${barcodeSrc}" alt="${escapeHtml(invoiceNumber)}" />
      </div>
      <div class="info-cell">
        <div class="customer-name">${escapeHtml(displayName)}</div>
        <div class="customer-meta">${escapeHtml(displayPhone)}</div>
      </div>
    </div>

    <div class="money-grid">
      <div class="money-cell">
        <div>RS : ${money(totalPkr)}</div>
        <div>Due (this order)</div>
      </div>
      <div class="money-cell">
        <div class="money-num">-</div>
      </div>
      <div class="money-cell">
        <div>RS : ${money(advance)}</div>
        <div>Advance</div>
      </div>
      <div class="money-cell">
        <div class="money-num">=</div>
      </div>
      <div class="money-cell">
        <div class="money-amount">RS : ${money(balanceDue)}</div>
        <div><b>Balance Due</b></div>
      </div>
    </div>

    <div class="summary-line">
      <div><b>Total Pcs : ${totalPcs}</b> &nbsp;&nbsp;&nbsp; ${urgentService ? `Urgent Extra: ${money(urgentExtra)}` : `Advance Balance: ${money(advance)}`}</div>
      <div class="line-right"><b>Delivery Date :</b> ${escapeHtml(dueDate)} ${escapeHtml(dueTime)} / ${escapeHtml(dueDateLong.split(',')[0] || '-')}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 42%;">Particular's</th>
          <th style="width: 19%;">Service</th>
          <th style="width: 7%;" class="right">Qty</th>
          <th style="width: 10%;" class="right">Rate</th>
          <th style="width: 11%;" class="right">Amount</th>
          <th style="width: 11%;" class="right">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="footer-grid">
      <div class="box">
        <h4>Terms and Conditions</h4>
        <p>All deliveries will be made in 24 Hours for laundry and ironing.</p>
        <p>Dry cleaning garments will be delivered as per service schedule.</p>
        <p>Urgent delivery of garments will be charged extra.</p>
        <p><b>Booked By:</b> SYSTEM</p>
      </div>
      <div class="box totals">
        <div class="totals-row"><span>Subtotal</span><span>${money(subtotalPkr)}</span></div>
        ${urgentService ? `<div class="totals-row"><span>Urgent Service Extra</span><span>${money(urgentExtra)}</span></div>` : ''}
        <div class="totals-row"><span>Total</span><span>${money(totalPkr)}</span></div>
        <div class="totals-row"><span>Due (this order)</span><span>${money(balanceDue)}</span></div>
      </div>
    </div>

    <div class="bottom-meta">
      <div><b>Timings:</b> 8:00am to 9:00pm | <span class="small-green">SUNDAY CLOSED</span></div>
      <div class="location-line">Locations: Wahdat Road - Faisal Town - Johar Town - Thokar Canal Road - Ghalib Market - Model Town - DHA Phase IV,V,VI - M.M Alam Road - Raiwind Road</div>
    </div>
  </div>
</body>
</html>
  `

  const printWindow = window.open('', '_blank', 'width=1000,height=1200')
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups to print invoice.')
  }

  printWindow.document.open()
  printWindow.document.write(invoiceHtml)
  printWindow.document.close()

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.onafterprint = () => printWindow.close()
  }

  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 80)
  } else {
    printWindow.addEventListener('load', () => setTimeout(triggerPrint, 80), { once: true })
  }
}
