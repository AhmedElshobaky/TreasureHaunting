import {Group, MathUtils, Object3D} from "three";
import {scene, sceneConfiguration} from "../game";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {setProgress} from "./ui";

export const environmentBits = new Array<Object3D>();

export const challengeRows = new Array<ChallengeRow>();
export let boatModel: Object3D;
export let starterBay: Group;
export let columnsModel: Object3D;
export let coinModel: Object3D;
export let rockModel: Object3D;
export let lifeModel: Object3D;

const gltfLoader = new GLTFLoader();


const boatGLTF = 'static/models/boat/scene.gltf';
const columnsGLTF = 'static/models/columns/scene.gltf';
const coinGLTF = 'static/models/coin/scene.gltf';
const rockGLTF = 'static/models/rock/scene.gltf';
const lifeGLTF = 'static/models/life/scene.gltf';
const starterBayGLTF = 'static/models/start_bay/scene.gltf';


export const objectsInit = async () => {
    setProgress('Loading columns model...');
    columnsModel = (await gltfLoader.loadAsync(columnsGLTF)).scene.children[0];
    setProgress('Loading coin model...');
    coinModel = (await gltfLoader.loadAsync(coinGLTF)).scene.children[0];
    setProgress('Loading rock model...');
    rockModel = (await gltfLoader.loadAsync(rockGLTF)).scene.children[0];
    setProgress('Loading lifes model...');
    lifeModel = (await gltfLoader.loadAsync(lifeGLTF)).scene.children[0];
    setProgress('Loading boat model ...');
    boatModel = (await gltfLoader.loadAsync(boatGLTF)).scene.children[0];
    setProgress('Loading starter bay...');
    starterBay = (await gltfLoader.loadAsync(starterBayGLTF)).scene;
}

export const addBackgroundBit = (count: number, horizonSpawn: boolean = false) => {
    // Work out how far away this background bit should be
    let zOffset = (horizonSpawn ? -1400 : -(60 * count));
    // Create a copy of our original column model
    let thisColumn = columnsModel.clone();
    // Set the scale appropriately for the scene
    thisColumn.scale.set(1, 1, 1);
    // Set the position of the columns one to the left and the other to the right
    thisColumn.position.set(count % 2 == 0 ? 60 - Math.random() : -60 - Math.random(), -10, zOffset);
    // Rotate the column to a better angle
    thisColumn.rotation.set(MathUtils.degToRad(-90), 0, Math.random());
    // Finally, add the column to the scene
    scene.add(thisColumn);
    // Add the column to the beginning of the environmentBits array to keep track of them (so we can clean up later)
    environmentBits.unshift(thisColumn);// add to beginning of array
}

export const addChallengeRow = (count: number, horizonSpawn: boolean = false) => {
    // Work out how far away this challenge row should be
    let zOffset = (horizonSpawn ? -1400 : -(count * 60));
    // Create a Group for the objects
    let rowGroup = new Group();
    rowGroup.position.z = zOffset;
    for (let i = 0; i < 5; i++) {

        const random = Math.random() * 10;

        // If it's less than 2, create a coin
        if (random < 2) {
            let coin = addCoin(i);
            coin.name = 'coin';
            rowGroup.add(coin);

        }
        // If it's less than 4, spawn a rock
        else if (random < 4) {
            let rock = addRock(i);
            rock.name = 'rock';
            rowGroup.add(rock);
        }
       // but if it's more than 9, spawn a life
        else if (random > 9) {
            let life = addLife(i);
            life.name = 'life';
            rowGroup.add(life);
        }
    }
    // Add the row to the challengeRows array to keep track of it, and so we can clean them up later
    challengeRows.unshift({rowParent: rowGroup, index: sceneConfiguration.challengeRowCount++});
    // add the row to the scene
    scene.add(rowGroup);
}
const addCoin = (rowCell: number) => {
    let coin = coinModel.clone();
    coin.position.x = rowCell * 11 - 20;
    coin.position.y = 8;
    coin.scale.set(200, 200, 200);
    coin.userData.objectType = ObjectType.COIN;
    return coin;
}
const addRock = (rowCell: number) => {
    let rock = rockModel.clone();
    rock.position.x = rowCell * 11 - 20;
    rock.scale.set(5, 5, 5);
    rock.position.y = 3;
    rock.rotation.set(MathUtils.degToRad(-270), 0,0);
    rock.userData.objectType = ObjectType.ROCK;
    return rock;
}
const addLife = (rowCell: number) => {
    let life = lifeModel.clone();
    life.position.x = rowCell * 11 - 20;
    life.position.y = 8;
    life.userData.objectType = ObjectType.LIFE;
    life.scale.set(0.08, 0.08, 0.08);
    return life;
}

export enum ObjectType {
    ROCK,
    COIN,
    LIFE
}

interface ChallengeRow {
    index: number;
    rowParent: Group;
}
