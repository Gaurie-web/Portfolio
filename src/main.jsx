import * as THREE from 'three';
import { OrbitControls } from './utils/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import emailjs from '@emailjs/browser';
const emailKEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const serviceKEY = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateKEY = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
import Soundfont from 'soundfont-player';
const apiKEY = import.meta.env.VITE_GOOGLE_API_KEY;
const calendarID = import.meta.env.VITE_GOOGLE_CALENDAR_ID;
import { createCalendarTexture } from './utils/calendarTexture.js';
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

///////////////////////////////////////////////////////////////////App for Timeline Modal////////////////////////////////////////////////////////////////////////////////
createRoot(document.querySelector("#experience-modal-content")).render(<App />);

////////////////////////////////////////////////////////////////////Setting up the Canvas////////////////////////////////////////////////////////////////////////////////
const canvas = document.querySelector("#experience-canvas");
const sizes ={
    width: window.innerWidth,
    height: window.innerHeight
}

////////////////////////////////////////////////////////////////////Setting up the Preloader Window//////////////////////////////////////////////////////////////////////
const preloaderEl = document.getElementById('preloader');
const barEl = document.getElementById('bar');
const percentEl = document.getElementById('percent');

const manager = new THREE.LoadingManager();

manager.onProgress = (url, loaded, total) => {
  const p = Math.round((loaded / total) * 100);
  barEl.style.width = p + '%';
  percentEl.textContent = p;
};
// delete the manager.onLoad block entirely

const minTime = 1500;
const start = performance.now();

async function hidePreloader() {
  // Let the GPU compile shaders and upload textures while the overlay is still covering the screen
  try {
    await renderer.compileAsync(scene, camera);   // three r157+
  } catch (e) {
    renderer.compile(scene, camera);              // older versions
  }
  renderer.render(scene, camera);

  // Wait for the minimum display time
  const wait = Math.max(0, minTime - (performance.now() - start));
  await new Promise(r => setTimeout(r, wait));

  // Wait two frames so the real scene is actually painted underneath
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  barEl.style.width = '100%';
  percentEl.textContent = 100;
  document.body.classList.remove('loading');
  preloaderEl.classList.add('hidden');
  setTimeout(() => preloaderEl.remove(), 1200);
}

function setProgress(p) {
  p = Math.min(100, Math.max(0, Math.round(p)));
  barEl.style.width = p + '%';
  percentEl.textContent = p;
}

////////////////////////////////////////////////////////////////////Setting up the Navigation Overlay/////////////////////////////////////////////////////////////////////
// const hint = document.getElementById('controls-hint');
// // setTimeout(() => { hint.style.opacity = '0'; }, 8000);
// window.addEventListener('pointerdown', () => { hint.style.opacity = '0'; }, { once: true });
// hint.addEventListener('transitionend', () => hint.remove());
const hints = document.querySelectorAll('.controls-hint');

window.addEventListener('pointerdown', () => {
  hints.forEach(h => {
    h.style.opacity = '0';
    h.addEventListener('transitionend', () => h.remove(), { once: true });
  });
}, { once: true });

////////////////////////////////////////////////////////////////////Setting up the loaders////////////////////////////////////////////////////////////////////////////////
// Model Loaders
const dracoloader = new DRACOLoader();
dracoloader.setDecoderPath('draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoloader);

const textureLoader = new THREE.TextureLoader();

////////////////////////////////////////////////////////////////////Setting up the baking texture//////////////////////////////////////////////////////////////////////////
const textureMap = {
    First: {
        day:"textures/TextureSetOne.webp",
    },
    Second: {
        day:"textures/TextureSetTwo.webp",
    },
    Third: {
        day:"textures/TextureSetThree.webp",
    },
    Fourth: {
        day:"textures/TextureSetFour.webp",
    },
    Fifth: {
        day:"textures/TextureSetFive.webp",
    },
    Sixth: {
        day:"textures/TextureSetSix.webp"
    },
    Seventh: {
        day:"textures/TextureSetSeven.webp"
    }

}

const loadedTexture = {
    day: {}
}

Object.entries(textureMap).forEach(([key, paths]) => {
    const dayTexture = textureLoader.load(paths.day);
    dayTexture.flipY = false; // Flip the texture on the Y-axis and makes everything look upside down
    dayTexture.colorSpace = THREE.SRGBColorSpace; // Set the color space to SRGB and gets the blender look
    loadedTexture.day[key] = dayTexture;
});

const photoTextureCat = textureLoader.load('images/Calcifer_Pic.jpg');
photoTextureCat.flipY = false; // match your existing texture setup
photoTextureCat.colorSpace = THREE.SRGBColorSpace;

const photoTextureGrad = textureLoader.load('images/Grad_Pic.jpg');
photoTextureGrad.flipY = false; 
photoTextureGrad.colorSpace = THREE.SRGBColorSpace;

const photoTextureRug = textureLoader.load('images/Rug_Pic.png');
photoTextureRug.flipY = false; 
photoTextureRug.colorSpace = THREE.SRGBColorSpace;

const photoTextureMonitor = textureLoader.load('images/Monitor_Screenshot.png');
photoTextureMonitor.colorSpace = THREE.SRGBColorSpace;
photoTextureMonitor.wrapS = THREE.ClampToEdgeWrapping;
photoTextureMonitor.wrapT = THREE.ClampToEdgeWrapping;
photoTextureMonitor.center.set(0.5, 0.5);
photoTextureMonitor.rotation = Math.PI / 2;
photoTextureMonitor.repeat.set(-1, 1);

////////////////////////////////////////////////////////////////////Setting up the Audio////////////////////////////////////////////////////////////////////////////////
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let piano = null;

Soundfont.instrument(audioContext, 'acoustic_grand_piano').then((instrument) => {
    piano = instrument;
});

const unlockEvents = ['touchstart', 'touchend', 'click'];
function globalUnlock() {
    audioContext.resume().then(() => {
        unlockEvents.forEach(e => window.removeEventListener(e, globalUnlock));
    });
}
unlockEvents.forEach(e => window.addEventListener(e, globalUnlock));

function unlockAudio() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playNote(note) {
    unlockAudio();
    if (piano) {
        piano.play(note);
    }
}

////////////////////////////////////////////////////////////////////Setting up the Raycaster/////////////////////////////////////////////////////////////////////////////
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

////////////////////////////////////////////////////////////////////Setting up the Piano//////////////////////////////////////////////////////////////////////////////////
const pianoKeys = []; 
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function getNoteForKey(keyNumber, startOctave = 3) {
    const noteIndex = (keyNumber - 1) % 12;
    const octave = startOctave + Math.floor((keyNumber - 1) / 12);
    return `${chromaticScale[noteIndex]}${octave}`;
}

function isBlackKey(note) {
    return note.includes('#');
}

////////////////////////////////////////////////////////////////////Setting up the hamburger menu/////////////////////////////////////////////////////////////////////////
function toggleMenu(force) {
    const open = force ?? !menu.classList.contains('open');

    // Move focus out before hiding the menu
    if (!open && menu.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    menu.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    menu.inert = !open;
}

////////////////////////////////////////////////////////////////////Setting up the Calendar//////////////////////////////////////////////////////////////////////////////////
const { texture: calendarCanvasTexture, refresh: refreshCalendar } = createCalendarTexture({
    calendarId: calendarID,
    apiKey: apiKEY,
    canvasWidth: 1024,
    canvasHeight: 1536,
});

// getting the UV to look right
calendarCanvasTexture.center.set(0.5, 0.5);
calendarCanvasTexture.rotation = -Math.PI / 2;

function normalizeUVs(geometry) {
    const uv = geometry.attributes.uv;
    if (!uv) {
        console.warn('normalizeUVs: geometry has no UVs');
        return;
    }

    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (let i = 0; i < uv.count; i++) {
        minU = Math.min(minU, uv.getX(i)); maxU = Math.max(maxU, uv.getX(i));
        minV = Math.min(minV, uv.getY(i)); maxV = Math.max(maxV, uv.getY(i));
    }

    const rangeU = maxU - minU || 1;
    const rangeV = maxV - minV || 1;
    for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (uv.getX(i) - minU) / rangeU, (uv.getY(i) - minV) / rangeV);
    }
    uv.needsUpdate = true;
}

// keep it current
setInterval(refreshCalendar, 10 * 60 * 1000);

////////////////////////////////////////////////////////////////////Setting up the model loader////////////////////////////////////////////////////////////////////////////
const clickableHitboxes = [];
loader.load("models/portfolio_room.glb", (glb) => {

    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');
    const list = document.getElementById('menu-list');

    menu.inert = true; // closed by default

    const get = (name) => glb.scene.getObjectByName(name);

    const targets = [
        { label: '👤 About Me',     object: get('About_Me_Hitbox'),     modal: true },
        { label: '📄 My Resume',    object: get('My_Resume_Hitbox'),    modal: true },
        { label: '💻 My Projects',  object: get('My_Projects_Hitbox'),  modal: true },
        { label: '💼 Experience',   object: get('Experience_Hitbox'),   modal: true },
        { label: '🏆 Achievements', object: get('Achievements_Hitbox'), modal: true },
        { label: '🔗 LinkedIn',     object: get('Linkedin_Hitbox'),     modal: true },
        { label: '✉️ Mail',        object: get('Gmail_Hitbox'),        modal: true },
        { label: '🎹 Piano',        object: get('Piano_Key001'),        modal: false },
        { label: '🐱 Cat',          object: get('Cat_Hitbox'),          modal: false },
    ];

    function toggleMenu(force) {
        const open = force ?? !menu.classList.contains('open');

        // Move focus out before hiding the menu
        if (!open && menu.contains(document.activeElement)) {
            document.activeElement.blur();
        }

        menu.classList.toggle('open', open);
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open);
        menu.inert = !open;
    }

    btn.addEventListener('click', () => toggleMenu());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && toggleMenu(false));

    // Smoothly move the camera toward an object
    function flyTo(object, duration = 1000) {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3()).length();
        const dir = camera.position.clone().sub(center).normalize();
        const endPos = center.clone().add(dir.multiplyScalar(size * 1.5 + 2));

        const startPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const t0 = performance.now();

        (function step(now) {
            const t = Math.min((now - t0) / duration, 1);
            const k = t * t * (3 - 2 * t); // smoothstep
            camera.position.lerpVectors(startPos, endPos, k);
            controls.target.lerpVectors(startTarget, center, k);
            controls.update();
            if (t < 1) requestAnimationFrame(step);
        })(t0);
    }

    targets.forEach(({ label, object, modal }) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.textContent = label;
        b.addEventListener('click', () => {
            toggleMenu(false);
            if (!object) return console.warn('Not found:', label);

            if (modal) {
                handleHitboxClick(object.name);
            } else {
                flyTo(object);
            }
        });
        li.appendChild(b);
        list.appendChild(li);
    });

////////////////////////////////////////////////////////////////////Setting up the solid Colors//////////////////////////////////////////////////////////////////////
    const colorMap = {                               
        // Desk items
        0x111111: ['Charger', 'Fairylight_Wire', 'Arrow', 'Text'],

        // Snow globe
        0xfff: ['Snow'],
        0xadd8e6: ['Snow_Globe'],                

        // Clock
        0x02021D:['Long_lock_Hand', 'Short_Clock_Hand'],
        0xffffff: ['Clock_Background', 'Trash'],


        // Blinds & Rug
        0xC4A484: ['Blinds'],
        0xA6602B: ['Photoframe_Stand'],
        0xE8DDCE: ['Rug_rim'],

        // Text & Hitboxes (make hitboxes invisible)
        0x3A00A2: ['About_Me', 'My_Resume', 'My_Projects', 'Bullet_Point'],
        0x000000: ['About_Me_Hitbox', 'My_Resume_Hitbox', 'My_Projects_Hitbox', 'Cat_Hitbox',
                'Experience_Hitbox', 'Achievements_Hitbox', 'Gmail_Hitbox', 'Linkedin_Hitbox']   
        
    }

////////////////////////////////////////////////////////////////////Setting up the colors in piano/////////////////////////////////////////////////////////////////////
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            Object.keys(textureMap).forEach((key) => {
                if(child.name.includes(key)){
                    const material = new THREE.MeshBasicMaterial({map: loadedTexture.day[key]});
                    child.material = material;

                    if(child.material.map){
                        child.material.map.minFilter = THREE.LinearFilter;
                    }
                }
            });

            //Bulk color mapping — checks if the object name includes any keyword
            let colored = false;
            for (const [color, keywords] of Object.entries(colorMap)) {
                if (keywords.some(keyword => child.name.includes(keyword))) {
                    child.material = new THREE.MeshBasicMaterial({
                        color: parseInt(color)
                    });
                    colored = true;
                    break;
                }
            }

////////////////////////////////////////////////////////////////////Making up hitboxes invisible/////////////////////////////////////////////////////////////////////////
            if (child.name.includes('Hitbox')) {
                child.material = new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                });
                clickableHitboxes.push(child);
            }

            if (child.name.includes('Piano_Key')) {
                const match = child.name.match(/\d+/);
                const keyNumber = match ? parseInt(match[0]) : null;

                if (keyNumber !== null && keyNumber >= 1 && keyNumber <= 29) {
                    child.material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // white keys
                } else {
                    child.material = new THREE.MeshBasicMaterial({ color: 0x857E75 }); // black keys
                }
                colored = true;
                pianoKeys.push(child);
            }

////////////////////////////////////////////////////////////////////Setting up the photos for frames//////////////////////////////////////////////////////////////////////
            if (child.name.includes('Calcifer_Photo')) { // use your actual mesh name here
                child.material = new THREE.MeshBasicMaterial({
                    map: photoTextureCat,
                });
                colored = true;
            }

            if (child.name.includes('Grad_Photo')) {
                child.material = new THREE.MeshBasicMaterial({
                    map: photoTextureGrad,
                });
                colored = true;
            }

            if (child.name ==='Rug') {
                child.material = new THREE.MeshBasicMaterial({
                    map: photoTextureRug,
                });
                colored = true;
            }

            if (child.name ==='Monitor_Screen') {
                child.material = new THREE.MeshBasicMaterial({
                    map: photoTextureMonitor,
                });
                colored = true;
                const uv = child.geometry.attributes.uv;
                let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
                for (let i = 0; i < uv.count; i++) {
                    minU = Math.min(minU, uv.getX(i)); maxU = Math.max(maxU, uv.getX(i));
                    minV = Math.min(minV, uv.getY(i)); maxV = Math.max(maxV, uv.getY(i));
                }
                for (let i = 0; i < uv.count; i++) {
                    const u = (uv.getX(i) - minU) / (maxU - minU);
                    const v = (uv.getY(i) - minV) / (maxV - minV);
                    uv.setXY(i, u, v);
                }
                uv.needsUpdate = true;
            }

////////////////////////////////////////////////////////////////////Setting up the Calendar pt2////////////////////////////////////////////////////////////////////////////////
            if (child.name.includes('Calendar')) {
                normalizeUVs(child.geometry);

                child.material = new THREE.MeshBasicMaterial({
                    map: calendarCanvasTexture,
                    side: THREE.DoubleSide,
                    depthTest: false,   // the plane sits inside/behind the frame mesh, so skip the depth check
                    depthWrite: false,  // don't let the calendar block anything drawn after it
                });
                child.renderOrder = 999; // draw after the frame so the calendar ends up on top

                colored = true;
            }

////////////////////////////////////////////////////////////////////Setting up the snow globe////////////////////////////////////////////////////////////////////////////////            
            if (child.name.includes('Snow_Globe')) {
                child.material = new THREE.MeshPhysicalMaterial({
                    transmission: 1,       // how much light passes through (1 = fully transparent glass)
                    roughness: 0.159,          // 0 = perfectly smooth/clear, higher = frosted look
                    thickness: 0.1,        // affects refraction distortion — depends on real-world object scale
                    ior: 1.5,               // index of refraction (1.5 is typical for glass)
                    transparent: true,
                });
                colored = true;
                createSnow(child);
            }

            // Fallback — any remaining untextured objects get a default color
            if (!colored && !child.material.map) {
                child.material = new THREE.MeshBasicMaterial({
                    color: 0xcccccc // light grey default
                });
            }
        }
    });
    scene.add(glb.scene);
    const box = new THREE.Box3().setFromObject(glb.scene);
    //const center = 
    box.getCenter(new THREE.Vector3());
    //const size = 
    box.getSize(new THREE.Vector3());

    hidePreloader(); // hides the preloader once an interaction has been made
    },
////////////////////////////////////////////////////////////////////Setting up the progress bar//////////////////////////////////////////////////////////////////////////////
    (xhr) => {
    if (xhr.lengthComputable) {
      setProgress((xhr.loaded / xhr.total) * 90);
    }
  }
);

////////////////////////////////////////////////////////////////////Setting up the snow fall//////////////////////////////////////////////////////////////////////////////////
let snow, snowPositions, snowVelocities;
const SNOW_COUNT = 1500;
let globeRadius = 1;
let globeCenter = new THREE.Vector3();

function createSnow(globeMesh) {
    // Measure the globe so the snow fits regardless of your Blender scale
    const box = new THREE.Box3().setFromObject(globeMesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(globeCenter);
    globeRadius = Math.min(size.x, size.y, size.z) / 2 * 0.92; // 0.9 keeps flakes off the glass

    snowPositions = new Float32Array(SNOW_COUNT * 3);
    snowVelocities = new Float32Array(SNOW_COUNT); // per-flake fall speed

    for (let i = 0; i < SNOW_COUNT; i++) {
        resetFlake(i, true);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: globeRadius * 0.05, // snow size
        sizeAttenuation: true,
        map: makeFlakeTexture(),
        alphaTest: 0.3,        // cuts out the transparent corners of the sprite
        transparent: false,
        depthWrite: true,
    });

    snow = new THREE.Points(geometry, material);
    snow.renderOrder = 1;           // draw after the glass
    scene.add(snow);                // or globeMesh.parent.add(snow) to inherit transforms
}

// Random point inside the sphere
function resetFlake(i, anywhere = false) {
    const r = globeRadius;
    let x, y, z;

    if (anywhere) {
        // Initial fill: random point anywhere inside the sphere
        do {
            x = (Math.random() * 2 - 1) * r;
            y = (Math.random() * 2 - 1) * r;
            z = (Math.random() * 2 - 1) * r;
        } while (x * x + y * y + z * z > r * r);
    } else {
        // Respawn: pick a spot across the full width of the globe,
        // then place it at the dome's ceiling above that spot
        do {
            x = (Math.random() * 2 - 1) * r;
            z = (Math.random() * 2 - 1) * r;
        } while (x * x + z * z > r * r * 0.98);

        y = Math.sqrt(r * r - x * x - z * z) * 0.98;
    }

    snowPositions[i * 3]     = globeCenter.x + x;
    snowPositions[i * 3 + 1] = globeCenter.y + y;
    snowPositions[i * 3 + 2] = globeCenter.z + z;
    snowVelocities[i] = 0.15 + Math.random() * 0.25;
}

// Soft round flake sprite (otherwise points render as squares)
function makeFlakeTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

function updateSnow(delta, elapsed) {
    // snow per frame
    if (!snow) return;
    const r2 = globeRadius * globeRadius;

    for (let i = 0; i < SNOW_COUNT; i++) {
        const ix = i * 3;
        // Fall
        snowPositions[ix + 1] -= snowVelocities[i] * delta * globeRadius;
        // Gentle drift (each flake offset by its index so they don't sway in sync)
        snowPositions[ix]     += Math.sin(elapsed + i) * 0.02 * delta * globeRadius;
        snowPositions[ix + 2] += Math.cos(elapsed * 0.8 + i) * 0.02 * delta * globeRadius;

        // Respawn if below the floor or outside the sphere
        const dx = snowPositions[ix]     - globeCenter.x;
        const dy = snowPositions[ix + 1] - globeCenter.y;
        const dz = snowPositions[ix + 2] - globeCenter.z;
        if (dx*dx + dy*dy + dz*dz > r2) {
            resetFlake(i);
        }
    }
    snow.geometry.attributes.position.needsUpdate = true;
}

const timer = new THREE.Timer();

function animate(timestamp) {
    requestAnimationFrame(animate);

    timer.update(timestamp);              // pass the rAF timestamp in
    const delta = timer.getDelta();
    const elapsed = timer.getElapsed();

    updateSnow(delta, elapsed);
    renderer.render(scene, camera);
}
requestAnimationFrame(animate);           // start the loop

////////////////////////////////////////////////////////////////////Setting up the actions for hitbox////////////////////////////////////////////////////////////////////////////
const catMeow = new Audio('/sounds/Cat_Meow.wav'); // file in your public/ folder
catMeow.preload = 'auto';

function handleHitboxClick(name) {
    if (name.includes('My_Resume_Hitbox')) {
        document.querySelector('#resume-modal').classList.remove('hidden');
    } else if (name.includes('About_Me_Hitbox')) {
        document.querySelector('#about-me-modal').classList.remove('hidden');
    } else if (name.includes('My_Projects_Hitbox')) {
        document.querySelector('#projects-modal').classList.remove('hidden');
    } else if (name.includes('Experience_Hitbox')) {
        document.querySelector('#experience-modal').classList.remove('hidden');
    } else if (name.includes('Achievements_Hitbox')) {
        document.querySelector('#achievements-modal').classList.remove('hidden');
    } else if (name.includes('Linkedin_Hitbox')) {
        window.open('https://www.linkedin.com/in/gaurie-sharma/', '_blank');
    } else if (name.includes('Gmail_Hitbox')) {
        document.querySelector('#contact-modal').classList.remove('hidden');
    } else if (name.includes('Cat_Hitbox')) {
        catMeow.currentTime = 0; // restart so rapid clicks replay the sound
        catMeow.play().catch((err) => console.error('Audio failed:', err));
    }
}

////////////////////////////////////////////////////////////////////Setting up the modals///////////////////////////////////////////////////////////////////////////////////////////
document.querySelector('#contact-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    emailjs.send(serviceKEY, templateKEY, {
        from_name: document.querySelector('#from-name').value,
        to_name: 'Gaurie', 
        message: document.querySelector('#message').value,
        time: new Date().toLocaleString(), // optional, fills the {{time}} field
    }, emailKEY) // API key
    .then(() => {
        alert('Message sent! Thanks for reaching out.');
        document.querySelector('#contact-modal').classList.add('hidden');
        e.target.reset();
    })
    .catch((err) => {
        console.error('Email failed:', err);
        alert('Something went wrong — please try again.');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send';
    });
});


document.querySelector('#close-resume-modal').addEventListener('click', () => {
    document.querySelector('#resume-modal').classList.add('hidden');
});

document.querySelector('#close-about-me-modal').addEventListener('click', () => {
    document.querySelector('#about-me-modal').classList.add('hidden');
});

document.querySelector('#close-projects-modal').addEventListener('click', () => {
    document.querySelector('#projects-modal').classList.add('hidden');
});

document.querySelector('#close-experience-modal').addEventListener('click', () => {
    document.querySelector('#experience-modal').classList.add('hidden');
});

document.querySelector('#close-achievements-modal').addEventListener('click', () => {
    document.querySelector('#achievements-modal').classList.add('hidden');
});

document.querySelector('#close-contact-modal').addEventListener('click', () => {
    document.querySelector('#contact-modal').classList.add('hidden');
});


const MODAL_SELECTOR = '[id$="-modal"]:not([id^="close-"])';

function isAnyModalOpen() {
    return document.querySelector(`${MODAL_SELECTOR}:not(.hidden)`) !== null;
}
////////////////////////////////////////////////////////////////////Setting up the Clicks////////////////////////////////////////////////////////////////////////////////////
canvas.addEventListener('click', (event) => {
    if (isAnyModalOpen()) return;

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const hitboxIntersects = raycaster.intersectObjects(clickableHitboxes);
    if (hitboxIntersects.length > 0) {
        handleHitboxClick(hitboxIntersects[0].object.name);
        return;
    }

////////////////////////////////////////////////////////////////////Making sure the piano keys play when clicked///////////////////////////////////////////////////////////////
    const keyIntersects = raycaster.intersectObjects(pianoKeys);
    if (keyIntersects.length > 0) {
        const clicked = keyIntersects[0].object;
        const match = clicked.name.match(/\d+/);
        const keyNumber = match ? parseInt(match[0]) : null;
        if (keyNumber !== null) {
            playNote(getNoteForKey(keyNumber));
        }
    }
});

////////////////////////////////////////////////////////////////////Setting up the phone actions///////////////////////////////////////////////////////////////////////////////
canvas.addEventListener('touchstart', (event) => {
    if (isAnyModalOpen()) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
}, { passive: false });

canvas.addEventListener('touchend', (event) => {
    if (isAnyModalOpen()) return;
    event.preventDefault();
    raycaster.setFromCamera(pointer, camera);

    const hitboxIntersects = raycaster.intersectObjects(clickableHitboxes);
    if (hitboxIntersects.length > 0) {
        handleHitboxClick(hitboxIntersects[0].object.name);
        return;
    }

    const keyIntersects = raycaster.intersectObjects(pianoKeys);
    if (keyIntersects.length > 0) {
        const clicked = keyIntersects[0].object;
        const match = clicked.name.match(/\d+/);
        const keyNumber = match ? parseInt(match[0]) : null;
        if (keyNumber !== null) {
            playNote(getNoteForKey(keyNumber));
        }
    }
}, { passive: false });

//////// If you want to close the modal just click outside the modal window. This closes modal without clicking the close button./////////

// document.querySelectorAll(MODAL_SELECTOR).forEach((modal) => {
//     modal.addEventListener('click', (e) => {
//         if (e.target === modal) modal.classList.add('hidden');
//     });
// });

////////////////////////////////////////////////////////////////////Setting up the Camera opening position//////////////////////////////////////////////////////////////////////////
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, sizes.width / sizes.height, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls( camera, renderer.domElement );

controls.minDistance = 2;
controls.maxDistance = 35;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0.3;
controls.maxAzimuthAngle = Math.PI / 2;
controls.target.set(5.5, 26, -3.8);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

camera.position.set(150, 60, 150);
controls.update();

////////////////////////////////////////////////////////////////////Setting up the flex for screen//////////////////////////////////////////////////////////////////////////////////
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    //Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    //Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

camera.position.set( 36.136731587531884, 16.078256103108806, 14.082799943958182);
controls.target.set(4.844066275819448, 3.6864958912081693, -7.602374440330694);
controls.update();

////////////////////////////////////////////////////////////////////Setting up the renders//////////////////////////////////////////////////////////////////////////////////////////
const render = () => {
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
}

render();