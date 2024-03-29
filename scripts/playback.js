function initPlayer () {
    window.onSpotifyWebPlaybackSDKReady();
}
window.onSpotifyWebPlaybackSDKReady = function () {
    if (!userAccess) {
        console.log('player - user is not logged in');
        return;
    }
    var token = userAccess;

    const player = new Spotify.Player({
        name: 'Releases on Spotify',
        getOAuthToken: cb => { cb(token); }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', state => { console.log(state); });

    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        var nd = {
            id: device_id,
            name: 'Releases on Spotify'
        }
        defaultDevice = nd;
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    player.connect();
}