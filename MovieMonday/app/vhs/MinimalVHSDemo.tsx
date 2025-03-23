"use client";

import React, { useEffect, useRef } from "react";

const MinimalVHSDemo = ({ movie }) => {
  // Set a default poster path if none is provided
  const posterPath = movie?.posterPath || "/6EdKBYkB1ssgGjc9GedWRFGpjkA.jpg";
  const containerRef = useRef(null);

  useEffect(() => {
    const initScene = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls");

      if (!containerRef.current) return;
      
      
      // Clear any existing content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      // Create scene with transparent background
      const scene = new THREE.Scene();
      scene.background = null; // This makes the background transparent

      // Create camera - positioned to see front of VHS
      const camera = new THREE.PerspectiveCamera(
        40,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 2.5; // Much closer to make object appear bigger
      camera.position.y = 0; // Centered vertically

      // Create renderer with alpha (transparency) enabled
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true // Enable transparency
      });
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha (transparent)
      containerRef.current.appendChild(renderer.domElement);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Brighter ambient light
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0xffffff, 1.2);
      pointLight1.position.set(2, 2, 4);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xffffff, 1.0);
      pointLight2.position.set(-2, -2, 4);
      scene.add(pointLight2);

      // Add controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.enableZoom = false; // Disable zoom for cleaner experience

      // Create a group for the VHS model to control rotation
      const vhsGroup = new THREE.Group();
      scene.add(vhsGroup);

      // Load VHS model
      const loader = new GLTFLoader();
      
      // Add debug logging
      console.log("Loading VHS model...");
      
      loader.load("/models/vhs.glb", (gltf) => {
        console.log("Model loaded, inspecting meshes...");
        let foundLabelMesh = false;
        
        const model = gltf.scene;
        
        // Make the model bigger
        model.scale.set(3, 3, 3);
        
        // Position to be fully in view and centered
        model.position.set(0, 0, 0);
        
        // Make sure the VHS tape is upright
        model.rotation.set(0, 0, 0);
        model.rotation.z = Math.PI / 2;
        
        // Apply movie poster texture to label area
        model.traverse((node) => {
          if (node.isMesh) {
            console.log(`Found mesh: "${node.name}"`);
            console.log(`- Material: ${node.material ? node.material.name : 'none'}`);
            
            // Look for the label mesh by name or material name
            if (
              node.name.toLowerCase().includes("label") ||
              node.name.toLowerCase().includes("sticker") ||
              node.name.toLowerCase().includes("poster") ||
              node.name.toLowerCase().includes("front") ||
              node.name.toLowerCase().includes("face") ||
              (node.material && node.material.name && 
               node.material.name.toLowerCase().includes("label"))
            ) {
              console.log(`*** Found label area: "${node.name}" ***`);
              foundLabelMesh = true;
              
              // Create a new material for the label
              const labelMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0
              });

              // Load movie poster as texture with full URL
              const textureLoader = new THREE.TextureLoader();
              const fullPosterUrl = `https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg`;
              console.log("Loading texture from:", fullPosterUrl);
              
                textureLoader.load(
                  fullPosterUrl,
                  (texture) => {
                    console.log("Texture loaded successfully!");
                    
                    // Use extremely small repeat values to make the texture tiny
                    texture.center.set(0.05, 0.05); // Center the texture
                    texture.repeat.set(.00100, .00100); // Very extreme scaling down
                    texture.offset.set(.001075, .001049); // Fine-tuned positioning
                    
                    // Prevent texture wrapping/repeating
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    
                    labelMaterial.map = texture;
                    labelMaterial.needsUpdate = true;
                    
                    console.log("Applied extreme texture scaling:", {
                      repeat: { x: texture.repeat.x, y: texture.repeat.y },
                      offset: { x: texture.offset.x, y: texture.offset.y }
                    });
                  },
                
              
            
                // Progress handler
                (progress) => {
                  console.log("Texture loading progress:", (progress.loaded / progress.total) * 100, "%");
                },
                // Error handler
                (error) => {
                  console.error("Error loading texture:", error);
                  
                  // As a fallback, try a direct Batman poster URL
                  console.log("Trying fallback texture...");
                  textureLoader.load(
                    "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
                    (fallbackTexture) => {
                      console.log("Fallback texture loaded!");
                      fallbackTexture.center.set(0.5, 0.5); // Center the texture
                      fallbackTexture.repeat.set(1, 1); // Adjust repeat values to fix stretching
                      fallbackTexture.offset.set(0, .01); // Adjust offset to center the image vertically
                      labelMaterial.map = fallbackTexture;
                      labelMaterial.needsUpdate = true;
                    }
                  );
                }
              );

              // Apply the material
              node.material = labelMaterial;
            }
          }
        });
        
        // Warning if no label mesh found
        if (!foundLabelMesh) {
          console.warn("No label mesh found in the model. Trying to apply to all visible parts.");
          
          // As fallback, apply to a visible part of the model
          model.traverse((node) => {
            if (node.isMesh && node.material) {
              // Just apply to one visible face as a test
              const labelMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0
              });
              
              const textureLoader = new THREE.TextureLoader();
              textureLoader.load(
                `https://image.tmdb.org/t/p/w500${movie.posterPath}`,
                (texture) => {
                  labelMaterial.map = texture;
                  labelMaterial.needsUpdate = true;
                }
              );
              
              node.material = labelMaterial;
              console.log("Applied poster to mesh as fallback:", node.name);
              return; // Only apply to the first mesh we find
            }
          });
        }
        
        // Add model to the group
        vhsGroup.add(model);
      }, 
      (progress) => {
        console.log("Loading progress:", (progress.loaded / progress.total) * 100, "%");
      },
      (error) => {
        console.error("Error loading model:", error);
      });

      // Subtle automatic rotation
      let rotationDirection = 1;
      let rotationLimit = 0.1; // Reduced rotation amount for a more subtle effect

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);

        // Subtle automatic rotation for the VHS
        vhsGroup.rotation.y += 0.002 * rotationDirection;
        
        // Change direction when rotation reaches limits
        if (vhsGroup.rotation.y > rotationLimit) {
          rotationDirection = -1;
        } else if (vhsGroup.rotation.y < -rotationLimit) {
          rotationDirection = 1;
        }

        controls.update();
        renderer.render(scene, camera);
      };

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;

        camera.aspect =
          containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      };

      window.addEventListener("resize", handleResize);
      animate();

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);

        if (containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }

        renderer.dispose();
        scene.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      };
    };

    initScene();
  }, [movie]); 

  return (
    <div
      ref={containerRef}
      className="w-full h-96 bg-transparent rounded-lg overflow-hidden" // Changed bg to transparent
    ></div>
  );
};

export default MinimalVHSDemo;