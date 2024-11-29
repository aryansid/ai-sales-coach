"use client";

import React, { useMemo, useRef, useEffect } from "react";
import vertexShader from "./vertexShader";
import fragmentShader from "./fragmentShader";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { extend } from '@react-three/fiber';
import { IcosahedronGeometry } from 'three';

extend({ IcosahedronGeometry });

const Blob = ({ isActive, color }) => {
  const mesh = useRef();
  const hover = useRef(false);
  const rafId = useRef(null);
  const timeRef = useRef(0);
  
  const uniforms = useMemo(() => {
    return {
      u_time: { value: 0 },
      u_intensity: { value: 0.3 },
    };
  }, []);

  // Separate time-based animation
  useEffect(() => {
    let startTime = Date.now();
    
    const animate = () => {
      if (mesh.current) {
        const currentTime = Date.now();
        const elapsed = (currentTime - startTime) * 0.001; // Convert to seconds
        mesh.current.material.uniforms.u_time.value = 0.4 * elapsed;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Handle intensity changes in useFrame
  useFrame(() => {
    if (mesh.current) {
      mesh.current.material.uniforms.u_intensity.value = MathUtils.lerp(
        mesh.current.material.uniforms.u_intensity.value,
        isActive ? 0.65 : 0.15,
        0.02
      );
    }
  });

  return (
    <mesh
      ref={mesh}
      scale={1.5}
      position={[0, 0, 0]}
      onPointerOver={() => (hover.current = true)}
      onPointerOut={() => (hover.current = false)}
    >
      <icosahedronGeometry args={[2, 20]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default Blob;