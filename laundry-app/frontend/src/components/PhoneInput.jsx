import { formatPhoneDisplay } from '../utils/phone'

export default function PhoneInput({ value, onChange, placeholder = '0321 456 7890', style, ...props }) {
  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
    onChange(raw)
  }

  return (
    <input
      type="tel"
      value={value ? formatPhoneDisplay(value) : ''}
      onChange={handleChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.70)',
        border: '1.5px solid rgba(200,215,235,0.80)',
        borderRadius: 10,
        fontSize: 14, outline: 'none',
        fontFamily: 'inherit',
        color: 'var(--text)',
        transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--accent)'
        e.target.style.boxShadow   = '0 0 0 3px rgba(22,163,74,0.12)'
        e.target.style.background  = 'rgba(255,255,255,0.90)'
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(200,215,235,0.80)'
        e.target.style.boxShadow   = 'none'
        e.target.style.background  = 'rgba(255,255,255,0.70)'
      }}
      {...props}
    />
  )
}
