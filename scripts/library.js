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
        artist.fetch_url.album = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=album&market=' + userCountry;
        artist.fetch_url.track = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=single&market=' + userCountry;
        artist.fetch_url.appears = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=appears_on&market=' + userCountry;
        artist.fetch_url.compilation = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=compilation&market=' + userCountry;
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
    elementTracks.hide();
    $('.nav-t').hide();
    if (!libraryAlbums) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        await libraryGetAlbums();
    }
    else if (libraryAlbums.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No albums', 'Cannot show any album, because you are following only artists without albums.');
    }
    else {
        // byly načteny albumy
        var params = getHashParams();

        if (params.show != 'albums') {
            // nebyla nastavena url
            window.location.replace("#show=albums");
        }

        // TODO : dodělat přepínání
        /*if (elementAlbums.is(':hidden')) {
            // albumy jsou již zobrazeny
            return;
        }*/

        // albumy nejsou zobrazeny
        // -> zobrazím albumy

        // TODO : zobrazit albumy (podle roku z url) a menu
        await viewReleases('2019', '0', libraryAlbums, 'a');
        elementMessage.hide();
    }
    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.addClass('current-year');
    elementTracksButton.removeClass('current-year');

    elementAlbums.show();
    $('.nav-a').show();
    elementNav.show();
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
    await addMenuYears(libraryAlbums, 'a');

    // zobrazí albumy
    await showAlbums();
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
    await showTracks();
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
    $('.nav-a').hide();
    if (!libraryTracks) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        await libraryGetTracks();
    }
    else if (libraryTracks.length < 1) {
        // albumy byly načteny, ale žádné se nenašly
        showError('No tracjs', 'Cannot show any track, because you are following only artists without tracks.');
    }
    else {
        // byly načteny albumy
        var params = getHashParams();

        if (params.show != 'tracks') {
            // nebyla nastavena url
            window.location.replace("#show=tracks");
        }

        // TODO : dodělat přepínání
        /*if (elementAlbums.is(':hidden')) {
            // albumy jsou již zobrazeny
            return;
        }*/

        // albumy nejsou zobrazeny
        // -> zobrazím albumy

        // TODO : zobrazit albumy (podle roku z url) a menu
        await viewReleases('2019', '0', libraryTracks, 't');
        elementMessage.hide();
    }
    // TODO : přesunout zobrazování jinam
    elementAlbumsButton.removeClass('current-year');
    elementTracksButton.addClass('current-year');

    elementTracks.show();
    $('.nav-t').show();
    elementNav.show();
}
