import * as React from "react"

// Definição dos breakpoints do Tailwind
export const SCREEN_SIZES = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

/**
 * Hook personalizado para detectar o tamanho da tela e a orientação
 * @param breakpoint - Breakpoint a ser verificado (sm, md, lg, xl, 2xl)
 * @returns Objeto com informações sobre o tamanho da tela
 */
export function useScreenSize(breakpoint = 'md') {
  const size = SCREEN_SIZES[breakpoint as keyof typeof SCREEN_SIZES] || SCREEN_SIZES.md
  
  const [screenInfo, setScreenInfo] = React.useState({
    isMobile: false,
    isPortrait: true,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  React.useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenInfo({
        isMobile: width < size,
        isPortrait: height > width,
        width,
        height
      })
    }
    
    // Inicializa com os valores corretos
    updateScreenInfo()
    
    // Adiciona listener para mudanças de tamanho e orientação
    window.addEventListener('resize', updateScreenInfo)
    window.addEventListener('orientationchange', updateScreenInfo)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateScreenInfo)
      window.removeEventListener('orientationchange', updateScreenInfo)
    }
  }, [size])

  return screenInfo
}

/**
 * Hook simplificado para compatibilidade retroativa
 * @returns boolean indicando se o dispositivo é mobile
 */
export function useIsMobile() {
  const { isMobile } = useScreenSize('md')
  return isMobile
}
