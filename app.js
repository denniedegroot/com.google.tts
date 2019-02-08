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

        let FoundDevices = [];
        let browser = mdns.createBrowser(mdns.tcp('googlecast'));
        let ttsAction = new Homey.FlowCardAction('tts');

        FoundDevices['Broadcast'] = {name: 'Broadcast', description: 'Broadcast to all devices'};

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
                    FoundDevices[data.fullname] = db;
            }
        });

        ttsAction.register().registerRunListener((args, state) => {
            return new Promise((resolve, reject) => {
                let device = new googleTTS(null, args.language);

                device.setTtsTimeout(5000);

                if (args.speed == 'slow')
                    device.setTtsSpeed(0.24)

                if (args.device.name == 'Broadcast') {
                    device.getTtsUrl(args.text).then((url) => {
                        for (let device_data in FoundDevices) {
                            if (FoundDevices[device_data].name == 'Broadcast')
                                continue;

                            device.setIp(FoundDevices[device_data].host);
                            device.audio(url, (result) => {
                                resolve();
                            });
                        }
                    });
                } else {
                    device.setIp(this.findDeviceIP(FoundDevices, args.device));
                    device.tts(args.text, (result) => {
                        resolve();
                    });
                }
            });
        }).getArgument('device').registerAutocompleteListener((query, args) => {
            let devices = []

            for (let device_data in FoundDevices)
                if (FoundDevices[device_data].name.toLowerCase().indexOf(query.toLowerCase()) > -1 || FoundDevices[device_data].description.toLowerCase().indexOf(query.toLowerCase()) > -1)
                    devices.push(FoundDevices[device_data]);

            return Promise.resolve(devices);
        });
    }

    findDeviceIP(FoundDevices, device) {
        for (let device_data in FoundDevices)
            if (FoundDevices[device_data].name == device.name)
                return FoundDevices[device_data].host;

        return "0.0.0.0";
    }

}

module.exports = App;
