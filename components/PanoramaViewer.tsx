'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PANORAMAS } from '@/data/panoramas';
import { useApartment } from '@/components/ApartmentContext';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import { APARTMENTS } from '@/data/apartments';
import { motion } from "framer-motion"
import Link from 'next/link';

export default function PanoramaViewer() {
  /* ===============================
     REFS
  =============================== */

  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHoverRef = useRef(false);

  const {
    setCurrentApartmentIndex,
    setShowApartmentBooking,
  } = useApartment();

  const { register, unregister } = useHeader();

  /* ===============================
     STATE
  =============================== */

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintAllowed, setHintAllowed] = useState(true);
  const [isHover, setIsHover] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 ТОЛЬКО ДЛЯ ЭФФЕКТОВ (не влияет на Three.js)
  const [effectsActive, setEffectsActive] = useState(false);

  /* ===============================
     THREE REFS
  =============================== */

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentMeshRef = useRef<THREE.Mesh | null>(null);
  const nextMeshRef = useRef<THREE.Mesh | null>(null);

  const { open } = usePhotoModal();
  const currentApartment = APARTMENTS.find(
  ap => ap.id === PANORAMAS[currentIndex].id
);

  /* ===============================
     HEADER MODE + BOOKING BUTTON
     (ТОЛЬКО КОГДА СЕКЦИЯ В ВИДИМОСТИ)
  =============================== */

  useEffect(() => {
    if (!sectionRef.current) return;

    const id = 'panorama';

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowApartmentBooking(entry.isIntersecting);

        if (entry.isIntersecting) {
          register(id, {
            mode: 'apartment',
            priority: 2,
          });
        } else {
          unregister(id);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
      unregister(id);
      setShowApartmentBooking(false);
    };
  }, [register, unregister, setShowApartmentBooking]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      1,
      1100
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.load(PANORAMAS[0].image, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      currentMeshRef.current = mesh;
      setLoading(false);
    });

    let lon = 0;
    let lat = 0;
    let targetLon = 0;
    let targetLat = 0;
    let isUserInteracting = false;

    let startX = 0;
    let startY = 0;
    let startLon = 0;
    let startLat = 0;

    const onPointerDown = (e: PointerEvent) => {
      isUserInteracting = true;
      setHintAllowed(false);
      startX = e.clientX;
      startY = e.clientY;
      startLon = targetLon;
      startLat = targetLat;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isUserInteracting) return;
      targetLon = startLon - (e.clientX - startX) * 0.1;
      targetLat = startLat + (e.clientY - startY) * 0.1;
    };

    const onPointerUp = () => {
      isUserInteracting = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const animate = () => {
      requestAnimationFrame(animate);

      if (!isUserInteracting && !isHoverRef.current) {
        targetLon += 0.01;
      }

      lon += (targetLon - lon) * 0.08;
      lat += (targetLat - lat) * 0.08;
      lat = Math.max(-30, Math.min(30, lat));

      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !currentMeshRef.current) return;

    const loader = new THREE.TextureLoader();

    loader.load(PANORAMAS[currentIndex].image, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
      });

      const geometry = currentMeshRef.current!.geometry;
      const nextMesh = new THREE.Mesh(geometry, material);
      sceneRef.current!.add(nextMesh);
      nextMeshRef.current = nextMesh;

      let opacity = 0;

      const fade = () => {
        opacity += 0.04;
        material.opacity = Math.min(opacity, 1);

        const oldMaterial =
          currentMeshRef.current!.material as THREE.MeshBasicMaterial;
        oldMaterial.opacity = 1 - material.opacity;

        if (opacity < 1) {
          requestAnimationFrame(fade);
        } else {
          sceneRef.current!.remove(currentMeshRef.current!);
          (oldMaterial.map as THREE.Texture)?.dispose();
oldMaterial.dispose();
          currentMeshRef.current = nextMesh;
          nextMeshRef.current = null;
        }
      };

      fade();
    });
  }, [currentIndex]);

  /* ===============================
     HELPERS
  =============================== */

  const prevIndex =
    (currentIndex - 1 + PANORAMAS.length) % PANORAMAS.length;
  const nextIndex =
    (currentIndex + 1) % PANORAMAS.length;

  const cleanTitle = (title: string) =>
    title.replace(/^LS\s*/i, '');

  /* ===============================
     JSX
  =============================== */

  return (
    <section
    id="panorama"          // ← ДОБАВЛЕНО
    ref={sectionRef}
    className="panorama-section"
  >
      <div
        ref={containerRef}
        className="panorama-canvas"
        onMouseEnter={() => {
          isHoverRef.current = true;
          setIsHover(true);
        }}
        onMouseLeave={() => {
          isHoverRef.current = false;
          setIsHover(false);
        }}
      />

      <div className="panorama-overlay" />

      <div className="panorama-info">
        <div
          className={`panorama-info-inner ${
            effectsActive ? 'animate-in' : ''
          }`}
          key={`${currentIndex}-${effectsActive}`}
        >
          <span className="panorama-info-eyebrow">
            Lifestyle · Luxury
          </span>

          <h2 className="panorama-info-title">
            {cleanTitle(PANORAMAS[currentIndex].title)}
          </h2>

          <p className="panorama-info-description">
            Просторные премиальные апартаменты с панорамным видом
            на Чёрное море. Архитектура, свет и воздух объединены
            в цельное пространство для жизни.
          </p>

          <ul className="panorama-info-meta">
            {PANORAMAS[currentIndex]?.meta?.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="panorama-info-actions">
  {currentApartment && (
  <Link
    href={`/apartments/${currentApartment.id}`}
    className="panorama-btn primary"
  >
    Смотреть апартамент
  </Link>
)}

  <motion.button
  layoutId="photo-modal"
  className="panorama-btn secondary"
  onClick={() => {
    if (!currentApartment) return
    open(currentApartment.images, 0)
  }}
>
  Фото / Видео
</motion.button>
</div>
        </div>
      </div>

      {loading && (
        <div className="panorama-loader">
          <span />
          <span />
          <span />
        </div>
      )}

      <div className="panorama-ui">
        <button
          className="panorama-arrow left"
          onClick={() => {
            setCurrentIndex(prevIndex);
            setCurrentApartmentIndex(prevIndex);
          }}
        >
          <span className="arrow-icon">←</span>
          <span className="arrow-label">
            {cleanTitle(PANORAMAS[prevIndex].title)}
          </span>
        </button>

        <div className="panorama-center">
          <div className="panorama-tiles">
            {PANORAMAS.map((_, i) => (
              <span
                key={i}
                className={`tile ${i === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(i);
                  setCurrentApartmentIndex(i);
                }}
              />
            ))}
          </div>
        </div>

        {hintAllowed && isHover && (
          <div className="panorama-hint">
            Нажмите и потяните, чтобы осмотреться
          </div>
        )}

        <button
          className="panorama-arrow right"
          onClick={() => {
            setCurrentIndex(nextIndex);
            setCurrentApartmentIndex(nextIndex);
          }}
        >
          <span className="arrow-label">
            {cleanTitle(PANORAMAS[nextIndex].title)}
          </span>
          <span className="arrow-icon">→</span>
        </button>
      </div>
    </section>
  );
}
