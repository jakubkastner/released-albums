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
        hideLoading('0 artists');
        return;
    }

    // seřadí seznam interpretů podle abecedy
    libraryArtists.sort(function (a, b) {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('Select which releases you want to display.');
}

/**
 * Získá ze Spotify api seznam interpretů, které uživatel sleduje.
 * @param {*} url url adresa api požadavku
 */
async function libraryGetArtistsApi(url, index = 0) {
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
        elementMessage.text('Please wait: Getting list of your followed artists... (' + ++index + ')');
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
        await libraryGetArtistsApi(json.artists.next, index);
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
/**
 * Kliknutí na tlačítko EP.
 */
elementEPsButton.click(function () {
    // volá funkci zobrazení eps
    showEPs();
});

// TODO !!!
/**
 * Zobrazení tracků
 */
async function showPodcasts() {
    elementHiddenMenu.hide();
    elementTitle.hide();

    elementActions.html(``);
    elementActions.hide();

    elementAlbums.hide();
    elementEPs.hide();
    elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();
    //elementPodcasts.hide();
    elementMyAlbums.hide();
    elementSettings.hide();

    elementMenuDate.show();
    $('.nav-a').hide();
    $('.nav-e').hide();
    $('.nav-t').hide();
    $('.nav-p').hide();
    $('.nav-c').hide();
    $('.nav-d').hide();
    //$('.nav-s').hide();
    $('.nav-m').hide();

    var params = getHashParams();
    if (params.show != 'podcasts') {
        // nebyla nastavena url
        window.location.replace("#show=podcasts");
    }
    if (!libraryPlaylists) {
        await libraryGetPlaylists();
    }

    if (!libraryPodcastsAll) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        //await libraryGetReleases('d');
        await libraryGetPodcasts();
    }

    if (!libraryPodcastsAll) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No Podcasts', 'Cannot show any podcasts, because you are following only artists without podcasts.');
    }
    else if (libraryPodcastsAll.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No Podcasts', 'Cannot show any podcasts, because you are following only artists without podcasts.');
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
        var year = '0';
        var month = '0';
        if (params.year) {
            year = params.year;
        }
        if (params.month) {
            month = params.month;
        }
        await viewReleases('d', year, month);
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementPodcastsButton.addClass('current-year');
    elementMyAlbumsButton.removeClass('current-year');
    elementSettingsButton.removeClass('current-year');

    elementPodcasts.show();
    $('.nav-d').show();
    elementHiddenMenu.show();
    elementTitle.show();
}
// TODO !!!
/**
 * Zobrazení tracků
 */
async function showEPs() {
    elementHiddenMenu.hide();
    elementTitle.hide();

    elementActions.html(``);
    elementActions.hide();

    elementAlbums.hide();
    //elementEPs.hide();
    elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();
    elementPodcasts.hide();
    elementMyAlbums.hide();
    elementSettings.hide();

    elementMenuDate.show();
    $('.nav-a').hide();
    //$('.nav-e').hide();
    $('.nav-t').hide();
    $('.nav-p').hide();
    $('.nav-c').hide();
    $('.nav-d').hide();
    $('.nav-s').hide();
    $('.nav-m').hide();

    var params = getHashParams();
    if (params.show != 'eps') {
        // nebyla nastavena url
        window.location.replace("#show=eps");
    }

    if (!libraryEPs) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        await libraryGetReleases('e');
    }

    if (!libraryEPs) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No EPs', 'Cannot show any EP, because you are following only artists without EPs.');
    }
    else if (libraryEPs.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No EPs', 'Cannot show any EP, because you are following only artists without EPs.');
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
        var year = '0';
        var month = '0';
        if (params.year) {
            year = params.year;
        }
        if (params.month) {
            month = params.month;
        }
        await viewReleases('e', year, month);
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.addClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementPodcastsButton.removeClass('current-year');
    elementMyAlbumsButton.removeClass('current-year');
    elementSettingsButton.removeClass('current-year');

    elementEPs.show();
    $('.nav-e').show();
    elementHiddenMenu.show();
    elementTitle.show();
}

// TODO !!!
/**
 * Zobrazení albumů
 */
async function showAlbums() {
    elementHiddenMenu.hide();
    elementTitle.hide();

    elementActions.html(``);
    elementActions.hide();

    //elementAlbums.hide();
    elementEPs.hide();
    elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();
    elementPodcasts.hide();
    elementMyAlbums.hide();
    elementSettings.hide();

    elementMenuDate.show();
    //$('.nav-a').hide();
    $('.nav-e').hide();
    $('.nav-t').hide();
    $('.nav-p').hide();
    $('.nav-c').hide();
    $('.nav-d').hide();
    $('.nav-s').hide();
    $('.nav-m').hide();

    var params = getHashParams();
    if (params.show != 'albums') {
        // nebyla nastavena url
        window.location.replace('#show=albums');
    }

    if (!libraryAlbums) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
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
        var year = '0';
        var month = '0';
        if (params.year) {
            year = params.year;
        }
        if (params.month) {
            month = params.month;
        }
        await viewReleases('a', year, month);
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.addClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementPodcastsButton.removeClass('current-year');
    elementMyAlbumsButton.removeClass('current-year');
    elementSettingsButton.removeClass('current-year');

    elementAlbums.show();
    $('.nav-a').show();
    elementHiddenMenu.show();
    elementTitle.show();
}

async function getPodcastsEpisodes(podcast) {
    // /shows/{id}/episodes
    await getPodcastsEpisodesApi(API_URL + '/shows/' + podcast.show.id + '/episodes?offset=0&limit=50', podcast);
}


async function getPodcastsEpisodesApi(url, podcast) {
    var json = await fetchJson(url);
    if (json === null) return false;
    if (!podcast.episodes) {
        podcast.episodes = [];
    }
    var name = podcast.show.name;
    await asyncForEach(json.items, async podcast2 => {
        // získá cover
        var coverUrl = '';
        if (podcast2.images.length > 0) {
            coverUrl = podcast2.images[0].url;
        }
        else if (podcast2.images.length > 1) {
            coverUrl = podcast2.images[1].url;
        }
        else if (podcast2.images.length > 3) {
            coverUrl = podcast2.images[3].url;
        }
        else {
            coverUrl = 'images/no-cover.png';
        }
        podcast2.url = podcast2.external_urls.spotify;
        podcast2.artist = podcast.show;

        // přidá potřebné věci k releasu
        podcast2.cover = coverUrl;
        podcast2.artistsString = name;
    });
    libraryPodcastsAll = libraryPodcastsAll.concat(json.items);
    podcast.episodes = podcast.episodes.concat(json.items);
    podcast.artistsString = name;
    if (json.next) {
        await getPodcastsEpisodesApi(json.next, podcast);
    }
    return true;
}

async function getPodcastsApi(url) {
    var json = await fetchJson(url);
    if (json === null) return false;
    libraryPodcasts = libraryPodcasts.concat(json.items);
    if (json.next) {
        await getPodcastsApi(json.next);
    }
    return true;
}

async function libraryGetPodcasts() {
    elementMenuMobile.addClass('hidden');
    // získání názvu typu a seznamů releasů
    var releaseName = 'podcasts';
    if (!libraryPodcasts) {
        libraryPodcasts = [];
    }
    if (!libraryPodcastsAll) {
        libraryPodcastsAll = [];
    }

    // zobrazení načítání
    showLoading('Getting ' + releaseName);

    // získám uložené podcasty
    await getPodcastsApi(API_URL + '/me/shows?offset=0&limit=50');

    // projde sledované interprety
    var index = 0;
    await asyncForEach(libraryPodcasts, async podcast => {
        if (podcast === undefined) return;
        elementMessage.text('Please wait: Getting podcasts... (' + ++index + ')');
        // získá ze spotify api jejich albumy
        await getPodcastsEpisodes(podcast);
    });

    if (libraryPodcastsAll.length < 1) {
        // nebyly získány žádné releasy
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        return;
    }

    // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
    libraryPodcastsAll.sort(function (a, b) {
        var keyA = new Date(a.release_date);
        var keyB = new Date(b.release_date);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('Select which year of albums releases you want to display.');

    // přidá do menu roky a měsíce releasů
    await addMenuYears('d');
}

/**
 * projde seznam umělců a získá z api jejich release
 * @param {*} releaseType a = albums / t = tracks / p = appears / c = compilations
 */
async function libraryGetReleases(releaseType) {
    elementMenuMobile.addClass('hidden');
    // nebyli získáni žádní umělci
    if (releaseType != 'm') {
        if (!libraryArtists) {
            await libraryGetArtists();
        }
    }
    if (!libraryPlaylists) {
        await libraryGetPlaylists();
    }

    // získání názvu typu a seznamů releasů
    var releaseName;
    if (releaseType == 'a') {
        releaseName = 'albums';
        if (!libraryAlbums) {
            libraryAlbums = [];
        }
    }
    else if (releaseType == 'e') {
        releaseName = 'eps';
        if (!libraryEPs) {
            libraryEPs = [];
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
    else if (releaseType == 'd') {
        releaseName = 'podcasts';
        if (!libraryPodcasts) {
            libraryPodcasts = [];
        }
    }
    else if (releaseType == 'm') {
        releaseName = 'saved albums';
        if (!libraryMyAlbums) {
            libraryMyAlbums = [];
        }
    }

    // zobrazení načítání
    showLoading('Getting ' + releaseName + ' from artists');

    // uloží hodnoty
    var index = 0;

    if (releaseType == 'm') {
        await libraryGetReleasesApi(releaseType);
    }
    else {
        var libraryArtistsLength = libraryArtists.length;
        // projde sledované interprety
        await asyncForEach(libraryArtists, async artist => {
            // získá ze spotify api jejich albumy
            await libraryGetReleasesApi(releaseType, '', artist, ++index, libraryArtistsLength);
        });
    }

    // získá seznam releasů
    var releaseList;
    var releaseList2;
    if (releaseType == 'a') {
        releaseList = libraryAlbums;
    }
    else if (releaseType == 'e') {
        releaseList = libraryEPs;
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
    else if (releaseType == 'd') {
        releaseList = libraryPodcasts;
    }
    else if (releaseType == 'm') {
        releaseList = libraryMyAlbums;
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

    if (releaseType == 'e') {
        releaseList2 = libraryTracks;
    }
    else if (releaseType == 't') {
        releaseList2 = libraryEPs;
    }
    if (releaseList2) {
        if (releaseList2.length > 0) {
            // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
            releaseList2.sort(function (a, b) {
                var keyA = new Date(a.release_date);
                var keyB = new Date(b.release_date);
                if (keyA < keyB) return 1;
                if (keyA > keyB) return -1;
                return 0;
            });
        }
    }

    // zobrazí/skryje příslušné prvky a zobrazí zprávu
    hideLoading('Select which year of albums releases you want to display.');

    // uloží do proměnných získaný seznam releasů
    if (releaseType == 'a') {
        libraryAlbums = releaseList;
    }
    else if (releaseType == 'e') {
        libraryEPs = releaseList;
        await addMenuYears('t');
        $('.nav-t').hide();
    }
    else if (releaseType == 't') {
        libraryTracks = releaseList;
        await addMenuYears('e');
        $('.nav-e').hide();
    }
    else if (releaseType == 'p') {
        libraryAppears = releaseList;
    }
    else if (releaseType == 'c') {
        libraryCompilations = releaseList;
    }
    else if (releaseType == 'd') {
        releaseList = libraryPodcasts;
    }
    else if (releaseType == 'm') {
        releaseList = libraryMyAlbums;
    }

    // přidá do menu roky a měsíce releasů
    await addMenuYears(releaseType);

}

/**
 * Získá ze Spotify api seznam albumů pro jednotlivé interprety.
 * @param {*} releaseType a = albums / t = tracks / p = appears / c = compilations
 * @param {*} artist interpret k získání albumů
 * @param {*} index pořadí aktuálního interpreta v seznamu
 * @param {*} artistsLength celkový počet interpretů, které uživatel sleduje
 */
async function libraryGetReleasesApi(releaseType, url = '', artist = null, index = 0, artistsLength = 0) {
    // získání názvu typu release
    var releaseName;
    var releaseFetch;
    if (releaseType == 'a') {
        releaseName = 'albums';
        releaseFetch = 'album';
    }
    else if (releaseType == 'e') {
        releaseName = 'eps';
        releaseFetch = 'single';
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
    else if (releaseType == 'd') {
        releaseName = 'podcasts';
        releaseFetch = 'podcasts';
    }
    else if (releaseType == 'm') {
        releaseName = 'saved albums';
    }
    // získá url pro fetch
    if (url == '') {
        if (releaseType == 'm') {
            // https://api.spotify.com/v1/me/albums
            url = API_URL + '/me/albums?offset=0&limit=50&market=' + userCountry;
        }
        else {
            url = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=' + releaseFetch + '&market=' + userCountry;
        }
    }


    // získá json releasů ze spotify api
    var json;
    if (releaseType == 'm') {
        // zobrazí zprávu
        elementMessage.text('Please wait: Getting ' + releaseName);
        json = await fetchJson(url, 'Failed to get ' + releaseName);
    }
    else {
        // zobrazí zprávu
        elementMessage.text('Please wait: Getting ' + releaseName + ' from artists... (' + index + ' / ' + artistsLength + ')');
        json = await fetchJson(url, 'Failed to get ' + releaseName + ' from artist ' + artist.name);
    }

    if (json == null) {
        return;
    }

    if (releaseType == 'm') {
        // projde release
        await asyncForEach(json.items, async releaseAlbum => {
            await libraryAddRelease(releaseType, releaseAlbum.album.artists[0], releaseAlbum.album);
        });
    }
    else {
        // přidá release do seznamu
        await libraryAddReleases(releaseType, artist, json.items);
    }


    // načte další stránku
    if (json.next) {
        if (releaseType == 'm') {
            await libraryGetReleasesApi(releaseType, json.next);
        }
        else {
            await libraryGetReleasesApi(releaseType, json.next, artist, index, artistsLength);
        }
    }
}


/**
 * Přidá vybrané alba do seznamu alb (interpreta a všech alb)
 * @param {*} releaseType a = albums / t = tracks / p = appears / c = compilations
 * @param {*} artist interpret releasu
 * @param {*} releases seznam releasů získaných ze spotify
 */
async function libraryAddReleases(releaseType, artist, releases) {
    // interpret nemá žádné releasy
    if (!releases) {
        return;
    }
    if (releases.length < 1) {
        return;
    }
    var rel = [];

    // projde nově získané releasy
    await asyncForEach(releases, async release => {
        var releaseNew = await libraryAddRelease(releaseType, artist, release);

        if (releaseNew == null) { return; }
        rel.push(releaseNew);
    });

    if (releaseType == 'a') {
        // nastaví interpretovi releasy
        if (!artist.albums) {
            artist.albums = [];
        }
        // přidá nové releasy do seznamu
        artist.albums = artist.albums.concat(rel);
        libraryAlbums = libraryAlbums.concat(rel);
    }
    else if (releaseType == 'e') {
        if (!artist.eps) {
            artist.eps = [];
        }
        artist.eps = artist.eps.concat(rel);
        libraryEPs = libraryEPs.concat(rel);
    }
    else if (releaseType == 't') {
        if (!artist.tracks) {
            artist.tracks = [];
        }
        artist.tracks = artist.tracks.concat(rel);
        libraryTracks = libraryTracks.concat(rel);
    }
    else if (releaseType == 'p') {
        if (!artist.appears) {
            artist.appears = [];
        }
        artist.appears = artist.appears.concat(rel);
        libraryAppears = libraryAppears.concat(rel);
    }
    else if (releaseType == 'c') {
        if (!artist.compilations) {
            artist.compilations = [];
        }
        artist.compilations = artist.compilations.concat(rel);
        libraryCompilations = libraryCompilations.concat(rel);
    }
    else if (releaseType == 'd') {
        /*if (!artist.podcasts) {
            artist.podcasts = [];
        }
        artist.podcasts = artist.podcasts.concat(rel);*/
        libraryPodcasts = libraryPodcasts.concat(rel);
        releaseList = libraryPodcasts;
    }
}
async function libraryAddRelease(releaseType, artist, release) {
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
        coverUrl = release.images[0].url;
    }
    else if (release.images.length > 1) {
        coverUrl = release.images[1].url;
    }
    else if (release.images.length > 3) {
        coverUrl = release.images[3].url;
    }
    else {
        coverUrl = 'images/no-cover.png';
    }

    // přidá potřebné věci k releasu
    release.cover = coverUrl;
    release.url = release.external_urls.spotify;
    release.artist = artist;
    release.artistsString = albumArtistsString;
    if (releaseType == 't') {
        if (release.total_tracks > 1) {
            if (!artist.eps) {
                artist.eps = [];
            }
            artist.eps.push(release);
            if (!libraryEPs) {
                libraryEPs = [];
            }
            libraryEPs.push(release);
            return null;
        }
    }
    else if (releaseType == 'e') {
        if (release.total_tracks <= 1) {
            if (!artist.tracks) {
                artist.tracks = [];
            }
            artist.tracks.push(release);
            if (!libraryTracks) {
                libraryTracks = [];
            }
            libraryTracks.push(release);
            return null;
        }
    }
    if (releaseType == 'm') {
        // přidá nový release do seznamu
        libraryMyAlbums.push(release);
    }
    return release;
}

// PODROBNÉ INFORMACE O ALBU //
// aktuálně nepoužíváno nikde !
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
/**
 * Zobrazení tracků
 */
async function showTracks() {
    elementHiddenMenu.hide();
    elementTitle.hide();

    elementActions.html(``);
    elementActions.hide();

    elementAlbums.hide();
    elementEPs.hide();
    //elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();
    elementPodcasts.hide();
    elementMyAlbums.hide();
    elementSettings.hide();

    elementMenuDate.show();
    $('.nav-a').hide();
    $('.nav-e').hide();
    //$('.nav-t').hide();
    $('.nav-p').hide();
    $('.nav-c').hide();
    $('.nav-d').hide();
    $('.nav-s').hide();
    $('.nav-m').hide();

    var params = getHashParams();
    if (params.show != 'tracks') {
        // nebyla nastavena url
        window.location.replace("#show=tracks");
    }

    if (!libraryTracks) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        await libraryGetReleases('t');
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
        var year = '0';
        var month = '0';
        if (params.year) {
            year = params.year;
        }
        if (params.month) {
            month = params.month;
        }
        await viewReleases('t', year, month);
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.addClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementPodcastsButton.removeClass('current-year');
    elementMyAlbumsButton.removeClass('current-year');
    elementSettingsButton.removeClass('current-year');

    elementTracks.show();
    $('.nav-t').show();
    elementHiddenMenu.show();
    elementTitle.show();
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
    elementHiddenMenu.hide();
    elementTitle.hide();

    elementActions.html(``);
    elementActions.hide();

    elementAlbums.hide();
    elementEPs.hide();
    elementTracks.hide();
    //elementAppears.hide();
    elementCompilations.hide();
    elementPodcasts.hide();
    elementMyAlbums.hide();
    elementSettings.hide();

    elementMenuDate.show();
    $('.nav-a').hide();
    $('.nav-e').hide();
    $('.nav-t').hide();
    //$('.nav-p').hide();
    $('.nav-c').hide();
    $('.nav-d').hide();
    $('.nav-s').hide();
    $('.nav-m').hide();

    var params = getHashParams();
    if (params.show != 'appears') {
        // nebyla nastavena url
        window.location.replace("#show=appears");
    }

    if (!libraryAppears) {
        // Appears dosud nebyly načteny
        // -> získá Appears a zobrazí je
        await libraryGetReleases('p');
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
        var year = '0';
        var month = '0';
        if (params.year) {
            year = params.year;
        }
        if (params.month) {
            month = params.month;
        }
        await viewReleases('p', year, month);
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.addClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementPodcastsButton.removeClass('current-year');
    elementMyAlbumsButton.removeClass('current-year');
    elementSettingsButton.removeClass('current-year');

    elementAppears.show();
    $('.nav-p').show();
    elementHiddenMenu.show();
    elementTitle.show();
}


// TODO !!!
elementCompilationsButton.click(function () {
    showCompilations();
});
elementPodcastsButton.click(function () {
    showPodcasts();
});


elementMyAlbumsButton.click(function () {
    showMyAlbums();
});

async function showMyAlbums() {
    elementHiddenMenu.hide();
    elementTitle.hide();

    elementActions.html(``);
    elementActions.hide();

    elementAlbums.hide();
    elementEPs.hide();
    elementTracks.hide();
    elementAppears.hide();
    elementCompilations.hide();
    elementPodcasts.hide();
    //elementMyAlbums.hide();
    elementSettings.hide();

    elementMenuDate.show();
    $('.nav-a').hide();
    $('.nav-e').hide();
    $('.nav-t').hide();
    $('.nav-p').hide();
    $('.nav-c').hide();
    $('.nav-d').hide();
    $('.nav-s').hide();
    //$('.nav-m').hide();

    var params = getHashParams();
    if (params.show != 'my-albums') {
        // nebyla nastavena url
        window.location.replace('#show=my-albums');
    }

    if (!libraryMyAlbums) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        await libraryGetReleases('m');
    }
    if (!libraryMyAlbums) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No albums', 'Cannot show any album, because you are havent any saved album.');
    }
    else if (libraryMyAlbums.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No albums', 'Cannot show any album, because you are havent any saved album.');
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
        var year = '0';
        var month = '0';
        if (params.year) {
            year = params.year;
        }
        if (params.month) {
            month = params.month;
        }
        await viewReleases('m', year, month);
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.removeClass('current-year');
    elementPodcastsButton.removeClass('current-year');
    elementMyAlbumsButton.addClass('current-year');
    elementSettingsButton.removeClass('current-year');

    elementMyAlbums.show();
    $('.nav-m').show();
    elementHiddenMenu.show();
    elementTitle.show();
}


// TODO !!!
/**
 * Zobrazení Compilations
 */
async function showCompilations() {
    elementHiddenMenu.hide();
    elementTitle.hide();

    elementActions.html(``);
    elementActions.hide();

    elementAlbums.hide();
    elementEPs.hide();
    elementTracks.hide();
    elementAppears.hide();
    //elementCompilations.hide();
    elementPodcasts.hide();
    elementMyAlbums.hide();
    elementSettings.hide();

    elementMenuDate.show();
    $('.nav-a').hide();
    $('.nav-e').hide();
    $('.nav-t').hide();
    $('.nav-p').hide();
    //$('.nav-c').hide();
    $('.nav-d').hide();
    $('.nav-s').hide();
    $('.nav-m').hide();

    var params = getHashParams();
    if (params.show != 'compilations') {
        // nebyla nastavena url
        window.location.replace("#show=compilations");
    }

    if (!libraryCompilations) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        await libraryGetReleases('c');
    }

    if (!libraryCompilations) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No compilations', 'Cannot show any compilation, because you are following only artists without compilations.');
    }
    else if (libraryCompilations.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No compilations', 'Cannot show any compilation, because you are following only artists without compilations.');
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

        // TODO : zobrazit albumy (podle roku z url) a menu -> nenačítat rok 2019 ale všechno
        var year = '0';
        var month = '0';
        if (params.year) {
            year = params.year;
        }
        if (params.month) {
            month = params.month;
        }
        await viewReleases('c', year, month);
        elementMessage.hide();
    }

    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementEPsButton.removeClass('current-year');
    elementTracksButton.removeClass('current-year');
    elementAppearsButton.removeClass('current-year');
    elementCompilationsButton.addClass('current-year');
    elementPodcastsButton.removeClass('current-year');
    elementMyAlbumsButton.removeClass('current-year');
    elementSettingsButton.removeClass('current-year');

    elementCompilations.show();
    $('.nav-c').show();
    elementHiddenMenu.show();
    elementTitle.show();
}



// získá playlisty uživatele
async function libraryGetPlaylists() {
    // zobrazení načítání
    showLoading('Getting your playlists');

    // načtení seznamu playlistů
    if (!libraryPlaylists) {
        libraryPlaylists = [];
    }

    // odeslání dotazu api
    await libraryGetPlaylistsApi(API_URL + '/me/playlists?limit=50');

    if (libraryPlaylists.length < 1) {
        // nebyli získáni žádní interpreti
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        //hideLoading('0 playlists');
        return;
    }
    //hideLoading('');
}
// získá playlisty uživatele z api
async function libraryGetPlaylistsApi(url, index = 0) {
    // získá json z api
    var json = await fetchJson(url, 'Failed to get list of your playlists:');

    if (json == null) {
        // chyba získávání
        return null;
    }

    // získá umělce
    var playlists = json.items;
    if (!playlists) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return;
    }
    if (playlists.length < 1) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return;
    }
    // získá seznam tracků pro playlisty uživatele
    await asyncForEach(playlists, async playlist => {
        elementMessage.text('Please wait: Getting your playlists... (' + ++index + ')');
        if (playlist.tracks.total < 1) {
            return;
        }
        if (!playlist.tracks.href) {
            return; //??
        }
        playlist.tracks.list = await libraryGetPlaylistsTracksApi(playlist.tracks.href);
    });

    // uložení do seznamu playlistů
    libraryPlaylists = libraryPlaylists.concat(playlists);

    if (json.next) {
        // existuje další stránka seznamu playlistů
        // -> odešle se další dotaz
        await libraryGetPlaylistsApi(json.next, index);
    }
}


async function libraryGetPlaylistsTracksApi(url) {
    // získá json z api

    // https://api.spotify.com/v1/playlists/{id}/tracks?market={market}&limit=100
    var json = await fetchJson(url, 'Failed to get list of your playlists:'); // !!

    if (json == null) {
        // chyba získávání
        return null;
    }

    // získá umělce
    var tracks = json.items;
    if (!tracks) {
        //showError('No playlists can be obtained', 'no album songs'); // !!
        return null;
    }
    if (tracks.length < 1) {
        //showError('No playlists can be obtained', 'no album songs'); // !!
        return null;
    }

    if (json.next) {
        // existuje další stránka seznamu umělců
        // -> odešle se další dotaz
        var newTracksList = await libraryGetPlaylistsTracksApi(json.next);
        tracks = tracks.concat(newTracksList);
    }
    return tracks;
}
async function libraryGetReleaseTracks(releaseId) {
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
        return;
    }
    else if (params.show == 'my-albums') {
        // zobrazím albumy
        release = libraryMyAlbums.find(x => x.id === releaseId);
    }
    else {
        return;
    }
    /*if (release.tracks) {
        console.log("tracks");
        return;
    }*/
    if (release.tracks > 0) {
        return;
    }
    release.tracks = [];
    var url = 'https://api.spotify.com/v1/albums/' + releaseId + '/tracks?market=' + userCountry + '&limit=50';
    await libraryGetReleaseTracksApi(url, release);
}

async function libraryGetReleaseTracksApi(url, release) {
    var json = await fetchJson(url, 'Failed to get list of your playlists:'); // !!
    if (json == null) {
        // chyba získávání
        return;
    }

    // získá umělce
    var tracks = json.items;
    if (!tracks) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return;
    }
    if (tracks.length < 1) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return;
    }
    release.tracks = release.tracks.concat(tracks);

    if (json.next) {
        // existuje další stránka seznamu umělců
        // -> odešle se další dotaz
        await libraryGetReleaseTracksApi(json.next, release);
    }
}