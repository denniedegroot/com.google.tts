# Google TTS for Homey
Broadcast a text message to your Google Home devices.

## Currently supports:
* Google Cast Devices

## Limitations
* Messages that contain over 200 characters are not supported by Google
* Only one message is played when sending multiple messages to the same device, create a timeout to play your next message

## Licensing:
* This application is subject to [these terms](https://github.com/denniedegroot/com.google.tts/blob/master/LICENSE).

---

## Changelog 1.3.2:
- Added Norwegian

---

## Changelog 1.3.1:
- Handle error in tts library

---

## Changelog 1.3.0:
- Added volume change
- Improved mdns-js error handling 

Due to the new volume setting the flow cards are broken and need to be re-saved.
A setting of 0% volume means no volume change.

---

## Changelog 1.2.0:
- Added new languages

---

## Changelog 1.1.1:
- Changed app store category

---

## Changelog 1.1.0:
- Added speech speed selection, bugfixes

---

## Changelog 1.0.0:
- Initial release

---
