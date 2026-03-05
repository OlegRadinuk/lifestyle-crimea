'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useApartment } from '@/components/ApartmentContext';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import { motion } from "framer-motion";
import Link from 'next/link';

export default function PanoramaViewer() {
  console.log('[PanoramaViewer] render');

  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHoverRef = useRef(false);
  const hideUITimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentApartmentIndex,
    setCurrentApartmentIndex,
    currentApartment,
    panoramas,
    loading: panoramasLoading,
  } = useApartment();

  console.log('[PanoramaViewer] panoramas:', panoramas);
  console.log('[PanoramaViewer] panoramasLoading:', panoramasLoading);
  console.log('[PanoramaViewer] currentApartmentIndex:', currentApartmentIndex);

  const { register, unregister } = useHeader();

  const [hintAllowed, setHintAllowed] = useState(true);
  const [isHover, setIsHover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [effectsActive, setEffectsActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const transitionTimer = useRef<NodeJS.Timeout | null>(null);
  const fadeAnimationRef = useRef<number | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentMeshRef = useRef<THREE.Mesh | null>(null);
  const nextMeshRef = useRef<THREE.Mesh | null>(null);
  const preloadedTextures = useRef<Record<number, THREE.Texture>>({});

  const { open } = usePhotoModal();

  const prevIndex = (currentApartmentIndex - 1 + panoramas.length) % panoramas.length;
  const nextIndex = (currentApartmentIndex + 1) % panoramas.length;

  const cleanTitle = (title: string) => title.replace(/^LS\s*/i, '');

  const changePanorama = (index: number) => {
    if (index === currentApartmentIndex) return;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (fadeAnimationRef.current) cancelAnimationFrame(fadeAnimationRef.current);
    transitionTimer.current = setTimeout(() => setTransitioning(true), 300);
    setCurrentApartmentIndex(index);
    setHasInteracted(true);
    setShowSwipeHint(false);
  };

  const showUITemporarily = () => {
    setUiVisible(true);
    if (hideUITimerRef.current) clearTimeout(hideUITimerRef.current);
    if (fullscreenMode) {
      hideUITimerRef.current = setTimeout(() => setUiVisible(false), 3000);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Header observer
  useEffect(() => {
    if (!sectionRef.current) return;
    const id = 'panorama';
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('[PanoramaViewer] IntersectionObserver entry.isIntersecting:', entry.isIntersecting);
        if (entry.isIntersecting) {
          register(id, { mode: 'apartment', priority: 2 });
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
    };
  }, [register, unregister]);

  useEffect(() => {
    if (fullscreenMode && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [fullscreenMode, isMobile]);

  const preloadTexture = (index: number) => {
    if (!panoramas[index] || preloadedTextures.current[index]) return;
    const loader = new THREE.TextureLoader();
    loader.load(panoramas[index].image, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      preloadedTextures.current[index] = texture;
      console.log('[PanoramaViewer] preloaded texture for index', index, panoramas[index].image);
    });
  };

  // Init Three
  useEffect(() => {
    if (!containerRef.current || panoramas.length === 0) {
      console.log('[PanoramaViewer] No container or panoramas, skipping Three init');
      return;
    }
    console.log('[PanoramaViewer] Initializing Three scene');
    const container = containerRef.current;

    if (rendererRef.current && rendererRef.current.domElement.parentNode === container) {
      container.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      1,
      1100
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();

    panoramas.forEach((_, index) => preloadTexture(index));

    const loadFirstTexture = () => {
      const cached = preloadedTextures.current[0];
      if (cached) {
        const material = new THREE.MeshBasicMaterial({ map: cached, transparent: true, opacity: 1 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        currentMeshRef.current = mesh;
        setLoading(false);
        setTransitioning(false);
        console.log('[PanoramaViewer] First texture loaded from cache');
      } else {
        loader.load(panoramas[0].image, texture => {
          texture.colorSpace = THREE.SRGBColorSpace;
          preloadedTextures.current[0] = texture;
          const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          currentMeshRef.current = mesh;
          setLoading(false);
          setTransitioning(false);
          console.log('[PanoramaViewer] First texture loaded from loader');
        }, undefined, (err) => {
          console.error('[PanoramaViewer] Failed to load first texture:', err);
          setLoading(false);
        });
      }
    };
    loadFirstTexture();

    let lon = 0, lat = 0, targetLon = 0, targetLat = 0;
    let isUserInteracting = false;
    let startX = 0, startY = 0, startLon = 0, startLat = 0;
    let touchStartX = 0, touchStartY = 0, touchStartLon = 0, touchStartLat = 0;
    let isDragging = false;
    const SWIPE_THRESHOLD = 50;
    const ROTATION_SPEED = 0.15;
    const TOUCH_ROTATION_SPEED = 0.12;
    const DAMPING_FACTOR_MOBILE = 0.12;
    const DAMPING_FACTOR_DESKTOP = 0.08;
    const AUTO_ROTATE_SPEED = 0.008;

    const onPointerDown = (e: PointerEvent) => {
      if (isMobile) return;
      isUserInteracting = true;
      setHintAllowed(false);
      startX = e.clientX;
      startY = e.clientY;
      startLon = targetLon;
      startLat = targetLat;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isUserInteracting || isMobile) return;
      targetLon = startLon - (e.clientX - startX) * ROTATION_SPEED;
      targetLat = startLat + (e.clientY - startY) * ROTATION_SPEED;
      targetLat = Math.max(-30, Math.min(30, targetLat));
    };
    const onPointerUp = () => { if (!isMobile) isUserInteracting = false; };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      if (fullscreenMode) {
        isUserInteracting = true;
        touchStartLon = targetLon;
        touchStartLat = targetLat;
        setHintAllowed(false);
        e.preventDefault();
      } else {
        isDragging = false;
      }
      showUITemporarily();
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (fullscreenMode) {
        e.preventDefault();
        if (isUserInteracting) {
          targetLon = touchStartLon - deltaX * TOUCH_ROTATION_SPEED;
          targetLat = touchStartLat + deltaY * TOUCH_ROTATION_SPEED * 0.5;
          targetLat = Math.max(-30, Math.min(30, targetLat));
        }
      } else {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) isDragging = true;
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (fullscreenMode) {
        isUserInteracting = false;
        return;
      }
      if (!isDragging) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - touchStartX;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) changePanorama(prevIndex);
        else changePanorama(nextIndex);
        setHasInteracted(true);
        setShowSwipeHint(false);
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    if (isMobile) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    const animate = () => {
      requestAnimationFrame(animate);
      if (!isUserInteracting && !isHoverRef.current && !fullscreenMode) {
        targetLon += AUTO_ROTATE_SPEED;
      }
      const dampingFactor = isMobile ? DAMPING_FACTOR_MOBILE : DAMPING_FACTOR_DESKTOP;
      lon += (targetLon - lon) * dampingFactor;
      lat += (targetLat - lat) * dampingFactor;
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );
      renderer.render(scene, camera);
    };
    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (isMobile) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
      if (rendererRef.current) {
        try {
          if (rendererRef.current.domElement.parentNode === container) {
            container.removeChild(rendererRef.current.domElement);
          }
        } catch (e) { console.warn(e); }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (sceneRef.current) {
        while(sceneRef.current.children.length > 0) sceneRef.current.remove(sceneRef.current.children[0]);
        sceneRef.current = null;
      }
    };
  }, [isMobile, fullscreenMode, panoramas]);

  // Texture switching
  useEffect(() => {
    if (!sceneRef.current || !currentMeshRef.current || panoramas.length === 0) return;
    console.log('[PanoramaViewer] Switching to index', currentApartmentIndex, 'image:', panoramas[currentApartmentIndex]?.image);
    const geometry = currentMeshRef.current.geometry;
    if (fadeAnimationRef.current) cancelAnimationFrame(fadeAnimationRef.current);

    const applyTexture = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0 });
      const nextMesh = new THREE.Mesh(geometry, material);
      sceneRef.current!.add(nextMesh);
      nextMeshRef.current = nextMesh;
      let opacity = 0;
      const fade = () => {
        opacity += 0.04;
        material.opacity = Math.min(opacity, 1);
        if (currentMeshRef.current) {
          const oldMaterial = currentMeshRef.current.material as THREE.MeshBasicMaterial;
          if (oldMaterial.map) oldMaterial.opacity = 1 - material.opacity;
        }
        if (opacity < 1) {
          fadeAnimationRef.current = requestAnimationFrame(fade);
        } else {
          if (currentMeshRef.current && sceneRef.current) {
            sceneRef.current.remove(currentMeshRef.current);
            const oldMat = currentMeshRef.current.material as THREE.MeshBasicMaterial;
            if (oldMat.map) oldMat.map.dispose();
            oldMat.dispose();
          }
          currentMeshRef.current = nextMesh;
          nextMeshRef.current = null;
          preloadTexture((currentApartmentIndex + 1) % panoramas.length);
          if (transitionTimer.current) {
            clearTimeout(transitionTimer.current);
            transitionTimer.current = null;
          }
          setTransitioning(false);
          fadeAnimationRef.current = null;
        }
      };
      fade();
    };

    const cached = preloadedTextures.current[currentApartmentIndex];
    if (cached) {
      console.log('[PanoramaViewer] Using cached texture');
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
      }
      setTransitioning(false);
      applyTexture(cached);
    } else {
      console.log('[PanoramaViewer] Loading texture from loader');
      const loader = new THREE.TextureLoader();
      loader.load(panoramas[currentApartmentIndex].image, applyTexture, undefined, (err) => {
        console.error('[PanoramaViewer] Failed to load texture:', err);
      });
    }

    return () => {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
        fadeAnimationRef.current = null;
      }
    };
  }, [currentApartmentIndex, panoramas]);

  if (panoramasLoading) {
    return <div className="panorama-section panorama-loading"><div className="panorama-loader"><span/><span/><span/><p>Загрузка панорам...</p></div></div>;
  }

  if (panoramas.length === 0) {
    return <div className="panorama-section panorama-loading"><div className="panorama-loader"><p>Нет доступных панорам</p></div></div>;
  }

  return (
    <section id="panorama" ref={sectionRef} className={`panorama-section ${fullscreenMode ? 'fullscreen-mode' : ''}`}>
      <div
        ref={containerRef}
        className="panorama-canvas"
        onMouseEnter={() => { isHoverRef.current = true; setIsHover(true); }}
        onMouseLeave={() => { isHoverRef.current = false; setIsHover(false); }}
        onClick={() => { if (isMobile && fullscreenMode) showUITemporarily(); }}
      />
      <div className="panorama-overlay" />
      {transitioning && (
        <div className="panorama-loading-overlay light">
          <div className="panorama-loading-content">
            <div className="panorama-loading-spinner" />
            <p className="panorama-loading-title">Загружаем панораму...</p>
          </div>
        </div>
      )}
      <div className={`panorama-info ${isMobile && fullscreenMode ? (uiVisible ? 'visible' : 'hidden') : ''}`}>
        <div className={`panorama-info-inner ${effectsActive ? 'animate-in' : ''}`} key={`${currentApartmentIndex}-${effectsActive}`}>
          <span className="panorama-info-eyebrow">Lifestyle · Luxury</span>
          <h2 className="panorama-info-title">{cleanTitle(panoramas[currentApartmentIndex].title)}</h2>
          <p className="panorama-info-description">Просторные премиальные апартаменты с панорамным видом на Чёрное море.</p>
          <ul className="panorama-info-meta">
            {panoramas[currentApartmentIndex]?.meta?.map((item: string, i: number) => <li key={i}>{item}</li>)}
          </ul>
          {!isMobile && currentApartment && (
            <div className="panorama-desktop-actions">
              <Link href={`/apartments/${currentApartment.id}`} className="panorama-desktop-btn primary">Перейти в апартамент</Link>
              <motion.button layoutId="photo-modal-desktop" className="panorama-desktop-btn secondary" onClick={() => {
                fetch(`/api/apartments/${currentApartment.id}`).then(res => res.json()).then(data => {
                  if (data.images?.length) open(data.images, 0); else alert('Фото временно недоступны');
                }).catch(() => alert('Ошибка загрузки фото'));
              }}>Смотреть фото</motion.button>
            </div>
          )}
        </div>
      </div>
      {loading && (
        <div className="panorama-loader"><span/><span/><span/></div>
      )}
      {isMobile && (
        <>
          {!fullscreenMode && showSwipeHint && !hasInteracted && (
            <div className="panorama-swipe-hint">Свайп для переключения</div>
          )}
          <div className={`panorama-fullscreen-wrapper ${fullscreenMode && !uiVisible ? 'hidden' : ''}`}>
            <button className={`fullscreen-btn ${fullscreenMode ? 'active' : ''}`} onClick={() => { setFullscreenMode(!fullscreenMode); setUiVisible(true); }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                {fullscreenMode ? (
                  <path d="M5 15L9 11M11 9L15 5M5 5L9 9M11 11L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                ) : (
                  <path d="M3 8L3 3L8 3M12 3L17 3L17 8M17 12L17 17L12 17M8 17L3 17L3 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                )}
              </svg>
            </button>
          </div>
          <div className={`panorama-actions-bottom ${fullscreenMode && !uiVisible ? 'hidden' : ''}`}>
            {currentApartment && (
              <Link href={`/apartments/${currentApartment.id}`} className="panorama-action-btn primary">Перейти в апартамент</Link>
            )}
            <motion.button layoutId="photo-modal" className="panorama-action-btn secondary" onClick={() => {
              fetch(`/api/apartments/${currentApartment?.id}`).then(res => res.json()).then(data => {
                if (data.images?.length) open(data.images, 0); else alert('Фото временно недоступны');
              }).catch(() => alert('Ошибка загрузки фото'));
            }}>Смотреть фото</motion.button>
          </div>
        </>
      )}
      {!isMobile && (
        <div className="panorama-ui">
          <button className="panorama-arrow left" onClick={() => changePanorama(prevIndex)}>
            <span className="arrow-icon">←</span>
            <span className="arrow-label">{cleanTitle(panoramas[prevIndex].title)}</span>
          </button>
          <div className="panorama-center">
            <div className="panorama-tiles">
              {panoramas.map((_, i) => (
                <span key={i} className={`tile ${i === currentApartmentIndex ? 'active' : ''}`} onClick={() => changePanorama(i)} />
              ))}
            </div>
            {hintAllowed && isHover && (
              <div className="panorama-hint">Нажмите и потяните, чтобы осмотреться</div>
            )}
          </div>
          <button className="panorama-arrow right" onClick={() => changePanorama(nextIndex)}>
            <span className="arrow-label">{cleanTitle(panoramas[nextIndex].title)}</span>
            <span className="arrow-icon">→</span>
          </button>
        </div>
      )}
    </section>
  );
}