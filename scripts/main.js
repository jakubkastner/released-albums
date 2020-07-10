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
var REDIRECT_URI = 'https://jakubkastner.github.io/released-albums/';
//var REDIRECT_URI = 'http://192.168.1.25:5500';
//var REDIRECT_URI = 'http://localhost:5500';
//var REDIRECT_URI = 'http://127.0.0.1:5500';
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
var libraryPlaylists = null;
var defaultPlaylist = null;

var lastAlbumsCount = 0;
var lastAlbumsCurrent = 0;

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
var elementSettings = $('.settings');

var elementTop = $('#top');
var elementBody = $('body, html'); // $(window) - změna scrolování - 17.3.2020

var elementNav = $('nav');

var elementAlbumsButton = $('.albums-button');
var elementEPsButton = $('.eps-button');
var elementTracksButton = $('.tracks-button');
var elementAppearsButton = $('.appears-button');
var elementCompilationsButton = $('.compilations-button');
var elementSettingsButton;

var elementHiddenMenu = $('.hidden-menu');

var viewAll = false;
var lastYear = 0;

elementHiddenMenu.hide();

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
        hideLoading(elementError.text() + '\n' + errorText + '\nCan not get JSON from Spotify API');
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
        hideLoading(elementError.text() + '\n' + errorText + '\n' + json.error.message);
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
    elementHiddenMenu.hide();
    elementLoader.show();
    elementMessage.show();
    elementMessage.text('Please wait: ' + message + '...');
}

/**
 * Skryje loader a zobrazí zprávu.
 * @param {*} message zpráva k zobrazení
 */
function hideLoading(message) {
    document.title = 'Releases on Spotify';
    elementLoader.hide();
    elementMessage.text(message);
    elementHiddenMenu.show();
}

/**
 * Zobrazí chybovou zprávu.
 * @param {*} title titulek chyby
 * @param {*} message text chyby
 */
function showError(title, message) {
    elementTitle.text(title);
    if (elementError.text()) {
        message = elementError.text() + '\n' + message;
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
    console.log(storedState);
    // získám z úložiště prohlížeče userAccess
    userAccess = localStorage.getItem(USER_ACCESS);
    if (userAccess) {
        // uživatel je přihlášen
        // -> získám informace o uživateli
        // PŘIHLÁŠENÍ -> krok 5
        await loginGetUserInfo();

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

async function sendFetch(url, trackUri, errorText = "") {
    url = url + '?uris=' + trackUri;
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
    elementSettings.show();
    elementMenuDate.hide();

    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementSettingsButton.addClass('current-year');

    // todo - přidává donekonečna seznam playlistů !!!!
    window.location.replace('#settings');
    if (!libraryPlaylists) {
        showError('zadny playlisty');
        return;
    }
    if (libraryPlaylists.length < 1) {
        showError('zadny playlisty');
        return;
    }
    elementSettings.html('');
    elementMessage.html('');
    elementMessage.hide();
    elementSettings.append(`<div class="settings-section" id="settings-notifications"><h3>Notifications</h3><p>Enable or disable broser notifications</p><ul class="playlists settings-playlist"><li class="playlist-default notifications-set" title="Click to enable browser notifications"><span><i class="fas fa-times"></i></span>Notifications disabled</li></ul></div>`);
    elementSettings.append(`<div class="settings-section" id="settings-playlist"><h3>Default playlist</h3><p>Set your default playlist to quickly add releases.</p></div>`);
    var elementSettingsPlaylist = $('#settings-playlist');
    elementTitle.text('Settings');
    //elementMessage.text(''); // todo - při přepínání se zpráva nezobrazuje, takže zmizí (přidat nadpis přímo do nějakého divu spolu s obsahem)
    var elementPlaylists = `<ul class="playlists settings-playlist">`;
    // projde playlisty uživatele
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
    elementSettingsPlaylist.append(elementPlaylists);
}

$(document).on('click', '.notifications-set', async function (e) {
    // nastavení notifikací
    var elementNotifications = e.currentTarget;
    var elementId = e.currentTarget.id;
    var elementNotificationsSpan = $('#' + elementId + ' span');

    if (!window.Notification) {
        console.log('Browser does not support notifications.');
    }
    else {
        // check if permission is already granted
        if (Notification.permission === 'granted') {
            // show notification here
            elementNotifications.removeClass('notifications-set');
            elementNotifications.addClass('notifications-disable');
            elementNotificationsSpan.html(`<i class="fas fa-check"></i>`);
        }
        else {
            // request permission from user
            Notification.requestPermission().then(function (p) {
                if (p === 'granted') {
                    // show notification here
                    elementNotifications.removeClass('notifications-set');
                    elementNotifications.addClass('notifications-disable');
                    elementNotificationsSpan.html(`<i class="fas fa-check"></i>`);
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
        release = libraryTracks.find(x => x.id === releaseId);
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
    var playlist = libraryPlaylists.find(x => x.id === playlistId);

    var inPlaylist = await libraryIsSongInPlaylist(playlist.tracks.list, release.tracks);
    // přidat
    if (playlistIcon.hasClass('fa-plus-circle')) {
        // pridani do playlistu
        if (!inPlaylist) {
            await asyncForEach(release.tracks, async releaseTrack => {
                // todo - vybírání a odebírání ve funkci ponechat (pokud mám zobrazený seznam z playlistu, automaticky to v něm odškrtne/zaškrtne)
                await libraryAddToPlaylistApi(releaseTrack, playlistId, releaseId);
            });
        }
        /*playlistIcon.removeClass('fa-plus-circle');
        playlistIcon.addClass('fa-minus-circle');
        playlistIcon.title = `Remove from default playlist '` + defaultPlaylist.name + `'`;*/
    }
    else {
        if (inPlaylist) {
            // odebrani z playlistu
            await asyncForEach(release.tracks, async albumTrack => {
                await libraryRemoveFromPlaylistApi(albumTrack, playlistId, releaseId);
            });
        }
        /*playlistIcon.removeClass('fa-minus-circle');
        playlistIcon.addClass('fa-plus-circle');
        playlistIcon.title = `Add to default playlist '` + defaultPlaylist.name + `'`;*/
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
        release = libraryTracks.find(x => x.id === releaseId);
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
    // vytvoreni playlistu
    var newPlaylist = await createPlaylist(release.artistsString + ' - ' + release.name);
    if (newPlaylist === null) {
        return;
    }
    // pridani do playlistu
    await asyncForEach(release.tracks, async releaseTrack => {
        // todo - vybírání a odebírání ve funkci ponechat (pokud mám zobrazený seznam z playlistu, automaticky to v něm odškrtne/zaškrtne)
        await libraryAddToPlaylistApi(releaseTrack, newPlaylist.id, releaseId);
    });
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
