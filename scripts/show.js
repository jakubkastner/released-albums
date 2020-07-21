// RELEASY //

/**
 * 
 * @param {*} realeseList 
 * @param {*} releaseType a = albums / t = tracks / p = appears / c = compilations
 */
async function addMenuYears(releaseType) {
    // získání názvu typu a seznamů releasů
    var releaseList;
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

    var years = [];
    var undefinedYear = false; // rok není ve spotify vyplněn

    // projde získané releasy (album, songy, ...)
    await asyncForEach(releaseList, async release => {
        // získá z releasů roky
        var date = release.release_date.split('-');
        var year = date[0];
        if (!years.includes(year)) {
            // měsíc nebyl ještě přidán
            console.log(year);
            if (!year || year == 0000) {
                undefinedYear = true;
            }
            else {
                years.push(year);
            }
        }
    });
    if (undefinedYear) {
        // měsíc není ve spotify vyplněn
        years.push(100);
    }

    // seřadí roky
    years.sort(function (a, b) {
        if (a < b) return 1;
        if (a > b) return -1;
        return 0;
    });
    years.unshift(0);
    elementMenuMobile.removeClass('hidden');
    var elementMenuDateLeft = $('<div class="nav-left"></div>');
    elementMenuDate.append(elementMenuDateLeft);
    // projde všechny roky
    await asyncForEach(years, async year => {
        // pro každý rok získá měsíce
        await addMenuMonths(year, releaseList, releaseType, elementMenuDateLeft);
    });
}

/* menu - přidání měsíců */
async function addMenuMonths(year, releaseList, releaseType, elementMenuDateLeft) {
    var releaseName;
    if (releaseType == 'a') {
        releaseName = 'albums';
    }
    else if (releaseType == 'e') {
        releaseName = 'eps';
    }
    else if (releaseType == 't') {
        releaseName = 'tracks';
    }
    else if (releaseType == 'p') {
        releaseName = 'appears';
    }
    else if (releaseType == 'c') {
        releaseName = 'compilations';
    }
    // přidá rok do menu (ostatní)
    var elementMenuYear = $('<ul class="nav-' + releaseType + '" id="' + releaseType + '-y-' + year + '"></ul>');
    elementMenuDateLeft.append(elementMenuYear);

    // přidá rok (all) do menu
    if (year == 0) {
        elementMenuYear.append('<li><a class="year" id="' + releaseType + '-' + year + '" title="Click to view all releases">all</a></li>');
        return;
    }
    else if (year == 100) {
        elementMenuYear.append('<li><a class="year" id="' + releaseType + '-' + year + '" title="Click to view months with undefined year">undefined</a></li>');
    }
    else {
        elementMenuYear.append('<li><a class="year" id="' + releaseType + '-' + year + '" title="Click to view months in ' + year + '">' + year + '</a></li>');
    }

    // měsíce
    var months = [];
    var undefinedMonth = false; // měsíc není ve spotify vyplněn

    // projde získané releasy (album, songy, ...)
    await asyncForEach(releaseList, async release => {
        // získá z nich měsíc
        var date = release.release_date.split('-');
        var releaseYear = date[0];
        if (releaseYear == 0000) {
            releaseYear = 100;
        }
        if (year == releaseYear) {
            // rok se shoduje
            // -> získám měsíc
            var releaseMonth = date[1];
            if (!months.includes(releaseMonth)) {
                // měsíc nebyl ještě přidán
                if (!releaseMonth || releaseMonth < 1 || releaseMonth > 12) {
                    undefinedMonth = true;
                }
                else {
                    months.push(releaseMonth);
                }
            }
        }

    });
    if (undefinedMonth) {
        // měsíc není ve spotify vyplněn
        months.push(100);
    }

    // seřadí měsíce
    months.sort(function (a, b) {
        if (a < b) return 1;
        if (a > b) return -1;
        return 0;
    });

    // přidá měsíce vybraného roku do menu    
    var elementMenuMonths = '';
    await asyncForEach(months, async month => {
        elementMenuMonths += `<li><a class="month ` + releaseType + `-` + year + `" id="` + releaseType + `-` + year + `-` + month + `" title="Click to view `;
        if (year == 100 && month == 100) {
            elementMenuMonths += `released ` + releaseName + ` with undefined year and month">undefined`;
        }
        else if (month == 100) {
            elementMenuMonths += `released ` + releaseName + ` in ` + year + ` with undefined month">undefined`;
        }
        else {
            elementMenuMonths += `released ` + releaseName + ` in ` + year + `-` + month + `">` + month;
        }
        elementMenuMonths += `</a></li>`;
    });
    elementMenuYear.append(elementMenuMonths);
}

/* zobrazení albumů z vybraného měsíce a roku */

/**
 * releaseType a = albums / t = tracks
 */
async function viewReleases(releaseType, year = 0, month = 0) {

    elementActions.html(``);
    elementActions.hide();

    var releaseName;
    var releaseList;
    if (releaseType == 'a') {
        releaseName = 'albums';
        releaseList = libraryAlbums;
    }
    else if (releaseType == 'e') {
        releaseName = 'eps';
        releaseList = libraryEPs;
    }
    else if (releaseType == 't') {
        releaseName = 'tracks';
        releaseList = libraryTracks;
    }
    else if (releaseType == 'p') {
        releaseName = 'appears';
        releaseList = libraryAppears;
    }
    else if (releaseType == 'c') {
        releaseName = 'compilations';
        releaseList = libraryCompilations;
    }

    // změna url parametrů
    var params = getHashParams();
    window.location.replace('#show=' + params.show + '&year=' + year + '&month=' + month);

    // element ze seznamem
    var elementReleases = $('.' + releaseName);
    elementReleases.empty();

    // zobrazení nadpisu
    if (year == 0 && month == 0) {
        // zobrazuji všechny alba
        elementTitle.text('All ' + releaseName + ' releases');
    }
    else if (year == 100 && month == 0) {
        // zobrazuji alba ve vybraném roce
        elementTitle.text('Released ' + releaseName + ' with undefined year');
    }
    else if (year == 100 && month == 100) {
        // zobrazuji alba ve vybraném měsíci a roce, který není ve spotify vyplněn
        elementTitle.text('Released ' + releaseName + ' with undefined year and month');
    }
    else if (year == 100) {
        // zobrazuji alba ve vybraném měsíci, který není ve spotify vyplněn
        elementTitle.text('Released ' + releaseName + ' with undefined year in ' + month);
    }
    else if (month == 100) {
        // zobrazuji alba ve vybraném měsíci, který není ve spotify vyplněn
        elementTitle.text('Released ' + releaseName + ' in ' + year + ' with undefined month');
    }
    else if (month == 0) {
        // zobrazuji alba ve vybraném roce
        elementTitle.text('Released ' + releaseName + ' in ' + year);
    }
    else {
        // zobrazuji alba ve vybraném měsíci
        elementTitle.text('Released ' + releaseName + ' in ' + year + '-' + month);
    }

    var elementReleaseDiv = '';
    var viewedReleases = [];

    await asyncForEach(releaseList, async release => {
        var date = release.release_date.split('-');
        var releaseYear = date[0];
        var releaseMonth = date[1];
        if (releaseYear == 0000) {
            releaseYear = 100;
        }
        var viewed = false;

        if (year == releaseYear || year == 0) {
            // zobrazuji všechny releasy nebo se jedná o vybraný rok
            if ((month == 0) || (month == releaseMonth) || (month == 100 && !releaseMonth)) {
                // zobrazuji releasy ve vybraném roce nebo se jedná o správný měsíc

                // projde seznam releasů a zkontroluje, jestli už není release zobrazený
                await asyncForEach(viewedReleases, async viewRelease => {
                    // id se schodují
                    if (viewRelease == release.id) {
                        // release je již zobrazen
                        viewed = true;
                        return;
                    }
                });
                if (viewed) {
                    return;
                }
                // release není zobrazen

                // přidá do seznamu zobrazených releasů
                viewedReleases.push(release.id);

                // získám div a zobrazím ho
                var releaseLibrary = '';
                if (release.library === true) {
                    releaseLibrary = `<i class="fas fa-heart album-like" title="Remove album from library" id="` + release.id + `_l"></i>`;
                }
                else {
                    releaseLibrary = `<i class="far fa-heart album-like" title="Add album to library" id="` + release.id + `_l"></i>`;
                }
                var defaultPlaylistButton = '';
                if (defaultPlaylist) {
                    defaultPlaylistButton = `<i class="fas fa-plus-circle album-playlist-add-default" title="Add to default playlist '` + defaultPlaylist.name + `'" id="pd_` + defaultPlaylist.id + `_` + release.id + `"></i>`;
                }
                elementReleaseDiv += `<div class="album" id="` + release.id + `">
                            <div class="album-flex">
                                <div class="album-img">
                                    <img src="` + release.cover + `"</img>
                                </div>
                                <div class="album-info">
                                    <a href="` + release.url + `" target="_blank" rel="noopener noreferrer"><h2>` + release.name + `</h2></a>
                                    <a href="` + release.artist.external_urls.spotify + `" target="_blank" rel="noopener noreferrer"><h3>` + release.artistsString + `</h3></a>
                                    <p>` + release.release_date + `</p>
                                    <i class="fas fa-bars album-tracklist" title="View tracklist" id="` + release.id + `_t"><span>` + release.total_tracks + `</span></i>`;
                elementReleaseDiv += releaseLibrary;
                elementReleaseDiv += `<i class="fas fa-plus album-playlist" title="Add to playlist" id="` + release.id + `_p"></i>`;
                elementReleaseDiv += defaultPlaylistButton;
                elementReleaseDiv += `<i class="fas fa-plus-square album-playlist-add-new" title="Add to new playlist" id="pd_` + release.id + `"></i>`;
                elementReleaseDiv += `<a href="` + release.url + `" target="_blank" rel="noopener noreferrer"><i class="fab fa-spotify" title="Open in Spotify"></i></a>`;
                elementReleaseDiv += `<a href="https://music.youtube.com/search?q=` + release.artistsString.replace(`&`, ``) + ` ` + release.name + `" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube" title="Search on Youtube Music"></i></a>`;
                elementReleaseDiv += `</div>
                            </div>
                          </div>`;
            }
        }
    });
    $('.' + releaseName).append(elementReleaseDiv);
    // zobrazí tlačítko pro přidání všech songů do playlistu
    if (releaseType == 't') {
        if (year != 0) {
            var text = `Add tracks to playlist "` + year;
            if (month != 0) {
                text += `-` + month;
            }
            elementActions.append(`<a id="playlist-add-month" class="button"><i class="fas fa-plus"></i>` + text + `"</a>`);
            elementActions.show();
        }
    }
    await selectInMenu(year, month, releaseType);
}

/* vybere rok a datum v menu */
// releaseType (a = album / t = track)
async function selectInMenu(year, month, releaseType) {
    console.log(year + "-" + month);
    // odstraní třídy vybraného a aktuálního roku
    $('.year').removeClass('selected-year current-year');
    $('#' + releaseType + '-' + year).addClass('current-year');

    // odstraní třídy vybraného a aktuálního měsíce
    $('.month').removeClass('selected-month current-month');
    $('#' + releaseType + '-' + year + '-' + month).addClass('current-month');
    $('.' + releaseType + '-' + year).addClass('selected-month');
}

/* mobilní navigace */
$(document).on('click', '.nav-mobile', async function (e) {
    if (elementMenuDate.hasClass('nav-hidden')) {
        elementMenuDate.removeClass('nav-hidden');
        return;
    }
    elementMenuDate.addClass('nav-hidden');
});


/* přidání tracků z měsíce / roku do playlistu */
$(document).on('click', '#playlist-add-month', async function (e) {
    var params = getHashParams();
    if (params.show != 'tracks') {
        return;
    }
    if (params.year == 0) {
        return;
    }

    var year = params.year;
    var month = params.month;
    var name = year;
    if (month != 0) {
        name += `-` + month;
    }

    // vytvoreni playlistu
    var newPlaylist = await createPlaylist(name);
    if (newPlaylist === null) {
        return;
    }
    // ziskani songu
    var albums = await libraryTracks.filter(obj => {
        return obj.release_date.indexOf(name) == 0
    })

    // seřadí seznam alb podle data vydání alba od nejstarších po nejnovější
    await albums.sort(function (a, b) {
        var keyA = new Date(a.release_date);
        var keyB = new Date(b.release_date);
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });

    // ziskani tracku albumu
    await asyncForEach(albums, async releaseAlbum => {
        // ziska tracky albumu
        await libraryGetReleaseTracks(releaseAlbum.id);
        // prida tracky do playlistu
        if (releaseAlbum.tracks) {
            await asyncForEach(releaseAlbum.tracks, async releaseTrack => {
                // todo - vybírání a odebírání ve funkci ponechat (pokud mám zobrazený seznam z playlistu, automaticky to v něm odškrtne/zaškrtne)
                await libraryAddToPlaylistApi(releaseTrack, newPlaylist.id, null);
            });
        }
        else {
            // CHYBA !!!!!!!!!!!!!!
            // pokud nenajdu tracky je neco spatne
            console.log(releaseAlbum);
        }
    });


});
