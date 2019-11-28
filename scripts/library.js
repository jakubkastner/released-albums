// INTERPRETI //

/**
 * Získá seznam interpretů, které uživatel sleduje na Spotify.
 */
async function libraryGetArtists() {
    // zobrazení zprávy
    showLoading('Please wait: Getting list of your followed artists...');

    // odeslání dotazu api
    await libraryGetArtistsApi(API_URL + '/me/following?type=artist&limit=50');

    if (!libraryArtists) {
        // nebyli získáni žádní interpreti
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
    hideLoading('Select which releases want to display.');
}

/**
 * Získá ze Spotify api seznam interpretů, které uživatel sleduje.
 * @param {*} url url adresa api požadavku
 */
async function libraryGetArtistsApi(url) {
    // získá json z api
    var json = await fetchJson(url, 'Failed to get list of your followed artists:');

    if (json == null) {
        // json je prázdný
        return;
    }

    // získá umělce
    var artists = json.artists.items;
    if (!artists) {
        showError('No artists', 'Cannot get any album or track, because you are not following any artist.');
        return;
    }
    if (artists.length < 1) {
        showError('No artists', 'Cannot get any album or track, because you are not following any artist.');
        return;
    }

    // získá url pro další dotazy api (seznam albumů, songů)
    await asyncForEach(artists, async artist => {
        artist.fetchUrlAlbum = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=album&market=' + userCountry;
        artist.fetchUrlTrack = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=single&market=' + userCountry;
    });

    // uložení do seznamu interpretů
    if (!libraryArtists) {
        libraryArtists = [];
    }
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
    showAlbumsMain();
});

// TODO !!!
/**
 * Zobrazení albumů
 */
function showAlbumsMain() {
    // TODO: dodělat
    window.location.replace("#show=albums");
    if (userAlbums) {
        if (elementAlbums.is(':hidden')) {
            // dodělat
            showAlbums();
        }
    }
    else {
        // získám umělce, které uživatel sleduje
        libraryGetAlbums();
        /*elementLoader.show();
        elementMessage.text('Please wait: Getting list of your followed artists...');
        userAlbums = [];
        getLibraryAlbums();*/
    }
}

/**
 * Projde seznam interpretů a získá ze Spotify jejich alba.
 */
async function libraryGetAlbums() {
    // zobrazí zprávu
    showLoading('Please wait: Getting albums from artists...');

    // uloží hodnoty
    var libraryArtistsLength = libraryArtists.length;
    var index = 0;

    // projde sledované interprety
    await asyncForEach(libraryArtists, async artist => {
        // získá ze spotify api jejich albumy
        await libraryGetAlbumsApi(artist, ++index, libraryArtistsLength);
    });

    // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
    userAlbums.sort(function (a, b) {
        var keyA = new Date(a.release);
        var keyB = new Date(b.release);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });

    // zobrazí albumy
    showAlbums();
}

/**
 * Získá ze Spotify api seznam albumů pro jednotlivé interprety.
 * @param {*} artist interpret k získání alb
 * @param {*} index pořadí aktuálního interpreta v seznamu
 * @param {*} libraryArtistsLength celkový počet interpretů, které uživatel sleduje
 */
async function libraryGetAlbumsApi(artist, index, libraryArtistsLength) {
    // zobrazí zprávu
    elementMessage.text('Please wait: Getting albums from artists... (' + index + ' / ' + libraryArtistsLength + ')');

    // získá json albumu ze spotify api
    var json = await fetchJson(artist.fetchUrlAlbum, 'Failed to get albums from artist ' + artist.name);

    if (json != null) {
        // přidá album do seznamu
        libraryAddAlbum(artist, json.items);
    }
}

// TODO !!!
/**
 * Přidá vybrané alba do seznamu alb (interpreta a všech alb)
 * @param {*} artist interpret albumu
 * @param {*} albums seznam albumů získaných ze spotify
 */
function libraryAddAlbum(artist, albums) {
    // interpret nemá žádné albumy
    if (!albums) {
        return;
    }
    if (albums.length < 1) {
        return;
    }

    // TODO: upravit kód níže (a udělat funkci async ??)

    // projde nově získané alba
    for (let index = 0; index < albums.length; index++) {
        const newAlbum = albums[index];
        var added = false;

        if (!artist.albums) {
            artist.albums = [];
        }

        // projde již získaná alba
        for (let index2 = 0; index2 < artist.albums.length; index2++) {
            // zkontroluje, zdali už album není přidáno
            if (newAlbum.id === artist.albums[index2].id) {
                // nové album již bylo přidáno do seznamu dříve
                added = true;
                break;
            }
        }
        if (!added) {
            // pokud nebylo přidáno již dříve

            // získá všechny umělce alba a zapíše je do stringu s oddělovači
            var albumArtists = newAlbum.artists;
            var albumArtistsString = albumArtists[0].name;
            for (let index = 1; index < albumArtists.length - 1; index++) {
                albumArtistsString += ', ' + albumArtists[index].name;
            }
            if (albumArtists.length > 1) {
                albumArtistsString += ' & ' + albumArtists[albumArtists.length - 1].name;
            }
            // získá cover
            var coverUrl = '';
            if (newAlbum.images.length > 0) {
                coverUrl = newAlbum.images[1].url;
            }
            else {
                coverUrl = 'images/no-cover.png';
            }

            // vytvoří objekt nového alba
            var newAlbumObject = {
                id: newAlbum.id,
                name: newAlbum.name,
                artists: albumArtistsString,
                release: newAlbum.release_date,
                cover: coverUrl,
                url: newAlbum.external_urls.spotify
            };

            //getAlbumInfo(artist, newAlbumObject);

            /**/
            artist.albums.push(newAlbumObject);
            if (!userAlbums) {
                userAlbums = [];
            }
            userAlbums.push(newAlbumObject);
        }
    }
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
                if (!userAlbums) {
                    userAlbums = [];
                }
                userAlbums.push(album);

                // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
                userAlbums.sort(function (a, b) {
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
    libraryArtistGetTracks();
    elementMenuYears.hide();
    elementAlbums.hide();
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
    /*userAlbums.sort(function (a, b) {
        var keyA = new Date(a.release);
        var keyB = new Date(b.release);
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
    });*/
    // zobrazí albumy
    //showAlbums();
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
    console.log(tracks);
    hideLoading('Finished.');
}

