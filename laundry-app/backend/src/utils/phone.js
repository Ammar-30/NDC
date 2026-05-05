function normalizePhone(input) {
  if (!input) throw Object.assign(new Error('Phone number is required'), { status: 400 });

  let phone = String(input).replace(/[\s\-().+]/g, '');

  if (phone.startsWith('+92')) phone = '0' + phone.slice(3);
  else if (phone.startsWith('92') && phone.length === 12) phone = '0' + phone.slice(2);
  else if (phone.startsWith('3') && phone.length === 10) phone = '0' + phone;

  if (!/^03\d{9}$/.test(phone)) {
    throw Object.assign(new Error(`Invalid Pakistani phone number: ${input}`), { status: 400 });
  }

  return phone;
}

module.exports = { normalizePhone };
