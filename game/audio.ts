import { AudioListener, Audio, AudioLoader  } from "three";

export const seaListener = new AudioListener();
export const coinListener = new AudioListener();
export const heartListener = new AudioListener();
export const rockListener = new AudioListener();

const coinSound = new Audio( coinListener );
const seaSound = new Audio( seaListener );
const heartSound = new Audio( heartListener );
const rockSound = new Audio( rockListener );


export const coinAudioLoader = () => {
    const coinAudioLoader = new AudioLoader();
    coinAudioLoader.load( 'static/sounds/coinSound.mp3', function( buffer ) {
	coinSound.setBuffer( buffer );
	coinSound.setVolume( 0.8 );
	coinSound.play();
});
}

export const heartAudioLoader = () => {
    const heartAudioLoader = new AudioLoader();
    heartAudioLoader.load( 'static/sounds/heartSound.mp3', function( buffer ) {
    heartSound.setBuffer( buffer );
    heartSound.setVolume( 0.8 );
	heartSound.play();
});
}

export const rockAudioLoader = () => {
    const rockAudioLoader = new AudioLoader();
    rockAudioLoader.load( 'static/sounds/rockSound.mp3', function( buffer ) {
        rockSound.setBuffer( buffer );
        rockSound.setVolume( 0.8 );
        rockSound.play();
});
}

export const seaAudioLoader = () => {
    const seaAudioLoader = new AudioLoader();
    seaAudioLoader.load( 'static/sounds/seaSound.mp3', function( buffer ) {
        seaSound.setBuffer( buffer );
        seaSound.setLoop( true );
        seaSound.setVolume( 0.3 );
        seaSound.play();
    });
}

