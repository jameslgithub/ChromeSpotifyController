# ChromeSpotifyController
This is a simple Chrome extension that allows the user to control their Spotify playback from within the browser. 
The extension uses the Spotify Web API to perform playback operations such as playing, pausing, skipping to the next or previous track, and accessing the user's current playback state.

# Getting Started
## Prerequisites
* Google Chrome browser
* Spotify Premium Account
* Spotify Developer account

## Installation
* Clone or download this repository to your local machine.
* Open Google Chrome and go to chrome://extensions/.
* Enable developer mode by toggling the switch on the top right corner.
* Click on the "Load unpacked" button on the top left corner.
* Select the folder containing the extension's files and click "Open".
* Create an app on the Spotify Developer Dashboard
* Update the RedirectUri to "https://{Your Extension ID}.chromiumapp.org/"
* Refresh Extension

## Usage
First, open up the Spotify app on your browser. <br />
Click on the extension icon to sign in to your Spotify account. <br />
After signing in, got back to the Spotify tab and play a song. <br />
Now, you can control your playback using the extension's interface.

## Notes
This is not a final build and the UI is being worked on. <br />
Expect updates relating to: <br />
* Integrating timestamp modification
* Volume Control
* Retain State (User has to refresh extension and app after idling)
* Display song image and details

# Built with
* JavaScript
* Chrome Extension API
* Spotify Web API




