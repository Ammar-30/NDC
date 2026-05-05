import { generateBarcodeSvg } from './barcode.js'

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.floor(parsed)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDueDate(dueDate) {
  if (!dueDate) return '-'
  const parsed = new Date(dueDate)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildStickers(items = []) {
  const stickers = []

  for (const item of items) {
    if (!item || !item.item_name) continue
    const quantity = toPositiveInt(item.quantity, 0)
    const pieces = toPositiveInt(item.pieces, 1)
    if (quantity < 1) continue

    for (let garmentIndex = 1; garmentIndex <= quantity; garmentIndex += 1) {
      for (let pieceIndex = 1; pieceIndex <= pieces; pieceIndex += 1) {
        stickers.push({
          itemName: item.item_name,
          garmentIndex,
          quantity,
          pieceIndex,
          pieces,
        })
      }
    }
  }

  return stickers.map((sticker, index) => ({
    ...sticker,
    serial: index + 1,
    total: stickers.length,
  }))
}

export function countOrderStickers(order) {
  return buildStickers(order?.items || []).length
}

export function printOrderStickers({ order, customerName, customerPhone }) {
  const stickers = buildStickers(order?.items || [])
  if (stickers.length === 0) return { printed: false, count: 0 }

  const token = order?.token || '-'
  const dueDate = formatDueDate(order?.due_date)
  const safeCustomerName = escapeHtml(customerName || '-')
  const safeCustomerPhone = escapeHtml(customerPhone || '-')
  const safeToken = escapeHtml(token)
  const safeDueDate = escapeHtml(dueDate)

  const stickerHtml = stickers.map((sticker) => {
    const garmentText = sticker.quantity > 1
      ? `${sticker.garmentIndex}/${sticker.quantity}`
      : '1/1'
    const pieceText = sticker.pieces > 1
      ? `${sticker.pieceIndex}/${sticker.pieces}`
      : '1/1'

    // Unique barcode per piece: TOKEN-SERIAL (e.g. LHR-250502-001-3)
    const barcodeValue = `${token}-${sticker.serial}`
    const barcodeSrc = generateBarcodeSvg(barcodeValue, {
      width: 1.4,
      height: 28,
      fontSize: 8,
      margin: 2,
    })

    return `
      <article class="sticker">
        <div class="row top">
          <span class="token">${safeToken}</span>
          <span class="count">${sticker.serial}/${sticker.total}</span>
        </div>
        <p class="item">${escapeHtml(sticker.itemName)}</p>
        <p class="meta">Garment: ${garmentText} · Piece: ${pieceText}</p>
        <img class="barcode" src="${barcodeSrc}" alt="${escapeHtml(barcodeValue)}" />
        <p class="customer">${safeCustomerName}</p>
        <div class="row bottom">
          <span>${safeCustomerPhone}</span>
          <span>Due: ${safeDueDate}</span>
        </div>
      </article>
    `
  }).join('')

  const printWindow = window.open('', '_blank', 'width=1200,height=820')
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups and try again.')
  }

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Stickers - ${safeToken}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #fff;
            color: #111827;
          }
          .sheet {
            display: grid;
            grid-template-columns: repeat(3, 63mm);
            grid-auto-rows: 52mm;
            gap: 3mm;
            justify-content: center;
          }
          .sticker {
            border: 1px solid #111827;
            border-radius: 2mm;
            padding: 2.5mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            break-inside: avoid;
          }
          .row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2mm;
          }
          .top {
            border-bottom: 1px dashed #9ca3af;
            padding-bottom: 1.2mm;
            margin-bottom: 1.6mm;
          }
          .token {
            font-size: 12pt;
            font-weight: 800;
            letter-spacing: 0.6px;
          }
          .count {
            font-size: 9pt;
            font-weight: 700;
          }
          .item {
            margin: 0;
            font-size: 10pt;
            font-weight: 700;
            line-height: 1.2;
            word-break: break-word;
          }
          .meta {
            margin: 1mm 0 0;
            font-size: 8.5pt;
            color: #374151;
            font-weight: 600;
          }
          .customer {
            margin: 1.4mm 0 0;
            font-size: 9pt;
            font-weight: 700;
            line-height: 1.2;
            word-break: break-word;
          }
          .barcode {
            display: block;
            width: 100%;
            height: 14mm;
            object-fit: contain;
            object-position: left center;
            margin: 1mm 0;
          }
          .bottom {
            margin-top: 1.2mm;
            padding-top: 1.2mm;
            border-top: 1px dashed #9ca3af;
            font-size: 8pt;
            color: #374151;
            line-height: 1.1;
          }
        </style>
      </head>
      <body>
        <main class="sheet">${stickerHtml}</main>
      </body>
    </html>
  `)
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

  return { printed: true, count: stickers.length }
}
