import {scene} from "../game";
import {challengeRows, environmentBits} from "./objects";

export const garbageCollector = () => {
    let environmentObjectsForCollection = environmentBits.filter(x => x.position.z > 100);
    let challengeRowsForCollection = challengeRows.filter(x => x.rowParent.position.z > 100);

    for (let i = 0; i < environmentObjectsForCollection.length - 1; i++) {
        let environmentObjectIndex = environmentBits.indexOf(environmentObjectsForCollection[i]);
        scene.remove(environmentBits[environmentObjectIndex]);
        environmentBits.splice(environmentObjectIndex, 1);

        console.log(`Removing environment object at index ${i} from scene`);
    }

    for (let i = 0; i < challengeRowsForCollection.length - 1; i++) {
        let challengeRowIndex = challengeRows.indexOf(challengeRowsForCollection[i]);
        scene.remove(challengeRowsForCollection[i].rowParent);

        console.log(`Removing challenge line at index ${i} from scene`);

        challengeRows.splice(challengeRowIndex, 1);

    }
}
