import * as THREE from 'three';

/*
 * Site-wide WebGL ambience + hero origami fox (Three.js).
 *
 *  - Background: aurora shader + higher-quality low-poly crystals (lit, flat
 *    shaded). Keeps animating during scroll (lighter fps while scrolling).
 *  - Hero fox: a 3D origami fox built from the logo's triangle layout, rotates
 *    on its own and reacts to the global pointer. Own small renderer, paused
 *    when the hero leaves the viewport.
 *
 * Degrades gracefully: no WebGL / reduced motion -> CSS blobs + SVG logo stay.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function supportsWebGL() {
    try {
        const c = document.createElement('canvas');
        return Boolean(
            window.WebGLRenderingContext &&
            (c.getContext('webgl') || c.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

function getViewport() {
    const vv = window.visualViewport;
    return {
        w: Math.round(vv?.width ?? window.innerWidth),
        h: Math.round(vv?.height ?? window.innerHeight),
    };
}

function isNarrowViewport() {
    return getViewport().w <= 768;
}

function isCoarsePointer() {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

function getPerfTier() {
    const { w } = getViewport();
    const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4;
    const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    if (w <= 768) return 'minimal';
    if (lowMemory || lowCpu || isCoarsePointer()) return 'balanced';
    if (document.documentElement.classList.contains('motion-lite')) return 'balanced';
    return 'full';
}

const TIER_CFG = {
    minimal: { renderScale: 0.62, maxDpr: 1.2, targetFps: 30, scrollFps: 24, crystals: 5, detail: 1, octaves: 2 },
    balanced: { renderScale: 0.72, maxDpr: 1.35, targetFps: 40, scrollFps: 28, crystals: 7, detail: 1, octaves: 2 },
    full: { renderScale: 0.85, maxDpr: 1.6, targetFps: 55, scrollFps: 32, crystals: 9, detail: 1, octaves: 3 },
};

/* ---- palettes -------------------------------------------------------- */
const PALETTES = {
    dark: {
        aurA: new THREE.Color('#070512'),
        aurB: new THREE.Color('#241753'),
        aurC: new THREE.Color('#7c3aed'),
        crystals: ['#c084fc', '#8b5cf6', '#e879f9', '#6366f1'],
        crystalOpacity: 0.9,
        crystalEmissive: 0.18,
    },
    light: {
        aurA: new THREE.Color('#f4f0fb'),
        aurB: new THREE.Color('#dcd0f4'),
        aurC: new THREE.Color('#b69bf0'),
        crystals: ['#7c3aed', '#6d28d9', '#9333ea', '#4f46e5'],
        crystalOpacity: 0.55,
        crystalEmissive: 0.05,
    },
};

function themeKey() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/* ---- shared loop ----------------------------------------------------- */
const clock = new THREE.Clock();
const tickFns = [];
let running = false;
let rafId = 0;
let lastFrameTs = 0;
let baseFps = 40;
let scrollFps = 28;

function isScrolling() {
    const root = document.documentElement;
    return root.classList.contains('is-scrolling') || root.classList.contains('is-smooth-scrolling');
}

function frame(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    const minMs = 1000 / (isScrolling() ? scrollFps : baseFps);
    if (ts - lastFrameTs < minMs) return;
    lastFrameTs = ts;
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    for (let i = 0; i < tickFns.length; i += 1) tickFns[i](delta, elapsed);
}
function start() {
    if (running || tickFns.length === 0) return;
    running = true;
    clock.start();
    lastFrameTs = 0;
    rafId = requestAnimationFrame(frame);
}
function stop() {
    running = false;
    cancelAnimationFrame(rafId);
}
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
});

/* ---- shared pointer / scroll ----------------------------------------- */
const input = { px: 0, py: 0, tx: 0, ty: 0, scroll: 0 };
let lastPointerTs = 0;

if (!isCoarsePointer()) {
    window.addEventListener('pointermove', (e) => {
        const now = performance.now();
        if (now - lastPointerTs < 24) return;
        lastPointerTs = now;
        const { w, h } = getViewport();
        input.tx = (e.clientX / w - 0.5) * 2;
        input.ty = (e.clientY / h - 0.5) * 2;
    }, { passive: true });
}

let scrollRaf = 0;
window.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        input.scroll = max > 0 ? window.scrollY / max : 0;
    });
}, { passive: true });

/* ---- aurora shader --------------------------------------------------- */
const AURORA_VERT = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

function buildAuroraFrag(octaves) {
    return /* glsl */`
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2  uMouse;
    uniform float uScroll;
    uniform vec2  uAspect;
    uniform vec3  uColA;
    uniform vec3  uColB;
    uniform vec3  uColC;

    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0);
        const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy));
        vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz);
        vec3 l=1.0-g;
        vec3 i1=min(g.xyz,l.zxy);
        vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;
        vec3 x2=x0-i2+C.yyy;
        vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(
            i.z+vec4(0.0,i1.z,i2.z,1.0))
            +i.y+vec4(0.0,i1.y,i2.y,1.0))
            +i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=0.142857142857;
        vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.0*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z);
        vec4 y_=floor(j-7.0*x_);
        vec4 x=x_*ns.x+ns.yyyy;
        vec4 y=y_*ns.x+ns.yyyy;
        vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);
        vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0;
        vec4 s1=floor(b1)*2.0+1.0;
        vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
        vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);
        vec3 p1=vec3(a0.zw,h.y);
        vec3 p2=vec3(a1.xy,h.z);
        vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
        m=m*m;
        return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }
    float fbm(vec3 p){
        float v=0.0,a=0.5;
        for(int i=0;i<${octaves};i++){v+=a*snoise(p);p*=2.02;a*=0.5;}
        return v;
    }
    float stars(vec2 uv){
        vec2 id=floor(uv*vec2(100.0,75.0));
        float n=fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453);
        vec2 gv=fract(uv*vec2(100.0,75.0))-0.5;
        return smoothstep(0.45,0.0,length(gv))*step(0.985,n);
    }
    void main(){
        vec2 uv=vUv;
        vec2 p=(uv-0.5);
        p.x*=uAspect.x/max(uAspect.y,0.001);
        float t=uTime*0.04;
        vec3 q=vec3(p*1.3,t+uScroll*0.45);
        float n=fbm(q+vec3(uMouse*0.3,0.0));
        n=n*0.5+0.5;
        float band=smoothstep(0.2,0.82,n);
        vec3 col=mix(uColA,uColB,band);
        col=mix(col,uColC,pow(n,2.6)*0.55);
        col+=uColC*stars(uv+uTime*0.0015)*0.4;
        float d=distance(uv,uMouse*0.5+0.5);
        col+=uColC*smoothstep(0.5,0.0,d)*0.06;
        float vig=smoothstep(1.15,0.35,length(p));
        col*=mix(0.68,1.0,vig);
        gl_FragColor=vec4(col,1.0);
    }
`;
}

/* ---- background scene ------------------------------------------------ */
function buildBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    let tier = getPerfTier();
    let cfg = TIER_CFG[tier];
    baseFps = cfg.targetFps;
    scrollFps = cfg.scrollFps;

    let dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
    let renderScale = cfg.renderScale;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: isNarrowViewport() ? 'low-power' : 'high-performance',
        stencil: false,
        depth: true,
    });
    renderer.autoClear = false;
    renderer.setPixelRatio(dpr);

    const auroraScene = new THREE.Scene();
    const auroraCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const auroraUniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
        uAspect: { value: new THREE.Vector2(1, 1) },
        uColA: { value: PALETTES.dark.aurA.clone() },
        uColB: { value: PALETTES.dark.aurB.clone() },
        uColC: { value: PALETTES.dark.aurC.clone() },
    };
    const auroraMat = new THREE.ShaderMaterial({
        vertexShader: AURORA_VERT,
        fragmentShader: buildAuroraFrag(cfg.octaves),
        uniforms: auroraUniforms,
        depthTest: false,
        depthWrite: false,
    });
    auroraScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), auroraMat));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 80);
    camera.position.set(0, 0, 12);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const keyLight = new THREE.PointLight(0xe879f9, 1.1, 0, 0.6);
    keyLight.position.set(7, 9, 12);
    const rimLight = new THREE.PointLight(0x6366f1, 0.9, 0, 0.6);
    rimLight.position.set(-9, -5, 6);
    scene.add(keyLight, rimLight);

    const world = new THREE.Group();
    scene.add(world);

    const crystals = [];

    function buildGeos(detail) {
        return [
            new THREE.IcosahedronGeometry(1, detail),
            new THREE.OctahedronGeometry(1, detail),
            new THREE.DodecahedronGeometry(0.92, 0),
        ];
    }
    let geos = buildGeos(cfg.detail);

    function spawnCrystals(count) {
        while (crystals.length) {
            const m = crystals.pop();
            world.remove(m);
            m.material.dispose();
        }
        const { w, h } = getViewport();
        const narrow = w / Math.max(h, 1) < 0.85;
        for (let i = 0; i < count; i += 1) {
            const mat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.3,
                metalness: 0.45,
                flatShading: true,
                transparent: true,
                opacity: 0.9,
                emissive: 0x000000,
                emissiveIntensity: 0.18,
            });
            const mesh = new THREE.Mesh(geos[i % geos.length], mat);
            const radius = narrow ? 3.5 + Math.random() * 4.5 : 4.5 + Math.random() * 6;
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
            mesh.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * (narrow ? 8 : 11),
                -2 - Math.random() * 10
            );
            mesh.scale.setScalar(narrow ? 0.65 + Math.random() * 0.85 : 0.55 + Math.random() * 1.05);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            mesh.userData = {
                rsx: (Math.random() - 0.5) * 0.16,
                rsy: (Math.random() - 0.5) * 0.18,
                phase: Math.random() * Math.PI * 2,
                amp: 0.2 + Math.random() * 0.3,
                baseY: mesh.position.y,
            };
            world.add(mesh);
            crystals.push(mesh);
        }
        applyTheme();
    }

    function applyTheme() {
        const pal = PALETTES[themeKey()];
        auroraUniforms.uColA.value.copy(pal.aurA);
        auroraUniforms.uColB.value.copy(pal.aurB);
        auroraUniforms.uColC.value.copy(pal.aurC);
        crystals.forEach((m, i) => {
            const hex = pal.crystals[i % pal.crystals.length];
            m.material.color.set(hex);
            m.material.emissive.set(hex);
            m.material.emissiveIntensity = pal.crystalEmissive;
            m.material.opacity = pal.crystalOpacity;
        });
    }

    function applyTier() {
        const nextTier = getPerfTier();
        if (nextTier !== tier) {
            tier = nextTier;
            cfg = TIER_CFG[tier];
            baseFps = cfg.targetFps;
            scrollFps = cfg.scrollFps;
            auroraMat.fragmentShader = buildAuroraFrag(cfg.octaves);
            auroraMat.needsUpdate = true;
            geos = buildGeos(cfg.detail);
            document.documentElement.dataset.webglTier = tier;
        }
        spawnCrystals(cfg.crystals);
    }

    function resize() {
        const { w, h } = getViewport();
        renderer.setSize(Math.floor(w * renderScale), Math.floor(h * renderScale), false);
        renderer.setPixelRatio(dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        auroraUniforms.uAspect.value.set(w, h);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
    }

    let resizeTimer = 0;
    function onViewportChange() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resize(); applyTier(); }, 120);
    }
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('orientationchange', onViewportChange, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onViewportChange, { passive: true });
    }

    applyTier();
    resize();

    let slowFrames = 0;

    tickFns.push((delta, elapsed) => {
        input.px += (input.tx - input.px) * 0.04;
        input.py += (input.ty - input.py) * 0.04;

        auroraUniforms.uTime.value = elapsed;
        auroraUniforms.uMouse.value.set(input.px, -input.py);
        auroraUniforms.uScroll.value = input.scroll;

        camera.position.x += (input.px * 1.4 - camera.position.x) * 0.04;
        camera.position.y += (-input.py * 1.0 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        world.position.y = input.scroll * 4.5;
        world.rotation.y = elapsed * 0.012;

        for (let i = 0; i < crystals.length; i += 1) {
            const m = crystals[i];
            const ud = m.userData;
            m.rotation.x += ud.rsx * delta;
            m.rotation.y += ud.rsy * delta;
            m.position.y = ud.baseY + Math.sin(elapsed * 0.45 + ud.phase) * ud.amp;
        }

        renderer.clear(true, true, true);
        renderer.render(auroraScene, auroraCam);
        renderer.render(scene, camera);

        if (delta > 0.05 && renderScale > 0.45) {
            slowFrames += 1;
            if (slowFrames > 50) {
                renderScale = Math.max(0.45, renderScale - 0.06);
                if (dpr > 1) dpr = Math.max(1, dpr - 0.1);
                slowFrames = 0;
                resize();
            }
        } else if (slowFrames > 0) {
            slowFrames -= 1;
        }
    });

    requestAnimationFrame(() => canvas.classList.add('is-ready'));
    document.documentElement.classList.add('webgl-active');
    document.documentElement.dataset.webglTier = tier;

    return { applyTheme };
}

/* ---- origami fox geometry (used in About scene) ---------------------- */
function buildFoxGeometry() {
    // Vertices from the SVG logo (x,y in 0..100), mapped to normalized 3D
    // with a z-depth that folds the face forward like origami.
    const P = {
        A: [-0.5, 0.7, -0.1], D: [0.5, 0.7, -0.1],     // ear tips (fold back)
        C: [-0.8, 0.1, -0.06], F: [0.8, 0.1, -0.06],   // outer cheeks
        B: [-0.2, 0.2, 0.12], E: [0.2, 0.2, 0.12],     // inner brows
        H: [0.0, 0.04, 0.26],                          // nose bridge (forward)
        G: [0.0, -0.7, 0.12],                          // chin / snout
        I: [-0.08, -0.54, 0.15], J: [0.08, -0.54, 0.15], // snout tip base
    };
    const tris = [
        { v: ['A', 'B', 'C'], c: '#d8b4fe' },
        { v: ['D', 'F', 'E'], c: '#a855f7' },
        { v: ['C', 'B', 'G'], c: '#9333ea' },
        { v: ['F', 'G', 'E'], c: '#4f46e5' },
        { v: ['B', 'E', 'H'], c: '#f0abfc' },
        { v: ['B', 'H', 'G'], c: '#e879f9' },
        { v: ['E', 'G', 'H'], c: '#8b5cf6' },
        { v: ['I', 'J', 'G'], c: '#ffffff' },
    ];
    const positions = [];
    const colors = [];
    const col = new THREE.Color();
    for (const tri of tris) {
        col.set(tri.c);
        for (const key of tri.v) {
            const p = P[key];
            positions.push(p[0], p[1], p[2]);
            colors.push(col.r, col.g, col.b);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
}

/* ---- about origami fox (anelli 3D + gemme orbitanti) ----------------- */
function buildAboutFox() {
    const host = document.getElementById('about-fox');
    if (!host) return null;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
    camera.position.set(0, 0.08, 6.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.PointLight(0xe879f9, 22, 40);
    key.position.set(4, 5, 6);
    const rim = new THREE.PointLight(0x6366f1, 16, 40);
    rim.position.set(-5, -2, 4);
    const fill = new THREE.PointLight(0xc084fc, 8, 30);
    fill.position.set(0, -4, 3);
    scene.add(key, rim, fill);

    const root = new THREE.Group();
    scene.add(root);

    root.add(new THREE.Mesh(
        new THREE.SphereGeometry(1.45, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.12 })
    ));

    const ringMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.45,
        metalness: 0.75,
        roughness: 0.22,
        transparent: true,
        opacity: 0.72,
    });
    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.024, 10, 96), ringMat);
    const ringInner = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.018, 8, 72), ringMat.clone());
    ringInner.material.opacity = 0.55;
    root.add(ringOuter, ringInner);

    const geo = buildFoxGeometry();
    geo.center();
    const foxGroup = new THREE.Group();
    const faceMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        metalness: 0.4,
        roughness: 0.3,
        emissive: new THREE.Color('#3b1a6b'),
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
    });
    const fox = new THREE.Mesh(geo, faceMat);
    fox.scale.setScalar(1.85);
    foxGroup.add(fox);
    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 1),
        new THREE.LineBasicMaterial({ color: 0xf5d0fe, transparent: true, opacity: 0.4 })
    );
    edges.scale.copy(fox.scale);
    foxGroup.add(edges);
    root.add(foxGroup);

    const gemGeo = new THREE.OctahedronGeometry(0.1, 0);
    const gems = [];
    const gemColors = [0xc084fc, 0xe879f9, 0x6366f1];
    for (let i = 0; i < 3; i += 1) {
        const gem = new THREE.Mesh(
            gemGeo,
            new THREE.MeshStandardMaterial({
                color: gemColors[i],
                emissive: gemColors[i],
                emissiveIntensity: 0.35,
                metalness: 0.5,
                roughness: 0.25,
                flatShading: true,
            })
        );
        gem.userData = {
            angle: (i / 3) * Math.PI * 2,
            radius: 1.95,
            speed: 0.35 + i * 0.08,
            y: 0.12 * (i - 1),
        };
        root.add(gem);
        gems.push(gem);
    }

    function resize() {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
    }
    let resizeTimer = 0;
    const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 120);
    };
    window.addEventListener('resize', onResize, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onResize, { passive: true });
    }
    resize();

    let inView = false;
    const io = new IntersectionObserver((entries) => {
        inView = entries[0]?.isIntersecting ?? false;
    }, { rootMargin: '80px', threshold: 0.08 });
    io.observe(host);

    let yawOffset = 0;
    let pitchOffset = 0;
    const glow = root.children[0];

    tickFns.push((delta, elapsed) => {
        if (!inView) return;

        yawOffset += (input.px * 0.45 - yawOffset) * 0.05;
        pitchOffset += (input.py * 0.25 - pitchOffset) * 0.05;

        ringOuter.rotation.z = elapsed * 0.22;
        ringOuter.rotation.x = Math.PI * 0.5 + Math.sin(elapsed * 0.3) * 0.08;
        ringInner.rotation.z = -elapsed * 0.16;
        ringInner.rotation.x = Math.PI * 0.5 + Math.cos(elapsed * 0.25) * 0.06;

        foxGroup.rotation.y = Math.sin(elapsed * 0.45) * 0.22 + yawOffset * 0.35;
        foxGroup.rotation.x = pitchOffset * 0.35 + Math.sin(elapsed * 0.55) * 0.03;
        foxGroup.position.y = Math.sin(elapsed * 0.65) * 0.04;

        glow.scale.setScalar(1 + Math.sin(elapsed * 0.8) * 0.03);

        for (let i = 0; i < gems.length; i += 1) {
            const g = gems[i];
            const ud = g.userData;
            const a = ud.angle + elapsed * ud.speed;
            g.position.set(
                Math.cos(a) * ud.radius,
                ud.y + Math.sin(elapsed + i) * 0.06,
                Math.sin(a) * ud.radius * 0.28
            );
            g.rotation.y = elapsed * 1.2 + i;
        }

        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    });

    return true;
}

/* ---- boot ------------------------------------------------------------ */
function boot() {
    if (prefersReducedMotion || !supportsWebGL()) return;

    let bg = null;
    try {
        bg = buildBackground();
    } catch (e) {
        return;
    }
    if (!bg) return;

    try {
        buildAboutFox();
    } catch (e) {
        /* about fox scene optional */
    }

    const mo = new MutationObserver(() => bg.applyTheme());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    start();
}

function scheduleBoot() {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(boot, { timeout: 2000 });
    } else {
        setTimeout(boot, 600);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBoot);
} else {
    scheduleBoot();
}
