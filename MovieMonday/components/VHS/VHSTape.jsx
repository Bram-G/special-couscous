import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const VHSTape = ({ posterUrl, width = 300, height = 200, onError }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const tapeRef = useRef(null);
  const frameIdRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);

  // Check if WebGL is supported
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const isWebGLSupported = !!gl;
      setIsSupported(isWebGLSupported);
      
      if (!isWebGLSupported && onError) {
        onError('WebGL is not supported on this device');
      }
    } catch (e) {
      console.error('Error checking WebGL support:', e);
      setIsSupported(false);
      if (onError) onError('Error checking WebGL support');
    }
  }, [onError]);

  // Set up Three.js scene
  useEffect(() => {
    if (!isSupported || !mountRef.current) return;

    // Stop any existing animation
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
    }

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = null; // Transparent background

      // Create camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 6;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
      });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      
      // Clear the mount point and add the renderer
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
      mountRef.current.appendChild(renderer.domElement);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(2, 2, 5);
      scene.add(directionalLight);

      // Add a subtle spotlight to create depth on the VHS
      const spotLight = new THREE.SpotLight(0xffffff, 0.5);
      spotLight.position.set(-3, 5, 5);
      spotLight.angle = Math.PI / 6;
      spotLight.penumbra = 0.5;
      scene.add(spotLight);

      // Create VHS tape programmatically
// In VHSTape.jsx, update the createVHSTape function

const createVHSTape = () => {
    // Create group for the whole tape
    const tapeGroup = new THREE.Group();
  
    // Define dimensions (with better aspect ratio)
    const tapeWidth = 2.4;     // Reduced width
    const tapeHeight = 0.8;    // Reduced height
    const tapeDepth = 1.6;     // Reduced depth for better proportions
    const labelWidth = 1.6;    // Make label proportional
    const labelHeight = 0.9;   // Make label taller
  
    // VHS body - main box
    const bodyGeometry = new THREE.BoxGeometry(tapeWidth, tapeHeight, tapeDepth);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x000000, // Black VHS tape
      shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    tapeGroup.add(body);
  
    // Cover label area (where poster goes)
    const labelGeometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
    const labelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.1
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    // Position it better - slightly raised from the surface
    label.position.set(0, 0, tapeDepth / 2 + 0.005); 
    label.name = "coverLabel"; // Name it for easy lookup
    tapeGroup.add(label);
  
    // Position the tape with less extreme angle
    tapeGroup.rotation.x = -0.05; // Less tilted
    tapeGroup.rotation.y = 0.2;   // Less angled
  
    // Center the group
    tapeGroup.position.y = -0.3;  // Less downward shift
  
    return tapeGroup;
  };

      // Create the VHS tape
      const tape = createVHSTape();
      scene.add(tape);
      tapeRef.current = tape;

      // Update references
      sceneRef.current = { scene, camera, renderer };

      // Animation function
      const animate = () => {
        if (tapeRef.current) {
          // Gentle rocking animation
          tapeRef.current.rotation.y = 0.3 + Math.sin(Date.now() * 0.001) * 0.1;
        }
        renderer.render(scene, camera);
        frameIdRef.current = requestAnimationFrame(animate);
      };

      // Start animation
      animate();

      // Apply poster if available
      if (posterUrl) {
        updatePoster(posterUrl, tape);
      }

      // Clean up function
      return () => {
        cancelAnimationFrame(frameIdRef.current);
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        // Dispose of geometries and materials
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => {
                if (material.map) material.map.dispose();
                material.dispose();
              });
            } else {
              if (object.material.map) object.material.map.dispose();
              object.material.dispose();
            }
          }
        });
        renderer.dispose();
      };
    } catch (error) {
      console.error('Error setting up ThreeJS scene:', error);
      setIsSupported(false);
      if (onError) onError('Error setting up 3D rendering');
    }
  }, [isSupported, width, height, onError]);

  // Update poster when URL changes
  useEffect(() => {
    if (!isSupported || !tapeRef.current || !posterUrl) return;
    
    updatePoster(posterUrl, tapeRef.current);
  }, [posterUrl, isSupported]);

  // Function to update the poster texture
  const updatePoster = (url, tape) => {
    try {
      // Check if the URL is from TMDb
      let proxyUrl = url;
      if (url && url.includes('image.tmdb.org')) {
        // Use the proxy route instead
        proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      }
      
      const textureLoader = new THREE.TextureLoader();
      
      textureLoader.load(
        proxyUrl,
        (texture) => {
          // Success case - same as before
          tape.traverse((child) => {
            if (child.name === 'coverLabel') {
              const newMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.5,
                metalness: 0.1
              });
              child.material.dispose();
              child.material = newMaterial;
            }
          });
        },
        undefined,
        (error) => {
          // Error handler - same as before
          console.error('Error loading texture:', error);
          // Add fallback implementation...
        }
      );
    } catch (error) {
      console.error('Error updating poster:', error);
    }

    try {
      const textureLoader = new THREE.TextureLoader();
      
      // Add error handling and fallback
      textureLoader.load(
        url,
        (texture) => {
          // Success case - find the cover label and apply texture
          tape.traverse((child) => {
            if (child.name === 'coverLabel') {
              const newMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.5,
                metalness: 0.1
              });
              child.material.dispose();
              child.material = newMaterial;
            }
          });
        },
        undefined, // Progress callback (not needed)
        (error) => {
          // Error callback - use a fallback texture
          console.error('Error loading texture:', error);
          
          // Create a canvas with movie title as fallback
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          
          // Fill background
          ctx.fillStyle = '#333333';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add text
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Movie', canvas.width/2, canvas.height/2 - 10);
          ctx.fillText('Poster', canvas.width/2, canvas.height/2 + 20);
          
          // Create texture from canvas
          const fallbackTexture = new THREE.CanvasTexture(canvas);
          
          // Apply fallback texture
          tape.traverse((child) => {
            if (child.name === 'coverLabel') {
              const newMaterial = new THREE.MeshStandardMaterial({
                map: fallbackTexture,
                roughness: 0.5,
                metalness: 0.1
              });
              child.material.dispose();
              child.material = newMaterial;
            }
          });
        }
      );
    } catch (error) {
      console.error('Error in updatePoster:', error);
    }
  };

  // Render a fallback if WebGL is not supported
  if (!isSupported) {
    return (
      <div 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img 
          src={posterUrl} 
          alt="Movie poster" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain' 
          }} 
        />
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`
      }}
      className="vhs-tape-container"
    />
  );
};

export default VHSTape;