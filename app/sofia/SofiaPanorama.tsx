'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const PANORAMA_IMAGE = '/panoramas/LS-Art-Sweet-Caramel.webp';

/**
 * Самостоятельная 360°-панорама для /sofia.
 *
 * Не переиспользует components/PanoramaViewer.tsx с главной — та завязана
 * на ApartmentContext/HeaderContext/PhotoModalContext и на полноэкранную
 * scene-сетку .main-container главной страницы, которых на этой обычной
 * лендинговой странице нет. Здесь один вид, без переключения апартаментов:
 * авто-вращение, пока не тронули, и перетаскивание мышью или пальцем через
 * единые Pointer Events (мышь и тач без раздельной обработки).
 */
export default function SofiaPanorama() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      1,
      1100
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    let mesh: THREE.Mesh | null = null;
    const loader = new THREE.TextureLoader();
    loader.load(
      PANORAMA_IMAGE,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('[SofiaPanorama] не удалось загрузить текстуру:', err);
        setLoading(false);
      }
    );

    const rotation = { targetLon: 0, targetLat: 0, lon: 0, lat: 0 };
    let autoRotate = true;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLon = 0;
    let startLat = 0;

    const ROTATION_SPEED = 0.2;
    const AUTO_ROTATE_SPEED = 0.004;
    const SMOOTHING = 0.1;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      autoRotate = false;
      setHintVisible(false);
      startX = e.clientX;
      startY = e.clientY;
      startLon = rotation.targetLon;
      startLat = rotation.targetLat;
      container.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      rotation.targetLon = startLon - (e.clientX - startX) * ROTATION_SPEED;
      rotation.targetLat = Math.max(
        -30,
        Math.min(30, startLat + (e.clientY - startY) * ROTATION_SPEED)
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        // капчер уже снят браузером — не критично
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (autoRotate && !dragging) {
        rotation.targetLon += AUTO_ROTATE_SPEED;
      }

      rotation.lon += (rotation.targetLon - rotation.lon) * SMOOTHING;
      rotation.lat += (rotation.targetLat - rotation.lat) * SMOOTHING;

      const phi = THREE.MathUtils.degToRad(90 - rotation.lat);
      const theta = THREE.MathUtils.degToRad(rotation.lon);

      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.dispose();
      }
    };
  }, []);

  return (
    <section id="panorama" className="lp-section sofia-panorama-section">
      <div className="lp-inner">
        <p className="lp-eyebrow lp-reveal">Виртуальный визит</p>
        <h2 className="lp-title lp-reveal">Осмотритесь ещё до заезда</h2>
        <div className="lp-prose lp-reveal">
          <p>
            Потяните картинку мышью или пальцем, чтобы оглядеться на 360° — почти как
            стоять на балконе самого апартамента.
          </p>
        </div>
      </div>

      <div className="sofia-panorama-stage lp-reveal">
        {/* Постер-фон под canvas: то же фото плоско, видно только пока WebGL
            не отрисовался или не сработал — вместо чёрного прямоугольника. */}
        <div
          className="sofia-panorama-poster"
          style={{ backgroundImage: `url(${PANORAMA_IMAGE})` }}
        />
        <div ref={containerRef} className="sofia-panorama-canvas" />

        {loading && (
          <div className="sofia-panorama-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}

        {!loading && hintVisible && (
          <div className="sofia-panorama-hint">Потяните, чтобы осмотреться</div>
        )}
      </div>
    </section>
  );
}
