import { useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  
  const imageSizes = {
    sm: 'h-10',
    md: 'h-16',
    lg: 'h-24',
  }

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  if (imageError) {
    return (
      <div className={`${textSizes[size]} font-black tracking-tight ${className}`}>
        <span className="text-white">Caperuci</span>
        <span className="text-red-500">tas</span>
        <span className="text-white">.com</span>
      </div>
    )
  }

  return (
    <img 
      src="/logo-caperucitas.jpeg" 
      alt="Caperucitas.com" 
      className={className || `${imageSizes[size]} w-auto object-contain`}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      onError={() => setImageError(true)}
    />
  )
}
