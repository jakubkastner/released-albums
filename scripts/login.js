// PŘIHLÁŠENÍ //

/**
 * Kliknutí na tlačítko přihlášení.
 */
$('.login').click(function () {
    // PŘIHLÁŠENÍ -> krok 1

    // získá stránku pro přihlášení do spotify
    var url = loginGetUrl();

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
function loginGetUrl() {
    // PŘIHLÁŠENÍ -> krok 2
    // kontrola přihlášení
    if (userAccess) {
        // uživatel je přihlášen
        return null;
    }

    // zapíše do lokálního úložiště náhodnou hodnotu
    var stateValue = generateRandomString(16);
    localStorage.setItem(STATE_KEY, stateValue);

    // otevře přihlašovací okno do spotify a získá access token
    var scope = 'user-follow-read user-read-private user-library-read user-library-modify playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';
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
    function generateRandomString(length) {
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
function loginParseUrl() {
    // PŘIHLÁŠENÍ -> krok 4
    // zobrazí příslušné informace po přihlášení

    // získá aktuální url adresu
    var currentUrl = window.location.href;

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

        // získá hodnotu úloženou v úložišti
        var storedState = localStorage.getItem(STATE_KEY);

        if (userAccess) {
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

    if (json.error) {
        if (json.error.status === 401) {
            // vypršela platnost access tokenu

            userAccess = null;
            // získá stránku pro přihlášení do spotify
            var url = loginGetUrl();

            if (url) {
                // naviguje na přihlašovací stránku Spotify
                window.location = url;
            }
            else {
                // uživatel je přihlášen
                // loginGetUserInfo(); došlo by k zacyklení
                console.log('Spotify login error');
            }
        }
    }

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

    var elementLogin = $('#login');
    elementLogin.html('Logged in as "' + json.display_name + '" | Click to logout');
    elementLogin.attr('title', 'Click to logout');
    elementLogin.attr('href', '');
    elementLogin.attr('id', 'logout');

    elementMessage.text('User @' + json.display_name + ' has been successfully logged in.');

    // uloží stát a id
    userCountry = json.country;
    userId = json.id;

    // získá interprety z knihovny uživatele
    await libraryGetArtists();
    // získá playlisty uživatele
    await libraryGetPlaylists();
}

/**
 * Kliknutí na tlačítko odhlášení.
 */
$(document).on('click', '#logout', function (e) {
    // odstraní userAccess
    localStorage.removeItem(USER_ACCESS);
});