// PŘIHLÁŠENÍ //

/**
 * Kliknutí na tlačítko přihlášení.
 */
$('.login').click(async function () {
    // PŘIHLÁŠENÍ -> krok 1
    if (userId) {
        console.log(user);
        window.open(user.external_urls.spotify, '_blank');
        return;
    }
    // získá stránku pro přihlášení do spotify
    var url = await loginGetUrl();
    if (url) {
        // naviguje na přihlašovací stránku Spotify
        window.location = url;
    }
    else {
        // uživatel je přihlášen
        loginGetUserInfo();
    }
});

/**
 * Získá url pro zobrazení přihlašovací stránky Spotify.
 * @returns
 *  null = uživatel je již přihlášen /
 *  url = url přihlašovací stránky Spotify 
 */
async function loginGetUrl() {
    // PŘIHLÁŠENÍ -> krok 2
    // kontrola přihlášení
    if (userAccess) {
        // uživatel je přihlášen
        return null;
    }

    // zapíše do lokálního úložiště náhodnou hodnotu
    var stateValue = await generateRandomString(16);
    localStorage.setItem(STATE_KEY, stateValue);
    console.log("ukládám " + stateValue);

    // otevře přihlašovací okno do spotify a získá access token
    var scope = 'user-follow-read user-read-private user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-playback-state user-modify-playback-state';
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(API_ID);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    url += '&state=' + encodeURIComponent(stateValue);
    return url;

    /**
     * Vygeneruje náhodný string o zadané délce.
     * @param {*} length délka vygenerovaného stringu
     * @returns vygenerovaný náhodný string
     */
    async function generateRandomString(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
}


/**
 * Zachytí odpověď přihlašovací stránky Spotify.
 */
async function loginParseUrl() {
    // PŘIHLÁŠENÍ -> krok 4
    // zobrazí příslušné informace po přihlášení

    // získá aktuální url adresu
    var currentUrl = window.location.href;
    console.log(window.location.href);

    if (currentUrl.includes('access_denied')) {
        // nesouhlas s podmínkami
        elementError.text('Failed to login, you must accept the premissions.');
    }
    else if (currentUrl.includes('?error')) {
        // nastala chyba
        elementError.text('Failed to login, please try it again.');
    }
    else if (currentUrl.includes('#access_token=') && currentUrl.includes('&token_type=') && currentUrl.includes('&expires_in=') && currentUrl.includes('&state=')) {
        // úspěšné přihlášení
        // -> získá userAccess

        // rozdělí získanou adresu a získá z ní parametry
        var params = getHashParams();
        userAccess = params.access_token;
        window.location.replace('');
        console.log(userAccess);

        // získá hodnotu úloženou v úložišti
        var storedState = localStorage.getItem(STATE_KEY);

        if (userAccess) {
            console.log(storedState);
            console.log(params.state);
            // existuje userAccess
            if (params.state !== null && params.state === storedState) {
                // získal jsem hodnotu ze spotify loginu
                // a shoduje s uloženou v místním úložišti
                // -> uloží do úložiště
                localStorage.setItem(USER_ACCESS, userAccess);
            }
            else {
                // nezískal jsem nebo se neschoduje
                // -> chyba
                elementError.text('Failed to login, please try it again.');
            }
        }
        else {
            // neexistující userAccess
            elementError.text('Failed to login, please try it again.');
        }
        // odstraní z úložiště kontrolní string
        console.log("odstranění loginPAreseUrl");
        localStorage.removeItem(STATE_KEY);
    }
}

/**
 * Získá informace ze Spotify API o aktuálním uživateli (pomocí userAccess)
 */
async function loginGetUserInfo() {
    // PŘIHLÁŠENÍ -> krok 6

    // uloží hlavičku pro dotazy api
    options = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + userAccess
        }
    };

    // získá informace o uživateli
    var json = await fetchJson(API_URL + '/me', 'Failed to login, please try it again.');

    if (json == null) {
        // chyba získání informací
        localStorage.removeItem(USER_ACCESS);
        userAccess = null;
        return;
    }
    // úspěšně získané informace

    // zobrazí informace a skryje/zobrazí příslušné prvky
    $('#login-button').remove();
    elementError.text('');

    var elementUser = $('#user');
    elementUser.attr('title', 'Logged in as "' + json.display_name + '"');

    var elementUserName = $('#user p');
    elementUserName.html(json.display_name);

    var elementUserIcon = $('#user i');

    if (json.images.length > 0) {
        elementUserIcon.remove();
        elementUser.prepend(`<img src="` + json.images[0].url + `" alt="">`);
    }
    else {
        // <i class="fab fa-spotify"></i>
        // <i class="fas fa-user"></i>    
        elementUserIcon.removeClass('fab');
        elementUserIcon.addClass('fas');
        elementUserIcon.removeClass('fa-spotify');
        elementUserIcon.addClass('fa-user');
    }

    //var elementMenu = $('.menu-user'); nová verze
    var elementMenu = $('header .in-main');
    elementMenu.append(`<nav class="nav-user"><a class="button settings-button hidden-menu">Settings</a><a class="button" id="logout">Logout</a></nav>`);
    elementMessage.text('User @' + json.display_name + ' has been successfully logged in.');

    elementSettingsButton = $('.settings-button');
    elementHiddenMenu = $('.hidden-menu');

    // nastavení
    elementSettingsButton.click(function () {
        showSettings();
    });

    // uloží stát a id
    userCountry = json.country;
    userId = json.id;
    user = json;

    // získá interprety z knihovny uživatele
    //await libraryGetArtists();
    // získá playlisty uživatele
    //await libraryGetPlaylists();
    // získá výstupní zařízení uživatele
    //await getDevices();
    hideLoading('Select which releases you want to display.');
}

/**
 * Kliknutí na tlačítko odhlášení.
 */
$(document).on('click', '#logout', function (e) {
    // odstraní userAccess
    localStorage.removeItem(USER_ACCESS);
    $('.nav-user').remove();
    window.location = '';
});

// získá zařízení na kterých se dá přehrávat
async function getDevices() {
    // zobrazení načítání
    showLoading('Getting your devices');

    // načtení seznamu playlistů
    if (!devices) {
        devices = [];
    }

    // odeslání dotazu api
    await getDevicesApi(API_URL + '/me/player/devices');

    if (devices.length < 1) {
        // nebyli získáni žádní interpreti
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        hideLoading('0 devices');
        return;
    }

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('');
}

// získá zařízení na kterých se dá přehrávat z api
async function getDevicesApi(url) {
    // získá json z api
    var json = await fetchJson(url, 'Failed to get list of your devices:');

    if (json == null) {
        // chyba získávání
        return null;
    }

    // získá umělce
    devices = json.devices;
    if (!devices) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return;
    }
    if (devices.length < 1) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return;
    }
}