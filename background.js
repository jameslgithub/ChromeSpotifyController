// let active_tabId = null;

const CLIENT_ID = encodeURIComponent('a14b1e81067c44108c7cd36702fa7b2e'), //Your Spotify Developer Client ID
    RESPONSE_TYPE = encodeURIComponent('code'),
    REDIRECT_URI = encodeURIComponent(chrome.identity.getRedirectURL()),
    CODE_CHALLENGE_METHOD = encodeURIComponent('S256'),
    SCOPE = encodeURIComponent('user-modify-playback-state user-read-playback-state user-read-currently-playing'),
    SHOW_DIALOG = encodeURIComponent('true');

let STATE = '',
    CODE_VERIFIER = '',
    ACCESS_TOKEN = '',
    REFRESH_TOKEN = '';

let user_signed_in = false;

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return hash;
}

function base64urlencode(a) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function rand_string() {
    return Math.random().toString(36).substring(2);
}

function clear_tokens() {
    ACCESS_TOKEN = '';
    REFRESH_TOKEN = '';
    user_signed_in = false;
}

function get_authorization_code_point() {
    return new Promise(async (resolve, reject) => {
        CODE_VERIFIER = rand_string().repeat('5');
        const code_challenge = base64urlencode(await sha256(CODE_VERIFIER));
        STATE = encodeURIComponent('meet' + rand_string());

        const oauth2_url =
            `https://accounts.spotify.com/authorize?
&client_id=${CLIENT_ID}
&response_type=${RESPONSE_TYPE}
&redirect_uri=${REDIRECT_URI}
&code_challenge_method=${CODE_CHALLENGE_METHOD}
&code_challenge=${code_challenge}
&state=${STATE}
&scope=${SCOPE}
&show_dialog=${SHOW_DIALOG}`;

        resolve({
            message: 'success',
            auth_endpoint: oauth2_url
        });
    });
}

function get_access_token_endpoint(code) {
    return fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${CLIENT_ID}&grant_type=authorization_code&code=${code}&redirect_uri=${chrome.identity.getRedirectURL()}&code_verifier=${CODE_VERIFIER}`
    })
        .then(res => {
            if (res.status === 200) {
                return res.json();
            } else {
                throw new Error('could not get token');
            }
        })
        .then(res => {
            console.log(res);
            return {
                ...res,
                message: 'success'
            }
        });
}

function get_refresh_token() {
    return fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${CLIENT_ID}&grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
    })
        .then(res => {
            if (res.status === 200) {
                return res.json();
            } else {
                throw new Error('could not get token');
            }
        })
        .then(res => {
            return {
                ...res,
                message: 'success'
            }
        });
}

function get_state() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('Spotify Player Extension', item => {
            if (chrome.runtime.lastError) {
                reject('fail');
            } else {
                const state = item['Spotify Player Extension'] ? item['Spotify Player Extension'] : "{}";

                resolve(JSON.parse(state));
            }
        });
    });
}

function set_state(_state) {
    return new Promise((resolve, reject) => {
        get_state()
            .then(res => {
                const updated_state = {
                    ...res,
                    ..._state
                }

                chrome.storage.local.set({ 'Spotify Player Extension': JSON.stringify(updated_state) }, () => {
                    if (chrome.runtime.lastError) {
                        reject('fail');
                    } else {
                        resolve('success');
                    }
                });
            }); 
    });
}


const player = {
    play: function () {
        return fetch(`https://api.spotify.com/v1/me/player/play`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
            .then(res => {
                console.log(res)
                if (res.status === 204) {
                    return 'success';
                } else {
                    throw new Error('fail');
                }
            });
    },
    pause: function () {
        return fetch(`https://api.spotify.com/v1/me/player/pause`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
            .then(res => {
                if (res.status === 204) {
                    return 'success';
                } else {
                    throw new Error('fail');
                }
            });
    },
    next: function () {
        return fetch(`https://api.spotify.com/v1/me/player/next`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
            .then(res => {
                if (res.status === 204) {
                    return 'success';
                } else {
                    throw new Error('fail');
                }
            });
    },
    prev: function () {
        return fetch(`https://api.spotify.com/v1/me/player/previous`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
            .then(res => {
                if (res.status === 204) {
                    return 'success';
                } else {
                    throw new Error('fail');
                }
            });
    },
    current: function () {
        return fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        })
            .then(res => {
                if (res.status === 200 || res.status === 204) {
                    console.log((res));
                    return res.status === 200 ? res.json() : {};
                } else {
                    throw new Error('fail');
                }
            })
            .then(res => {
                return {
                    current_track: res.item ? `${res.item.artists[0].name} - ${res.item.name}` : '',
                    isPlaying: res.is_playing
                }

        });
    }
}



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.from === 'popup' && request.message === 'login') {
        if (user_signed_in) {
            console.log("User is signed in");
        }
        else {
            get_authorization_code_point()  
            .then(res => {
            chrome.identity.launchWebAuthFlow({
                url: res.auth_endpoint,
                interactive: true
            }, function (redirect_url) {
                if (chrome.runtime.lastError) {
                    sendResponse({ message: 'fail' });
                }
                else {
                    if (redirect_url.includes('callback?error=access_denied')) {
                        sendResponse({ message: 'fail'});
                    }
                    else { //get access token
                        code = redirect_url.substring(redirect_url.indexOf('code=') + 5);                       
                        console.log(code);

                        let state = redirect_url.substring(redirect_url.indexOf('state=') + 6);
                        console.log(state);

                        if (state === STATE) {
                            get_access_token_endpoint(code)
                                .then(res => {
                                    if (res.message === 'success'){
                                        ACCESS_TOKEN = res.access_token;
                                        REFRESH_TOKEN = res.refresh_token;
                                        user_signed_in = true;
                                        
                                        
                                        setTimeout(() => {
                                            get_refresh_token()
                                                .then( res => {
                                                    if (res.message === 'success') {
                                                        setTimeout(() => {
                                                            clear_tokens();
                                                        }, 3600000);
                                                    }
                                                })
                                        }, 3600000);
                                        get_state()
                                        .then(res => {
                                            player.current()
                                            .then(res =>{
                                                chrome.tabs.sendMessage(active_tabId, { from: 'background', message: 'update_state', payload: { ...res, ...current } });
                                                sendResponse({ message: 'success' });
                                            })
                                        })
                                        chrome.action.setPopup({ popup: './signedIn.html' }, () => {
                                            sendResponse({ message: 'success' });
                                        });
                                    } else {
                                        sendResponse({ message: 'fail' });

                                    }
                                })
                            }}
                }
            });
        })
        return true;
    }}
    else if (request.message === 'logout') {
        clear_tokens();
        chrome.action.setPopup({ popup :'./popup.html'}, () => {
            sendResponse({ message: 'success'});
        });
        return true;
    }

    else if (request.message === 'play') {
        if (user_signed_in){
            player.play()
            .then(res => set_state(request.payload))
            .then(res => player.current())
            .then(res => sendResponse({ message: 'success', current_track: res.current_track }))
            .catch(err => sendResponse({ message: 'fail' }));

        return true;
        }
    }

    else if (request.message === 'pause') {
        if (user_signed_in){
            player.pause()
            .then(res => set_state(request.payload))
            .then(res => player.current())
            .then(res => sendResponse({ message: 'success', current_track: res.current_track }))
            .catch(err => sendResponse({ message: 'fail' }));

            return true;    
        }
    }
    else if (request.message === 'get_state') {
        get_state()
            .then(res => {
                player.current()
                    .then(current => {
                        sendResponse({ message: 'success', payload: { ...res, ...current } })
                    });
            })
            .catch(err => sendResponse({ message: 'fail' }));

        return true;
    } else if (request.message === 'set_state') {
        set_state(request.payload)
            .then(res => sendResponse({ message: 'success' }))
            .catch(err => sendResponse({ message: 'fail' }));

        return true;
    }

});





