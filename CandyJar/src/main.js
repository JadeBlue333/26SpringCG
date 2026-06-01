import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as CANNON from 'cannon-es';

const app = document.querySelector('#app');
const memoryForm = document.querySelector('#memoryForm');
const memoryImageInput = document.querySelector('#memoryImageInput');
const memoryTextInput = document.querySelector('#memoryTextInput');

// Scene / 씬
const scene = new THREE.Scene();

scene.background = new THREE.Color('#151515');

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

camera.position.set(0, 1.3, 5);
camera.lookAt(0, 0.3, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

// Lights / 조명

scene.add(
  new THREE.AmbientLight(
    0xffffff,
    2
  )
);

const keyLight =
  new THREE.DirectionalLight(
    0xffffff,
    5
  );

keyLight.position.set(
  5,
  8,
  5
);

scene.add(keyLight);

keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;

// desk / 유리병을 둔 책상
const desk = new THREE.Mesh(
  new THREE.BoxGeometry(5, 0.12, 2),
  new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.7,
    metalness: 0.1
  })
);

desk.position.set(0, -1.2, 0);
desk.receiveShadow = true;
scene.add(desk);

// colliders part. got help from ai ----------------

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 10;

const candyMaterial = new CANNON.Material('candy');
const jarMaterial = new CANNON.Material('jar');

const candyJarContact = new CANNON.ContactMaterial(
  candyMaterial,
  jarMaterial,
  {
    // Lower friction lets candies slide along the glass more easily.
    friction: 0.1,

    // Restitution controls bounce
    restitution: 0.2
  }
);

const candyContact = new CANNON.ContactMaterial(
  candyMaterial,
  candyMaterial,
  {
    friction: 0.15,
    restitution: 0.35
  }
);

world.addContactMaterial(candyJarContact);
world.addContactMaterial(candyContact);

const deskBody = new CANNON.Body({ mass: 0, material: jarMaterial });
const deskHalfExtents = new CANNON.Vec3(5 / 2, 0.12 / 2, 2 / 2);
const deskShape = new CANNON.Box(deskHalfExtents);
deskBody.addShape(deskShape);
deskBody.position.set(desk.position.x, desk.position.y, desk.position.z);
world.addBody(deskBody);

// function to create a Cannon.js Trimesh from a Three.js geometry.
function createTrimesh(geometry, scale = 1) {
  // Trimesh is useful for irregular objects
  const pos = geometry.attributes.position.array;
  const vertices = new Float32Array(pos.length);

  for (let i = 0; i < pos.length; i++) {
    vertices[i] = pos[i] * scale;
  }

  let indices;
  if (geometry.index) {
    indices = Array.from(geometry.index.array);
  } else {
    const count = geometry.attributes.position.count;
    indices = Array.from({ length: count }, (_, i) => i);
  }

  return new CANNON.Trimesh(Array.from(vertices), indices);
}

// ---------------------------------------------------------

const dragInfo = document.createElement('div');
const dragInfoImage = document.createElement('img');
const dragInfoText = document.createElement('div');

Object.assign(dragInfo.style, {
  position: 'fixed',
  display: 'none',
  pointerEvents: 'none',
  background: 'transparent',
  color: 'white',
  padding: '0',
  borderRadius: '0',
  fontFamily: "'Mona12', system-ui, sans-serif",
  fontSize: '16px',
  maxWidth: '320px',
  zIndex: '1001',
  alignItems: 'center',
  gap: '12px'
});


Object.assign(dragInfoImage.style, {
  width: '120px',
  height: '120px',
  objectFit: 'cover',
  borderRadius: '8px',
  flexShrink: '0',
  boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
});

Object.assign(dragInfoText.style, {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '16px'
});

dragInfo.appendChild(dragInfoImage);
dragInfo.appendChild(dragInfoText);
document.body.appendChild(dragInfo);

const dragState = {
  active: false,
  candy: null,
  body: null,
  plane: new THREE.Plane(),
  offset: new THREE.Vector3(),
  intersection: new THREE.Vector3()
};

// Memories / 추억 데이터

const memories = [
  {
    image: '/26SpringCG/CandyJar/public/assets/memory01.jpg',
    text: 'My first solo trip to Grindelwald, Switzerland.'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory02.jpg',
    text: 'Cup noodles I used to eat with my high school roommate when we were not supposed to.'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory03.jpg',
    text: 'That time I got a surgery and I was alone in the hospital room for days.'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory04.jpg',
    text: 'My puppy when she was a baby.'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory05.jpg',
    text: 'Hot chocolate in Iceland while waiting for the Northern Lights to show up but they never came...'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory06.jpg',
    text: 'Me and my friend on a summer day at the beach in Nice, France.'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory07.jpg',
    text: 'School festival day in Sogang. We had fried chicken watching the performance.'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory08.jpg',
    text: 'My friend made a sandwhich for us in the morning after a night out.'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory09.jpg',
    text: 'I was invited to a dinner by my friend, and he cooked a salmon steak with his girlfriend. They can sell it at a restaurant!!'
  },
  {
    image: '/26SpringCG/CandyJar/public/assets/memory10.jpg',
    text: 'My favorite crepe place in Tokyo. Me and my friend went there to charge energy after a long day of walking around the city.'
  }
];

// Jar / 유리병

const objLoader = new OBJLoader();

objLoader.load(
  '/26SpringCG/CandyJar/public/glassJar.obj',

  (jar) => {

    const jarBody = new CANNON.Body({
      mass: 0,
      material: jarMaterial
    });

    jar.traverse((child) => {

      if (child.isMesh) {
        // glass-like material with help from ai.
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.08,
          transmission: 0.1,
          roughness: 0.02,
          metalness: 0,
          ior: 1.55,
          thickness: 1.1,
          clearcoat: 1,
          clearcoatRoughness: 0,
          reflectivity: 1,
          envMapIntensity: 1.5,
          sheen: 0.6,
          sheenRoughness: 0.15,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        child.renderOrder = 2;
        child.castShadow = true;
        child.receiveShadow = true;

        // create collider shape for each mesh in the jar model and add to the jar body
        const shape = createTrimesh(child.geometry, 0.15);
        const offset = new CANNON.Vec3(child.position.x, child.position.y, child.position.z);
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(child.rotation.x, child.rotation.y, child.rotation.z, 'XYZ');
        jarBody.addShape(shape, offset, quat);
      }
    });

    jar.scale.setScalar(0.15);
    jar.rotation.x = -Math.PI / 2;
    jar.position.y = -1;
    scene.add(jar);

    jarBody.position.set(jar.position.x, jar.position.y, jar.position.z);
    jarBody.quaternion.setFromEuler(jar.rotation.x, jar.rotation.y, jar.rotation.z, 'XYZ');
    world.addBody(jarBody);
  }
);

// Candies / 캔디

const candies = [];

// initial candies
function getCandyStartPosition() {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 0.25,
    -0.5 + Math.random() * 0.35,
    (Math.random() - 0.5) * 0.25
  );
}

// new candies
function getCandyDropPosition() {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 0.18,
    0.54,
    (Math.random() - 0.5) * 0.18
  );
}

function createCandy(memory, position = getCandyStartPosition()) {
  const candy =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.12,
        32,
        32
      ),

      new THREE.MeshPhysicalMaterial({

        color:
          new THREE.Color()
          .setHSL(
            Math.random(),
            1.0,
            0.7
          ),

        transmission: 0.8,

        roughness: 0,

        thickness: 0.3

      })

    );

  candy.position.copy(position);

  candy.scale.setScalar(0.85);

  candy.userData.memory = memory;

  const radius = 0.12 * 0.85;
  const candyBody = new CANNON.Body({
    mass: 0.18,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(candy.position.x, candy.position.y, candy.position.z),
    material: candyMaterial,
    linearDamping: 0.2,
    angularDamping: 0.4
  });

  world.addBody(candyBody);
  candy.userData.body = candyBody;

  candy.castShadow = true;
  candy.receiveShadow = true;
  scene.add(candy);

  candies.push(candy);

  return candy;
}

// create initial candies with memories array
for(let i = 0; i < 10; i++){
  createCandy(
    memories[
      i % memories.length
    ]
  );
}

// push new candy with 'fill your jar' button
memoryForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const imageFile = memoryImageInput.files[0];
  const text = memoryTextInput.value.trim();

  if (!imageFile || !text) return;

  const memory = {
    image: URL.createObjectURL(imageFile),
    text
  };

  memories.push(memory);
  createCandy(memory, getCandyDropPosition());

  memoryForm.reset();
});

// Picking & Dragging / 선택과 드래그

const raycaster =
  new THREE.Raycaster();

const mouse =
  new THREE.Vector2();

function updateDragInfoPosition(clientX, clientY) {
  dragInfo.style.left = `${Math.min(clientX + 16, window.innerWidth - 240)}px`;
  dragInfo.style.top = `${Math.min(clientY + 16, window.innerHeight - 120)}px`;
}

window.addEventListener('pointerdown', (event) => {
  if (event.target.closest('.memory-form')) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(candies);

  if (hits.length) {
    const candy = hits[0].object;
    const body = candy.userData.body;

    dragState.active = true;
    dragState.candy = candy;
    dragState.body = body;

    const point = hits[0].point;

    dragState.plane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()).negate(),
      point
    );
    dragState.offset.copy(point).sub(candy.position);

    body.type = CANNON.Body.KINEMATIC;
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);

    dragInfoImage.src = candy.userData.memory.image;
    dragInfoText.textContent = candy.userData.memory.text;
    dragInfo.style.display = 'flex';
    updateDragInfoPosition(event.clientX, event.clientY);

    event.preventDefault();
  }
});

window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (!dragState.active || !dragState.candy) return;

  updateDragInfoPosition(event.clientX, event.clientY);

  raycaster.setFromCamera(mouse, camera);
  if (raycaster.ray.intersectPlane(dragState.plane, dragState.intersection)) {
    const target = dragState.intersection.sub(dragState.offset);
    dragState.body.position.copy(target);
    dragState.body.velocity.set(0, 0, 0);
    dragState.body.angularVelocity.set(0, 0, 0);
  }
});

window.addEventListener('pointerup', () => {
  if (!dragState.active) return;

  dragState.body.type = CANNON.Body.DYNAMIC;
  dragState.active = false;
  dragState.candy = null;
  dragState.body = null;
  dragInfo.style.display = 'none';
});

const clock =
  new THREE.Clock();

function animate() {

  requestAnimationFrame(
    animate
  );

  const delta = Math.min(clock.getDelta(), 1 / 30);
  world.step(1 / 60, delta, 3);

  candies.forEach((candy) => {
    // Copy Cannon.js physics positions back to Three.js meshes every frame!!
    const body = candy.userData.body;
    candy.position.copy(body.position);
    candy.quaternion.copy(body.quaternion);
  });

  renderer.render(
    scene,
    camera
  );
}

animate();

// Resize / 화면 크기 변경

window.addEventListener(
  'resize',
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);
