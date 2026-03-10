'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PANORAMAS } from '@/data/panoramas';
import { useApartment } from '@/components/ApartmentContext';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';

export default function PanoramaViewer() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isHoverRef = useRef(false);
  const hideUITimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentApartmentIndex,
    setCurrentApartmentIndex,
  } = useApartment();

  const { register, unregister } = useHeader();

  const [hintAllowed, setHintAllowed] = useState(true);
  const [isHover, setIsHover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const transitionTimer = useRef<NodeJS.Timeout | null>(null);
  const fadeAnimationRef = useRef<number | null>(null);

  // Состояние для вращения
  const rotationState = useRef({
    targetLon: 0,
    targetLat: 0,
    lon: 0,
    lat: 0
  });

  // Ref для текущего индекса
  const currentIndexRef = useRef(currentApartmentIndex);
  
  useEffect(() => {
    currentIndexRef.current = currentApartmentIndex;
  }, [currentApartmentIndex]);

  const panoramas = PANORAMAS;
  const currentPano = panoramas[currentApartmentIndex];

  // Маппинг ID -> папка с фото
  const getPhotoFolder = (id: string): string => {
    const map: Record<string, string> = {
      'ls-lux-sweet-caramel': 'sweet-caramel',
      'ls-lux-flower-kiss': 'flower-kiss',
      'ls-lux-soft-blue': 'soft-blue',
      'ls-art-crystal-blue': 'crystal-blue',
      'ls-lux-sunny-mood': 'sunny-mood',
      'ls-lux-beautiful-days': 'beautiful-days',
      'ls-lux-sun-rays': 'sun-rays',
      'ls-lux-sunshine': 'sunshine',
      'ls-lux-fly-birds': 'fly-birds',
      'ls-lux-fly-mood': 'fly-mood',
      'ls-lux-fly-sky': 'fly-sky',
      'ls-lux-only-you': 'only-you',
      'ls-art-dream-vacation': 'dream-vacation',
    };
    return map[id] || id;
  };

  // Количество фото
  const getPhotoCount = (id: string): number => {
    const map: Record<string, number> = {
      'ls-lux-sweet-caramel': 1,
      'ls-lux-flower-kiss': 1,
      'ls-lux-soft-blue': 3,
      'ls-art-crystal-blue': 2,
      'ls-lux-sunny-mood': 3,
      'ls-lux-beautiful-days': 3,
      'ls-lux-sun-rays': 3,
      'ls-lux-sunshine': 2,
      'ls-lux-fly-birds': 3,
      'ls-lux-fly-mood': 3,
      'ls-lux-fly-sky': 3,
      'ls-lux-only-you': 1,
      'ls-art-dream-vacation': 3,
    };
    return map[id] || 3;
  };

  // --- Загрузка статуса ---
  useEffect(() => {
    if (!currentPano?.id) return;
    const checkStatus = async () => {
      setCheckingStatus(true);
      try {
        const res = await fetch(`/api/apartments/${currentPano.id}`);
        if (res.ok) {
          const data = await res.json();
          setIsActive(data.is_active === true);
        } else {
          setIsActive(false);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setIsActive(false);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [currentPano?.id]);

  const cleanTitle = (title: string) => title.replace(/^LS\s*/i, '').trim();

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

  const toggleFullscreen = () => {
    const newMode = !fullscreenMode;
    setFullscreenMode(newMode);
    setUiVisible(true);
    if (newMode) {
      showUITemporarily();
    } else {
      if (hideUITimerRef.current) clearTimeout(hideUITimerRef.current);
      setUiVisible(true);
    }
    setHasInteracted(true);
    setShowSwipeHint(false);
  };

  const handleCanvasClick = () => {
    if (isMobile && fullscreenMode) showUITemporarily();
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const id = 'panorama';
    const observer = new IntersectionObserver(
      ([entry]) => {
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

  // --- THREE.js ---
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentMeshRef = useRef<THREE.Mesh | null>(null);
  const nextMeshRef = useRef<THREE.Mesh | null>(null);
  const preloadedTextures = useRef<Record<number, THREE.Texture>>({});
  const loadingTextures = useRef<Record<number, boolean>>({});

  const { open } = usePhotoModal();

  // Предзагрузка с защитой
  const preloadTexture = (index: number) => {
    if (preloadedTextures.current[index] || loadingTextures.current[index]) return;
    loadingTextures.current[index] = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      panoramas[index].image,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        preloadedTextures.current[index] = texture;
        loadingTextures.current[index] = false;
        console.log(`✅ Preloaded texture ${index}`);
      },
      undefined,
      error => {
        console.error(`❌ Failed to load texture ${index}:`, error);
        loadingTextures.current[index] = false;
      }
    );
  };

  // Инициализация сцены
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Очищаем контейнер
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Создаем сцену
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Создаем камеру (помещаем в центр сферы)
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Создаем рендерер
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      powerPreference: "high-performance",
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000); // Черный фон пока грузится
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Создаем геометрию сферы (большой радиус, инвертированная)
    const geometry = new THREE.SphereGeometry(500, 64, 64);
    // Инвертируем геометрию, чтобы камера была внутри
    geometry.scale(-1, 1, 1);

    // Загружаем первую текстуру
    const loader = new THREE.TextureLoader();
    loader.load(
      panoramas[0].image,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        preloadedTextures.current[0] = texture;
        
        const material = new THREE.MeshBasicMaterial({ 
          map: texture, 
          side: THREE.BackSide, // Важно! Рисуем внутреннюю сторону сферы
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        currentMeshRef.current = mesh;
        
        setLoading(false);
        setTransitioning(false);
        
        // Предзагружаем все остальные
        for (let i = 1; i < panoramas.length; i++) {
          preloadTexture(i);
        }
      },
      undefined,
      err => {
        console.error('Error loading first texture:', err);
        setLoading(false);
      }
    );

    // --- Логика вращения ---
    let isUserInteracting = false;
    let isTouching = false;
    
    // Для инерции
    let velocityLon = 0;
    let velocityLat = 0;
    let lastLon = 0;
    let lastLat = 0;
    let lastTime = 0;
    
    // Для позиционирования
    let startX = 0, startY = 0;
    let startLon = 0, startLat = 0;
    
    // Параметры
    const SENSITIVITY = 0.005;
    const VERTICAL_LIMIT = 0.5;
    const INERTIA_DAMPING = 0.95;
    const AUTO_ROTATE_SPEED = 0.002;
    const SMOOTHING_FACTOR = 0.1;

    // Обработчики событий
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      isUserInteracting = true;
      isTouching = true;
      setHintAllowed(false);
      
      startX = e.clientX;
      startY = e.clientY;
      startLon = rotationState.current.targetLon;
      startLat = rotationState.current.targetLat;
      
      velocityLon = 0;
      velocityLat = 0;
      lastLon = startLon;
      lastLat = startLat;
      lastTime = performance.now();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isUserInteracting) return;
      
      const currentTime = performance.now();
      const deltaTime = Math.min(32, currentTime - lastTime);
      
      const deltaX = (e.clientX - startX) * SENSITIVITY;
      const deltaY = (e.clientY - startY) * SENSITIVITY * 0.5;
      
      const newLon = startLon - deltaX;
      let newLat = startLat + deltaY;
      newLat = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, newLat));
      
      rotationState.current.targetLon = newLon;
      rotationState.current.targetLat = newLat;
      
      if (deltaTime > 0) {
        velocityLon = ((newLon - lastLon) / deltaTime) * 0.5;
        velocityLat = ((newLat - lastLat) / deltaTime) * 0.5;
      }
      
      lastLon = newLon;
      lastLat = newLat;
      lastTime = currentTime;
    };

    const onPointerUp = () => {
      isUserInteracting = false;
      setTimeout(() => {
        if (!isUserInteracting) {
          isTouching = false;
        }
      }, 100);
    };

    // Touch события
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      
      isUserInteracting = true;
      isTouching = true;
      setHintAllowed(false);
      
      startX = touch.clientX;
      startY = touch.clientY;
      startLon = rotationState.current.targetLon;
      startLat = rotationState.current.targetLat;
      
      velocityLon = 0;
      velocityLat = 0;
      lastLon = startLon;
      lastLat = startLat;
      lastTime = performance.now();
      
      showUITemporarily();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isUserInteracting) return;
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const currentTime = performance.now();
      const deltaTime = Math.min(32, currentTime - lastTime);
      
      const deltaX = (touch.clientX - startX) * SENSITIVITY;
      const deltaY = (touch.clientY - startY) * SENSITIVITY * 0.5;
      
      const newLon = startLon - deltaX;
      let newLat = startLat + deltaY;
      newLat = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, newLat));
      
      rotationState.current.targetLon = newLon;
      rotationState.current.targetLat = newLat;
      
      if (deltaTime > 0) {
        velocityLon = ((newLon - lastLon) / deltaTime) * 0.5;
        velocityLat = ((newLat - lastLat) / deltaTime) * 0.5;
      }
      
      lastLon = newLon;
      lastLat = newLat;
      lastTime = currentTime;
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isUserInteracting = false;
      
      // Проверяем свайп для переключения панорамы
      if (!fullscreenMode) {
        const touch = e.changedTouches[0];
        if (!touch) return;
        
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const SWIPE_THRESHOLD = 50;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
          const currentIdx = currentIndexRef.current;
          if (deltaX > 0) {
            setCurrentApartmentIndex((currentIdx - 1 + panoramas.length) % panoramas.length);
          } else {
            setCurrentApartmentIndex((currentIdx + 1) % panoramas.length);
          }
          setHasInteracted(true);
          setShowSwipeHint(false);
        }
      }
      
      setTimeout(() => {
        if (!isUserInteracting) {
          isTouching = false;
        }
      }, 100);
    };

    // Добавляем обработчики
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Анимационный цикл
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Автовращение
      if (!isUserInteracting && !isTouching && !isHoverRef.current) {
        rotationState.current.targetLon += AUTO_ROTATE_SPEED;
      }
      
      // Инерция
      if (!isUserInteracting && isTouching) {
        rotationState.current.targetLon += velocityLon;
        rotationState.current.targetLat += velocityLat;
        
        velocityLon *= INERTIA_DAMPING;
        velocityLat *= INERTIA_DAMPING;
        
        rotationState.current.targetLat = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, rotationState.current.targetLat));
        
        if (Math.abs(velocityLon) < 0.0001 && Math.abs(velocityLat) < 0.0001) {
          isTouching = false;
        }
      }
      
      // Плавное движение
      rotationState.current.lon += (rotationState.current.targetLon - rotationState.current.lon) * SMOOTHING_FACTOR;
      rotationState.current.lat += (rotationState.current.targetLat - rotationState.current.lat) * SMOOTHING_FACTOR;
      
      // Поворачиваем камеру (так как камера в центре, мы вращаем сцену или камеру)
      // Проще всего вращать камеру вокруг своей оси
      camera.rotation.x = rotationState.current.lat;
      camera.rotation.y = rotationState.current.lon;
      camera.rotation.z = 0;
      
      renderer.render(scene, camera);
    };
    
    const animationId = requestAnimationFrame(animate);

    // Обработка ресайза
    const handleResize = () => {
      if (!camera || !renderer || !container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode === container) {
          container.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
    };
  }, [isMobile, fullscreenMode]);

  // --- Переключение панорам ---
  useEffect(() => {
    if (!sceneRef.current || !currentMeshRef.current) return;

    const geometry = currentMeshRef.current.geometry;

    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
    }

    const applyTexture = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.BackSide,
        transparent: true, 
        opacity: 0
      });
      
      const nextMesh = new THREE.Mesh(geometry, material);
      sceneRef.current!.add(nextMesh);
      nextMeshRef.current = nextMesh;

      let opacity = 0;

      const fade = () => {
        opacity += 0.03;
        material.opacity = Math.min(opacity, 1);

        if (currentMeshRef.current) {
          const oldMaterial = currentMeshRef.current.material as THREE.MeshBasicMaterial;
          oldMaterial.opacity = 1 - material.opacity;
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
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
      }
      setTransitioning(false);
      applyTexture(cached);
    } else {
      const loader = new THREE.TextureLoader();
      loader.load(
        panoramas[currentApartmentIndex].image,
        texture => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          preloadedTextures.current[currentApartmentIndex] = texture;
          applyTexture(texture);
        },
        undefined,
        err => {
          console.error(`❌ Error loading texture ${currentApartmentIndex}:`, err);
        }
      );
    }

    return () => {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
        fadeAnimationRef.current = null;
      }
    };
  }, [currentApartmentIndex]);

  // --- Рендер ---
  return (
    <section
      id="panorama"
      ref={sectionRef}
      className={`panorama-section ${fullscreenMode ? 'fullscreen-mode' : ''}`}
    >
      <div
        ref={containerRef}
        className="panorama-canvas"
        onMouseEnter={() => { isHoverRef.current = true; setIsHover(true); }}
        onMouseLeave={() => { isHoverRef.current = false; setIsHover(false); }}
        onClick={handleCanvasClick}
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

      {/* Информационный блок */}
      {!fullscreenMode && (
        <div className={`panorama-info ${isMobile && fullscreenMode ? (uiVisible ? 'visible' : 'hidden') : ''}`}>
          <div className="panorama-info-inner">
            <span className="panorama-info-eyebrow">Lifestyle · Luxury</span>
            <h2 className="panorama-info-title">{cleanTitle(currentPano.title)}</h2>
            <p className="panorama-info-description">Просторные премиальные апартаменты с панорамным видом на Чёрное море.</p>
            <ul className="panorama-info-meta">{currentPano.meta.map((item, i) => (<li key={i}>{item}</li>))}</ul>

            {!isMobile && !checkingStatus && (
              <div className="panorama-desktop-actions">
                {isActive ? (
                  <>
                    <Link href={`/apartments/${currentPano.id}`} className="panorama-desktop-btn primary">Перейти в апартамент</Link>
                    
                    <button
                      className="panorama-desktop-btn secondary"
                      onClick={() => {
                        const folder = getPhotoFolder(currentPano.id);
                        const count = getPhotoCount(currentPano.id);
                        
                        const images = [];
                        for (let i = 1; i <= count; i++) {
                          const path = `/images/apartments/${folder}/${i}.webp`;
                          images.push(path);
                        }
                        
                        open(images, 0);
                      }}
                    >
                      Смотреть фото
                    </button>
                  </>
                ) : (
                  <div className="panorama-unavailable-message"><span className="unavailable-text">Апартамент временно недоступен для бронирования</span></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="panorama-loader">
          <span /><span /><span />
        </div>
      )}

      {isMobile && (
        <>
          <AnimatePresence>
            {!fullscreenMode && showSwipeHint && !hasInteracted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="panorama-swipe-hint"
              >
                <span className="swipe-icon">←</span>
                <span className="swipe-text">Листайте</span>
                <span className="swipe-icon">→</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!fullscreenMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="panorama-fullscreen-button"
              onClick={toggleFullscreen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 8L4 4L8 4M16 4L20 4L20 8M20 16L20 20L16 20M8 20L4 20L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          )}

          {fullscreenMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: uiVisible ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="panorama-fullscreen-button exit"
              onClick={toggleFullscreen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          )}

          {!fullscreenMode && (
            <div className="panorama-actions-bottom">
              {isActive ? (
                <>
                  <Link href={`/apartments/${currentPano.id}`} className="panorama-action-btn primary">Перейти в апартамент</Link>
                  <button
                    className="panorama-action-btn secondary"
                    onClick={() => {
                      const folder = getPhotoFolder(currentPano.id);
                      const count = getPhotoCount(currentPano.id);
                      
                      const images = [];
                      for (let i = 1; i <= count; i++) {
                        const path = `/images/apartments/${folder}/${i}.webp`;
                        images.push(path);
                      }
                      
                      open(images, 0);
                    }}
                  >
                    Смотреть фото
                  </button>
                </>
              ) : (
                <div className="panorama-unavailable-message mobile"><span>Временно недоступно</span></div>
              )}
            </div>
          )}
        </>
      )}

      {!isMobile && !fullscreenMode && (
        <div className="panorama-ui">
          <button 
            className="panorama-arrow left" 
            onClick={() => {
              const prev = (currentApartmentIndex - 1 + panoramas.length) % panoramas.length;
              changePanorama(prev);
            }}
          >
            <span className="arrow-icon">←</span>
            <span className="arrow-label">{cleanTitle(panoramas[(currentApartmentIndex - 1 + panoramas.length) % panoramas.length].title)}</span>
          </button>

          <div className="panorama-center">
            <div className="panorama-tiles">
              {panoramas.map((_, i) => (
                <span
                  key={i}
                  className={`tile ${i === currentApartmentIndex ? 'active' : ''}`}
                  onClick={() => changePanorama(i)}
                />
              ))}
            </div>
            {hintAllowed && isHover && (
              <div className="panorama-hint">Нажмите и потяните, чтобы осмотреться</div>
            )}
          </div>

          <button 
            className="panorama-arrow right" 
            onClick={() => {
              const next = (currentApartmentIndex + 1) % panoramas.length;
              changePanorama(next);
            }}
          >
            <span className="arrow-label">{cleanTitle(panoramas[(currentApartmentIndex + 1) % panoramas.length].title)}</span>
            <span className="arrow-icon">→</span>
          </button>
        </div>
      )}
    </section>
  );
}