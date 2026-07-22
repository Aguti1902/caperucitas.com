import { useEffect, useRef } from 'react'

interface ProtectedImageProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
}

export default function ProtectedImage({ src, alt, className = '', onClick }: ProtectedImageProps) {
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Prevenir capturas de pantalla con múltiples técnicas
    
    // 1. Deshabilitar menú contextual (botón derecho)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // 2. Prevenir arrastrar imágenes
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // 3. Prevenir selección de texto/imágenes
    const handleSelectStart = (e: Event) => {
      e.preventDefault()
      return false
    }

    // 4. Detectar teclas de captura de pantalla
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen, F12 (DevTools), Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'PrintScreen' ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') || // Guardar página
        (e.ctrlKey && e.key === 'p')    // Imprimir
      ) {
        e.preventDefault()
        // Mostrar advertencia
        alert('Las capturas de pantalla están deshabilitadas para proteger el contenido.')
        return false
      }
    }

    // 5. Prevenir copiar al portapapeles
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      return false
    }

    // 6. Detectar intentos de captura con extensiones
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Si la página se oculta, podría ser una captura
        console.warn('Página oculta - posible intento de captura')
      }
    }

    // Agregar event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Agregar listeners específicos al contenedor de la imagen
    const container = imgRef.current
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu)
      container.addEventListener('dragstart', handleDragStart)
      container.addEventListener('selectstart', handleSelectStart)
    }

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu)
        container.removeEventListener('dragstart', handleDragStart)
        container.removeEventListener('selectstart', handleSelectStart)
      }
    }
  }, [])

  return (
    <div
      ref={imgRef}
      className={`relative ${className}`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        pointerEvents: onClick ? 'auto' : 'auto',
      }}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          pointerEvents: 'auto',
        } as React.CSSProperties}
      />
      {/* Overlay invisible para protección adicional */}
      <div
        className="absolute inset-0"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          pointerEvents: onClick ? 'none' : 'none',
        }}
      />
    </div>
  )
}

