// components/AudioVisualizer.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const AudioVisualizer = ({ isActive = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add bloom effect
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,
      0.4,
      0.85
    );
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // Create multiple layers of spheres
    const createSphere = (radius: number, detail: number, color: number, speed: number) => {
      const geometry = new THREE.IcosahedronGeometry(radius, detail);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uActive: { value: false },
          uSpeed: { value: speed }
        },
        vertexShader: `
          uniform float uTime;
          uniform bool uActive;
          uniform float uSpeed;
          varying vec3 vNormal;
          
          void main() {
            vNormal = normal;
            float amplitude = uActive ? 0.3 : 0.1;
            
            vec3 pos = position;
            float displacement = sin(pos.x * 2.0 + uTime * uSpeed) * 
                               sin(pos.y * 2.0 + uTime * uSpeed) * 
                               sin(pos.z * 2.0 + uTime * uSpeed) * 
                               amplitude;
            
            vec3 newPosition = pos + normal * displacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform bool uActive;
          varying vec3 vNormal;
          
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            float alpha = uActive ? 0.6 : 0.3;
            gl_FragColor = vec4(uColor, intensity * alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });

      return new THREE.Mesh(geometry, material);
    };

    const sphere1 = createSphere(4, 24, 0x8B5CF6, 1.0); // Violet
    const sphere2 = createSphere(3.8, 20, 0x3B82F6, 1.2); // Blue
    const sphere3 = createSphere(3.6, 16, 0xF59E0B, 1.4); // Amber

    scene.add(sphere1);
    scene.add(sphere2);
    scene.add(sphere3);

    camera.position.z = 10;

    const animate = () => {
      requestAnimationFrame(animate);

      [sphere1, sphere2, sphere3].forEach((sphere) => {
        const material = sphere.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value += 0.01;
        material.uniforms.uActive.value = isActive;

        sphere.rotation.x += 0.001;
        sphere.rotation.y += 0.002;
      });

      composer.render();
    };

    animate();

    return () => {
      renderer.dispose();
      [sphere1, sphere2, sphere3].forEach((sphere) => {
        sphere.geometry.dispose();
        (sphere.material as THREE.Material).dispose();
      });
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [isActive]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default AudioVisualizer;