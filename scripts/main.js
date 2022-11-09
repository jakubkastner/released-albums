/**
 * ZKRATKY *
 *
 * a = albums
 * t = tracks
 * p = appears
 * c = compilations
 *
 *
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
//var REDIRECT_URI = 'https://jakubkastner.github.io/released-albums/';
//var REDIRECT_URI = 'http://192.168.1.25:5500';
//var REDIRECT_URI = 'http://localhost:5500';
//var REDIRECT_URI = 'http://127.0.0.1:5500';
var REDIRECT_URI = location.protocol + '//' + location.host + location.pathname;
var STATE_KEY = 'spotify_auth_state';
var USER_ACCESS = 'spotify_user_access';
var API_URL = 'https://api.spotify.com/v1';

var userAccess = null;
var userCountry = null;
var userId = null;
var user = null;

var libraryArtists = null;
var libraryAlbums = null;
var libraryEPs = null;
var libraryTracks = null;
var libraryAppears = null;
var libraryCompilations = null;
var libraryPodcasts = null;
var libraryPodcastsAll = null;
var libraryPlaylists = null;
var libraryMyAlbums = null;

var defaultPlaylist = null;
var defaultDevice = null;

var notifications = false;
var youtubeMusic = false;
var playlistPositionFirst = true;
var variousArtists = true;

var lastAlbumsCount = 0;
var lastAlbumsCurrent = 0;

var devices = null;

var options = {};

var elementError = $('.error');
var elementMessage = $('.message');
var elementLoader = $('.loader');
var elementTitle = $('.title');

var elementMenuDate = $('.nav-date');
var elementMenuMobile = $('.nav-mobile');

var elementAlbums = $('.albums');
var elementEPs = $('.eps');
var elementTracks = $('.tracks');
var elementAppears = $('.appears');
var elementCompilations = $('.compilations');
var elementPodcasts = $('.podcasts');
var elementSettings = $('.settings');
var elementMyAlbums = $('.my-albums');

var elementTop = $('#top');
var elementBody = $('body, html'); // $(window) - změna scrolování - 17.3.2020

var elementNav = $('nav');
var elementActions = $('.actions');

var elementAlbumsButton = $('.albums-button');
var elementEPsButton = $('.eps-button');
var elementTracksButton = $('.tracks-button');
var elementAppearsButton = $('.appears-button');
var elementCompilationsButton = $('.compilations-button');
var elementPodcastsButton = $('.podcasts-button');
var elementMyAlbumsButton = $('.my-albums-button');
var elementSettingsButton;

var elementLoggedOut = $('.logged-out');

var spotifyPlayer = null;

var elementHiddenMenu = $('.hidden-menu');

var viewAll = false;
var lastYear = 0;

//elementHiddenMenu.hide();

// pwa aplikace
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('sw.js');
}

if (Notification.permission === 'granted') {
    notifications = true;
}

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
 * Načte JSON pomocí Spotify api.
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

    if (!json) {
        // nepodařilo se získat json
        //hideLoading(elementError.text() + '\n' + errorText + '\nCan not get JSON from Spotify API');
        console.log('fetch error - from url: ' + url);
        return null;
    }

    if (json.error) {
        // chyba získávání dat
        if (json.error.status === 429) {
            // api - moc dotazů
            return await fetchJson(url, errorText);
            // UPOZORNĚNÍ -> HROZÍ NEKONEČNÁ SMYČKA
        }
        else if (json.error.status === 401) {
            // vypršela platnost access tokenu
            localStorage.removeItem(USER_ACCESS);
            userAccess = null;
            // získá stránku pro přihlášení do spotify
            var url = await loginGetUrl();

            if (url) {
                // naviguje na přihlašovací stránku Spotify
                //window.location = url;
                console.log("naviguji");
            }
            else {
                // uživatel je přihlášen
                // loginGetUserInfo(); došlo by k zacyklení
                console.log('Spotify login error');
            }
            return await fetchJson(url, errorText);
            // UPOZORNĚNÍ -> HROZÍ NEKONEČNÁ SMYČKA
        }
        // jiná chyba
        //hideLoading(elementError.text() + '\n' + errorText + '\n' + json.error.message);
        console.log('fetch error - from spotify: ' + json.error.message);
        console.log(json.error);
        return null;
    }
    return json;
}

/**
 * Zobrazí loader a zprávu načítání.
 * @param {*} message zpráva k zobrazení
 */
function showLoading(message) {
    document.title = message;
    //elementHiddenMenu.hide();
    elementLoader.show();
    elementMessage.show();
    elementMessage.text('Please wait: ' + message + '...');
}

/**
 * Skryje loader a zobrazí zprávu.
 * @param {*} message zpráva k zobrazení
 */
function hideLoading(message, notifyMessage = '') {
    document.title = 'Releases on Spotify';
    elementLoader.hide();
    elementMessage.text(message);
    //elementHiddenMenu.show();
    // show notification
    if (notifications === true && notifyMessage !== '') {
        var notify = new Notification('Releases on Spotify', {
            body: notifyMessage,
            icon: '/images/favicon.png',
        });
    }
}

/**
 * Zobrazí chybovou zprávu.
 * @param {*} title titulek chyby
 * @param {*} message text chyby
 */
function showError(title, message) {
    elementTitle.text(title);
    /*if (elementError.text()) {
        message = elementError.text() + '\n' + message;
    }*/
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

// změna scrolování - 17.3.2020
/*elementBody.scroll(function () {
    // načtení dalšího obsahu
    var position = elementBody.scrollTop();
    if (position > 20) {
        // poloha je níže než 20px
        // -> zobrazí posunovník nahoru
        elementTop.show();
        elementTop.animate({ "bottom": "50px" });
        return;
    }
    if (!elementTop.is(':hidden')) {
        // skryje posuvník nahoru
        elementTop.animate({ "bottom": "0px" },);
        elementTop.promise().done(function(){
            elementTop.hide();
        });
    }
    return;*/

window.onscroll = function () {
    // načtení dalšího obsahu

    // TODO : dodělat načítání dalšího obsahu (nekonečný seznam)

    /*if (viewAll) {
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
    }*/

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


/**
 * Načtení stránky.
 */
$(document).ready(async function () {
    var storedState = localStorage.getItem(STATE_KEY);

    // získám z úložiště prohlížeče userAccess
    userAccess = localStorage.getItem(USER_ACCESS);
    if (userAccess) {
        // uživatel je přihlášen
        // -> získám informace o uživateli
        // PŘIHLÁŠENÍ -> krok 5
        await loginGetUserInfo();
        initPlayer();
        // získám parametry
        var params = getHashParams();
        if (params.show == 'albums') {
            // zobrazím albumy
            showAlbums();
        }
        else if (params.show == 'tracks') {
            // zobrazím albumy
            showTracks();
        }
        else if (params.show == 'eps') {
            // zobrazím albumy
            showEPs();
        }
        else if (params.show == 'appears') {
            // zobrazím albumy
            showAppears();
        }
        else if (params.show == 'compilations') {
            // zobrazím albumy
            showCompilations();
        }
        else if (params.show == 'podcasts') {
            // zobrazím albumy
            showPodcasts();
        }
        else if (params.show == 'my-albums') {
            // zobrazím albumy
            showMyAlbums();
        }
        else if (params.settings == '') {
            // zobrazím albumy
            showSettings();
        }
    }
    else {
        // uživatel není přihlášen
        // -> zkontoluji, zdali nepřišla odpověď z přihlašovací stránky Spotify
        // PŘIHLÁŠENÍ -> krok 3
        console.log(window.location.href);
        await loginParseUrl();
    }
});

async function sendFetch(url, trackUri, errorText = "", position = false) {
    url += '?';
    if (position === true) {
        url += 'position=0&';
    }
    url = url + 'uris=' + trackUri;
    var opt = {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + userAccess
        }
    };
    return await fetch(url, opt);
}
async function sendFetchQueue(url, trackUri, errorText = "") {
    url = url + '?uri=' + trackUri + '&device_id=' + defaultDevice.id;
    var opt = {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + userAccess
        }
    };
    return await fetch(url, opt);
}


async function putFetch(url, errorText = "") {
    var opt = {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + userAccess
        }
    };
    return await fetch(url, opt);
}

async function putFetchJson(url, json, errorText = "") {
    var opt = {
        method: 'PUT',
        body: json,
        headers: {
            'Authorization': 'Bearer ' + userAccess,
            'Content-Type': 'application/json'
        }
    };
    return await fetch(url, opt);
}

// https://api.spotify.com/v1/playlists/{playlist_id}/tracks
async function deleteFetch(url, json = null, errorText = "") {
    var opt = {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + userAccess
        }
    };
    if (json) {
        opt.body = json;
        opt.headers = {
            'Authorization': 'Bearer ' + userAccess,
            'Content-Type': 'application/json'
        }
    }
    return await fetch(url, opt);
}



async function showSettings() {
    elementAlbums.hide();
    elementEPs.hide();
    elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();
    elementPodcasts.hide();
    elementMyAlbums.hide();
    elementSettings.show();
    elementMenuDate.hide();

    elementActions.hide();

    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementPodcastsButton.removeClass('current-year');
    elementMyAlbumsButton.removeClass('current-year');
    elementSettingsButton.addClass('current-year');

    // todo - přidává donekonečna seznam playlistů !!!!
    window.location.replace('#settings');
    if (!libraryPlaylists) {
        await libraryGetPlaylists();
    }
    await getDevices();
    elementSettings.html('');
    elementMessage.html('');
    elementMessage.hide();
    elementError.html('');
    var notificationsLi;
    if (notifications === true) {
        notificationsLi = `<li class="playlist-default notifications-disable" title="Click to disable browser notifications"><i class="fas fa-check"></i>Notifications enabled</li>`;
    }
    else {
        notificationsLi = `<li class="playlist-default notifications-enable" title="Click to enable browser notifications"><i class="fas fa-times"></i>Notifications disabled</li>`;
    }
    elementSettings.append(`<div class="settings-section" id="settings-notifications"><h3>Notifications</h3><p>Enable or disable browser notifications</p><ul class="playlists settings-playlist"> ` + notificationsLi + `</ul></div>`);

    elementSettings.append(`<div class="settings-section" id="settings-device"><h3>Default device</h3><p>Set your default device to play releases.</p></div>`);
    var elementSettingsDevice = $('#settings-device');
    var elementDevices = `<ul class="devices settings-devices">`;
    if (user.product != 'premium') {
        elementDevices += `<li class="device-default"><i class="fas fa-times"></i>This feature is available only for Spotify Premium users.</li>`;
        //elementSettingsDevice.append(`<p><i class="fas fa-times"></i> This feature is available only for Spotify Premium users.</p>`);
    }
    else if (devices.length < 1) {
        elementDevices += `<li class="device-default"><i class="fas fa-times"></i>No device found</li   >`;
        //elementSettingsDevice.append(`<p><i class="fas fa-times"></i> No device found</p>`);
    }
    else {
        //var elementDevices = `<ul class="devices settings-devices">`;
        await asyncForEach(devices, async device => {
            var icon;
            var title;
            var classEl = '';
            if (!defaultDevice) {
                icon = `<i class="fas fa-plus"></i>`;
                title = `Set device '` + device.name + `' as default`;
                classEl = 'device-default-set';
            }
            else if (defaultDevice.id != device.id) {
                icon = `<i class="fas fa-plus"></i>`;
                title = `Set playlist '` + device.name + `' as default`;
                classEl = 'device-default-set';
            }
            else {
                icon = `<i class="fas fa-check"></i>`;
                title = `Unset device '` + device.name + `'`;
                classEl = 'device-default-remove';
            }
            elementDevices += `<li class="device-default `;
            elementDevices += classEl;
            elementDevices += `" id="d_` + device.id + `" title="`
            elementDevices += title;
            elementDevices += `"><span>`;
            elementDevices += icon;
            elementDevices += `</span>` + device.name + `</li>`;
        });
        //elementDevices += `</ul>`;
        //elementSettingsDevice.append(elementDevices);
    }
    elementDevices += `</ul>`;
    elementSettingsDevice.append(elementDevices);

    var varArtLi;
    if (playlistPositionFirst === true) {
        varArtLi = `<li class="variousart settings-variousart-hide" title="Click to hide releases from Various artists"><i class="fas fa-check"></i>Releases from Various artists are displayed</li>`;
    }
    else {
        varArtLi = `<li class="variousart settings-variousart-show" title="Click to show releases from Various artists"><i class="fas fa-times"></i>Releases from Various artists are hidden</li>`;
    }
    elementSettings.append(`<div class="settings-section" id="settings-variousart"><h3>Various artists</h3><p>Show or hide releases from Various artists.</p><ul class="playlists settings-variousart-showhide"> ` + varArtLi + `</ul></div>`);



    var plPositionLi;
    if (playlistPositionFirst === true) {
        plPositionLi = `<li class="playlist-default playlist-position-last" title="Click to set last position"><i class="fas fa-angle-up"></i>First position</li>`;
    }
    else {
        plPositionLi = `<li class="playlist-default playlist-position-first" title="Click to set first position"><i class="fas fa-angle-down"></i>Last position</li>`;
    }
    elementSettings.append(`<div class="settings-section" id="settings-playlist-position"><h3>Position of added release to the playlist</h3><p>Set the position (first or last) of added releases to the playlist.</p><ul class="playlists settings-playlist-position"> ` + plPositionLi + `</ul></div>`);


    elementSettings.append(`<div class="settings-section" id="settings-playlist"><h3>Default playlist</h3><p>Set your default playlist to quickly add releases.</p></div>`);
    var elementSettingsPlaylist = $('#settings-playlist');
    elementTitle.text('Settings');
    var elementPlaylists = '';
    // projde playlisty uživatele
    if (libraryPlaylists.length < 1) {
        elementPlaylists = `<p><i class="fas fa-times"></i> 0 playlists, try to create one.</p>`;
    }
    else {
        //elementMessage.text(''); // todo - při přepínání se zpráva nezobrazuje, takže zmizí (přidat nadpis přímo do nějakého divu spolu s obsahem)
        elementPlaylists = `<ul class="playlists settings-playlist">`;
        await asyncForEach(libraryPlaylists, async playlist => {
            // pouze pokud se jedná o playlist do kterého lze přidat album
            if (playlist.collaborative || playlist.owner.id == userId) {
                var icon;
                var title;
                var classEl = '';
                if (!defaultPlaylist) {
                    icon = `<i class="fas fa-plus"></i>`;
                    title = `Set playlist '` + playlist.name + `' as default`;
                    classEl = 'playlist-default-set';
                }
                else if (defaultPlaylist.id != playlist.id) {
                    icon = `<i class="fas fa-plus"></i>`;
                    title = `Set playlist '` + playlist.name + `' as default`;
                    classEl = 'playlist-default-set';
                }
                else {
                    icon = `<i class="fas fa-check"></i>`;
                    title = `Unset playlist '` + playlist.name + `'`;
                    classEl = 'playlist-default-remove';
                }
                elementPlaylists += `<li class="playlist-default `;
                elementPlaylists += classEl;
                elementPlaylists += `" id="p_` + playlist.id + `" title="`
                elementPlaylists += title;
                elementPlaylists += `"><span>`;
                elementPlaylists += icon;
                elementPlaylists += `</span>` + playlist.name + `</li>`;
            }
        });
        elementPlaylists += `</ul>`;

        var youtubeLi;
        if (youtubeMusic === true) {
            youtubeLi = `<li class="youtubemusic youtubemusic-disable" title="Click to hide YouTube Music icon"><i class="fas fa-check"></i>YouTube Music search enabled</li>`;
        }
        else {
            youtubeLi = `<li class="youtubemusic youtubemusic-enable" title="Click to show YouTube Music icon"><i class="fas fa-times"></i>YouTube Music search disabled</li>`;
        }
        elementSettings.append(`<div class="settings-section" id="settings-youtubemusic"><h3>YouTube Music Search</h3><p>Show or hide YouTube Music search icon.</p><ul class="playlists settings-youtubemusic"> ` + youtubeLi + `</ul></div>`);
    }
    elementSettingsPlaylist.append(elementPlaylists);
    //elementSettings.append(`<div class="settings-section"><h3>back</h3><ul class="playlists settings-playlist"><li id="settings-background">background</ul></li></div>`);
}

$(document).on('click', '.notifications-disable', async function (e) {
    var elementNotifications = $('.notifications-disable');
    notifications = false;
    elementNotifications.removeClass('notifications-disable');
    elementNotifications.addClass('notifications-enable');
    elementNotifications.prop('title', 'Click to enable browser notifications');
    elementNotifications.html(`<i class="fas fa-times"></i>Notifications disabled`);
    notifications = false;
});

$(document).on('click', '.notifications-enable', async function (e) {
    // nastavení notifikací
    var elementNotifications = $('.notifications-enable');
    notifications = false;

    if (!window.Notification) {
        console.log('Browser does not support notifications.');
    }
    else {
        // check if permission is already granted
        if (Notification.permission === 'granted') {
            // show notification here
            elementNotifications.removeClass('notifications-enable');
            elementNotifications.addClass('notifications-disable');
            elementNotifications.prop('title', 'Click to disable browser notifications');
            elementNotifications.html(`<i class="fas fa-check"></i>Notifications enabled`);
            notifications = true;
        }
        else {
            // request permission from user
            Notification.requestPermission().then(function (p) {
                if (p === 'granted') {
                    // show notification here
                    elementNotifications.removeClass('notifications-enable');
                    elementNotifications.addClass('notifications-disable');
                    elementNotifications.prop('title', 'Click to disable browser notifications');
                    elementNotifications.html(`<i class="fas fa-check"></i>Notifications enabled`);
                    notifications = true;
                }
                else {
                    console.log('User blocked notifications.');
                }
            }).catch(function (err) {
                console.error(err);
            });
        }
    }
});

$(document).on('click', '.playlist-default-set', async function (e) {
    // todo - odebraní výchozího playlistu
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var playlistId = ids[1];

    var playlistDiv = $('#' + elementId);
    var playlistDivSpan = $('#' + elementId + ' span');

    if (defaultPlaylist) {
        if (playlistId != defaultPlaylist.id) {
            var playlistDefaultDiv = $('#p_' + defaultPlaylist.id);
            var playlistDefaultDivSpan = $('#p_' + defaultPlaylist.id + ' span');
            // ikona
            playlistDefaultDivSpan.html(`<i class="fas fa-plus"></i>`);
            // class
            playlistDefaultDiv.removeClass('playlist-default-remove');
            playlistDefaultDiv.addClass('playlist-default-set');
            // titulek
            playlistDefaultDiv.prop('title', `Set playlist '` + playlistDiv.text() + `' as default`);
        }
    }
    // ikona
    playlistDivSpan.html(`<i class="fas fa-check"></i>`);
    // class
    playlistDiv.removeClass('playlist-default-set');
    playlistDiv.addClass('playlist-default-remove');
    // titulek
    playlistDiv.prop('title', `Unset playlist '` + playlistDiv.text() + `'`);
    // nastavení výchozího playlistu
    var playlist = libraryPlaylists.find(x => x.id === playlistId);
    defaultPlaylist = playlist;

    // todo - odstranit ikonky jiných checknutých playlistů (ted se donekonecna pridavaji) !!!!
});

$(document).on('click', '.playlist-default-remove', async function (e) {
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var playlistId = ids[1];

    var playlistDiv = $('#' + elementId);
    var playlistDivSpan = $('#' + elementId + ' span');

    // ikona
    playlistDivSpan.html(`<i class="fas fa-plus"></i>`);
    // class
    playlistDiv.removeClass('playlist-default-remove');
    playlistDiv.addClass('playlist-default-set');
    // titulek
    playlistDiv.prop('title', `Set playlist '` + playlistDiv.text() + `' as default`);
    // nastavení výchozího playlistu
    defaultPlaylist = null;
});

// todo - aktuálně se načítá ikona pro přidání do defaultního playlistu pouze při načítání releasů (což není ok)
// může nastat situace kdy odeberu defaultní playlist a pak ikonky zůstanou zobrazené, což tak nemá být


// todo při načítání albumů, kontrolovat, jestli už není přidaný v defaultním playlistu a podle toho měnit ikonku????? nebo to kontrolovat až při přidávání (tzn. nekontrolovat podle class ikonky) = zabrání duplicitám v playlistu
// a změnit při zobrazení přidání do playlistů !

$(document).on('click', '.album-playlist-add-default', async function (e) {

    // todo přidat do class (stejné se volá v actions.js)
    // todo změnit ikonky
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var playlistId = ids[1];
    var releaseId = ids[2];

    await libraryGetReleaseTracks(releaseId);
    var playlistIcon = $('#' + elementId);

    var release;
    // získám parametry
    var params = getHashParams();
    if (params.show == 'albums') {
        // zobrazím albumy
        release = libraryAlbums.find(x => x.id === releaseId);
    }
    else if (params.show == 'eps') {
        // zobrazím albumy
        release = libraryEPs.find(x => x.id === releaseId);
    }
    else if (params.show == 'tracks') {
        // zobrazím albumy
        release = libraryTracks.find(x => x.id === releaseId);
    }
    else if (params.show == 'appears') {
        // zobrazím albumy
        release = libraryAppears.find(x => x.id === releaseId);
    }
    else if (params.show == 'compilations') {
        // zobrazím albumy
        release = libraryCompilations.find(x => x.id === releaseId);
    }
    else if (params.show == 'podcasts') {
        // zobrazím albumy
        release = libraryPodcastsAll.find(x => x.id === releaseId);
    }
    else if (params.show == 'my-albums') {
        // zobrazím albumy
        release = libraryMyAlbums.find(x => x.id === releaseId);
    }
    var playlist = libraryPlaylists.find(x => x.id === playlistId);

    var inPlaylist;
    if (params.show == 'podcasts') {
        var tracks = [];
        tracks.push(release);
        inPlaylist = await libraryIsSongInPlaylist(playlist.tracks.list, tracks);
    }
    else {
        inPlaylist = await libraryIsSongInPlaylist(playlist.tracks.list, release.tracks);
    }
    // přidat
    if (playlistIcon.hasClass('fa-plus-circle')) {
        // pridani do playlistu
        if (!inPlaylist) {
            if (params.show == 'podcasts') {
                await libraryAddToPlaylistApi(release, playlistId, releaseId);
            }
            else {
                var tracks = release.tracks;
                if (playlistPositionFirst === true) {
                    tracks = tracks.reverse();
                }
                await asyncForEach(tracks, async releaseTrack => {
                    // todo - vybírání a odebírání ve funkci ponechat (pokud mám zobrazený seznam z playlistu, automaticky to v něm odškrtne/zaškrtne)
                    await libraryAddToPlaylistApi(releaseTrack, playlistId, releaseId);
                });
            }
        }
        /*playlistIcon.removeClass('fa-plus-circle');
        playlistIcon.addClass('fa-minus-circle');
        playlistIcon.title = `Remove from default playlist '` + defaultPlaylist.name + `'`;*/
    }
    else {
        if (inPlaylist) {
            if (params.show == 'podcasts') {
                await libraryRemoveFromPlaylistApi(release, playlistId, releaseId);
            }
            else {
                // odebrani z playlistu
                await asyncForEach(release.tracks, async albumTrack => {
                    await libraryRemoveFromPlaylistApi(albumTrack, playlistId, releaseId);
                });
            }
        }
        /*playlistIcon.removeClass('fa-minus-circle');
        playlistIcon.addClass('fa-plus-circle');
        playlistIcon.title = `Add to default playlist '` + defaultPlaylist.name + `'`;*/
    }
});



$(document).on('click', '.settings .youtubemusic', async function (e) {
    // nastavení ikony youtube music
    var elementYtMusic = $('.youtubemusic');
    if (youtubeMusic === true) {
        // disable
        elementYtMusic.removeClass('youtubemusic-enable');
        elementYtMusic.addClass('youtubemusic-disable');
        elementYtMusic.prop('title', 'Click to show YouTube Music icon');
        elementYtMusic.html(`<i class="fas fa-times"></i>YouTube Music search disabled`);
        youtubeMusic = false;
    }
    else {
        // enable
        elementYtMusic.removeClass('youtubemusic-disable');
        elementYtMusic.addClass('youtubemusic-enable');
        elementYtMusic.prop('title', 'Click to hide YouTube Music icon');
        elementYtMusic.html(`<i class="fas fa-check"></i>YouTube Music search enabled`);
        youtubeMusic = true;
    }
});


// todo při přepínání albumy - tracky - apperas - nastavení neskrávat obsah, nýbrž obsah odstraňovat (což se aktuálně děje při přidávání, takže tam zůstává zbytečně)




// todo
// pokud byl už playlist vytvořen (stejný název), nabídnout odstranění

// vytvoření nového playlistu
$(document).on('click', '.album-playlist-add-new', async function (e) {

    // todo přidat do class (stejné se volá v actions.js)
    // todo změnit ikonky
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var releaseId = ids[1];
    var playlistIcon = $('#' + elementId);

    await libraryGetReleaseTracks(releaseId);

    var release;
    // získám parametry
    var params = getHashParams();
    if (params.show == 'albums') {
        // zobrazím albumy
        release = libraryAlbums.find(x => x.id === releaseId);
    }
    else if (params.show == 'eps') {
        // zobrazím albumy
        release = libraryEPs.find(x => x.id === releaseId);
    }
    else if (params.show == 'tracks') {
        // zobrazím albumy
        release = libraryTracks.find(x => x.id === releaseId);
    }
    else if (params.show == 'appears') {
        // zobrazím albumy
        release = libraryAppears.find(x => x.id === releaseId);
    }
    else if (params.show == 'compilations') {
        // zobrazím albumy
        release = libraryCompilations.find(x => x.id === releaseId);
    }
    else if (params.show == 'podcasts') {
        // zobrazím albumy
        release = libraryPodcastsAll.find(x => x.id === releaseId);
    }
    else if (params.show == 'my-albums') {
        // zobrazím albumy
        release = libraryMyAlbums.find(x => x.id === releaseId);
    }
    // vytvoreni playlistu
    var newPlaylist = await createPlaylist(release.artistsString + ' - ' + release.name);
    if (newPlaylist === null) {
        return;
    }
    // pridani do playlistu
    if (params.show == 'podcasts') {
        await libraryAddToPlaylistApi(release, newPlaylist.id, releaseId);
    }
    else {
        var tracks = release.tracks;
        if (playlistPositionFirst === true) {
            tracks = tracks.reverse();
        }
        await asyncForEach(tracks, async releaseTrack => {
            // todo - vybírání a odebírání ve funkci ponechat (pokud mám zobrazený seznam z playlistu, automaticky to v něm odškrtne/zaškrtne)
            console.log(releaseTrack);
            await libraryAddToPlaylistApi(releaseTrack, newPlaylist.id, releaseId);
        });
    }
    playlistIcon.addClass('current-month');
});

async function createPlaylist(playlistName) {
    url = 'https://api.spotify.com/v1/users/' + user.id + '/playlists';
    var options = {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + userAccess
        },
        body: JSON.stringify({
            name: playlistName,
            description: "",
            public: false
        }),
        json: true
    };
    let response = await fetch(url, options);

    // získaný json
    let json = await response.json();
    if (json.id) {
        libraryPlaylists.push(json);
        console.log(libraryPlaylists);
        return json;
    }
    return null;
}















// prehravani



$(document).on('click', '.device-default-set', async function (e) {
    // todo - odebraní výchozího playlistu
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var deviceId = ids[1];

    var deviceDiv = $('#' + elementId);
    var deviceDivSpan = $('#' + elementId + ' span');

    if (defaultDevice) {
        if (deviceId != defaultDevice.id) {
            var deviceDefaultDiv = $('#d_' + defaultDevice.id);
            var deviceDefaultDivSpan = $('#d_' + defaultDevice.id + ' span');
            // ikona
            deviceDefaultDivSpan.html(`<i class="fas fa-plus"></i>`);
            // class
            deviceDefaultDiv.removeClass('device-default-remove');
            deviceDefaultDiv.addClass('device-default-set');
            // titulek
            deviceDefaultDiv.prop('title', `Set device '` + deviceDiv.text() + `' as default`);
        }
    }
    // ikona
    deviceDivSpan.html(`<i class="fas fa-check"></i>`);
    // class
    deviceDiv.removeClass('device-default-set');
    deviceDiv.addClass('device-default-remove');
    // titulek
    deviceDiv.prop('title', `Unset device '` + deviceDiv.text() + `'`);
    // nastavení výchozího deviceu
    var device = devices.find(x => x.id === deviceId);
    defaultDevice = device;

    // todo - odstranit ikonky jiných checknutých deviceů (ted se donekonecna pridavaji) !!!!
});

$(document).on('click', '.device-default-remove', async function (e) {
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var deviceId = ids[1];

    var deviceDiv = $('#' + elementId);
    var deviceDivSpan = $('#' + elementId + ' span');

    // ikona
    deviceDivSpan.html(`<i class="fas fa-plus"></i>`);
    // class
    deviceDiv.removeClass('device-default-remove');
    deviceDiv.addClass('device-default-set');
    // titulek
    deviceDiv.prop('title', `Set device '` + deviceDiv.text() + `' as default`);
    // nastavení výchozího deviceu
    defaultDevice = null;
});




$(document).on('click', '.playlist-position-last', async function (e) {
    // nastavení notifikací
    var elementPlaylistSettings = $('.playlist-position-last');
    elementPlaylistSettings.removeClass('playlist-position-last');
    elementPlaylistSettings.addClass('playlist-position-first');
    elementPlaylistSettings.prop('title', 'Click to set first position');
    elementPlaylistSettings.html(`<i class="fas fa-angle-down"></i></i>Last position`);

    playlistPositionFirst = false;
});
$(document).on('click', '.playlist-position-first', async function (e) {
    // nastavení notifikací
    var elementPlaylistSettings = $('.playlist-position-first');
    elementPlaylistSettings.removeClass('playlist-position-first');
    elementPlaylistSettings.addClass('playlist-position-last');
    elementPlaylistSettings.prop('title', 'Click to set last position');
    elementPlaylistSettings.html(`<i class="fas fa-angle-up"></i>First position`);

    playlistPositionFirst = true;
});
/*
$(document).on('click', '.settings-varart-hide', async function (e) {
    // various artists
    var elementPlaylistSettings = $('.playlist-position-last');
    elementPlaylistSettings.removeClass('playlist-position-last');
    elementPlaylistSettings.addClass('playlist-position-first');
    elementPlaylistSettings.prop('title', 'Click to set first position');
    elementPlaylistSettings.html(`<i class="fas fa-angle-down"></i></i>Last position`);

    variousArtists = false;
});
$(document).on('click', '.settings-varart-show', async function (e) {
    // various artists
    var elementPlaylistSettings = $('.playlist-position-first');
    elementPlaylistSettings.removeClass('playlist-position-first');
    elementPlaylistSettings.addClass('playlist-position-last');
    elementPlaylistSettings.prop('title', 'Click to set last position');
    elementPlaylistSettings.html(`<i class="fas fa-angle-up"></i>First position`);

    variousArtists = true;
});*/

$(document).on('click', '.settings .variousart', async function (e) {
    // nastavení ikony youtube music
    var elementVarArt = $('.variousart');
    if (variousArtists === true) {
        // disable
        elementVarArt.removeClass('settings-variousart-hide');
        elementVarArt.addClass('settings-variousart-show');
        elementVarArt.prop('title', 'Click to show releases from Various artists');
        elementVarArt.html(`<i class="fas fa-times"></i>Releases from Various artists are hidden`);
        variousArtists = false;
    }
    else {
        // enable
        elementVarArt.removeClass('settings-variousart-show');
        elementVarArt.addClass('settings-variousart-hide');
        elementVarArt.prop('title', 'Click to hide releases from Various artists');
        elementVarArt.html(`<i class="fas fa-check"></i>Releases from Various artists are displayed`);
        variousArtists = true;
    }
});