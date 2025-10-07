import React from 'react'

const SimpleFormField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  placeholder,
  options = null
}) => {
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
    outline: 'none'
  }

  const focusStyle = {
    borderColor: '#3b82f6',
    backgroundColor: 'white',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb'
            e.target.style.backgroundColor = '#f9fafb'
            e.target.style.boxShadow = 'none'
          }}
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb'
            e.target.style.backgroundColor = '#f9fafb'
            e.target.style.boxShadow = 'none'
          }}
        />
      )}
    </div>
  )
}

export default SimpleFormField
