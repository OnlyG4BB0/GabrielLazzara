import * as THREE from 'three';

/*
 * Site-wide WebGL ambience (Three.js) — "awwwards" style, performance-first.
 *
 * Layers (single renderer, two-pass render, one rAF loop):
 *   1. Aurora: fullscreen GLSL shader. Domain-warped fbm noise -> flowing
 *      purple aurora that reacts to pointer + scroll. Very cheap, fills the
 *      whole page (fixed canvas), so the effect lives across every section.
 *   2. Crystals: a handful of flat-shaded low-poly shards drifting in depth.
 *   3. Particles: additive point field with pointer parallax + cursor swell.
 *
 * Degrades gracefully: no WebGL or reduced-motion -> original CSS blobs + fox
 * logo stay untouched. Adaptive DPR step-down keeps weak GPUs smooth.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

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

/* ---- palettes -------------------------------------------------------- */
const PALETTES = {
    dark: {
        aurA: new THREE.Color('#070512'),
        aurB: new THREE.Color('#241753'),
        aurC: new THREE.Color('#7c3aed'),
        crystals: ['#c084fc', '#8b5cf6', '#e879f9', '#6366f1', '#a855f7'],
        crystalEmissive: 0.22,
        crystalOpacity: 0.9,
        particle: new THREE.Color('#c4b5fd'),
        particleOpacity: 0.7,
    },
    light: {
        aurA: new THREE.Color('#f4f0fb'),
        aurB: new THREE.Color('#dcd0f4'),
        aurC: new THREE.Color('#b69bf0'),
        crystals: ['#7c3aed', '#6d28d9', '#9333ea', '#4f46e5', '#a855f7'],
        crystalEmissive: 0.04,
        crystalOpacity: 0.5,
        particle: new THREE.Color('#7c3aed'),
        particleOpacity: 0.4,
    },
};

function themeKey() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/* ---- shared loop ----------------------------------------------------- */
const clock = new THREE.Clock();
const updatables = [];
let running = false;
let rafId = 0;

function frame() {
    if (!running) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    for (let i = 0; i < updatables.length; i += 1) updatables[i](delta, elapsed);
    rafId = requestAnimationFrame(frame);
}
function start() {
    if (running || updatables.length === 0) return;
    running = true;
    clock.start();
    rafId = requestAnimationFrame(frame);
}
function stop() {
    running = false;
    cancelAnimationFrame(rafId);
}
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
});

/* ---- shared pointer / scroll (eased) --------------------------------- */
const input = { px: 0, py: 0, tx: 0, ty: 0, scroll: 0 };
if (!isCoarse) {
    window.addEventListener('pointermove', (e) => {
        input.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        input.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
}
window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    input.scroll = max > 0 ? window.scrollY / max : 0;
}, { passive: true });

/* ---- GLSL ------------------------------------------------------------ */
const AURORA_VERT = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

// Ashima simplex noise (3D) — public domain.
const AURORA_FRAG = /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2  uMouse;
    uniform float uScroll;
    uniform vec2  uRes;
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
        for(int i=0;i<4;i++){v+=a*snoise(p);p*=2.0;a*=0.5;}
        return v;
    }
    void main(){
        vec2 uv=vUv;
        vec2 p=(uv-0.5);
        p.x*=uRes.x/uRes.y;
        float t=uTime*0.045;
        vec3 q=vec3(p*1.45,t);
        float w=fbm(q+vec3(uMouse*0.45,uScroll*0.6));
        float n=fbm(q+w+vec3(0.0,0.0,t));
        n=n*0.5+0.5;
        float band=smoothstep(0.18,0.85,n);
        vec3 col=mix(uColA,uColB,band);
        col=mix(col,uColC,pow(n,3.0)*0.65);
        // cursor glow
        float d=distance(uv,uMouse*0.5+0.5);
        col+=uColC*smoothstep(0.55,0.0,d)*0.10;
        // vignette
        float vig=smoothstep(1.25,0.25,length(p));
        col*=mix(0.62,1.0,vig);
        gl_FragColor=vec4(col,1.0);
    }
`;

/* ---- scene build ----------------------------------------------------- */
function build() {
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-bg';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
    });
    const maxDpr = isMobile ? 1.3 : 2;
    let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.autoClear = false;

    /* aurora pass (ortho fullscreen) */
    const auroraScene = new THREE.Scene();
    const auroraCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const auroraUniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uColA: { value: PALETTES.dark.aurA.clone() },
        uColB: { value: PALETTES.dark.aurB.clone() },
        uColC: { value: PALETTES.dark.aurC.clone() },
    };
    const auroraMat = new THREE.ShaderMaterial({
        vertexShader: AURORA_VERT,
        fragmentShader: AURORA_FRAG,
        uniforms: auroraUniforms,
        depthTest: false,
        depthWrite: false,
    });
    auroraScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), auroraMat));

    /* main pass (perspective: crystals + particles) */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const key = new THREE.PointLight(0xffffff, 70, 120);
    key.position.set(8, 10, 14);
    const rim = new THREE.PointLight(0xffffff, 45, 120);
    rim.position.set(-10, -6, 6);
    scene.add(ambient, key, rim);

    const world = new THREE.Group();
    scene.add(world);

    /* crystals */
    const geos = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1.2, 0),
        new THREE.DodecahedronGeometry(0.9, 0),
    ];
    const CRYSTALS = isMobile ? 6 : 10;
    const crystals = [];
    for (let i = 0; i < CRYSTALS; i += 1) {
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.35,
            metalness: 0.18,
            flatShading: true,
            transparent: true,
            opacity: 0.9,
        });
        const mesh = new THREE.Mesh(geos[i % geos.length], mat);
        const radius = 5 + Math.random() * 7;
        const angle = Math.random() * Math.PI * 2;
        mesh.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 12,
            -2 - Math.random() * 14
        );
        mesh.scale.setScalar(0.5 + Math.random() * 1.4);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rs: new THREE.Vector3(
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.25,
                (Math.random() - 0.5) * 0.15
            ),
            phase: Math.random() * Math.PI * 2,
            amp: 0.3 + Math.random() * 0.5,
            baseY: mesh.position.y,
        };
        world.add(mesh);
        crystals.push(mesh);
    }

    /* particles */
    const PCOUNT = isMobile ? 1100 : 2600;
    const pos = new Float32Array(PCOUNT * 3);
    const seed = new Float32Array(PCOUNT);
    for (let i = 0; i < PCOUNT; i += 1) {
        pos[i * 3] = (Math.random() - 0.5) * 42;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 32;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4;
        seed[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: isMobile ? 0.07 : 0.055,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    world.add(particles);

    /* theme */
    function applyTheme() {
        const pal = PALETTES[themeKey()];
        auroraUniforms.uColA.value.copy(pal.aurA);
        auroraUniforms.uColB.value.copy(pal.aurB);
        auroraUniforms.uColC.value.copy(pal.aurC);
        scene.fog = new THREE.FogExp2(pal.aurA.getHex(), 0.02);
        crystals.forEach((m, i) => {
            const hex = pal.crystals[i % pal.crystals.length];
            m.material.color.set(hex);
            m.material.emissive.set(hex);
            m.material.emissiveIntensity = pal.crystalEmissive;
            m.material.opacity = pal.crystalOpacity;
        });
        pMat.color.copy(pal.particle);
        pMat.opacity = pal.particleOpacity;
    }
    applyTheme();

    /* resize */
    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        renderer.setPixelRatio(dpr);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        auroraUniforms.uRes.value.set(w * dpr, h * dpr);
    }
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 120);
    });
    resize();

    /* adaptive perf: if frames are consistently slow, step DPR down once */
    let slowFrames = 0;
    let steppedDown = false;

    updatables.push((delta, elapsed) => {
        // ease shared input
        input.px += (input.tx - input.px) * 0.045;
        input.py += (input.ty - input.py) * 0.045;

        // aurora
        auroraUniforms.uTime.value = elapsed;
        auroraUniforms.uMouse.value.set(input.px, -input.py);
        auroraUniforms.uScroll.value = input.scroll;

        // camera parallax + scroll drift
        camera.position.x += (input.px * 2.2 - camera.position.x) * 0.05;
        camera.position.y += (-input.py * 1.6 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
        world.position.y = input.scroll * 6.0;
        world.rotation.y = elapsed * 0.02;

        for (let i = 0; i < crystals.length; i += 1) {
            const m = crystals[i];
            const ud = m.userData;
            m.rotation.x += ud.rs.x * delta;
            m.rotation.y += ud.rs.y * delta;
            m.rotation.z += ud.rs.z * delta;
            m.position.y = ud.baseY + Math.sin(elapsed * 0.5 + ud.phase) * ud.amp;
        }
        particles.rotation.y = elapsed * 0.015;
        particles.position.z = Math.sin(elapsed * 0.1) * 1.5;

        // two-pass render
        renderer.clear();
        renderer.render(auroraScene, auroraCam);
        renderer.render(scene, camera);

        // perf guard
        if (!steppedDown && delta > 0.028) {
            slowFrames += 1;
            if (slowFrames > 90) {
                steppedDown = true;
                dpr = Math.max(1, dpr - 0.4);
                resize();
            }
        } else if (slowFrames > 0) {
            slowFrames -= 1;
        }
    });

    requestAnimationFrame(() => canvas.classList.add('is-ready'));
    document.documentElement.classList.add('webgl-active');

    return { applyTheme };
}

/* ---- boot ------------------------------------------------------------ */
function boot() {
    if (prefersReducedMotion || !supportsWebGL()) return;

    let themed = null;
    try {
        themed = build();
    } catch (e) {
        return; // CSS blobs remain
    }
    if (!themed) return;

    const mo = new MutationObserver(() => themed.applyTheme());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    start();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
