/* eslint-disable linebreak-style */
/* eslint-disable camelcase */
/* eslint-disable indent */
/* eslint-disable no-tabs */
/* eslint-disable max-len */
/* eslint-disable object-curly-newline */
/* eslint-disable object-property-newline */
/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable consistent-return */

'use strict';


const Homey = require('homey');
const GoogleHomeTTS = require('./lib/GoogleHomeAudioTTS');

class googleTTS extends Homey.App {

    onInit() {
        this.log(`${Homey.manifest.id} running...`);
        this.foundDevices = [];

        this.discoverDevices();
        this.goWithTheFlow();
    }

    findDeviceIP(device) {
        for (const device_data in this.foundDevices)
            if (this.foundDevices[device_data].name == device.name || (this.foundDevices[device_data].id != undefined && this.foundDevices[device_data].id == device.id))
                return { ip: this.foundDevices[device_data].host, port:this.foundDevices[device_data].port };

        return { ip: "0.0.0.0", port: undefined };
    }

    async goWithTheFlow() {
        this.homey.flow.getActionCard('tts')
        .registerRunListener((args, state) => {
            return new Promise((resolve, reject) => {
                const device = new GoogleHomeTTS();
                device.setLanguage(args.language);
                if (args.speed) device.setTtsSpeed(args.speed);
                if (args.muted) device.setSendToMuted(args.muted);
                device.setVolume(args.volume)
                device.setTts(args.text);

                if (args.device.name === 'Broadcast') {
                    for (let device_data in this.foundDevices) {
                        if (this.foundDevices[device_data].name !== 'Broadcast') {
                            device.setPort(this.foundDevices[device_data].port);
                            device.setIp(this.foundDevices[device_data].host);
                            device.audio();
                        }
                    }
                } else {
                    let { ip, port } = this.findDeviceIP(args.device);

                    if (ip == undefined || ip == "0.0.0.0") return reject();

                    device.setIp(ip);
                    device.setPort(port);
                    device.audio();
                }
                return resolve();
            });
        })
        .registerArgumentAutocompleteListener('device', (query, args) => {
            const devices = []
            for (const device_data in this.foundDevices) {
                const name = this.foundDevices[device_data].name || '';
                const description = this.foundDevices[device_data].description || '';
                if (name.toLowerCase().indexOf(query.toLowerCase()) > -1 || description.toLowerCase().indexOf(query.toLowerCase()) > -1)
                    devices.push(this.foundDevices[device_data]);
            }

            return Promise.resolve(devices);
        })
    }

    addDiscoveryResult(discoveryResult) {
        this.log('discoverDevices : ', discoveryResult.txt.fn, 'on', discoveryResult.address, discoveryResult.port);
        const db = {};
        db.id = discoveryResult.id;
        db.host = discoveryResult.address;
        db.port = discoveryResult.port;
        db.name = discoveryResult.txt.fn || discoveryResult.id;
        db.description = discoveryResult.txt.md || '';
        this.foundDevices[discoveryResult.id] = db;
    }

    async discoverDevices() {
        this.foundDevices['Broadcast'] = {name: 'Broadcast', description: 'Broadcast to all devices'};

        const discoveryStrategy = this.homey.discovery.getStrategy('googlecast');

        discoveryStrategy.on('result', discoveryResult => this.addDiscoveryResult(discoveryResult));

        // getDiscoveryResults() returns already known results synchronously,
        // these need to be processed too since the 'result' event only fires
        // for devices discovered after this listener was registered.
        const discoveryResults = discoveryStrategy.getDiscoveryResults();
        for (const id in discoveryResults) this.addDiscoveryResult(discoveryResults[id]);
    }
}

module.exports = googleTTS;
