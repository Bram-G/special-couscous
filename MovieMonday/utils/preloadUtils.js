/**
 * Utility functions for preloading resources
 */

// Preload Three.js and VHS component during idle time
export const preloadVHSResources = () => {
    if (typeof window === 'undefined') return; // Skip in SSR
    
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        console.log('Preloading VHS resources during idle time...');
        
        // Import Three.js
        import('three').catch(err => {
          console.error('Error preloading Three.js:', err);
        });
        
        // Import VHS component
        import('./VHSTape').catch(err => {
          console.error('Error preloading VHS component:', err);
        });
      }, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        console.log('Preloading VHS resources with timeout fallback...');
        
        // Import Three.js
        import('three').catch(err => {
          console.error('Error preloading Three.js:', err);
        });
        
        // Import VHS component
        import('./VHSTape').catch(err => {
          console.error('Error preloading VHS component:', err);
        });
      }, 3000);
    }
  };
  
  // Check if the device supports WebGL well enough for 3D rendering
  export const checkWebGLSupport = () => {
    if (typeof window === 'undefined') return false; // SSR environment
    
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return false;
      
      // Check for minimum capabilities
      const extensions = gl.getSupportedExtensions();
      const hasRequiredExtensions = 
        extensions.includes('OES_texture_float') && 
        extensions.includes('OES_standard_derivatives');
      
      // Check if we can create enough textures
      const maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      
      // Check if device has enough memory
      const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowPowerDevice = isMobile && !(
        // Exclude high-end tablets and iPads from low power category
        /iPad|Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1
      );
      
      return hasRequiredExtensions && maxTextures >= 8 && !isLowPowerDevice;
    } catch (e) {
      console.error('Error checking WebGL support:', e);
      return false;
    }
  };
  
  // Save user preference for VHS mode
  export const saveVHSModePreference = (enabled) => {
    try {
      localStorage.setItem('vhs3dMode', String(enabled));
      return true;
    } catch (e) {
      console.error('Error saving VHS mode preference:', e);
      return false;
    }
  };
  
  // Get user preference for VHS mode
  export const getVHSModePreference = () => {
    try {
      const preference = localStorage.getItem('vhs3dMode');
      
      if (preference === null) {
        // No stored preference, use smart defaults
        const supportsWebGL = checkWebGLSupport();
        const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Default to enabled only on capable non-mobile devices without reduced motion preference
        return supportsWebGL && !isMobile && !prefersReducedMotion;
      }
      
      return preference === 'true';
    } catch (e) {
      console.error('Error getting VHS mode preference:', e);
      return false;
    }
  };