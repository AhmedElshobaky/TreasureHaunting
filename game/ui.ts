import {sceneConfiguration, sceneSetup} from "../game";
import { seaAudioLoader } from "./audio";

export const coinUiElement = document.getElementById('coinCount')!;
export const lifeUiElement = document.getElementById('lifeCount')!;
export const progressUiElement = document.getElementById('courseProgress')!;

export const endLevelDescriptor = document.getElementById('levelDescriptor')!;
export const endLevelBoatStatus = document.getElementById('boatStatus')!;

export const nextLevelButton = document.getElementById('nextLevel')!;

export const startAgainButton = document.getElementById('startOver')!;
export const startGameButton = document.getElementById('startGame')!;
export const enableSoundsButton = document.getElementById('enableSounds')!;

export const startPanel = document.getElementById('levelStartPanel')!;


export const uiInit = () => {
    startAgainButton.onclick = () => {
        nextLevel(true);
    }
    enableSoundsButton.onclick = () => {
        if (!sceneConfiguration.soundEnabled) {
            
            sceneConfiguration.soundEnabled = true;
            seaAudioLoader();
            enableSoundsButton.classList.add('hidden');
        }
    }
}

export const nextLevel = (reset: boolean = false) => {

    document.getElementById('endOfLevel')!.style!.display = '';
    document.getElementById('endOfLevel')!.classList.remove('fadeOut');
    document.getElementById('endOfLevel')!.classList.add('hidden');
    document.getElementById('startGame')!.classList.remove('hidden');
    document.getElementById('levelStartPanel')!.classList.remove('hidden');

    sceneConfiguration.cameraStartAnimationPlaying = false;
    sceneConfiguration.boatMoving = false;
    sceneConfiguration.speed = 0.05;
    sceneConfiguration.speed = sceneConfiguration.level * 0.1;
    if (reset) {
        sceneSetup(1)
    } else {
        sceneSetup(++sceneConfiguration.level);
    }
}

export const updateLevelEndUI = (damaged: boolean) => {
    endLevelDescriptor.innerText = `LEVEL ${sceneConfiguration.level}`;
    if (damaged) {
        endLevelBoatStatus.innerText = '';
        endLevelBoatStatus.innerText = 'NOOOO Captain!\r\n\r\n Your boat has sank, you hit too many rocks !';
        nextLevelButton.classList.add('hidden');
        startAgainButton.classList.remove('hidden');
    } else {

        let lifeCount = sceneConfiguration.data.lifesCollected;
        console.log(lifeCount);
        endLevelBoatStatus.innerText = '';
        if (lifeCount >= 5) {
            endLevelBoatStatus.innerText = 'NICE Captain! \r\n\r\nYour boat is in a perfect condition!';
        } else if (lifeCount >= 1 && lifeCount < 5) {
            endLevelBoatStatus.innerText = 'GOOD JOB Captain! \r\n\r\nYour boat is in a decent condition.';
        } else if (lifeCount == 0) {
            endLevelBoatStatus.innerText = 'No lifes in the sea? \r\n\r\nYour ship is in the same condition as when you left!';
        } else if (lifeCount < 0) {
            endLevelBoatStatus.innerText = 'BECAREFULL Captain! \r\n\r\nYour ship is almost sank. Try to hit less rocks next time!';
        }

        nextLevelButton.classList.remove('hidden');
        startAgainButton.classList.add('hidden');

    }
}

export const showLevelEndScreen = () => {
    
    document.getElementById('endOfLevel')!.style!.display = 'flex';
    document.getElementById('endOfLevel')!.classList.add('fadeOut');
    document.getElementById('coinCountLevelEnd')!.innerText = String(sceneConfiguration.data.coinsCollected);


}
export const setProgress = (progress: string) => {
    let progressElement = document.getElementById('loadingProgress');
    if (progressElement != null) {
        progressElement.innerText = progress;
    }
}


