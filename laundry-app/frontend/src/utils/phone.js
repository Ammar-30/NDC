export function normalizePhone(input) {
  if (!input) return ''
  let phone = String(input).replace(/[\s\-\(\)\.\+]/g, '')
  if (phone.startsWith('+92')) phone = '0' + phone.slice(3)
  else if (phone.startsWith('92') && phone.length === 12) phone = '0' + phone.slice(2)
  else if (phone.startsWith('3') && phone.length === 10) phone = '0' + phone
  if (!/^03\d{9}$/.test(phone)) throw new Error('Invalid phone number')
  return phone
}

export function formatPhoneDisplay(phone) {
  if (!phone) return ''
  const p = phone.replace(/\D/g, '')
  if (p.length === 11) return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`
  return phone
}

export function phoneToWhatsApp(phone) {
  const p = normalizePhone(phone)
  return '92' + p.slice(1)
}
