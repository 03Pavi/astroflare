'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

const Planet = ({ radius, speed, size, color, offset = 0 }: {
  radius: number; speed: number; size: number; color: string; offset?: number
}) => {
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
            emissiveIntensity={0.6}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <pointLight color={color} intensity={3} distance={size * 8} />
      </Float>
    </group>
  );
};

const PlanetarySystem = () => {
  return (
    <group rotation={[Math.PI / 6, 0, 0]}>
      {/* Central glow */}
      <pointLight intensity={8} distance={20} color="#F59E0B" />
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={2} />
      </mesh>

      <Planet radius={4} speed={0.4} size={0.25} color="#06B6D4" offset={0} />
      <Planet radius={6.5} speed={0.25} size={0.4} color="#a490c2" offset={Math.PI / 2} />
      <Planet radius={9.5} speed={0.15} size={0.35} color="#6366f1" offset={Math.PI} />
      <Planet radius={13} speed={0.08} size={0.5} color="#ec4899" offset={Math.PI * 0.7} />

      {/* Orbit Rings */}
      {[4, 6.5, 9.5, 13].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.05, r + 0.05, 128]} />
          <meshBasicMaterial color="white" transparent opacity={0.04} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

const MainGalaxy = () => {
  const pointsRef = useRef<THREE.Points>(null!);

  const count = 50000;
  const radius = 20;
  const branches = 5;
  const spin = 1.2;
  const insideColor = '#F59E0B';
  const outsideColor = '#4338ca';

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new THREE.Color(insideColor);
    const colorOutside = new THREE.Color(outsideColor);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 0.5) * radius; // bias toward center
      const spinAngle = r * spin;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const scatter = Math.pow(Math.random(), 3);
      const scatterDir = Math.random() < 0.5 ? 1 : -1;
      const randomX = scatter * scatterDir * 0.5 * r;
      const randomY = scatter * scatterDir * 0.3;
      const randomZ = scatter * scatterDir * 0.5 * r;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
      positions[i3 + 1] = randomY * Math.exp(-r / 8);
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

      const mixedColor = colorInside.clone().lerp(colorOutside, r / radius);
      // Add some extra brightness near the core
      const brightness = r < 2 ? 1.5 : 1;
      colors[i3] = mixedColor.r * brightness;
      colors[i3 + 1] = mixedColor.g * brightness;
      colors[i3 + 2] = mixedColor.b * brightness;
    }
    return [positions, colors];
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.025;
    }
  });

  return (
    <points ref={pointsRef} position={[0, -3, -6]} rotation={[0.4, 0, 0.15]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={true}
        transparent={true}
        opacity={0.85}
      />
    </points>
  );
};

// A secondary, distant galaxy for depth
const DistantGalaxy = () => {
  const ref = useRef<THREE.Points>(null!);
  const count = 8000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      pos[i3] = Math.cos(angle) * r + (Math.random() - 0.5) * 2;
      pos[i3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={ref} position={[25, 8, -30]} rotation={[0.3, 0.5, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#8b5cf6"
        transparent
        opacity={0.5}
      />
    </points>
  );
};

export default function ThreeBackground() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 5, 12], fov: 65 }}>
        <color attach="background" args={['#050810']} />
        <ambientLight intensity={0.15} />
        <fog attach="fog" args={['#050810', 10, 35]} />

        {/* Dense star field – multiple layers for depth */}
        <Stars radius={80} depth={80} count={12000} factor={5} saturation={0.2} fade speed={0.5} />
        <Stars radius={150} depth={120} count={8000} factor={3} saturation={0} fade speed={0.3} />

        <MainGalaxy />
        <DistantGalaxy />
        <PlanetarySystem />
      </Canvas>
    </div>
  );
}
