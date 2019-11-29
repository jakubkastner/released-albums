/**
 * TODO *
 *  
 * zobrazení všech albumů ze všech roků, to samé u měsíců
 * - jako eshopy
 * - nekonečné scrollování
 * - ale načítat pouze část albumů postupně
 * -> není hotovo
 * 
 * NICE 2 HAVE *
 * 
 * nějaké lepší tlačítko na odhlašování
 * 
 * další tlačítka albumů 
 * 
 * 
 * HOTOVO * 
 * 
 * kontrola při načítání albumů, zdali už nejsou v knihovně
 * - podle toho zobrazit ikonku
 * 
 * odstraňování albumů z knihovny
 * 
 * přidávání albumů do knihovny
 * - funguje
 * - akorát se přidají navíc všechny skladby albumu do knihovny, což nechci
 * 
 */

var API_ID = 'd1c9a91ea65443af90946fde02fdda64';
var API_SECRET = '26bbf4fad9384fd4bb3543649ade8b05';
var REDIRECT_URI = 'http://192.168.1.25:5500';
//var REDIRECT_URI = 'http://localhost:5500';
var STATE_KEY = 'spotify_auth_state';
var USER_ACCESS = 'spotify_user_access';
var API_URL = 'https://api.spotify.com/v1';

var userAccess = null;
var userCountry = null;
var libraryAlbums = null;
var userTracks = null;

var libraryArtists = null;

var lastAlbumsCount = 0;
var lastAlbumsCurrent = 0;

var options = {};
var elementError = $('.error');
var elementMessage = $('.message');
var elementLoader = $('.loader');
var elementTitle = $('.title');
var elementMenuYears = $('.years');
var elementAlbums = $('.albums');
var elementMenuYear; // = $('.year');
var elementMenuMonth; //= $('.month');
var elementTop = $('#top');
var elementBody = $('body, html');
var elementAlbumsButton = $('.albums-button');
var elementTracksButton = $('.tracks-button');

var viewAll = false;
var lastYear = 0;

/**
 * Získá parametry z aktuální url adresy.
 * @returns objekt získaných parametrů aktuální url adresy
 */
function getHashParams() {
    var hashParams = {};
    var e,
        r = /([^&;=]+)=?([^&;]*)/g, q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

/**
 * Asynchronní foreach.
 * @param {*} array pole k procházení
 * @param {*} callback funkce pro vykonání
 */
async function asyncForEach(array, callback) {
    // projde pole forem
    for (let index = 0; index < array.length; index++) {
        // vykoná funkci a čeká, dokuď se neprovede
        await callback(array[index], index, array);
    }
}

/**
 * Fetchne JSON pomocí Spotify api.
 * @param {*} url url dotazu api
 * @param {*} errorText text, pokud se nezdaří získání json
 * @returns
 *  json = úspěšně se podařilo získat data za api /
 *  null = chyba dotazu
 */
async function fetchJson(url, errorText) {
    // odpověď požadavku
    let response = await fetch(url, options);

    // získaný json
    let json = await response.json();

    if (json.error) {
        // chyba získávání dat
        if (json.error.status === 429) {
            // api - moc dotazů
            setTimeout(function () { fetchJson(url, errorText); }, 3000);
        }
        else {
            // jiná chyba
            hideLoading(elementError.text() + '<br>' + errorText + json.error.message);
        }
        return null;
    }
    return json;
}

/**
 * Zobrazí loader a zprávu načítání.
 * @param {*} message zpráva k zobrazení
 */
function showLoading(message) {
    elementLoader.show();
    elementMessage.text(message);
}

/**
 * Skryje loader a zobrazí zprávu.
 * @param {*} message zpráva k zobrazení
 */
function hideLoading(message) {
    elementLoader.hide();
    elementMessage.text(message);
}

/**
 * Zobrazí chybovou zprávu.
 * @param {*} title titulek chyby
 * @param {*} message text chyby
 */
function showError(title, message) {
    elementTitle.text(title);
    if (elementError.text()) {
        message = elementError.text() + '<br>' + message;
    }
    elementError.html(message);
    elementMessage.remove();
    elementLoader.hide();
}

/**
 * Kliknutí na posunovník nahoru.
 */
elementTop.click(function () {
    // posune stránku nahoru
    elementBody.scrollTop(0);
});

// TODO !!!!
/**
 * Došlo k posunutí stránky.
 */
window.onscroll = function () {
    // načtení dalšího obsahu

    // TODO : dodělat načítání dalšího obsahu (nekonečný seznam)

    if (viewAll) {
        // nefunkční
        if ($(window).scrollTop() == $(document).height() - $(window).height()) {
            if (lastYear > 1000) {
                var params = parsedUrl.param();
                params["page"] = $(this).val();
                var newUrl = "?" + $.param(params);
                window.location.href = newUrl;
                viewAlbums(lastYear - 1, 0);
            }
        }
    }

    // posuvník
    if (elementBody.scrollTop() > 20) {
        // poloha je níže než 20px
        // -> zobrazí posunovník nahoru
        elementTop.show();
    }
    else {
        // skryje posuvník nahoru
        elementTop.hide();
    }
};


// TODO !!!!!
/**
 * Načtení stránky.
 */
$(document).ready(function () {
    // TODO : dodělat načítání z url

    // získám z úložiště prohlížeče userAccess
    userAccess = localStorage.getItem(USER_ACCESS);
    if (userAccess) {
        // uživatel je přihlášen
        // -> získám informace o uživateli
        // PŘIHLÁŠENÍ -> krok 5
        loginGetUserInfo();

        // získám parametry
        var params = getHashParams();
        if (params.show == 'albums') {
            // zobrazím albumy
            showAlbumsMain();
        }
    }
    else {
        // uživatel není přihlášen
        // -> zkontoluji, zdali nepřišla odpověď z přihlašovací stránky Spotify
        // PŘIHLÁŠENÍ -> krok 3
        loginParseUrl();
    }
});