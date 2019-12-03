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
    elementAlbumsButton.show();
    elementTracksButton.show();
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
function showAlbums() {
    if (!libraryAlbums) {
        // albumy dosud nebyly načteny
        // -> získá albumy a zobrazí je
        libraryGetAlbums();
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
        viewAlbums(0, 0, libraryAlbums, 'albums');
        elementMessage.hide();
    }
    // TODO : přesunout zobrazování jinam
    elementAlbums.show();
    elementTracks.hide();
    $('.nav-tracks').hide();
    $('.nav-albums').show();
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
        await libraryGetAlbumApi(artist, ++index, libraryArtistsLength);
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

    await

        // zobrazí/skryje příslušné prvky a zobrazí zprávu
        hideLoading('Select which year of albums releases you want to display.');

    // přidá do menu roky a měsíce albumů
    addMenuYears(libraryAlbums, 'a');

    // zobrazí albumy
    showAlbums();
}

/**
 * Získá ze Spotify api seznam albumů pro jednotlivé interprety.
 * @param {*} artist interpret k získání albumů
 * @param {*} index pořadí aktuálního interpreta v seznamu
 * @param {*} artistsLength celkový počet interpretů, které uživatel sleduje
 * @param {*} url adresa dotazu api
 */
async function libraryGetAlbumApi(artist, index, artistsLength, url = artist.fetch_url.album) {
    // zobrazí zprávu
    elementMessage.text('Please wait: Getting albums from artists... (' + index + ' / ' + artistsLength + ')');

    // získá json albumu ze spotify api
    var json = await fetchJson(url, 'Failed to get albums from artist ' + artist.name);

    if (json == null) {
        return;
    }

    // přidá album do seznamu
    await libraryAddAlbum(artist, json.items);

    if (json.next) {
        await libraryGetAlbumApi(artist, index, artistsLength, json.next);
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
                    var keyA = new Date(a.release);
                    var keyB = new Date(b.release);
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
    // TODO : dodělat přepínání
    window.location.replace("#show=tracks");
    console.log(libraryTracks);
    if (!libraryTracks) {
        libraryArtistGetTracks();
    }
    else {
        if (elementTracks.is(':hidden')) {
            // dodělat
            //show(libraryTracks, 'tarcks');
        }
    }
    elementAlbums.hide();
    elementTracks.show();
    $('.nav-albums').hide();
    $('.nav-tracks').show();
});

// TODO !!!
/* projde seznam umělců a získá z api jejich skladby */
async function libraryArtistGetTracks() {
    showLoading('Please wait: Getting tracks from artists...');
    var libraryArtistsLength = libraryArtists.length;
    var index = 0;
    await asyncForEach(libraryArtists, async artist => {
        await libraryArtistGetTracksApi(artist, ++index, libraryArtistsLength);
    });
    // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
    libraryTracks.sort(function (a, b) {
        var keyA = new Date(a.release);
        var keyB = new Date(b.release);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });
    // zobrazí albumy
    showRelease_Old(libraryTracks, 'tracks');
}

// TODO !!!
async function libraryArtistGetTracksApi(artist, index, libraryArtistsLength) {
    // TODO : nenačítá další stránku skladeb !
    elementMessage.text('Please wait: Getting tracks from artists... (' + index + ' / ' + libraryArtistsLength + ')');
    var json = await fetchJson(artist.fetchUrlTrack, 'Failed to get tracks from artist ' + artist.name);
    if (json == null) {
        return;
    }
    var tracks = json.items;
    if (!tracks) {
        return;
    }
    if (tracks.length < 1) {
        return;
    }
    if (!libraryTracks) {
        libraryTracks = [];
    }
    tracks.forEach(track => {
        var trackArtists = track.artists;
        var trackArtistsString = trackArtists[0].name;
        for (let index = 1; index < trackArtists.length - 1; index++) {
            trackArtistsString += ', ' + trackArtists[index].name;
        }
        if (trackArtists.length > 1) {
            trackArtistsString += ' & ' + trackArtists[trackArtists.length - 1].name;
        }
        // získá cover
        var coverUrl = '';
        if (track.images.length > 0) {
            coverUrl = track.images[1].url;
        }
        else {
            coverUrl = 'images/no-cover.png';
        }
        var newTrackObject = {
            id: track.id,
            name: track.name,
            artists: trackArtistsString,
            release: track.release_date,
            cover: coverUrl,
            url: track.external_urls.spotify
        };
        libraryTracks.push(newTrackObject);
    });
    if (json.next) {
        console.log(json.next);
        // TODO : pokud je next -> nepřidá se = chyba opravit !!            
    }
}

