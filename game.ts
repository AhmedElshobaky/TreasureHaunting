import {
    ACESFilmicToneMapping,
    AnimationClip,
    AnimationMixer,
    Clock,
    HemisphereLight,
    InterpolateSmooth,
    LoopOnce,
    MathUtils,
    Mesh,
    MirroredRepeatWrapping,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Quaternion,
    QuaternionKeyframeTrack,
    Scene, ShaderMaterial,
    SpotLight,
    TextureLoader,
    Vector3,
    VectorKeyframeTrack,
    WebGLRenderer,
    FogExp2
} from 'three';

import {Water} from './objects/water'
import {Sky} from "three/examples/jsm/objects/Sky";
import {garbageCollector} from "./game/garbageCollector";
import {moveCollectedBits} from "./game/physics";
import {
    coinUiElement as coinUiElement,
    nextLevel,
    nextLevelButton,
    progressUiElement,
    setProgress,
    lifeUiElement as lifeUiElement,
    showLevelEndScreen,
    startGameButton, startPanel,
    uiInit,
    updateLevelEndUI
} from './game/ui';
import {
    addBackgroundBit,
    addChallengeRow,
    challengeRows,
    coinModel,
    environmentBits,
    objectsInit,
    boatModel,
    starterBay
} from "./game/objects";
import {detectCollisions} from "./game/collisionDetection";

export const scene = new Scene();
export const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);



// Our three renderer
let renderer: WebGLRenderer;


export const destructionBits = new Array<Mesh>();

// Stores the current position of the camera, while the opening camera animation is playing
let cameraAngleStartAnimation = 0.00;

// The plane that shows our water
const waterGeometry = new PlaneGeometry(10000, 10000);

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new TextureLoader().load('static/normals/waternormals.jpeg', function (texture) {
            texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
        }),
        sunDirection: new Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog  !== undefined
    }
);
let leftPressed = false;
let rightPressed = false;


const sun = new Vector3();
const light = new HemisphereLight(0xffffff, 0x444444, 1.0);
light.position.set(0, 1, 0);
scene.add(light);
export const sceneConfiguration = {
    // flag: scene is ready
    ready: false,
    // flag: initial animation
    cameraStartAnimationPlaying: false,
    // flags: start game configuration
    cameraMovingToStartPosition: false,
    boatMoving: false,
    soundEnabled: false,
    // coin and life rotation speed
    rotationStep: 10,
    // track player progress between levels
    data: {
        coinsCollected: 0,
        lifesCollected: 0
    },
    // level progress
    courseLength: 500,
    courseProgress: 0,
    levelOver: false,
    level: 1,
    /// level progress 0.0 to 1.0.
    coursePercentComplete: () => (sceneConfiguration.courseProgress / sceneConfiguration.courseLength),

    /// How many 'columns' are in the scene
    columnsCount: 0,
    /// How many 'challenge rows' are in the scene
    challengeRowCount: 0,
    /// The current speed of the boat
    speed: 0.0
}

// resize window 
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    updateWaterMaterial()
}

// boat left and right constraints
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

// ANIMATION
const animate = () => {
    requestAnimationFrame(animate);
    if (leftPressed) {
        boatModel.position.x -= 0.5;
    }
    if (rightPressed) {
        boatModel.position.x += 0.5;
    }
    // Clamp the final position of the boat
    boatModel.position.x = clamp(boatModel.position.x, -20, 25);

    
    if (sceneConfiguration.boatMoving) {
        progressUiElement.style.width = String(sceneConfiguration.coursePercentComplete() * 200) + 'px';
        sceneConfiguration.speed += 0.001;
        sceneConfiguration.courseProgress += sceneConfiguration.speed;
        
        garbageCollector();
    }


    if (sceneConfiguration.ready) {
        if (boatModel.userData?.mixer != null) {
            boatModel.userData?.mixer?.update(boatModel.userData.clock.getDelta());
        }
        // ready camera animation 
        if (!sceneConfiguration.cameraStartAnimationPlaying) {
            camera.position.x = 20 * Math.cos(cameraAngleStartAnimation);
            camera.position.z = 20 * Math.sin(cameraAngleStartAnimation);
            camera.position.y = 30;
            camera.lookAt(boatModel.position);
            cameraAngleStartAnimation += 0.005;
            
        }

        // reset speed
        if (sceneConfiguration.levelOver) {
            if (sceneConfiguration.speed > 0) {
                sceneConfiguration.speed -= 0.1;
            }
        }


        destructionBits.forEach(mesh => {
            if (mesh.userData.clock && mesh.userData.mixer) {
                mesh.userData.mixer.update(mesh.userData.clock.getDelta());
            }
        });

        camera.userData?.mixer?.update(camera.userData?.clock?.getDelta());
        // game play logic
        if (sceneConfiguration.boatMoving) {
            // Detect if the boat has collided
            detectCollisions();
            // Move the columns towards the boat z position
            for (let i = 0; i < environmentBits.length; i++) {
                let mesh = environmentBits[i];
                mesh.position.z += sceneConfiguration.speed;
            }
            // Move the challenge rows towards the boat z position
            for (let i = 0; i < challengeRows.length; i++) {
                let mesh = challengeRows[i];
                mesh.rowParent.position.z += sceneConfiguration.speed;
                // Rotate the coins and lifes around thier y axis
                let children = mesh.rowParent.children;
                for (let child in children){
                    if (mesh.rowParent.children[child].name == 'coin'){
                    mesh.rowParent.children[child].rotateOnAxis(new Vector3(0, 0, 1), 0.01);
                    }else if (mesh.rowParent.children[child].name == 'life'){
                        mesh.rowParent.children[child].rotateOnAxis(new Vector3(0, 0, 1), 0.01);
                    }
                }
            }

            // creating new columns on the horizon
            if ((!environmentBits.length || environmentBits[0].position.z > -1300) && !sceneConfiguration.levelOver) {
                addBackgroundBit(sceneConfiguration.columnsCount++, true);
            }

            // creating new challenge row on the horizon
            if ((!challengeRows.length || challengeRows[0].rowParent.position.z > -1300) && !sceneConfiguration.levelOver) {
                addChallengeRow(sceneConfiguration.challengeRowCount++, true);
            }

            // If the starter bay hasn't already been removed from the scene, move it away from the player
            if (starterBay != null) {
                starterBay.position.z += sceneConfiguration.speed;
            }

            // If the starter bay is outside of the players' field of view, remove it from the scene
            if (starterBay.position.z > 200) {
                scene.remove(starterBay);
            }
        }

        // Call the function to relocate the current bits on the screen and move them towards the boat
        // so it looks like the boat is collecting them
        moveCollectedBits();
        // If the boat's progress equals the length of the course go to end level screen
        if (sceneConfiguration.courseProgress >= sceneConfiguration.courseLength) {
            if (!boatModel.userData.flyingAway) {
                endLevel(false);
            }
        }
        if (boatModel.userData.flyingAway) {
            showLevelEndScreen();
        }
    }
    updateWaterMaterial();
    renderer.render(scene, camera);
}

/// init the scene
async function init() {
    renderer = new WebGLRenderer();
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    startPanel.classList.remove('hidden');

    nextLevelButton.onclick = (event) => {
        nextLevel();
    }

    startGameButton.onclick = (event) => {
        // Indicate that the animation from the camera starting position to the rocket location is running
        sceneConfiguration.cameraStartAnimationPlaying = true;
        // Remove the red text on the life item, if it existed from the last level
        lifeUiElement.classList.remove('danger');
        // Show the heads up display (that shows coins collected, etc)
        document.getElementById('headsUpDisplay')!.classList.remove('hidden');

        // Create an animation mixer on the boat model
        camera.userData.mixer = new AnimationMixer(camera);
        // Create an animation from the cameras' current position to behind the rocket
        let track = new VectorKeyframeTrack('.position', [0, 2], [
            camera.position.x,
            camera.position.y,
            camera.position.z,
            0,
            30,
            100,
        ], InterpolateSmooth);

        // Create a Quaternion rotation for the "forwards" position on the camera
        let identityRotation = new Quaternion().setFromAxisAngle(new Vector3(-1, 0, 0), .3);

        // Create an animation clip that begins with the cameras' current rotation, and ends on the camera being
        // rotated towards the game space
        let rotationClip = new QuaternionKeyframeTrack('.quaternion', [0, 2], [
            camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w,
            identityRotation.x, identityRotation.y, identityRotation.z, identityRotation.w
        ]);

        // Associate both KeyFrameTracks to an AnimationClip, so they both play at the same time
        const animationClip = new AnimationClip('animateIn', 4, [track, rotationClip]);
        const animationAction = camera.userData.mixer.clipAction(animationClip);
        animationAction.setLoop(LoopOnce, 1);
        animationAction.clampWhenFinished = true;

        camera.userData.clock = new Clock();
        camera.userData.mixer.addEventListener('finished', function () {
            // Make sure the camera is facing in the right direction
            camera.lookAt(new Vector3(0, -500, -1400));
            // change boat flag
            sceneConfiguration.boatMoving = true;
        });

        // Play the animation
        camera.userData.mixer.clipAction(animationClip).play();
        // Remove the "start panel" from view
        startPanel.classList.add('hidden');
    }

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);


    setProgress('Scene loaded!');
    document.getElementById('loadingCover')?.remove();
    document.getElementById('loadingTextContainer')?.remove();
    document.getElementById('piratePicture')?.remove();

    // Water
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = 0;

    scene.add(water);
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    // Set up variables to control the look of the sky
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 3,
        azimuth: 115
    };

    const pmremGenerator = new PMREMGenerator(renderer);

    const phi = MathUtils.degToRad(90- parameters.elevation);
    const theta = MathUtils.degToRad(180-parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    (water.material as ShaderMaterial).uniforms['sunDirection'].value.copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky as any).texture;


    (water.material as ShaderMaterial).uniforms['speed'].value = 0.0;


    // Create some lighting for the foreground of the scene
    const shadowLight = new SpotLight();
    shadowLight.lookAt(boatModel.position);
    shadowLight.position.z = 50;
    shadowLight.position.y = 100;
    shadowLight.position.x = 100;
    shadowLight.castShadow = true;
    scene.add(shadowLight);

    // Set the appropriate scale for our boat model
    boatModel.scale.set(0.3, 0.3, 0.3);
    scene.add(boatModel);
    sceneConfiguration.ready = true;
    sceneSetup(sceneConfiguration.level);
}

export const endLevel = (damaged: boolean) => {
    updateLevelEndUI(damaged);
    sceneConfiguration.boatMoving = false;
    sceneConfiguration.levelOver = true;
    boatModel.userData.flyingAway = true;
    destructionBits.forEach(x => {
        scene.remove(x);
    });
    destructionBits.length = 0;
}

export function updateWaterMaterial() {
    (water.material as ShaderMaterial).uniforms['time'].value += 1 / 60.0;
    if (sceneConfiguration.boatMoving) {
        (water.material as ShaderMaterial).uniforms['speed'].value += sceneConfiguration.speed / 50;
    }
}

function onKeyDown(event: KeyboardEvent) {
    console.log('keypress');
    let keyCode = event.which;
    if (keyCode == 37 || keyCode == 65) {
        leftPressed = true;
    } else if (keyCode == 39 || keyCode == 68) {
        rightPressed = true;
    }
}

function onKeyUp(event: KeyboardEvent) {
    let keyCode = event.which;
    if (keyCode == 37 || keyCode == 65) {
        leftPressed = false;
    } else if (keyCode == 39 || keyCode == 68) {
        rightPressed = false;
    }
}

export const sceneSetup = (level: number) => {
    // Remove all references to old "challenge rows" and background bits
    sceneConfiguration.challengeRowCount = 0;
    sceneConfiguration.columnsCount = 0;
    // Reset the camera position back to slightly infront of the boat, for the start-up animation
    camera.position.z = 50;
    camera.position.y = 12;
    camera.position.x = 15;
    camera.rotation.y = 2.5;

    // Add the starter bay to the scene (the sandy shore with the rocks around it)
    scene.add(starterBay);

    // Set the starter bay position to be close to the ship
    starterBay.position.copy(new Vector3(10, 0, 120));
    starterBay.scale.set(3,1, 1);
    starterBay.position.x = 20;

    // Rotate the boat model back to the correct orientation to play the level
    boatModel.scale.set(0.45, 0.45, 0.45);
    boatModel.rotation.set(MathUtils.degToRad(-90), 0,0);
    // Set the location of the boat model to be within the starter bay
    boatModel.position.z = 60;
    boatModel.position.y = 0;
    boatModel.position.x = 0;

    // Remove any existing challenge rows from the scene
    challengeRows.forEach(x => {
        scene.remove(x.rowParent);
    });

    // Remove any existing environment bits from the scene
    environmentBits.forEach(x => {
        scene.remove(x);
    })

    // Setting the length of these arrays to zero clears the array of any values
    environmentBits.length = 0;
    challengeRows.length = 0;

    // Render some challenge rows and background bits into the distance
    for (let i = 0; i < 60; i++) {
        addChallengeRow(sceneConfiguration.challengeRowCount++);
        addBackgroundBit(sceneConfiguration.columnsCount++);
    }


    // Indicates that the animation where the camera flies from the current position isn't playing
    sceneConfiguration.cameraStartAnimationPlaying = false;
    // The level isn't over (we just started it)
    sceneConfiguration.levelOver = false;
    // The boat isn't flying away
    boatModel.userData.flyingAway = false;
    // Resets the current progress of the course to 0, as we haven't yet started the level we're on
    sceneConfiguration.courseProgress = 0;
    // Sets the length of the course based on our current level
    sceneConfiguration.courseLength = 1000 * level;

    // Reset how many things we've collected in this level to zero
    sceneConfiguration.data.lifesCollected = 0;
    sceneConfiguration.data.coinsCollected = 0;

    // Updates the UI to show how many things we've collected to zero.
    coinUiElement.innerText = String(sceneConfiguration.data.coinsCollected);
    lifeUiElement.innerText = String(sceneConfiguration.data.lifesCollected);

    // Sets the current level ID in the UI
    document.getElementById('levelIndicator')!.innerHTML = `<p>LEVEL ${sceneConfiguration.level} </p>`;
    // Indicates that the scene setup has completed, and the scene is now ready
    sceneConfiguration.ready = true;
}


objectsInit().then(x => {
    uiInit();
    init();
    animate();
})


