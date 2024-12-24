// script.js

// Import Three.js and Addons
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize variables
let scene, camera, renderer, controls;
let snowflakes = [];
let isSecretMode = false;

// Audio elements
const backgroundMusic = document.getElementById('background-music');
const secretMusic = document.getElementById('secret-music');
// secretMusic.loop = true;

// Initialize the scene
function init() {
    // Create Scene
    scene = new THREE.Scene();

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a3c, 1); // Dark blue background
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: Choose shadow type
    document.getElementById('container').appendChild(renderer.domElement);

    // Create Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    // Initial camera position will be set in animate()

    // Controls (optional for user interaction)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // For smoother controls
    controls.dampingFactor = 0.05;
    controls.enableRotate = false; // Disable manual rotation to control camera programmatically

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ambientLight.name = 'ambient-light';
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(50, 50, 50);
    pointLight.castShadow = true; // Enable shadow casting
    pointLight.name = 'point-light';
    scene.add(pointLight);

    // Create Tree with decorations
    createTree();

    // Create Gifts
    createGifts();

    // Create Snowflakes
    createSnowflakes();

    // Create Ground for snow pile
    // createGround();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start background music (user interaction may be required to play audio)
    backgroundMusic.volume = 0.3;
    backgroundMusic.play().catch(error => {
        console.log("Autoplay prevented. User interaction required to play music.");
    });

    // Randomly decide if it's secret mode
    checkSecretMode();

    // Start Animation
    animate();
}

// Function to create the tree with multiple layers, trunk, and a star topper
function createTree() {
    // Parameters for tree layers
    const layerCount = THREE.MathUtils.randInt(3, 5); // Number of cone layers
    const baseHeight = THREE.MathUtils.randFloat(20, 25); // Total height of the tree
    const baseRadius = THREE.MathUtils.randFloat(10, 15); // Base radius of the tree
    const layerHeight = baseHeight / layerCount; // Height per layer
    const layerOverlap = 1.5; // How much each layer overlaps with the one below

    // Material for the tree layers (varying green shades)
    const treeMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0, THREE.MathUtils.randFloat(0.5, 1.0), 0),
        flatShading: true
    });

    // Keep track of cumulative height to position layers without gaps
    let cumulativeHeight = 0;

    // Create each layer of the tree
    for (let i = 0; i < layerCount; i++) {
        const currentHeight = layerHeight; // Uniform height for simplicity
        const currentRadius = baseRadius * (1 - i * 0.15); // Decreasing radius for upper layers

        const geometry = new THREE.ConeGeometry(currentRadius, currentHeight, 32);
        const layer = new THREE.Mesh(geometry, treeMaterial);
        layer.name = 'tree-layer'; // Assign a name for easier identification

        // Position the layer with overlap
        layer.position.y = cumulativeHeight + currentHeight / 2 - layerOverlap;
        cumulativeHeight += currentHeight - layerOverlap; // Subtract overlap to ensure layers touch

        layer.castShadow = true; // Tree layers cast shadows
        layer.receiveShadow = true; // Optional: If you want layers to receive shadows

        scene.add(layer);

        // Add ornaments to the layer
        addOrnaments(layer, i);

        // Add fairy lights to the layer
        addFairyLights(layer);
    }

    // Create the trunk
    const trunkHeight = baseHeight * 0.2; // 20% of baseHeight
    const trunkRadius = baseRadius * 0.2; // 20% of baseRadius
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 32);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown color for trunk
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = cumulativeHeight - trunkHeight / 2 - layerOverlap; // Position it directly on the ground
    trunk.name = 'tree-trunk'; // Assign a name for easier identification
    trunk.castShadow = true; // Trunk casts shadows
    trunk.receiveShadow = true; // Trunk receives shadows
    scene.add(trunk);

    // Create the star topper
    const starGeometry = new THREE.SphereGeometry(1.5, 16, 16); // Increased size for visibility
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // Gold color for star
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.y = cumulativeHeight + 1.5; // Slightly above the top layer
    star.name = 'star-topper'; // Assign a name for easier identification
    scene.add(star);

    // Optional: Add slight rotation to the star for dynamic effect
    star.rotation.y = THREE.MathUtils.degToRad(THREE.MathUtils.randInt(0, 360));
}

// Function to add ornaments to a given tree layer
function addOrnaments(layerMesh, layerIndex) {
    const ornamentCount = THREE.MathUtils.randInt(5, 10); // Number of ornaments per layer
    const layerRadius = layerMesh.geometry.parameters.radius; // Current layer radius
    const layerHeight = layerMesh.geometry.parameters.height; // Current layer height

    for (let i = 0; i < ornamentCount; i++) {
        const ornamentGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const ornamentMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            emissive: 0x000000
        });
        const ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);
        ornament.name = 'ornament'; // Assign a name for easier identification

        // Random position within the current layer
        const theta = THREE.MathUtils.degToRad(Math.random() * 360);
        const radius = THREE.MathUtils.randFloat(0.5, layerRadius - 1);
        const yOffset = THREE.MathUtils.randFloat(-layerHeight / 2 + 0.5, layerHeight / 2 - 0.5);

        ornament.position.set(
            radius * Math.cos(theta),
            yOffset + layerMesh.position.y,
            radius * Math.sin(theta)
        );

        // Slight variation in ornament size
        const scale = THREE.MathUtils.randFloat(0.8, 1.2);
        ornament.scale.set(scale, scale, scale);

        // Add some emissive property to make ornaments glow slightly
        ornament.material.emissiveIntensity = 0.2;

        ornament.castShadow = true; // Ornaments cast shadows
        ornament.receiveShadow = true; // Ornaments receive shadows

        scene.add(ornament);
    }
}

// Function to add fairy lights to the tree layer
function addFairyLights(layerMesh) {
    const lightCount = THREE.MathUtils.randInt(10, 20); // Number of lights per layer

    for (let i = 0; i < lightCount; i++) {
        const light = new THREE.PointLight(0xffffff, 0.5, 5, 2);
        light.color.setHSL(Math.random(), 1, 0.5); // Random color

        // Position the light randomly within the layer
        const theta = THREE.MathUtils.degToRad(Math.random() * 360);
        const radius = THREE.MathUtils.randFloat(0.5, layerMesh.geometry.parameters.radius - 0.5);
        const yOffset = THREE.MathUtils.randFloat(-layerMesh.geometry.parameters.height / 2 + 0.5, layerMesh.geometry.parameters.height / 2 - 0.5);

        light.position.set(
            radius * Math.cos(theta),
            yOffset + layerMesh.position.y,
            radius * Math.sin(theta)
        );

        light.name = 'fairy-light'; // Assign a name for easier identification
        scene.add(light);
    }
}

// Function to create random gifts
function createGifts() {
    const giftCount = THREE.MathUtils.randInt(20, 30);
    const giftGeometry = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < giftCount; i++) {
        // Random color
        const giftColor = new THREE.Color(Math.random(), Math.random(), Math.random());

        const giftMaterial = new THREE.MeshPhongMaterial({ color: giftColor });
        const gift = new THREE.Mesh(giftGeometry, giftMaterial);
        gift.name = 'gift'; // Assign a name for easier identification

        // Random position around the tree
        const radius = THREE.MathUtils.randFloat(5, 15);
        const theta = THREE.MathUtils.degToRad(Math.random() * 360);
        const height = THREE.MathUtils.randFloat(0, 20); // Positioned on or above ground

        gift.position.set(
            radius * Math.cos(theta),
            height,
            radius * Math.sin(theta)
        );

        // Slightly scale the gifts
        const scale = THREE.MathUtils.randFloat(0.5, 1.5);
        gift.scale.set(scale, scale, scale);

        // Assign rotation speed and direction
        gift.userData = {
            rotationSpeed: THREE.MathUtils.randFloat(0.005, 0.02),
            rotationDirection: Math.random() > 0.5 ? 1 : -1 // Randomly choose direction
        };

        gift.castShadow = true; // Gifts cast shadows
        gift.receiveShadow = true; // Gifts receive shadows

        // Add to scene
        scene.add(gift);
    }
}

// Function to create snowflakes
function createSnowflakes() {
    const snowflakeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const snowflakeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 200; i++) {
        const snowflake = new THREE.Mesh(snowflakeGeometry, snowflakeMaterial);
        snowflake.position.set(
            THREE.MathUtils.randFloatSpread(100),
            THREE.MathUtils.randFloat(50, 100),
            THREE.MathUtils.randFloatSpread(100)
        );
        snowflake.velocity = THREE.MathUtils.randFloat(0.1, 0.5);
        snowflake.name = 'snowflake'; // Assign a name for easier identification
        scene.add(snowflake);
        snowflakes.push(snowflake);
    }
}

// Function to create the ground for snow pile
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide }); // White color to represent snow
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0; // Ground plane at y = 0
    ground.receiveShadow = true; // Ensure it can receive shadows if shadows are enabled
    ground.name = 'ground'; // Assign a name for easier identification
    scene.add(ground);
}

// Function to handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Function to check if secret mode should be activated
function checkSecretMode() {
    // Define a small probability to enter secret mode
    const chance = 0.1; // 10% chance
    if (Math.random() < chance) {
        isSecretMode = true;
        activateSecretMode();
    }
}

// Function to activate secret mode
function activateSecretMode() {
    // Change music
    backgroundMusic.pause();
    secretMusic.volume = 0.5;
    secretMusic.play().catch(error => {
        console.log("Autoplay prevented. User interaction required to play music.");
    });

    // Change lighting to flashing ballroom lightning
    // Toggle point light intensity rapidly
    setInterval(() => {
        scene.children.forEach(child => {
            if (child.type === "PointLight") {
                child.intensity = child.intensity === 1 ? 5 : 1;
            }
        });
    }, 500);
}

// Camera rotation parameters
let cameraAngle = 0; // Initial angle in radians
const cameraRadius = 50; // Distance from the origin
const cameraInclination = THREE.MathUtils.degToRad(70); // 30 degrees from the Y-axis
const cameraRotationSpeed = 0.001; // Slow rotation speed (increment per frame)

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update camera angle
    cameraAngle += cameraRotationSpeed;

    // Calculate camera position using spherical coordinates
    const x = cameraRadius * Math.sin(cameraInclination) * Math.sin(cameraAngle);
    const y = cameraRadius * Math.cos(cameraInclination);
    const z = cameraRadius * Math.sin(cameraInclination) * Math.cos(cameraAngle);

    camera.position.set(x, y, z);
    camera.lookAt(new THREE.Vector3(0, 5, 0)); // Look slightly above the ground

    // Animate gifts rotating in the opposite direction
    scene.traverse((object) => {
        // Ensure the object has a geometry property before accessing its type
        if (object.geometry && object.geometry.type === 'BoxGeometry' && object.userData.rotationSpeed) {
            object.rotation.y -= object.userData.rotationSpeed * object.userData.rotationDirection; // Reverse rotation direction
        }
    });

    // Animate snowflakes
    snowflakes.forEach(snowflake => {
        snowflake.position.y -= snowflake.velocity;
        if (snowflake.position.y < 0.1) { // Reset to above ground
            snowflake.position.y = THREE.MathUtils.randFloat(50, 100);
            snowflake.position.x = THREE.MathUtils.randFloatSpread(100);
            snowflake.position.z = THREE.MathUtils.randFloatSpread(100);
        }
    });

    // Update controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// Start the scene
init();