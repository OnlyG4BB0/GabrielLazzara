import * as THREE from 'three';

/*
 * WebGL enhancements for the portfolio.
 *  1. Ambient background: floating low-poly crystals + particle dust (echoes the
 *     origami logo aesthetic), with pointer parallax and scroll drift.
 *  2. Interactive 3D logo mark in the navbar (rotates, reacts to hover/pointer).
 *
 * Everything degrades gracefully: if WebGL is missing, reduced motion is on, or
 * the device is too constrained, the existing SVG logo and CSS blobs stay.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function supportsWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

const PALETTES = {
    dark: {
        shards: [0xc084fc, 0x8b5cf6, 0xe879f9, 0x6366f1, 0xa855f7],
        particle: 0xc4b5fd,
        ambient: 0x2a1f4a,
        keyLight: 0xe879f9,
        rimLight: 0x6366f1,
        fog: 0x08060f,
        shardOpacity: 0.92,
        particleOpacity: 0.7,
    },
    light: {
        shards: [0x7c3aed, 0x6d28d9, 0x9333ea, 0x4f46e5, 0xa855f7],
        particle: 0x7c3aed,
        ambient: 0xb9a9e8,
        keyLight: 0xa855f7,
        rimLight: 0x6366f1,
        fog: 0xf2eefb,
        shardOpacity: 0.55,
        particleOpacity: 0.45,
    },
};

function currentThemeKey() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

const clock = new THREE.Clock();
const updatables = [];
let running = false;

function loop() {
    if (!running) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    for (const fn of updatables) fn(delta, elapsed);
    requestAnimationFrame(loop);
}

function start() {
    if (running || updatables.length === 0) return;
    running = true;
    clock.start();
    requestAnimationFrame(loop);
}

function stop() {
    running = false;
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
});

/* ------------------------------------------------------------------ */
/* Background scene                                                    */
/* ------------------------------------------------------------------ */
function initBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const keyLight = new THREE.PointLight(0xffffff, 60, 100);
    keyLight.position.set(8, 10, 12);
    const rimLight = new THREE.PointLight(0xffffff, 40, 100);
    rimLight.position.set(-10, -6, 6);
    scene.add(ambient, keyLight, rimLight);

    const world = new THREE.Group();
    scene.add(world);

    // Low-poly crystalline shards
    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1.2, 0),
        new THREE.DodecahedronGeometry(0.9, 0),
    ];
    const shards = [];
    const SHARD_COUNT = 11;
    for (let i = 0; i < SHARD_COUNT; i += 1) {
        const geo = geometries[i % geometries.length];
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.35,
            metalness: 0.15,
            flatShading: true,
            transparent: true,
            opacity: 1,
        });
        const mesh = new THREE.Mesh(geo, material);
        const radius = 5 + Math.random() * 7;
        const angle = Math.random() * Math.PI * 2;
        mesh.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 12,
            -2 - Math.random() * 14
        );
        const scale = 0.5 + Math.random() * 1.4;
        mesh.scale.setScalar(scale);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rotSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.15
            ),
            floatPhase: Math.random() * Math.PI * 2,
            floatAmp: 0.3 + Math.random() * 0.5,
            baseY: mesh.position.y,
        };
        world.add(mesh);
        shards.push(mesh);
    }

    // Particle dust
    const PARTICLE_COUNT = window.matchMedia('(max-width: 1024px)').matches ? 700 : 1300;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    world.add(particles);

    function applyTheme() {
        const p = PALETTES[currentThemeKey()];
        scene.fog = new THREE.FogExp2(p.fog, 0.022);
        ambient.color.setHex(p.ambient);
        keyLight.color.setHex(p.keyLight);
        rimLight.color.setHex(p.rimLight);
        shards.forEach((mesh, i) => {
            mesh.material.color.setHex(p.shards[i % p.shards.length]);
            mesh.material.emissive.setHex(p.shards[i % p.shards.length]);
            mesh.material.emissiveIntensity = currentThemeKey() === 'light' ? 0.05 : 0.18;
            mesh.material.opacity = p.shardOpacity;
        });
        particleMat.color.setHex(p.particle);
        particleMat.opacity = p.particleOpacity;
    }
    applyTheme();

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', (e) => {
        pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    updatables.push((delta, elapsed) => {
        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;

        camera.position.x += (pointer.x * 2.2 - camera.position.x) * 0.05;
        camera.position.y += (-pointer.y * 1.6 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        world.position.y = (scrollY / window.innerHeight) * 3.2;
        world.rotation.y = elapsed * 0.02;

        for (const mesh of shards) {
            const ud = mesh.userData;
            mesh.rotation.x += ud.rotSpeed.x * delta;
            mesh.rotation.y += ud.rotSpeed.y * delta;
            mesh.rotation.z += ud.rotSpeed.z * delta;
            mesh.position.y = ud.baseY + Math.sin(elapsed * 0.5 + ud.floatPhase) * ud.floatAmp;
        }

        particles.rotation.y = elapsed * 0.015;
        renderer.render(scene, camera);
    });

    requestAnimationFrame(() => canvas.classList.add('is-ready'));
    document.documentElement.classList.add('webgl-active');

    return { applyTheme };
}

/* ------------------------------------------------------------------ */
/* Interactive 3D logo                                                 */
/* ------------------------------------------------------------------ */
function initLogo() {
    const host = document.querySelector('[data-logo3d]');
    if (!host) return null;

    const canvas = document.createElement('canvas');
    canvas.className = 'brand-logo__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(0, 0, 4.2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const key = new THREE.PointLight(0xe879f9, 25, 30);
    key.position.set(3, 4, 5);
    const rim = new THREE.PointLight(0x6366f1, 18, 30);
    rim.position.set(-4, -2, 2);
    scene.add(ambient, key, rim);

    const group = new THREE.Group();
    scene.add(group);

    const gem = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.05, 0),
        new THREE.MeshStandardMaterial({
            color: 0xc084fc,
            emissive: 0x6d28d9,
            emissiveIntensity: 0.35,
            roughness: 0.25,
            metalness: 0.4,
            flatShading: true,
        })
    );
    const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(gem.geometry),
        new THREE.LineBasicMaterial({ color: 0xf0abfc, transparent: true, opacity: 0.5 })
    );
    group.add(gem, wire);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let spinBoost = 0;

    host.addEventListener('pointermove', (e) => {
        const rect = host.getBoundingClientRect();
        pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
    host.addEventListener('pointerenter', () => { spinBoost = 1; });
    host.addEventListener('pointerleave', () => {
        spinBoost = 0;
        pointer.tx = 0;
        pointer.ty = 0;
    });

    function applyTheme() {
        const light = currentThemeKey() === 'light';
        gem.material.color.setHex(light ? 0x7c3aed : 0xc084fc);
        gem.material.emissive.setHex(light ? 0x4c1d95 : 0x6d28d9);
        gem.material.emissiveIntensity = light ? 0.18 : 0.35;
        wire.material.color.setHex(light ? 0x9333ea : 0xf0abfc);
    }
    applyTheme();

    function resize() {
        const size = host.clientWidth || 44;
        renderer.setSize(size, size, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let boost = 0;
    updatables.push((delta, elapsed) => {
        pointer.x += (pointer.tx - pointer.x) * 0.1;
        pointer.y += (pointer.ty - pointer.y) * 0.1;
        boost += (spinBoost - boost) * 0.08;

        group.rotation.y += (0.4 + boost * 1.6) * delta;
        group.rotation.x = pointer.y * 0.5 + Math.sin(elapsed * 0.6) * 0.08;
        group.rotation.z = -pointer.x * 0.3;
        const s = 1 + boost * 0.08;
        group.scale.setScalar(s);

        renderer.render(scene, camera);
    });

    host.classList.add('logo3d-ready');
    return { applyTheme };
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
function boot() {
    if (prefersReducedMotion || !supportsWebGL()) return;

    const themed = [];
    try {
        const logo = initLogo();
        if (logo) themed.push(logo);
    } catch (e) {
        /* logo stays as SVG */
    }

    // Heavier background only on roomier viewports / non-touch-first devices.
    const roomy = window.matchMedia('(min-width: 768px)').matches;
    if (roomy) {
        try {
            const bg = initBackground();
            if (bg) themed.push(bg);
        } catch (e) {
            /* CSS blobs stay */
        }
    }

    if (themed.length === 0) return;

    const observer = new MutationObserver(() => {
        themed.forEach((t) => t.applyTheme && t.applyTheme());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    start();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
