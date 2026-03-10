'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

const Planet = ({ radius, speed, size, color, offset = 0 }: { radius: number; speed: number; size: number; color: string; offset?: number }) => {
  const ref = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.x = Math.sin(t) * radius;
    ref.current.position.z = Math.cos(t) * radius;
  });

  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh>
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        <pointLight color={color} intensity={2} distance={size * 5} />
      </Float>
    </group>
  );
};

const PlanetarySystem = () => {
  return (
    <group rotation={[Math.PI / 6, 0, 0]}>
      {/* Sun/Core Light */}
      <pointLight intensity={5} distance={20} color="#F59E0B" />

      <Planet radius={4} speed={0.4} size={0.3} color="#06B6D4" offset={0} />
      <Planet radius={7} speed={0.2} size={0.5} color="#a490c2" offset={Math.PI / 2} />
      <Planet radius={10} speed={0.15} size={0.4} color="#6366f1" offset={Math.PI} />

      {/* Orbit Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.95, 4.05, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.95, 7.05, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.95, 10.05, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const EnhancedGalaxy = () => {
  const pointsRef = useRef<THREE.Points>(null!);

  const count = 30000;
  const radius = 15;
  const branches = 6;
  const spin = 0.8;
  const insideColor = '#F59E0B'; // Gold Core
  const outsideColor = '#4338ca'; // Deep Indigo Arms

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new THREE.Color(insideColor);
    const colorOutside = new THREE.Color(outsideColor);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * radius;
      const spinAngle = r * spin;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;

      // Concentrated core: more stars near the center
      const mixedRandomness = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3 * r;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + mixedRandomness;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.8 * Math.exp(-r / 5); // Tapered vertical spread
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + mixedRandomness;

      const mixedColor = colorInside.clone().lerp(colorOutside, r / radius);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }
    return [positions, colors];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.03;
    }
  });

  return (
    <points ref={pointsRef} position={[0, -2, -5]} rotation={[0.5, 0, 0.2]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={true}
        transparent={true}
        opacity={0.6}
      />
    </points>
  );
};

export default function ThreeBackground() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 6, 12], fov: 60 }}>
        <color attach="background" args={['#070a14']} />
        <ambientLight intensity={0.2} />
        <fog attach="fog" args={['#070a14', 5, 25]} />

        <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1.5} />
        <EnhancedGalaxy />
        <PlanetarySystem />
      </Canvas>
    </div>
  );
}
