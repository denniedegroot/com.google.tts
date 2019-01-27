'use strict';

const Homey = require('homey');

const mdns = require('mdns-js');
const googleTTS = require('google-home-audio-tts');

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++)
        await callback(array[index], index, array);
}

class App extends Homey.App {

    log() {
        console.log.bind(this, '[log]').apply(this, arguments);
    }

    error() {
        console.error.bind(this, '[error]').apply(this, arguments);
    }

    onInit() {
        console.log(`${Homey.manifest.id} running...`);

        let foundServers = [{name: 'Broadcast', description: 'Broadcast to all devices'}];
        let browser = mdns.createBrowser(mdns.tcp('_googlecast'));
        let device = new googleTTS('0.0.0.0');

        browser.on('ready', function onReady() {
            browser.discover();
        });

        browser.on('update', function onUpdate(data) {
            if (typeof(data) == 'object' &&
                 data.hasOwnProperty('type') &&
                 data.hasOwnProperty('addresses') &&
                 data.hasOwnProperty('txt')) {

                let db = {};
                db.host = data.addresses[0];

                for (let key in data.txt) {
                    if (data.txt[key].indexOf('md=') > -1) {
                        db.name = data.txt[key].replace('md=', '');
                    }
                    if (data.txt[key].indexOf('fn=') > -1) {
                        db.description = data.txt[key].replace('fn=', '') + ' (' + data.addresses[0] + ')';
                    }
                }

                if (data.type[0].name == 'googlecast')
                    foundServers.push(db);
            }
        });

        let ttsAction = new Homey.FlowCardAction('tts');
        ttsAction.register().registerRunListener(( args, state ) => {
            return new Promise((resolve, reject) => {
                device.setLanguage(args.language);

                if (args.device.name == 'Broadcast') {
                    asyncForEach(foundServers, async (device_data) => {
                        if (device_data.name == 'Broadcast')
                            return;

                        device.setIp(device_data.host);

                        device.tts(args.text, result => {
                            resolve();
                        });

                        await waitFor(1000);
                    });
                } else {
                    device.setIp(args.device.host);

                    device.tts(args.text, result => {
                        resolve();
                    });
                }
            });

        }).getArgument('device').registerAutocompleteListener(( query, args ) => {
            return Promise.resolve(foundServers);
        });
    }

}

module.exports = App;
