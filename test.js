const GoogleHomeAVT = require('google-home-audio-tts');

console.log(GoogleHomeAVT);

let device = new GoogleHomeAVT('192.168.1.153', 'nl');

device.setTtsSpeed(1);

// play text via tts
device.tts('Hello and welcome! Hallo en welkom!', result => {
    // result:
    // - media object on success
    // - false on error
});

// // play audio
// device.audio('https://sample-videos.com/audio/mp3/crowd-cheering.mp3', result => {
//     // result:
//     // - media object on success
//     // - false on error
// });
