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
  
  const autoRotateEnabled = useRef(true);
  const isFullscreenRef = useRef(false);

  const rotationState = useRef({
    targetLon: 0,
    targetLat: 0,
    lon: 0,
    lat: 0
  });

  const currentIndexRef = useRef(currentApartmentIndex);
  
  useEffect(() => {
    currentIndexRef.current = currentApartmentIndex;
  }, [currentApartmentIndex]);

  useEffect(() => {
    isFullscreenRef.current = fullscreenMode;
  }, [fullscreenMode]);

  const panoramas = PANORAMAS;
  const currentPano = panoramas[currentApartmentIndex];

  useEffect(() => {
    const section = sectionRef.current;
    if (section) {
      section.classList.remove('fullscreen-mode', 'mobile', 'desktop');
    }
    
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      const mobile = window.innerWidth <= 768;
      mainContainer.classList.remove('mobile', 'desktop');
      mainContainer.classList.add(mobile ? 'mobile' : 'desktop');
    }
    
    autoRotateEnabled.current = true;
  }, []);

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
    setFullscreenMode(prev => !prev);
    setUiVisible(true);
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

  const preloadTexture = (index: number) => {
    if (preloadedTextures.current[index] || loadingTextures.current[index]) return;
    loadingTextures.current[index] = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      panoramas[index].image,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        preloadedTextures.current[index] = texture;
        loadingTextures.current[index] = false;
      },
      undefined,
      error => {
        console.error(`Failed to load texture ${index}:`, error);
        loadingTextures.current[index] = false;
      }
    );
  };

  useEffect(() => {
    if (!containerRef.current) return;
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
    loader.load(
      panoramas[0].image,
      texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        preloadedTextures.current[0] = texture;
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        currentMeshRef.current = mesh;
        setLoading(false);
        setTransitioning(false);
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

    let isUserInteracting = false;
    let startX = 0, startY = 0, startLon = 0, startLat = 0;
    let touchStartX = 0, touchStartY = 0;
    let isDraggingForSwipe = false;
    
    const ROTATION_SPEED = 0.2;
    const AUTO_ROTATE_SPEED = 0.005;
    const TOUCH_ROTATION_SPEED = 0.15;
    const SMOOTHING_FACTOR = 0.1;

    const disableAutoRotate = () => {
      if (autoRotateEnabled.current) {
        autoRotateEnabled.current = false;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isMobile) return;
      isUserInteracting = true;
      disableAutoRotate();
      setHintAllowed(false);
      startX = e.clientX;
      startY = e.clientY;
      startLon = rotationState.current.targetLon;
      startLat = rotationState.current.targetLat;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isUserInteracting || isMobile) return;
      
      const newTargetLon = startLon - (e.clientX - startX) * ROTATION_SPEED;
      const newTargetLat = startLat + (e.clientY - startY) * ROTATION_SPEED;
      
      rotationState.current.targetLon = newTargetLon;
      rotationState.current.targetLat = Math.max(-30, Math.min(30, newTargetLat));
    };

    const onPointerUp = () => { if (!isMobile) isUserInteracting = false; };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      
      if (isFullscreenRef.current) {
        e.preventDefault();
        isUserInteracting = true;
        disableAutoRotate();
        setHintAllowed(false);
        startLon = rotationState.current.targetLon;
        startLat = rotationState.current.targetLat;
        isDraggingForSwipe = false;
      } else {
        isDraggingForSwipe = false;
      }
      
      showUITemporarily();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      
      if (isFullscreenRef.current) {
        e.preventDefault();
        if (isUserInteracting) {
          const newTargetLon = startLon - deltaX * TOUCH_ROTATION_SPEED;
          const newTargetLat = startLat + deltaY * TOUCH_ROTATION_SPEED * 0.5;
          
          rotationState.current.targetLon = newTargetLon;
          rotationState.current.targetLat = Math.max(-30, Math.min(30, newTargetLat));
        }
      } else {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isDraggingForSwipe = true;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isFullscreenRef.current) {
        isUserInteracting = false;
        return;
      }
      
      if (!isDraggingForSwipe) return;
      
      const touch = e.changedTouches[0];
      if (!touch) return;
      
      const deltaX = touch.clientX - touchStartX;
      const SWIPE_THRESHOLD = 50;
      const currentIdx = currentIndexRef.current;
      
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) {
          setCurrentApartmentIndex((currentIdx - 1 + panoramas.length) % panoramas.length);
        } else {
          setCurrentApartmentIndex((currentIdx + 1) % panoramas.length);
        }
        setHasInteracted(true);
        setShowSwipeHint(false);
      }
      
      isDraggingForSwipe = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    
    const sectionElement = sectionRef.current;
    if (sectionElement) {
      sectionElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      sectionElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      sectionElement.addEventListener('touchend', handleTouchEnd);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      
      if (!isFullscreenRef.current && autoRotateEnabled.current && !isUserInteracting) {
        rotationState.current.targetLon += AUTO_ROTATE_SPEED;
      }

      rotationState.current.lon += (rotationState.current.targetLon - rotationState.current.lon) * SMOOTHING_FACTOR;
      rotationState.current.lat += (rotationState.current.targetLat - rotationState.current.lat) * SMOOTHING_FACTOR;

      const phi = THREE.MathUtils.degToRad(90 - rotationState.current.lat);
      const theta = THREE.MathUtils.degToRad(rotationState.current.lon);

      if (cameraRef.current) {
        cameraRef.current.lookAt(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
        );
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      
      const sectionElementClean = sectionRef.current;
      if (sectionElementClean) {
        sectionElementClean.removeEventListener('touchstart', handleTouchStart);
        sectionElementClean.removeEventListener('touchmove', handleTouchMove);
        sectionElementClean.removeEventListener('touchend', handleTouchEnd);
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
  }, [isMobile]);

  useEffect(() => {
    if (!sceneRef.current || !currentMeshRef.current) return;

    const geometry = currentMeshRef.current.geometry;

    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
    }

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
          preloadedTextures.current[currentApartmentIndex] = texture;
          applyTexture(texture);
        },
        undefined,
        err => {
          console.error(`Error loading texture ${currentApartmentIndex}:`, err);
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
        <div className="panorama-info">
          <div className="panorama-info-inner">
            <span className="panorama-info-eyebrow">Lifestyle · Luxury</span>
            <h2 className="panorama-info-title">{cleanTitle(currentPano.title)}</h2>
            <p className="panorama-info-description">Просторные премиальные апартаменты с панорамным видом на Чёрное море.</p>
            <ul className="panorama-info-meta">{currentPano.meta.map((item, i) => (<li key={i}>{item}</li>))}</ul>

            {!checkingStatus && (
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
                          images.push(`/images/apartments/${folder}/${i}.webp`);
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
          <span className="swipe-text">swipe</span>
          <span className="swipe-icon">→</span>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Кнопка входа в полноэкранный режим */}
    {!fullscreenMode && (
      <button
        className="panorama-fullscreen-button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setFullscreenMode(true);
          setUiVisible(true);
          setHasInteracted(true);
          setShowSwipeHint(false);
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M4 8L4 4L8 4M16 4L20 4L20 8M20 16L20 20L16 20M8 20L4 20L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    )}

    {/* Кнопка выхода из полноэкранного режима - отдельный div поверх всего */}
    {fullscreenMode && (
      <div
        style={{
          position: 'fixed',
          bottom: '190px',
          right: '20px',
          zIndex: 999999,
          pointerEvents: 'auto',
        }}
      >
        <button
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#139ab6',
            backdropFilter: 'blur(10px)',
            border: '2px solid #139ab6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.2s ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('EXIT FULLSCREEN CLICKED');
            setFullscreenMode(false);
            setUiVisible(true);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('EXIT FULLSCREEN TOUCH END');
            setFullscreenMode(false);
            setUiVisible(true);
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
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
                  images.push(`/images/apartments/${folder}/${i}.webp`);
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