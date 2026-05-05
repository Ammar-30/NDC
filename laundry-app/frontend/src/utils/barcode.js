import JsBarcode from 'jsbarcode'

/**
 * Generates a Code 128 barcode as an SVG data URL.
 * Runs entirely in-browser — no network request, works offline.
 *
 * @param {string} value  - The text/number to encode
 * @param {object} opts   - Optional JsBarcode overrides
 * @returns {string}      - "data:image/svg+xml;base64,..." ready for <img src>
 */
export function generateBarcodeSvg(value, opts = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, String(value), {
    format: 'CODE128',
    width: 1.8,
    height: 40,
    displayValue: true,
    fontSize: 10,
    margin: 4,
    lineColor: '#000',
    background: '#fff',
    ...opts,
  })
  const svgStr = new XMLSerializer().serializeToString(svg)
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
}
