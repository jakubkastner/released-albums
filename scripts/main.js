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
var userAlbums = null;
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

/* získá parametry z url */
function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

/* načtení stránky */
$(document).ready(function () {
    // -> přihlášení uživatele

    // získám z úložiště prohlížeče userAccess
    userAccess = localStorage.getItem(USER_ACCESS);
    if (userAccess) {
        // pokud existuje
        // -> uživatel přihlášen (získám o něm informace)
        getUser();
    }
    else {
        // pokud neexistuje
        // -> otevřu přihlašovací stránku spotify
        loginUser();
    }
});

/* kliknutí na tlačítko přihlášení */
$('.login').click(function () {
    // -> získá stránku pro přihlášení do spotify

    // kontrola přihlášení
    if (userAccess) {
        // uživatel je přihlášen
        return;
    }
    userAccess = null;

    // zapíše do lokálního úložiště náhodnou hodnotu
    var stateValue = generateRandomString(16);
    localStorage.setItem(STATE_KEY, stateValue);

    // otevře přihlašovací okno do spotify a získá access token
    var scope = 'user-follow-read user-read-private user-library-read user-library-modify';
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(API_ID);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    url += '&state=' + encodeURIComponent(stateValue);
    window.location = url;

    /* vygenerování náhodného stringu */
    function generateRandomString(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
});

/* zachytí odpověď po otevření přihlašovací stránky spotify */
function loginUser() {
    // -> zobrazí příslušné informace po přihlášení

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
        window.location = REDIRECT_URI;

        // získá hodnotu navrácenou ze spotify
        var state = params.state;

        // získá hodnotu úloženou v úložišti
        var storedState = localStorage.getItem(STATE_KEY);
        // odstraním z úložiště
        localStorage.removeItem(STATE_KEY);

        if (userAccess) {
            localStorage.setItem(USER_ACCESS, userAccess);
            // existuje user access
            if (state === null || state !== storedState) {
                // a nezískal jsem hodnotu ze spotify loginu nebo se neshoduje s uloženou v místním úložišti = chyba
                elementError.text('Failed to login, please try it again.');
            }
        }
        else {
            // nezískal jsem user access
            elementError.text('Failed to login, please try it again.');
        }
    }
}

/* získá informace o přihlášeném uživateli (z userAccess) */
function getUser() {
    // uloží hlavičku pro další dotazy api
    options = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + userAccess
        }
    };
    $.ajax(
        API_URL + '/me',
        {
            // nastaví parametry dotazu
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + userAccess
            },
            success: function (response) {
                // úspěšně získané informace o uživateli

                // zobrazí informace o uživateli a skryje/zobrazí prvky
                $('#login-button').remove();
                elementError.text('');

                var elementLogin = $('#login');
                elementLogin.html('Logged in as "' + response.display_name + " | Click to logout");
                elementLogin.attr('title', 'Click to logout');
                elementLogin.attr('href', '');
                elementLogin.attr('id', 'logout');
                elementMessage.text('User @' + response.display_name + ' has been successfully logged in.');
                userCountry = response.country;

                // získá interprety z knihovny uživatele
                getLibraryArtists();
            },
            error: function (error) {
                if (error.status == 429) {
                    // api limit překročen
                    getUser();
                }
                else {
                    localStorage.removeItem(USER_ACCESS);
                    userAccess = null;
                    elementError.text('Failed to login, please try it again.');
                }
            }
        }
    );
}


elementAlbumsButton.click(function () {
    if (userAlbums) {
        showAlbums();
    }
    else {
        // získám umělce, které uživatel sleduje
        getLibraryAlbums();
        /*elementLoader.show();
        elementMessage.text('Please wait: Getting list of your followed artists...');
        userAlbums = [];
        getLibraryAlbums();*/
    }
});

elementTracksButton.click(function () {
    elementMenuYears.hide();
    elementAlbums.hide();
});


/* získá z api json se seznamem umělců, které uživatel sleduje */
function getLibraryArtists(fetchUrl = API_URL + '/me/following?type=artist&limit=50') {
    showLoading('Please wait: Getting list of your followed artists...');
    fetch(fetchUrl, options)
        .then(response => response.json())
        .then(json => {
            // možné chyby
            if (json.error) {
                if (json.error.status === 429) {
                    // api - moc dotazů
                    setTimeout(function () { getLibraryArtists(fetchUrl); }, 3000);
                }
                else {
                    elementError.html(elementError.text() + '<br>Failed to get list of your followed artists: ' + json.error.message + '.');
                }
                return;
            }

            var artists = json.artists.items;
            artists.forEach(artist => {
                artist.fetchUrl = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=album&market=' + userCountry;
            });
            if (!libraryArtists) {
                libraryArtists = [];
            }
            libraryArtists = libraryArtists.concat(artists);

            if (!artists) {
                showError('No artists', 'Cannot get any album or track, because you are not following any artist.');
                return;
            }
            if (artists.length < 1) {
                showError('No artists', 'Cannot get any album or track, because you are not following any artist.');
                return;
            }

            if (json.artists.next) {
                // pokud existuje další stránka seznamu umělců, získám další seznam
                getLibraryArtists(json.artists.next);
            }
            else {
                // neexistuje další stránka umělců
                elementAlbumsButton.show();
                elementTracksButton.show();
                hideLoading('Select which releases want to display.');
            }
        });
}

/* zobrazí načítání */
function showLoading(message) {
    elementLoader.show();
    elementMessage.text(message);
}
/* skryje načítání */
function hideLoading(message) {
    elementLoader.hide();
    elementMessage.text(message);
}

/* získá z api json se seznamem umělců, které uživatel sleduje */
function getUserArtistsOld(fetchUrl) {
    fetch(fetchUrl, options)
        .then(response => response.json())
        .then(json => {
            // možné chyby
            if (json.error) {
                if (json.error.status === 429) {
                    // api - moc dotazů
                    setTimeout(function () { getUserArtists(fetchUrl); }, 100);
                }
                else {
                    elementError.html(elementError.text() + '<br>Failed to get list of your followed artists: ' + json.error.message + '.');
                }
                return;
            }

            var artists = json.artists.items;
            libraryArtists = libraryArtists.concat(artists);
            console.log(libraryArtists);

            if (!artists) {
                showError('No albums', 'Cannot get any album, because you are not following any artist.');
                return;
            }
            if (artists.length < 1) {
                showError('No albums', 'Cannot get any album, because you are not following any artist.');
                return;
            }

            if (json.artists.next) {
                // pokud existuje další stránka seznamu umělců, získám další seznam
                for (let index = 0; index < artists.length; index++) {
                    // projde získané umělce a získá jejich alba
                    getArtistAlbums(artists[index], false);
                }
                getUserArtists(json.artists.next);
            }
            else {
                // neexistuje další stránka umělců
                lastAlbumsCurrent = 0;
                lastAlbumsCount = artists.length;
                for (let index = 0; index < artists.length; index++) {
                    getArtistAlbums(artists[index], true);
                }
            }
        });
}

function showAlbums() {
    // jedná se o poslední stránku umělců

    // přičtu aktuální počet úspěšně získaných posledních albumů
    /*lastAlbumsCurrent++;
    if (lastAlbumsCount != lastAlbumsCurrent) {
        // ještě jsem neprošel všechny interprety
        return;
    }*/

    // úspěšně jsem získal ze spotify interprety z poslední stránky
    // zobrazím alba
    if (!userAlbums) {
        showError('No albums', 'Cannot get any album, because you are following only artists without albums.');
        return;
    }
    if (userAlbums.length < 1) {
        showError('No albums', 'Cannot get any album, because you are following only artists without albums.');
        return;
    }

    // zobrazím roky vydaných alb umělců v menu
    elementTitle.text('All released albums');
    addMenuYears();
    // získám rok a měsíc nejnovějšího alba
    var date = userAlbums[0].release.split('-');
    var year = date[0];
    var month = date[1];
    // zobrazení v menu
    $('#' + year).addClass('current-year');
    $('#m' + year).addClass('selected-month');
    $('#' + date[0] + '-' + date[1]).addClass('current-month');
    // zobrazení albumů
    //viewAlbums(year, month);
    // dodělat -> nefunguje správně

    viewAlbums(year, 0);
    //viewAll = true;
    elementMessage.remove();
    elementLoader.hide();
}

async function getArtistAlbums2(artist) 
{
  console.log("fetchuju " + artist.name);
  let response = await fetch(artist.fetchUrl, options);
  //console.log("mezifetch " + artist.name);
  let data = await response.json();
  console.log("odfetchovano " + artist.name);
  return data;
}

/* získá z api json seznam alb jednotlivých umělců */
function getArtistAlbum(artist) {
        fetch(artist.fetchUrl, options)
        .then(response => response.json())
        .then(json => {
            // možné chyby
            if (json.error) {
                if (json.error.status === 429) {
                    // api - moc dotazů
                    setTimeout(function () { getArtistAlbum(artist); }, 3000);
                }
                else {
                    elementError.html(elementError.text() + '<br>Failed to get albums from artist ' + artist.name + ': ' + json.error.message);
                }
                return;
            }
            var albums = json.items;
            if (!albums) {
                /*if (lastCheck) {
                    // jedná se o poslední stránku umělců
                    showAlbums();
                }*/
                return;
            }
            if (albums.length < 1) {
                /*if (lastCheck) {
                    // jedná se o poslední stránku umělců
                    showAlbums();
                }*/
                return;
            }

            for (let index = 0; index < albums.length; index++) {
                // projde nově získané alba
                const newAlbum = albums[index];
                var added = false;

                if (!artist.albums) {
                    artist.albums = [];
                }

                for (let index2 = 0; index2 < artist.albums.length; index2++) {
                    // projde již získaná alba
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
                    //console.log(artist)
                    // seřadí seznam alb podle data vydání alba od nejnovějších po nejstarší
                    userAlbums.sort(function (a, b) {
                        var keyA = new Date(a.release);
                        var keyB = new Date(b.release);
                        if (keyA < keyB) return 1;
                        if (keyA > keyB) return -1;
                        return 0;
                    });
                }
            }
            /*if (lastCheck) {
                // jedná se o poslední stránku umělců
                showAlbums();
            }*/
        })
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

/* projde seznam umělců a získá z api jejich alba */
async function getLibraryAlbums() {
    showLoading('Please wait: Getting albums from artists...');
    asyncForEach(libraryArtists, async artist => {
        //getArtistAlbum(artist);
        
        console.log("start " + artist.name);
    
        await getArtistAlbums2(artist)
        .then(data => console.log("finished " + artist.name)); 
    });


    /*console.log("aa");
    await getArtistAlbums2(libraryArtists[0]);*/
    /*libraryArtists.forEach(async artist => {
        //getArtistAlbum(artist);
        
        console.log("start " + artist.name);
    
        await getArtistAlbums2(artist)
        .then(data => console.log("finished " + artist.name)); 
    });*/
    console.log("bla");
}

/* získá z api json seznam alb jednotlivých umělců */
function getArtistAlbumsOld(artist, lastCheck) {
    if (!artist) {
        elementError.html(elementError.text() + '<br>Failed to get artist albums.');
        return;
    }

    //elementMessage.text('Please wait: Getting albums from artist ' + artist.name + '...');
    showLoading('Please wait: Getting albums from artists...');
    var fetchUrl = API_URL + '/artists/' + artist.id + '/albums?offset=0&limit=50&include_groups=album&market=' + userCountry;

    fetch(fetchUrl, options)
        .then(response => response.json())
        .then(json => {
            // možné chyby
            if (json.error) {
                if (json.error.status === 429) {
                    // api - moc dotazů
                    setTimeout(function () { getArtistAlbums(artist, lastCheck); }, 100);
                }
                else {
                    elementError.html(elementError.text() + '<br>Failed to get albums from artist ' + artist.name + ': ' + json.error.message);
                }
                return;
            }
            var albums = json.items;
            if (!albums) {
                if (lastCheck) {
                    // jedná se o poslední stránku umělců
                    showAlbums();
                }
                return;
            }
            if (albums.length < 1) {
                if (lastCheck) {
                    // jedná se o poslední stránku umělců
                    showAlbums();
                }
                return;
            }

            for (let index = 0; index < albums.length; index++) {
                // projde nově získané alba
                const newAlbum = albums[index];
                var added = false;
                for (let index2 = 0; index2 < userAlbums.length; index2++) {
                    // projde již získaná alba
                    if (newAlbum.id === userAlbums[index2].id) {
                        // nové album již bylo přidáno do seznamu dřive
                        added = true;
                        break;
                    }
                }
                if (!added) {
                    // pokud nebylo přidáno již dříve

                    // získá všechny umělce alba a zapíše je do stringu s oddělovači
                    var artists = newAlbum.artists;
                    var artistsString = artists[0].name;
                    for (let index = 1; index < artists.length - 1; index++) {
                        artistsString += ', ' + artists[index].name;
                    }
                    if (artists.length > 1) {
                        artistsString += ' & ' + artists[artists.length - 1].name;
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
                        artists: artistsString,
                        release: newAlbum.release_date,
                        cover: coverUrl,
                        url: newAlbum.external_urls.spotify
                    };
                    getAlbumInfo(newAlbumObject);
                }
            }
            if (lastCheck) {
                // jedná se o poslední stránku umělců
                showAlbums();
            }
        })
}

/* menu - kliknutí na rok */
$(document).on('click', '.year', function (e) {
    // odstraní třídy vybraného roku a skrytí jeho měsíce
    // přidá třídy vybraného roku a zobrazení jeho měsíců
    var year = e.currentTarget.id;
    var elementMenuYearID = $('#' + year);
    elementMenuYear.removeClass('selected-year');
    elementMenuYearID.addClass('selected-year');

    $('.months').removeClass('selected-month');
    $('#m' + year).addClass('selected-month');
    viewAll = false;
    if (year == 0) {
        elementMenuYear.removeClass('current-year');
        elementMenuMonth.removeClass('selected-month current-month');
        elementMenuYearID.addClass('current-year');
        lastYear = 0;
        var allYears = $(".year");
        allYears.each(checkYear => {
            if (allYears[checkYear].id > lastYear) {
                lastYear = allYears[checkYear].id;
            }
        });
        viewAll = true;
        $('.albums').empty();
        viewAlbums(lastYear, 0);
    }
});

/* menu - kliknutí na měsíc */
$(document).on('click', '.month', function (e) {
    // získám rok a měsíc z id
    var id = e.currentTarget.id;
    var idSplit = id.split('-');
    var year = idSplit[0];
    var month = idSplit[1];
    if (month === 'all') {
        month = 0;
    }
    else if (month === 'undefined') {
        month = -1;
    }
    // odstraní třídy vybraného a aktuálního roku
    elementMenuYear.removeClass('selected-year current-year');
    $('#' + year).addClass('current-year');

    // odstraní třídy vybraného a aktuálního měsíce
    elementMenuMonth.removeClass('selected-month current-month');
    $('#' + id).addClass('current-month');

    // zobrazí alba vybraného měsíce
    viewAlbums(year, month);
});

/* kliknutí na zobrazení seznamu skladeb albumu - zobrazení přehrávače alba */
$(document).on('click', '.album-tracklist', function (e) {
    var albumTracklist = e.currentTarget.id;
    var albumId = albumTracklist.replace("_t", "");
    var albumTracklistIcon = $('#' + albumTracklist);
    viewTracklist(albumId, albumTracklistIcon);
});

/*$(document).on('click', '.album', function (e) {
    var albumId = e.currentTarget.id;
    var albumTracklistIcon = $('#' + albumId + "_t");
    viewTracklist(albumId, albumTracklistIcon);
});*/

function viewTracklist(albumId, albumTracklistIcon) {
    var albumDiv = '#' + albumId;
    if ($(albumDiv).find('.album-player').length > 0) {
        // již je zobrazený přehrávač = odstraním ho
        $(albumDiv).children('.album-player').remove();
        //e.currentTarget.title = "View tracklist";
        albumTracklistIcon.removeClass("album-tracklist-visible");
    }
    else {
        // zobrazím přehrávač alba
        var player = '<iframe class="album-player" src="https://open.spotify.com/embed/album/' + albumId + '" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>';
        $(albumDiv).append(player);
        //e.currentTarget.title = "Close tracklist";
        albumTracklistIcon.addClass("album-tracklist-visible");
    }

}

/* kliknutí na přidání albumu do knihovny - přidá album do knihovny na spotify */
// todo - odebírání ???????????
$(document).on('click', '.album-like', function (e) {
    var albumLike = e.currentTarget.id;
    var albumLikeIcon = $('#' + albumLike);
    var albumId = albumLike.replace("_l", "");
    if (albumLikeIcon.hasClass("far")) {
        // album nebylo při přidávání v knihovně
        $.ajax({
            url: API_URL + '/me/albums?ids=' + albumId,
            type: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + userAccess
            },
            success: function () {
                albumLikeIcon.removeClass("far");
                albumLikeIcon.addClass("fas");
                albumLikeIcon.title = "Remove album from library";
            },
            error: function (result) {
                console.log(result.message);
            }
        });
    }
    else {
        // album je v knihovně
        $.ajax({
            url: API_URL + '/me/albums?ids=' + albumId,
            type: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + userAccess
            },
            success: function () {
                albumLikeIcon.removeClass("fas");
                albumLikeIcon.addClass("far");
                albumLikeIcon.title = "Add album to library";
            },
            error: function (result) {
                console.log(result.message);
            }
        });
    }
});

/* menu - přidání roků */
function addMenuYears() {
    var years = [];
    if (userAlbums.length < 60) {
        years.push('all');
    }
    userAlbums.forEach(album => {
        // projde získané alba a získá z nich rok
        var date = album.release.split('-');
        var year = date[0];
        if (!years.includes(year)) {
            years.push(year);
        }
    });
    years.forEach(year => {
        // pro každý získaný rok, získám měsíce
        addMenuMonths(year);
        elementMenuYear = $('.year');
        elementMenuMonth = $('.month');
    });
}

/* menu - přidání měsíců */
function addMenuMonths(yearToAdd) {
    if (yearToAdd === 'all') {
        elementMenuYears.append('<li><a class="year" id="' + 0 + '">' + 'all' + '</a></li>');
        return;
    }
    var months = [];
    var undefinedMonth = false; // měsíc není ve spotify vyplněn
    months.push('all');
    userAlbums.forEach(album => {
        // projde získané alba a získá z nich rok a měsíc
        var date = album.release.split('-');
        var year = date[0];
        if (year === yearToAdd) {
            // rok se shoduje
            var month = date[1];
            if (!months.includes(month)) {
                // měsíc nebyl ještě přidán
                if (!month) {
                    undefinedMonth = true;
                }
                else {
                    months.push(month);
                }
            }
        }
    });
    if (undefinedMonth) {
        // měsíc není ve spotify vyplněn
        months.push('undefined');
    }
    // přidá rok do menu
    elementMenuYears.append('<li><a class="year" id="' + yearToAdd + '" title="Click to view months in ' + yearToAdd + '">' + yearToAdd + '</a></li>');
    // přidá měsíce vybraného roku do menu
    $('nav').append('<ul class="months" id="m' + yearToAdd + '"></ul>');
    var yearDiv = $('#m' + yearToAdd);
    var monthDivs = '';
    months.forEach(month => {
        if (month === 'all') {
            monthDivs += `<li><a class="month" id="` + yearToAdd + `-` + month + `" title="Click to view all released albums in ` + yearToAdd + `">` + month + `</a></li>`;
        }
        else if (month === 'undefined') {
            monthDivs += `<li><a class="month" id="` + yearToAdd + `-` + month + `" title="Click to view released albums in ` + yearToAdd + ` with undefined month">` + month + `</a></li>`;
        }
        else {
            monthDivs += `<li><a class="month" id="` + yearToAdd + `-` + month + `" title="Click to view released albums in ` + yearToAdd + `-` + month + `">` + month + `</a></li>`;
        }
    });
    yearDiv.append(monthDivs);
}

/* zobrazení albumů z vybraného měsíce a roku */
function viewAlbums(year, month) {
    var elementAlbums = $('.albums');
    if (year == 0 && month == 0) {
        viewAll = true;
    }
    else {
        viewAll = false;
    }
    if (!viewAll) {
        // odstraním alba z jiného roku nebo měsíce
        elementAlbums.empty();
    }
    if (viewAll) {
        // zobrazuji všechny alba
        elementTitle.text('All albums releases');
    }
    else if (month === 0) {
        // zobrazuji alba ve vybraném roce
        elementTitle.text('Released albums in ' + year);
    }
    else if (month < 0) {
        // zobrazuji alba ve vybraném měsíci, který není ve spotify vyplněn
        elementTitle.text('Released albums in ' + year + ' with undefined month');
    }
    else {
        // zobrazuji alba ve vybraném měsíci
        elementTitle.text('Released albums in ' + year + '-' + month);
    }
    var albumsDiv = '';
    userAlbums.forEach(album => {
        // projdu získaná alba a získám měsíc a rok
        var realese = album.release.split('-');
        var albumYear = realese[0];
        var albumMonth = realese[1];
        if (year == albumYear) {
            // zobrazuji všechna alba nebo se jedná o vybraný rok
            if ((month === 0) || (month === albumMonth) || (month < 0 && !albumMonth)) {
                // zobrazuji alba ve vybraném roce nebo se jedná o správný měsíc
                // získám div a zobrazím ho
                var albumLibrary = '';
                if (album.library === true) {
                    albumLibrary = `<i class="fas fa-heart album-like" title="Remove album from library" id="` + album.id + `_l"></i>`;
                }
                else {
                    albumLibrary = `<i class="far fa-heart album-like" title="Add album to library" id="` + album.id + `_l"></i>`;
                }

                albumsDiv += `<div class="album" id="` + album.id + `">
                                <div class="album-flex">
                                    <div class="album-img">
                                        <img src="` + album.cover + `"></img>
                                    </div>
                                    <div class="album-info">
                                        <h2>` + album.name + `</h2><h3>` + album.artists + `</h3>
                                        <p>` + album.release + `</p>
                                        <i class="fas fa-bars album-tracklist" title="View tracklist" id="` + album.id + `_t"></i>`;
                albumsDiv += albumLibrary;
                albumsDiv += `<a href="` + album.url + `" target="_blank" rel="noopener noreferrer"><i class="fab fa-spotify" title="Open in Spotify"></i></a>
                                    </div>
                                </div>
                              </div>`;
            }
        }
    });
    lastYear = year;
    elementAlbums.append(albumsDiv);
}

/* získá info o albumu (máli ho uživatel v knihovně atd.) */
function getAlbumInfo(artist, album) {
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
                //console.log(artist)
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

$(document).on('click', '#logout', function (e) {
    localStorage.removeItem(USER_ACCESS);
});

/* posunutí stránky dolů */
window.onscroll = function () {
    // načtení dalšího obsahu
    if (viewAll) {
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
    // posuvník nahoru
    if (elementBody.scrollTop() > 20) {
        // poloha je níže než 20px, zobrazím posunovník nahoru
        elementTop.show();
    }
    else {
        elementTop.hide();
    }
};

/* kliknutí na posunovník nahoru */
elementTop.click(function () {
    elementBody.scrollTop(0);
});

function showError(title, error) {
    elementTitle.text(title);
    if (elementError.text()) {
        error = elementError.text() + '<br>' + error;
    }
    elementError.html(error);
    elementMessage.remove();
    elementLoader.hide();
}