import React, { useState, useEffect } from 'react'

export default function PageWrapper({ children, className = '' }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className={"transition-opacity duration-300 ease-out " + className} style={{ opacity: visible ? 1 : 0 }}>
      {children}
    </div>
  )
}
