import * as THREE from 'three';

/*
 * Site-wide WebGL ambience — performance-first, responsive.
 * Aurora shader (always) + low-poly crystals (all tiers, count scales with viewport).
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
    minimal: { renderScale: 0.55, maxDpr: 1.1, targetFps: 28, crystals: 4, particles: 0, shaderOctaves: 2 },
    balanced: { renderScale: 0.65, maxDpr: 1.25, targetFps: 36, crystals: 6, particles: 120, shaderOctaves: 2 },
    full: { renderScale: 0.78, maxDpr: 1.5, targetFps: 50, crystals: 8, particles: 320, shaderOctaves: 3 },
};

function getTierConfig() {
    return TIER_CFG[getPerfTier()];
}

/* ---- palettes -------------------------------------------------------- */
const PALETTES = {
    dark: {
        aurA: new THREE.Color('#070512'),
        aurB: new THREE.Color('#241753'),
        aurC: new THREE.Color('#7c3aed'),
        crystals: ['#c084fc', '#8b5cf6', '#e879f9', '#6366f1'],
        crystalOpacity: 0.88,
        particle: new THREE.Color('#c4b5fd'),
        particleOpacity: 0.55,
    },
    light: {
        aurA: new THREE.Color('#f4f0fb'),
        aurB: new THREE.Color('#dcd0f4'),
        aurC: new THREE.Color('#b69bf0'),
        crystals: ['#7c3aed', '#6d28d9', '#9333ea', '#4f46e5'],
        crystalOpacity: 0.5,
        particle: new THREE.Color('#7c3aed'),
        particleOpacity: 0.38,
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
let minFrameMs = 1000 / 36;
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

/* ---- input ----------------------------------------------------------- */
const input = { px: 0, py: 0, tx: 0, ty: 0, scroll: 0 };
let lastPointerTs = 0;

if (!isCoarsePointer()) {
    window.addEventListener('pointermove', (e) => {
        const now = performance.now();
        if (now - lastPointerTs < 32) return;
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

function isScrolling() {
    const root = document.documentElement;
    return root.classList.contains('is-scrolling') || root.classList.contains('is-smooth-scrolling');
}

/* ---- GLSL ------------------------------------------------------------ */
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
    float shard(vec2 uv,vec2 c,float r,float a){
        vec2 d=uv-c;
        float ca=cos(a),sa=sin(a);
        d=mat2(ca,-sa,sa,ca)*d;
        return smoothstep(r,r*0.72,max(abs(d.x)*0.65+abs(d.y),abs(d.x)*0.2+abs(d.y)*1.1));
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
        float s1=shard(p,vec2(0.35*sin(t*0.7),0.28*cos(t*0.5)),0.14,t*0.3);
        float s2=shard(p,vec2(-0.42*cos(t*0.55),0.22*sin(t*0.65)),0.11,t*0.5+1.0);
        float s3=shard(p,vec2(0.18*sin(t*0.4+2.0),-0.38*cos(t*0.45)),0.1,t*0.25+2.5);
        col+=uColC*(s1+s2+s3)*0.22;
        float d=distance(uv,uMouse*0.5+0.5);
        col+=uColC*smoothstep(0.5,0.0,d)*0.06;
        float vig=smoothstep(1.15,0.35,length(p));
        col*=mix(0.68,1.0,vig);
        gl_FragColor=vec4(col,1.0);
    }
`;
}

const AURORA_VERT = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

/* ---- scene ----------------------------------------------------------- */
function build() {
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    let tier = getPerfTier();
    let cfg = TIER_CFG[tier];
    minFrameMs = 1000 / cfg.targetFps;

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
        fragmentShader: buildAuroraFrag(cfg.shaderOctaves),
        uniforms: auroraUniforms,
        depthTest: false,
        depthWrite: false,
    });
    auroraScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), auroraMat));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 80);
    camera.position.set(0, 0, 12);
    const world = new THREE.Group();
    scene.add(world);

    const geos = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1.15, 0),
    ];
    const crystals = [];
    let particles = null;
    let pMat = null;

    function spawnCrystal(index, total) {
        const mesh = new THREE.Mesh(
            geos[index % geos.length],
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.88,
                depthTest: true,
                depthWrite: false,
            })
        );
        const { w, h } = getViewport();
        const aspect = w / Math.max(h, 1);
        const narrow = aspect < 0.85;
        const radius = narrow ? 3.5 + Math.random() * 4.5 : 4.5 + Math.random() * 6;
        const angle = (index / total) * Math.PI * 2 + Math.random() * 0.6;
        mesh.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * (narrow ? 8 : 11),
            -2 - Math.random() * 10
        );
        mesh.scale.setScalar(narrow ? 0.65 + Math.random() * 0.85 : 0.55 + Math.random() * 1.05);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rs: (Math.random() - 0.5) * 0.16,
            phase: Math.random() * Math.PI * 2,
            amp: 0.2 + Math.random() * 0.3,
            baseY: mesh.position.y,
        };
        world.add(mesh);
        crystals.push(mesh);
        return mesh;
    }

    function rebuildCrystals(count) {
        while (crystals.length) {
            const m = crystals.pop();
            world.remove(m);
            m.geometry.dispose();
            m.material.dispose();
        }
        for (let i = 0; i < count; i += 1) spawnCrystal(i, count);
        applyTheme();
    }

    function rebuildParticles(count) {
        if (particles) {
            world.remove(particles);
            particles.geometry.dispose();
            pMat.dispose();
            particles = null;
            pMat = null;
        }
        if (count <= 0) return;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
            pos[i * 3] = (Math.random() - 0.5) * 36;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 26;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 3;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        pMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: isNarrowViewport() ? 0.065 : 0.05,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        particles = new THREE.Points(pGeo, pMat);
        world.add(particles);
        applyTheme();
    }

    function applyTierLayout() {
        const nextTier = getPerfTier();
        const nextCfg = TIER_CFG[nextTier];
        if (nextTier !== tier) {
            tier = nextTier;
            cfg = nextCfg;
            minFrameMs = 1000 / cfg.targetFps;
            auroraMat.fragmentShader = buildAuroraFrag(cfg.shaderOctaves);
            auroraMat.needsUpdate = true;
            document.documentElement.dataset.webglTier = tier;
        }
        rebuildCrystals(cfg.crystals);
        rebuildParticles(cfg.particles);
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

    applyTierLayout();

    function resize() {
        const { w, h } = getViewport();
        const rw = Math.max(1, Math.floor(w * renderScale));
        const rh = Math.max(1, Math.floor(h * renderScale));
        renderer.setSize(rw, rh, false);
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
        resizeTimer = setTimeout(() => {
            resize();
            applyTierLayout();
        }, 120);
    }
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('orientationchange', onViewportChange, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', onViewportChange, { passive: true });
    }

    resize();

    let slowFrames = 0;

    tickFn = (delta, elapsed) => {
        if (isScrolling()) return;

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
            m.rotation.y += ud.rs * delta;
            m.position.y = ud.baseY + Math.sin(elapsed * 0.45 + ud.phase) * ud.amp;
        }
        if (particles) particles.rotation.y = elapsed * 0.01;

        renderer.clear(true, true, true);
        renderer.render(auroraScene, auroraCam);
        renderer.render(scene, camera);

        if (delta > 0.034) {
            slowFrames += 1;
            if (slowFrames > 40 && renderScale > 0.4) {
                renderScale = Math.max(0.4, renderScale - 0.06);
                if (dpr > 1) dpr = Math.max(1, dpr - 0.1);
                slowFrames = 0;
                resize();
            }
        } else if (slowFrames > 0) {
            slowFrames -= 1;
        }
    };

    requestAnimationFrame(() => canvas.classList.add('is-ready'));
    document.documentElement.classList.add('webgl-active');
    document.documentElement.dataset.webglTier = tier;

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
