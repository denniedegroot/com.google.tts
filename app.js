'use strict';

const Homey = require('homey');

const mdns = require('mdns-js');
const googleTTS = require('google-home-audio-tts');

class App extends Homey.App {

    log() {
        console.log.bind(this, '[log]').apply(this, arguments);
    }

    error() {
        console.error.bind(this, '[error]').apply(this, arguments);
    }

    onInit() {
        console.log(`${Homey.manifest.id} running...`);

        let foundServers = [];
        let browser = mdns.createBrowser(mdns.tcp('googlecast'));
        let device = new googleTTS('0.0.0.0');
        let ttsAction = new Homey.FlowCardAction('tts');

        foundServers['Broadcast'] = {name: 'Broadcast', description: 'Broadcast to all devices'};

        browser.on('ready', function onReady() {
            browser.discover();
        });

        browser.on('update', function onUpdate(data) {
            if (typeof(data) == 'object' &&
                 data.hasOwnProperty('type') &&
                 data.hasOwnProperty('addresses') &&
                 data.hasOwnProperty('txt') &&
                 data.hasOwnProperty('fullname')) {

                let db = {};
                db.host = data.addresses[0];

                for (let key in data.txt) {
                    if (data.txt[key].indexOf('fn=') > -1)
                        db.name = data.txt[key].replace('fn=', '');

                    if (data.txt[key].indexOf('md=') > -1)
                        db.description = data.txt[key].replace('md=', '');
                }

                if (data.type[0].name == 'googlecast')
                    foundServers[data.fullname] = db;
            }
        });

        ttsAction.register().registerRunListener((args, state) => {
            return new Promise((resolve, reject) => {
                device.setTtsSpeed(1)
                device.setLanguage(args.language);
                device.setTtsTimeout(5000);

                if (args.speed == 'slow')
                    device.setTtsSpeed(0.24)

                if (args.device.name == 'Broadcast') {
                    device.getTtsUrl(args.text).then((url) => {
                        for (let device_data in foundServers) {
                            if (foundServers[device_data].name == 'Broadcast')
                                continue;

                            device.setIp(foundServers[device_data].host);
                            device.audio(url, (result) => {
                                resolve();
                            });
                        }
                    });
                } else {
                    device.setIp(args.device.host);

                    device.tts(args.text, (result) => {
                        resolve();
                    });
                }
            });
        }).getArgument('device').registerAutocompleteListener((query, args) => {
            let foundDevices = []

            for (let device_data in foundServers)
                if (foundServers[device_data].name.toLowerCase().indexOf(query.toLowerCase()) > -1 || foundServers[device_data].description.toLowerCase().indexOf(query.toLowerCase()) > -1)
                    foundDevices.push(foundServers[device_data]);

            return Promise.resolve(foundDevices);
        });
    }

}

module.exports = App;
