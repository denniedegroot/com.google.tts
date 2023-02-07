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

const Client = require('castv2-client').Client;
const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const googleTTS = require('google-tts-api');

/**
 * initialize device
 * @return {GoogleHomeAudioTTS}
 */
class GoogleHomeAudioTTS {
    constructor() {
        this.setIp();
        this.setLanguage('en');
        this.setRestoreVolume(true);
        this.setSlow(false);
        this.setSendToMuted(false);
        this.setPort(8009);
    }
    /**
     * set device ip
     * @type {string}
     */
    setIp(ip) {
        this.ip = ip;
    }
    /**
     * set device port
     * @type {string}
    */	
    setPort(port) {
        this.port = port;
    }
    /**
     * set device ip
     * @type {string}
     */
    setSlow(slow) {
        this.ttsSlow = slow;
    }
    /**
     * device device language
     * @type {string}
     */
    setLanguage(language) {
        this.language = language;
    }
    /**
     * device device language
     * @type {string}
     */
    setSendToMuted(muted) {
        this.sendToMuted = muted;
    }
    /**
     * set device volume
     * @param {number} volume
     */
    setVolume(volume) {
        if (volume >= 0 && volume <= 100) {
            console.log('setVolume', volume);
            this.volume = volume / 100;
        }
    }
    /**
     * set device volume
     * @param {boolean} restore
     */
    setRestoreVolume(restore) {
        this.restoreVolume = restore;
    }
    /**
     * set tts voice speed
     * @param {boolean} ttsSlow
     */
    setTtsSpeed(ttsSlow) {
        this.ttsSlow = ttsSlow;
    }
    /**
     * get tts url
     * @param ()
     * @return url
     */
    getTtsUrl() {
        return this.ttsUrl;
    }
    /**
     * let device play text to speech
     * @param {string} message
     * @param {function} [callback]
     */
    setTts(message) {
        const url = googleTTS.getAudioUrl(message, {
            lang: this.language,
            slow: this.ttsSlow,
            host: 'https://translate.google.com',
          });
        this.ttsUrl = url;
    }
    /**
     * play audio file on device
     * @param {string} urloriginalVolume
     */
    audio() {
        this.playOnDevice(this.ttsUrl);
    }
    /**
     * play url on device
     * @access private
     * @param {string} url
     */
    playOnDevice(url) {
        let client = new Client();
        let volume = this.volume;
        let originalVolume;
        let that = this;

        let closeClient = function () {
            if (that.restoreVolume && originalVolume) {
                client.setVolume(originalVolume, () => {
                    client.close();
                });
            } else {
                client.close();
            }
        };

        client.on('error', err => {
            console.log('Error:', err.message);
            closeClient();
            return;
        });

        client.connect({ host: that.ip, port: that.port }, () => {
            client.getVolume((err, value) => {
                originalVolume = value;
                if ((value.muted && that.sendToMuted) || !that.sendToMuted) {
                    client.setVolume({ level: volume }, ( err, vol ) => { });
                }
            });

            console.log('connected, launching media ...', that.ip, that.port, url);

            client.launch(DefaultMediaReceiver, function (err, player) {
                if (err) {
                    console.log('Error:', err.message);
                    closeClient();
                    return;
                }

                let media = {
                    contentId: url,
                    contentType: 'audio/mp3',
                    streamType: 'BUFFERED'
                };

                if (player) {
                    player.load(media, { autoplay: true }, (err , status) => {

                        if (err) {
                            console.log('Error:', err.message);
                            closeClient();
                            return;
                        }

                        console.log('Media loaded playerState=', status.playerState);
                        player.on('status', status => {
                            switch (status.playerState) {
                            case 'BUFFERING':
                            case 'PLAYING':
                                break;
                            default:
                                // Finished. Restore volume level.   
                                console.log('Media ended playerState=', status.playerState);                            
                                closeClient();
                                break;
                            }
                        });
                    });
                }
                else closeClient();
            });
        });
    }
}

module.exports = GoogleHomeAudioTTS;