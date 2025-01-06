 "use client";

import { Canvas } from '@react-three/fiber';
import Blob from './Blob';
import dynamic from 'next/dynamic';

const Scene = ({ isActive, color }: { isActive: boolean, color: number }) => {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 85 }}
        className="transform-gpu"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Blob isActive={isActive} color={color} />
      </Canvas>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Scene), { ssr: false });