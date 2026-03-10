'use client';

import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Brightness2Icon from '@mui/icons-material/Brightness2';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { analysisContent } from '@/constants/analysis';
import styles from './analysis.module.scss';

const MiniPlanet = ({ radius, speed, size, color, offset = 0 }: { radius: number; speed: number; size: number; color: string; offset?: number }) => {
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
            emissiveIntensity={1.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        <pointLight color={color} intensity={4} distance={size * 15} />
      </Float>
    </group>
  );
};

const MiniGalaxy = () => {
  const pointsRef = useRef<THREE.Points>(null!);

  const count = 10000;
  const radius = 8;
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
      const r = Math.random() * radius;
      const spinAngle = r * spin;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;

      const mixedRandomness = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * r;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + mixedRandomness;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.4 * Math.exp(-r / 2);
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
      pointsRef.current.rotation.y -= delta * 0.1;
    }
  });

  return (
    <group rotation={[Math.PI / 6, 0, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors={true}
          transparent={true}
          opacity={0.8}
        />
      </points>

      {/* Sun/Core Light */}
      <pointLight intensity={3} distance={10} color="#F59E0B" />

      {/* Orbit Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.98, 4.02, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.98, 6.02, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.98, 8.02, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      <MiniPlanet radius={4} speed={0.8} size={0.25} color="#06B6D4" offset={0} />
      <MiniPlanet radius={6} speed={0.5} size={0.35} color="#a490c2" offset={Math.PI / 2} />
      <MiniPlanet radius={8} speed={0.3} size={0.3} color="#6366f1" offset={Math.PI} />
    </group>
  );
};

export default function Analysis() {
  return (
    <section className={styles.analysisSection}>
      <Container maxWidth="lg">
        <div className={styles.mainCard}>
          <div className={styles.content}>
            <motion.div
              className={styles.badge}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 16 }} />
              {analysisContent.badge}
            </motion.div>

            <h2 className={styles.title}>
              {analysisContent.titlePart1}<br />
              {analysisContent.titlePart2}
            </h2>

            <div className={styles.features}>
              <motion.div
                className={styles.featureItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className={styles.icon}><AutoAwesomeIcon /></div>
                <div>
                  <h4>{analysisContent.bullets[0].title}</h4>
                  <p>{analysisContent.bullets[0].description}</p>
                </div>
              </motion.div>

              <motion.div
                className={styles.featureItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className={styles.icon}><Brightness2Icon /></div>
                <div>
                  <h4>{analysisContent.bullets[1].title}</h4>
                  <p>{analysisContent.bullets[1].description}</p>
                </div>
              </motion.div>

              <motion.div
                className={styles.featureItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className={styles.icon}><CalendarMonthIcon /></div>
                <div>
                  <h4>{analysisContent.bullets[2].title}</h4>
                  <p>{analysisContent.bullets[2].description}</p>
                </div>
              </motion.div>
            </div>
          </div>

          <div className={styles.visual}>
            <div style={{ width: '100%', height: '100%', pointerEvents: 'none', minHeight: '400px' }}>
              <Canvas camera={{ position: [0, 8, 22], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <MiniGalaxy />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
              </Canvas>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
