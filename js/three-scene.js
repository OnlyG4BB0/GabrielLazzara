import * as THREE from 'three';

/*
 * Site-wide WebGL ambience — performance-first.
 *
 * Tiered quality:
 *   minimal  — mobile / weak GPU: shader aurora only, half-res, ~24fps
 *   balanced — tablets / motion-lite: aurora + few crystals, ~30fps
 *   full     — desktop: aurora + crystals + light particles, adaptive fps
 *
 * Stars are baked into the shader (no Points geometry on minimal/balanced).
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const isLiteMotion = () => document.documentElement.classList.contains('motion-lite');
const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4;
const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;

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

function getPerfTier() {
    if (isMobile || lowMemory || lowCpu) return 'minimal';
    if (isCoarse || isLiteMotion()) return 'balanced';
    return 'full';
}

const TIER = getPerfTier();
const TIER_CFG = {
    minimal: { renderScale: 0.42, maxDpr: 1, targetFps: 24, crystals: 0, particles: 0, shaderOctaves: 2 },
    balanced: { renderScale: 0.58, maxDpr: 1.15, targetFps: 30, crystals: 3, particles: 0, shaderOctaves: 2 },
    full: { renderScale: 0.72, maxDpr: 1.4, targetFps: 50, crystals: 5, particles: 280, shaderOctaves: 3 },
}[TIER];

/* ---- palettes -------------------------------------------------------- */
const PALETTES = {
    dark: {
        aurA: new THREE.Color('#070512'),
        aurB: new THREE.Color('#241753'),
        aurC: new THREE.Color('#7c3aed'),
        crystals: ['#c084fc', '#8b5cf6', '#e879f9', '#6366f1'],
        crystalOpacity: 0.85,
        particle: new THREE.Color('#c4b5fd'),
        particleOpacity: 0.55,
    },
    light: {
        aurA: new THREE.Color('#f4f0fb'),
        aurB: new THREE.Color('#dcd0f4'),
        aurC: new THREE.Color('#b69bf0'),
        crystals: ['#7c3aed', '#6d28d9', '#9333ea', '#4f46e5'],
        crystalOpacity: 0.45,
        particle: new THREE.Color('#7c3aed'),
        particleOpacity: 0.35,
    },
};

function themeKey() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/* ---- loop ------------------------------------------------------------ */
const clock = new THREE.Clock();
let running = false;
let rafId = 0;
let tickFn = null;
const minFrameMs = 1000 / TIER_CFG.targetFps;
let lastFrameTs = 0;

function frame(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (ts - lastFrameTs < minFrameMs) return;
    lastFrameTs = ts;
    if (tickFn) tickFn(Math.min(clock.getDelta(), 0.05), clock.elapsedTime);
}
function start() {
    if (running || !tickFn) return;
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

/* ---- input (throttled) ----------------------------------------------- */
const input = { px: 0, py: 0, tx: 0, ty: 0, scroll: 0 };
let lastPointerTs = 0;

if (!isCoarse) {
    window.addEventListener('pointermove', (e) => {
        const now = performance.now();
        if (now - lastPointerTs < 32) return;
        lastPointerTs = now;
        input.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        input.ty = (e.clientY / window.innerHeight - 0.5) * 2;
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

function isScrolling() {
    const root = document.documentElement;
    return root.classList.contains('is-scrolling') || root.classList.contains('is-smooth-scrolling');
}

/* ---- GLSL (lighter: fewer octaves, stars in shader) ------------------ */
const OCTAVES = TIER_CFG.shaderOctaves;
const AURORA_VERT = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

const AURORA_FRAG = /* glsl */`
    precision ${TIER === 'full' ? 'highp' : 'mediump'} float;
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
        for(int i=0;i<${OCTAVES};i++){v+=a*snoise(p);p*=2.02;a*=0.5;}
        return v;
    }
    float stars(vec2 uv){
        vec2 gv=fract(uv*vec2(120.0,90.0))-0.5;
        vec2 id=floor(uv*vec2(120.0,90.0));
        float n=fract(sin(dot(id,vec2(12.9898,78.233)))*43758.5453);
        float sz=smoothstep(0.5,0.0,length(gv))*step(0.992,n);
        return sz;
    }
    void main(){
        vec2 uv=vUv;
        vec2 p=(uv-0.5);
        p.x*=uAspect.x/uAspect.y;
        float t=uTime*0.04;
        vec3 q=vec3(p*1.35,t+uScroll*0.5);
        float n=fbm(q+vec3(uMouse*0.35,0.0));
        n=n*0.5+0.5;
        float band=smoothstep(0.2,0.82,n);
        vec3 col=mix(uColA,uColB,band);
        col=mix(col,uColC,pow(n,2.8)*0.55);
        col+=uColC*stars(uv+uTime*0.002)*0.35;
        float d=distance(uv,uMouse*0.5+0.5);
        col+=uColC*smoothstep(0.5,0.0,d)*0.07;
        float vig=smoothstep(1.2,0.3,length(p));
        col*=mix(0.65,1.0,vig);
        gl_FragColor=vec4(col,1.0);
    }
`;

/* ---- scene ----------------------------------------------------------- */
function build() {
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const cfg = TIER_CFG;
    let dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
    let renderScale = cfg.renderScale;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        stencil: false,
        depth: true,
    });
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
    auroraScene.add(new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
            vertexShader: AURORA_VERT,
            fragmentShader: AURORA_FRAG,
            uniforms: auroraUniforms,
            depthTest: false,
            depthWrite: false,
        })
    ));

    const hasOverlay = cfg.crystals > 0 || cfg.particles > 0;
    let scene = null;
    let camera = null;
    let world = null;
    let crystals = [];
    let particles = null;
    let pMat = null;

    if (hasOverlay) {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        camera.position.set(0, 0, 14);
        world = new THREE.Group();
        scene.add(world);

        if (cfg.crystals > 0) {
            const geos = [
                new THREE.IcosahedronGeometry(1, 0),
                new THREE.OctahedronGeometry(1, 0),
                new THREE.TetrahedronGeometry(1.2, 0),
            ];
            for (let i = 0; i < cfg.crystals; i += 1) {
                const mesh = new THREE.Mesh(
                    geos[i % geos.length],
                    new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.85,
                        depthWrite: false,
                    })
                );
                const radius = 5.5 + Math.random() * 6;
                const angle = Math.random() * Math.PI * 2;
                mesh.position.set(
                    Math.cos(angle) * radius,
                    (Math.random() - 0.5) * 10,
                    -3 - Math.random() * 12
                );
                mesh.scale.setScalar(0.55 + Math.random() * 1.1);
                mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                mesh.userData = {
                    rs: (Math.random() - 0.5) * 0.18,
                    phase: Math.random() * Math.PI * 2,
                    amp: 0.25 + Math.random() * 0.35,
                    baseY: mesh.position.y,
                };
                world.add(mesh);
                crystals.push(mesh);
            }
        }

        if (cfg.particles > 0) {
            const pos = new Float32Array(cfg.particles * 3);
            for (let i = 0; i < cfg.particles; i += 1) {
                pos[i * 3] = (Math.random() - 0.5) * 38;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 24 - 4;
            }
            const pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            pMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.05,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            particles = new THREE.Points(pGeo, pMat);
            world.add(particles);
        }
    }

    function applyTheme() {
        const pal = PALETTES[themeKey()];
        auroraUniforms.uColA.value.copy(pal.aurA);
        auroraUniforms.uColB.value.copy(pal.aurB);
        auroraUniforms.uColC.value.copy(pal.aurC);
        crystals.forEach((m, i) => {
            m.material.color.set(pal.crystals[i % pal.crystals.length]);
            m.material.opacity = pal.crystalOpacity;
        });
        if (pMat) {
            pMat.color.copy(pal.particle);
            pMat.opacity = pal.particleOpacity;
        }
    }
    applyTheme();

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const rw = Math.max(1, Math.floor(w * renderScale));
        const rh = Math.max(1, Math.floor(h * renderScale));
        renderer.setSize(rw, rh, false);
        renderer.setPixelRatio(dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        auroraUniforms.uAspect.value.set(w, h);
        if (camera) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    }
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });
    resize();

    let slowFrames = 0;
    let frameCounter = 0;

    tickFn = (delta, elapsed) => {
        input.px += (input.tx - input.px) * 0.04;
        input.py += (input.ty - input.py) * 0.04;

        auroraUniforms.uTime.value = elapsed;
        auroraUniforms.uMouse.value.set(input.px, -input.py);
        auroraUniforms.uScroll.value = input.scroll;

        const scrolling = isScrolling();
        const skipOverlay = scrolling && TIER !== 'full';

        if (hasOverlay && !skipOverlay) {
            camera.position.x += (input.px * 1.6 - camera.position.x) * 0.04;
            camera.position.y += (-input.py * 1.2 - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);
            world.position.y = input.scroll * 5;
            world.rotation.y = elapsed * 0.015;

            for (let i = 0; i < crystals.length; i += 1) {
                const m = crystals[i];
                const ud = m.userData;
                m.rotation.y += ud.rs * delta;
                m.position.y = ud.baseY + Math.sin(elapsed * 0.45 + ud.phase) * ud.amp;
            }
            if (particles) particles.rotation.y = elapsed * 0.012;
        }

        renderer.clear();
        renderer.render(auroraScene, auroraCam);
        if (hasOverlay && !skipOverlay) {
            renderer.render(scene, camera);
        }

        frameCounter += 1;
        if (delta > 0.032) {
            slowFrames += 1;
            if (slowFrames > 45 && renderScale > 0.35) {
                renderScale = Math.max(0.35, renderScale - 0.08);
                if (dpr > 1) dpr = Math.max(1, dpr - 0.15);
                slowFrames = 0;
                resize();
            }
        } else if (slowFrames > 0) {
            slowFrames -= 1;
        }
    };

    requestAnimationFrame(() => canvas.classList.add('is-ready'));
    document.documentElement.classList.add('webgl-active');
    document.documentElement.dataset.webglTier = TIER;

    return { applyTheme };
}

function boot() {
    if (prefersReducedMotion || !supportsWebGL()) return;

    let themed = null;
    try {
        themed = build();
    } catch (e) {
        return;
    }
    if (!themed) return;

    const mo = new MutationObserver(() => themed.applyTheme());
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
