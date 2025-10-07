import React from 'react'

const FormField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  placeholder,
  options = null,
  rows = 1,
  className = ''
}) => {
  const inputClasses = `w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-400 ${className}`
  
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={inputClasses}
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  )
}

export default FormField
