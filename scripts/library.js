// INTERPRETI //

/**
 * Získá seznam interpretů, které uživatel sleduje na Spotify.
 */
async function libraryGetArtists() {
    // zobrazení načítání
    showLoading('Getting list of your followed artists');

    // načtení seznamu interpretů
    if (!libraryArtists) {
        libraryArtists = [];
    }

    // odeslání dotazu api
    await libraryGetArtistsApi(API_URL + '/me/following?type=artist&limit=50');

    if (libraryArtists.length < 1) {
        // nebyli získáni žádní interpreti
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        return;
    }

    // seřadí seznam interpretů podle abecedy
    libraryArtists.sort(function (a, b) {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    elementNav.show();
    hideLoading('Select which releases you want to display.');
}

/**
 * Získá ze Spotify api seznam interpretů, které uživatel sleduje.
 * @param {*} url url adresa api požadavku
 */
async function libraryGetArtistsApi(url) {
    // získá json z api
    var json = await fetchJson(url, 'Failed to get list of your followed artists:');

    if (json == null) {
        // chyba získávání
        return;
    }

    // získá umělce
    var artists = json.artists.items;
    if (!artists) {
        showError('No artist can be obtained', 'You are not following any artist.');
        return;
    }
    if (artists.length < 1) {
        showError('No artist can be obtained', 'You are not following any artist.');
        return;
    }

    // získá url pro další dotazy api (seznam albumů, songů, ...)
    await asyncForEach(artists, async artist => {
        if (!artist.fetch_url) {
            artist.fetch_url = {};
        }
        var fetchUrl = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=';
        artist.fetch_url.album = fetchUrl + 'album&market=' + userCountry;
        artist.fetch_url.track = fetchUrl + 'single&market=' + userCountry;
        artist.fetch_url.appears = fetchUrl + 'appears_on&market=' + userCountry;
        artist.fetch_url.compilation = fetchUrl + 'compilation&market=' + userCountry;
    });

    // uložení do seznamu interpretů
    libraryArtists = libraryArtists.concat(artists);

    if (json.artists.next) {
        // existuje další stránka seznamu umělců
        // -> odešle se další dotaz
        await libraryGetArtistsApi(json.artists.next);
    }
}

// ALBUMY //

/**
 * Kliknutí na tlačítko Albumů.
 */
elementAlbumsButton.click(function () {
    // volá funkci zobrazení albumů
    showAlbums();
});

// TODO !!!
/**
 * Zobrazení albumů
 */
async function showAlbums() {
    elementNav.hide();
    elementTitle.hide();

    //elementAlbums.hide();
    elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();

    //$('.nav-a').hide();
    $('.nav-t').hide();
    $('.nav-p').hide();
    $('.nav-c').hide();

    var params = getHashParams();
    if (params.show != 'albums') {
        // nebyla nastavena url
        window.location.replace("#show=albums");
    }

    if (!libraryAlbums) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        //await libraryGetAlbums();
        await libraryGetReleases('a');
    }
    if (!libraryAlbums) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No albums', 'Cannot show any album, because you are following only artists without albums.');
    }
    else if (libraryAlbums.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No albums', 'Cannot show any album, because you are following only artists without albums.');
    }
    else {
        // byly načteny albumy

        // TODO : dodělat přepínání
        /*if (elementAlbums.is(':hidden')) {
            // albumy jsou již zobrazeny
            return;
        }*/

        // albumy nejsou zobrazeny
        // -> zobrazím albumy

        // TODO : zobrazit albumy (podle roku z url) a menu
        await viewReleases('a', '2019');
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.addClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');

    elementAlbums.show();
    $('.nav-a').show();
    elementNav.show();
    elementTitle.show();
}

/**
 * projde seznam umělců a získá z api jejich release
 * @param {*} releaseType a = albums / t = tracks / p = appears / c = compilations
 */
async function libraryGetReleases(releaseType) {
    // nebyli získáni žádní umělci
    if (!libraryArtists) {
        await libraryGetArtists();
    }

    // získání názvu typu a seznamů releasů
    var releaseName;
    if (releaseType == 'a') {
        releaseName = 'albums';
        if (!libraryAlbums) {
            libraryAlbums = [];
        }
    }
    else if (releaseType == 't') {
        releaseName = 'tracks';
        if (!libraryTracks) {
            libraryTracks = [];
        }
    }
    else if (releaseType == 'p') {
        releaseName = 'appears';
        if (!libraryAppears) {
            libraryAppears = [];
        }
    }
    else if (releaseType == 'c') {
        releaseName = 'compilations';
        if (!libraryCompilations) {
            libraryCompilations = [];
        }
    }

    // zobrazení načítání
    showLoading('Getting ' + releaseName + ' from artists');

    // uloží hodnoty
    var libraryArtistsLength = libraryArtists.length;
    var index = 0;

    // projde sledované interprety
    await asyncForEach(libraryArtists, async artist => {
        // získá ze spotify api jejich albumy
        await libraryGetReleasesApi(releaseType, artist, ++index, libraryArtistsLength);
    });
    
    // získá seznam releasů
    var releaseList;
    if (releaseType == 'a') {
        releaseList = libraryAlbums;
    }
    else if (releaseType == 't') {
        releaseList = libraryTracks;
    }
    else if (releaseType == 'p') {
        releaseList = libraryAppears;
    }
    else if (releaseType == 'c') {
        releaseList = libraryCompilations;
    }

    if (releaseList.length < 1) {
        // nebyly získány žádné releasy
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        return;
    }

    // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
    releaseList.sort(function (a, b) {
        var keyA = new Date(a.release_date);
        var keyB = new Date(b.release_date);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('Select which year of albums releases you want to display.');

    // uloží do proměnných získaný seznam releasů
    if (releaseType == 'a') {
        libraryAlbums = releaseList;
    }
    else if (releaseType == 't') {
        libraryTracks = releaseList;
    }
    else if (releaseType == 'p') {
        libraryAppears = releaseList;
    }
    else if (releaseType == 'c') {
        libraryCompilations = releaseList;
    }
    
    // přidá do menu roky a měsíce releasů
    await addMenuYears(releaseType);

    // zobrazí albumy
    //await showAlbums();
}

/**
 * Projde seznam interpretů a získá ze Spotify jejich alba.
 */
async function libraryGetAlbums() {
    if (!libraryArtists) {
        await libraryGetArtists();
    }

    // zobrazení načítání
    showLoading('Getting albums from artists');

    // uloží hodnoty
    var libraryArtistsLength = libraryArtists.length;
    var index = 0;

    // nastaví seznam albumů
    if (!libraryAlbums) {
        libraryAlbums = [];
    }

    // projde sledované interprety
    await asyncForEach(libraryArtists, async artist => {
        // získá ze spotify api jejich albumy
        await libraryGetAlbumsApi(artist, ++index, libraryArtistsLength);
    });

    if (libraryAlbums.length < 1) {
        // nebyly získány žádné albumy
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        return;
    }

    // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
    libraryAlbums.sort(function (a, b) {
        var keyA = new Date(a.release_date);
        var keyB = new Date(b.release_date);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('Select which year of albums releases you want to display.');

    // přidá do menu roky a měsíce albumů
    await addMenuYears('a');

    // zobrazí albumy
    //await showAlbums();
}

/**
 * Získá ze Spotify api seznam albumů pro jednotlivé interprety.
 * @param {*} releaseType a = albums / t = tracks / p = appears / c = compilations
 * @param {*} artist interpret k získání albumů
 * @param {*} index pořadí aktuálního interpreta v seznamu
 * @param {*} artistsLength celkový počet interpretů, které uživatel sleduje
 */
async function libraryGetReleasesApi(releaseType, artist, index, artistsLength, url = '') {
    // získání názvu typu release
    var releaseName;
    var releaseFetch;
    if (releaseType == 'a') {
        releaseName = 'albums';
        releaseFetch = 'album';
    }
    else if (releaseType == 't') {
        releaseName = 'tracks';
        releaseFetch = 'single';
    }
    else if (releaseType == 'p') {
        releaseName = 'appears';
        releaseFetch = 'appears_on';
    }
    else if (releaseType == 'c') {
        releaseName = 'compilations';
        releaseFetch = 'compilation';
    }

    // získá url pro fetch
    if (url == '') {
        url = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=' + releaseFetch + '&market=' + userCountry;
    }

    // zobrazí zprávu
    elementMessage.text('Please wait: Getting ' + releaseName + ' from artists... (' + index + ' / ' + artistsLength + ')');

    // získá json releasů ze spotify api
    var json = await fetchJson(url, 'Failed to get ' + releaseName + ' from artist ' + artist.name);

    if (json == null) {
        return;
    }

    // přidá release do seznamu
    await libraryAddRelease(releaseType, artist, json.items);

    // načte další stránku
    if (json.next) {
        await libraryGetReleasesApi(releaseType, artist, index, artistsLength, json.next);
    }
}

/**
 * Získá ze Spotify api seznam albumů pro jednotlivé interprety.
 * @param {*} artist interpret k získání albumů
 * @param {*} index pořadí aktuálního interpreta v seznamu
 * @param {*} artistsLength celkový počet interpretů, které uživatel sleduje
 * @param {*} url adresa dotazu api
 */
async function libraryGetAlbumsApi(artist, index, artistsLength, url = artist.fetch_url.album) {
    // zobrazí zprávu
    elementMessage.text('Please wait: Getting albums from artists... (' + index + ' / ' + artistsLength + ')');

    // získá json albumů ze spotify api
    var json = await fetchJson(url, 'Failed to get albums from artist ' + artist.name);

    if (json == null) {
        return;
    }

    // přidá album do seznamu
    await libraryAddAlbum(artist, json.items);

    // načte další stránku
    if (json.next) {
        await libraryGetAlbumsApi(artist, index, artistsLength, json.next);
    }
}

/**
 * Přidá vybrané alba do seznamu alb (interpreta a všech alb)
 * @param {*} releaseType a = albums / t = tracks / p = appears / c = compilations
 * @param {*} artist interpret releasu
 * @param {*} releases seznam releasů získaných ze spotify
 */
async function libraryAddRelease(releaseType, artist, releases) {
    // interpret nemá žádné releasy
    if (!releases) {
        return;
    }
    if (releases.length < 1) {
        return;
    }

    // projde nově získané releasy
    await asyncForEach(releases, async release => {
        // získá všechny umělce releasu
        var releaseArtists = release.artists;

        // zapíše všechny umělce releasu do stringu s oddělovači
        var albumArtistsLength = releaseArtists.length;
        var albumArtistsString = '';
        if (albumArtistsLength > 0) {
            albumArtistsString = releaseArtists[0].name;
            for (let index = 1; index < albumArtistsLength - 1; index++) {
                albumArtistsString += ', ' + releaseArtists[index].name;
            }
        }
        if (albumArtistsLength > 1) {
            albumArtistsString += ' & ' + releaseArtists[albumArtistsLength - 1].name;
        }

        // získá cover
        var coverUrl = '';
        if (release.images.length > 0) {
            coverUrl = release.images[1].url;
        }
        else {
            coverUrl = 'images/no-cover.png';
        }

        // přidá potřebné věci k releasu
        release.cover = coverUrl;
        release.url = release.external_urls.spotify;
        release.artist = artist;
        release.artistsString = albumArtistsString;
    });

    if (releaseType == 'a') {
        // nastaví interpretovi releasy
        if (!artist.albums) {
            artist.albums = [];
        }
        // přidá nové releasy do seznamu
        artist.albums = artist.albums.concat(releases);
        libraryAlbums = libraryAlbums.concat(releases);
    }
    else if (releaseType == 't') {
        if (!artist.tracks) {
            artist.tracks = [];
        }
        artist.tracks = artist.tracks.concat(releases);
        libraryTracks = libraryTracks.concat(releases);
    }
    else if (releaseType == 'p') {
        if (!artist.appears) {
            artist.appears = [];
        }
        artist.appears = artist.appears.concat(releases);
        libraryAppears = libraryAppears.concat(releases);
    }
    else if (releaseType == 'c') {
        if (!artist.compilations) {
            artist.compilations = [];
        }
        artist.compilations = artist.compilations.concat(releases);
        libraryCompilations = libraryCompilations.concat(releases);
    }

}

/**
 * Přidá vybrané alba do seznamu alb (interpreta a všech alb)
 * @param {*} artist interpret albumu
 * @param {*} albums seznam albumů získaných ze spotify
 */
async function libraryAddAlbum(artist, albums) {
    // interpret nemá žádné albumy
    if (!albums) {
        return;
    }
    if (albums.length < 1) {
        return;
    }

    // nastaví interpretovi albumy
    if (!artist.albums) {
        artist.albums = [];
    }

    // projde nově získané alba
    await asyncForEach(albums, async album => {
        // získá všechny umělce alba
        var releaseArtists = album.artists;

        // zapíše všechny umělce alba do stringu s oddělovači
        var albumArtistsLength = releaseArtists.length;
        var albumArtistsString = '';
        if (albumArtistsLength > 0) {
            albumArtistsString = releaseArtists[0].name;
            for (let index = 1; index < albumArtistsLength - 1; index++) {
                albumArtistsString += ', ' + releaseArtists[index].name;
            }
        }
        if (albumArtistsLength > 1) {
            albumArtistsString += ' & ' + releaseArtists[albumArtistsLength - 1].name;
        }

        // získá cover
        var coverUrl = '';
        if (album.images.length > 0) {
            coverUrl = album.images[1].url;
        }
        else {
            coverUrl = 'images/no-cover.png';
        }

        // přidá potřebné věci k albumu
        album.cover = coverUrl;
        album.url = album.external_urls.spotify;
        album.artist = artist;
        album.artistsString = albumArtistsString;
    });

    // přidá nové albumy do seznamu
    artist.albums = artist.albums.concat(albums);
    libraryAlbums = libraryAlbums.concat(albums);
}


// PODROBNÉ INFORMACE O ALBU //

// TODO!!!!
/* získá info o albumu (máli ho uživatel v knihovně atd.) */
function getAlbumInfo(artist, album) {
    // TODO : spuštět až po kliknutí na dané album
    fetchUrl = API_URL + '/me/albums/contains?ids=' + album.id;
    fetch(fetchUrl, options)
        .then(response => response.json())
        .then(json => {
            var inLibrary = false;
            // možné chyby
            if (json.error) {
                if (json.error.status === 429) {
                    // api - moc dotazů
                    setTimeout(function () { getAlbumInfo(artist, album); }, 3000);
                }
            }
            else {
                if (json[0] == true) {
                    inLibrary = true;
                }
            }
            album.library = inLibrary;

            if (!artist.albums) {
                artist.albums = [];
            }

            // uloží ho do seznamu všech alb
            var added = false;
            for (let index = 0; index < artist.albums.length; index++) {
                // projde již získaná alba
                if (album.id === artist.albums[index].id) {
                    // nové album již bylo přidáno do seznamu dřive
                    added = true;
                    break;
                }
            }
            if (!added) {
                //userAlbums.push(album);
                artist.albums.push(album);
                if (!libraryAlbums) {
                    libraryAlbums = [];
                }
                libraryAlbums.push(album);

                // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
                libraryAlbums.sort(function (a, b) {
                    var keyA = new Date(a.release_date);
                    var keyB = new Date(b.release_date);
                    if (keyA < keyB) return 1;
                    if (keyA > keyB) return -1;
                    return 0;
                });
            }
        });
}


// SKLADBY //

// TODO !!!
elementTracksButton.click(function () {
    showTracks();
});

// TODO !!!
/* projde seznam umělců a získá z api jejich skladby */
async function libraryGetTracks() {
    if (!libraryArtists) {
        await libraryGetArtists();
    }

    // zobrazení načítání
    showLoading('Getting tracks from artists');

    // uloží hodnoty
    var libraryArtistsLength = libraryArtists.length;
    var index = 0;

    // nastaví seznam tracků
    if (!libraryTracks) {
        libraryTracks = [];
    }

    await asyncForEach(libraryArtists, async artist => {
        await libraryGetTracksApi(artist, ++index, libraryArtistsLength);
    });

    if (libraryTracks.length < 1) {
        // nebyly získány žádné tracky
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        return;
    }

    // seřadí seznam tracků podle data vydání od nejnovějších po nejstarší
    libraryTracks.sort(function (a, b) {
        var keyA = new Date(a.release_date);
        var keyB = new Date(b.release_date);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('Select which year of tracks releases you want to display.');

    // přidá do menu roky a měsíce albumů
    await addMenuYears(libraryTracks, 't');

    // zobrazí tracky
    //await showTracks();
}

// TODO !!!
async function libraryGetTracksApi(artist, index, artistsLength, url = artist.fetch_url.track) {
    // zobrazí zprávu
    elementMessage.text('Please wait: Getting tracks from artists... (' + index + ' / ' + artistsLength + ')');

    // získá json tracků ze spotify api
    var json = await fetchJson(url, 'Failed to get tracks from artist ' + artist.name);

    if (json == null) {
        return;
    }

    // přidá track do seznamu
    await libraryAddTrack(artist, json.items);

    // načte další stránku
    if (json.next) {
        await libraryGetTracksApi(artist, index, artistsLength, json.next);
    }
}


/**
 * Přidá vybrané tracky do seznamu tracků (interpreta a všech tracků)
 * @param {*} artist interpret tracku
 * @param {*} tracks seznam tracků získaných ze spotify
 */
async function libraryAddTrack(artist, tracks) {
    // interpret nemá žádné tracky
    if (!tracks) {
        return;
    }
    if (tracks.length < 1) {
        return;
    }

    // nastaví interpretovi tracky
    if (!artist.tracks) {
        artist.tracks = [];
    }

    // projde nově získané tracky
    await asyncForEach(tracks, async track => {
        // získá všechny umělce alba
        var releaseArtists = track.artists;

        // zapíše všechny umělce alba do stringu s oddělovači
        var albumArtistsLength = releaseArtists.length;
        var albumArtistsString = '';
        if (albumArtistsLength > 0) {
            albumArtistsString = releaseArtists[0].name;
            for (let index = 1; index < albumArtistsLength - 1; index++) {
                albumArtistsString += ', ' + releaseArtists[index].name;
            }
        }
        if (albumArtistsLength > 1) {
            albumArtistsString += ' & ' + releaseArtists[albumArtistsLength - 1].name;
        }

        // získá cover
        var coverUrl = '';
        if (track.images.length > 0) {
            coverUrl = track.images[1].url;
        }
        else {
            coverUrl = 'images/no-cover.png';
        }

        // přidá potřebné věci k albumu
        track.cover = coverUrl;
        track.url = track.external_urls.spotify;
        track.artistsString = albumArtistsString;
    });

    // přidá nové albumy do seznamu
    artist.tracks = artist.tracks.concat(tracks);
    libraryTracks = libraryTracks.concat(tracks);
}

// TODO !!!
/**
 * Zobrazení tracků
 */
async function showTracks() {
    elementNav.hide();
    elementTitle.hide();

    elementAlbums.hide();
    //elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();

    $('.nav-a').hide();
    //$('.nav-t').hide();
    $('.nav-p').hide();
    $('.nav-c').hide();

    var params = getHashParams();
    if (params.show != 'tracks') {
        // nebyla nastavena url
        window.location.replace("#show=tracks");
    }

    if (!libraryTracks) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        await libraryGetTracks();
    }

    if (!libraryTracks) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No tracks', 'Cannot show any track, because you are following only artists without tracks.');
    }
    else if (libraryTracks.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No tracks', 'Cannot show any track, because you are following only artists without tracks.');
    }
    else {
        // byly načteny albumy

        // TODO : dodělat přepínání
        /*if (elementAlbums.is(':hidden')) {
            // albumy jsou již zobrazeny
            return;
        }*/

        // albumy nejsou zobrazeny
        // -> zobrazím albumy

        // TODO : zobrazit albumy (podle roku z url) a menu
        await viewReleases('t', '2019');
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementTracksButton.addClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');

    elementTracks.show();
    $('.nav-t').show();
    elementNav.show();
    elementTitle.show();
}


/**
 * Projde seznam interpretů a získá ze Spotify jejich Appears.
 */
async function libraryGetAppears() {
    if (!libraryArtists) {
        await libraryGetArtists();
    }

    // zobrazení načítání
    showLoading('Getting appears from artists');

    // uloží hodnoty
    var libraryArtistsLength = libraryArtists.length;
    var index = 0;

    // nastaví seznam Appears
    if (!libraryAppears) {
        libraryAppears = [];
    }

    // projde sledované interprety
    await asyncForEach(libraryArtists, async artist => {
        // získá ze spotify api jejich Appears
        await libraryGetAppearsApi(artist, ++index, libraryArtistsLength);
    });

    if (libraryAppears.length < 1) {
        // nebyly získány žádné Appears
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        return;
    }

    // seřadí seznam Appears podle data vydání alba od nejnovějších po nejstarší
    libraryAppears.sort(function (a, b) {
        var keyA = new Date(a.release_date);
        var keyB = new Date(b.release_date);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('Select which year of appears releases you want to display.');

    // přidá do menu roky a měsíce Appears
    await addMenuYears(libraryAppears, 'p');

    // zobrazí Appears
    //await showAppears();
}

/**
 * Získá ze Spotify api seznam Appears pro jednotlivé interprety.
 * @param {*} artist interpret k získání Appears
 * @param {*} index pořadí aktuálního interpreta v seznamu
 * @param {*} artistsLength celkový počet interpretů, které uživatel sleduje
 * @param {*} url adresa dotazu api
 */
async function libraryGetAppearsApi(artist, index, artistsLength, url = artist.fetch_url.appears) {
    // zobrazí zprávu
    elementMessage.text('Please wait: Getting appears from artists... (' + index + ' / ' + artistsLength + ')');

    // získá json Appears ze spotify api
    var json = await fetchJson(url, 'Failed to get appears from artist ' + artist.name);

    if (json == null) {
        return;
    }

    // přidá album do seznamu
    await libraryAddAppear(artist, json.items);

    // načte další stránku
    if (json.next) {
        await libraryGetAppearsApi(artist, index, artistsLength, json.next);
    }
}

/**
 * Přidá vybrané Appears do seznamu Appears (interpreta a všech Appears)
 * @param {*} artist interpret Appears
 * @param {*} appears seznam Appears získaných ze spotify
 */
async function libraryAddAppear(artist, appears) {
    // interpret nemá žádné Appears
    if (!appears) {
        return;
    }
    if (appears.length < 1) {
        return;
    }

    // nastaví interpretovi Appears
    if (!artist.appears) {
        artist.appears = [];
    }

    // projde nově získané alba
    await asyncForEach(appears, async appear => {
        // získá všechny umělce alba
        var releaseArtists = appear.artists;

        // zapíše všechny umělce alba do stringu s oddělovači
        var appearArtistsLength = releaseArtists.length;
        var albumArtistsString = '';
        if (appearArtistsLength > 0) {
            albumArtistsString = releaseArtists[0].name;
            for (let index = 1; index < appearArtistsLength - 1; index++) {
                albumArtistsString += ', ' + releaseArtists[index].name;
            }
        }
        if (appearArtistsLength > 1) {
            albumArtistsString += ' & ' + releaseArtists[appearArtistsLength - 1].name;
        }

        // získá cover
        var coverUrl = '';
        if (appear.images.length > 0) {
            if (appear.images[1]) {
                coverUrl = appear.images[1].url;
            }
            else {
                coverUrl = appear.images[0].url;
            }
        }
        else {
            coverUrl = 'images/no-cover.png';
        }

        // přidá potřebné věci k albumu
        appear.cover = coverUrl;
        appear.url = appear.external_urls.spotify;
        appear.artistsString = albumArtistsString;
    });

    // přidá nové albumy do seznamu
    artist.appears = artist.appears.concat(appears);
    libraryAppears = libraryAppears.concat(appears);
}


/**
 * Kliknutí na tlačítko Appears.
 */
elementAppearsButton.click(function () {
    // volá funkci zobrazení albumů
    showAppears();
});

// TODO !!!
/**
 * Zobrazení Appears
 */
async function showAppears() {
    elementNav.hide();
    elementTitle.hide();

    elementAlbums.hide();
    elementTracks.hide();
    //elementAppears.hide();
    elementCompilations.hide();

    $('.nav-a').hide();
    $('.nav-t').hide();
    //$('.nav-p').hide();
    $('.nav-c').hide();

    var params = getHashParams();
    if (params.show != 'appears') {
        // nebyla nastavena url
        window.location.replace("#show=appears");
    }

    if (!libraryAppears) {
        // Appears dosud nebyly načteny
        // -> získá Appears a zobrazí je
        await libraryGetAppears();
    }
    if (!libraryAppears) {
        // Appears byly načteny, ale žádné se nenašly
        showError('No appears', 'Cannot show any appear, because you are following only artists without appears.');
    }
    else if (libraryAppears.length < 1) {
        // Appears byly načteny, ale žádné se nenašly
        showError('No appears', 'Cannot show any appear, because you are following only artists without appears.');
    }
    else {
        // byly načteny Appears

        // TODO : dodělat přepínání
        /*if (elementAlbums.is(':hidden')) {
            // albumy jsou již zobrazeny
            return;
        }*/

        // albumy nejsou zobrazeny
        // -> zobrazím albumy

        // TODO : zobrazit albumy (podle roku z url) a menu
        await viewReleases('p', '2019');
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.addClass('current-year');
    elementCompilationsButton.removeClass('current-year');

    elementAppears.show();
    $('.nav-p').show();
    elementNav.show();
    elementTitle.show();
}