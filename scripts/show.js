// ALBUMY //

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
    else if (releaseType == 't') {
        releaseList = libraryTracks;
    }
    else if (releaseType == 'p') {
        releaseList = libraryAppears;
    }
    else if (releaseType == 'c') {
        releaseList = libraryCompilations;
    }
    console.log(releaseList);
    var years = [];

    // projde získané releasy (album, songy, ...)
    await asyncForEach(releaseList, async release => {
        // získá z releasů roky
        var date = release.release_date.split('-');
        var year = date[0];
        if (!years.includes(year)) {
            years.push(year);
        }
    });

    // seřadí roky
    years.sort(function (a, b) {
        if (a < b) return 1;
        if (a > b) return -1;
        return 0;
    });
    years.unshift(0);

    // projde všechny roky
    await asyncForEach(years, async year => {
        // pro každý rok získá měsíce
        await addMenuMonths(year, releaseList, releaseType);
    });
}

/* menu - přidání měsíců */
async function addMenuMonths(year, releaseList, releaseType) {
    // přidá rok do menu (ostatní)
    var elementMenuYear = $('<ul class="nav-' + releaseType + '" id="' + releaseType + '-y-' + year + '"></ul>');
    elementMenuDate.append(elementMenuYear);

    // přidá rok (all) do menu
    if (year === 0) {
        elementMenuYear.append('<li><a class="year" id="' + releaseType + '-' + year + '" title="Click to view all releases">all</a></li>');
        return;
    }
    elementMenuYear.append('<li><a class="year" id="' + releaseType + '-' + year + '" title="Click to view months in ' + year + '">' + year + '</a></li>');

    // měsíce
    var months = [];
    var undefinedMonth = false; // měsíc není ve spotify vyplněn

    // projde získané releasy (album, songy, ...)
    await asyncForEach(releaseList, async release => {
        // získá z nich měsíc
        var date = release.release_date.split('-');
        var releaseYear = date[0];
        if (year === releaseYear) {
            // rok se shoduje
            // -> získám měsíc
            var releaseMonth = date[1];
            if (!months.includes(releaseMonth)) {
                // měsíc nebyl ještě přidán
                if (!releaseMonth) {
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
        if (month === 100) {
            elementMenuMonths += `released albums in ` + year + ` with undefined month">undefined`;
        }
        else {
            elementMenuMonths += `released albums in ` + year + `-` + month + `">` + month;
        }
        elementMenuMonths += `</a></li>`;
    });
    elementMenuYear.append(elementMenuMonths);
}

/* zobrazení albumů z vybraného měsíce a roku */

/**
 * releaseType a = albums / t = tracks
 */
async function viewReleases(releaseType, year = '0', month = '0') {
    var releaseName;
    var releaseList;
    if (releaseType == 'a') {
        releaseName = 'albums';
        releaseList = libraryAlbums;
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

    // element ze seznamem
    var elementReleases = $('.' + releaseName);
    elementReleases.empty();

    // zobrazení nadpisu
    if (year == 0 && month == 0) {
        // zobrazuji všechny alba
        elementTitle.text('All ' + releaseName + ' releases');
    }
    else if (month == 0) {
        // zobrazuji alba ve vybraném roce
        elementTitle.text('Released ' + releaseName + ' in ' + year);
    }
    else if (month == 100) {
        // zobrazuji alba ve vybraném měsíci, který není ve spotify vyplněn
        elementTitle.text('Released ' + releaseName + ' in ' + year + ' with undefined month');
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

                elementReleaseDiv += `<div class="album" id="` + release.id + `">
                            <div class="album-flex">
                                <div class="album-img">
                                    <img src="` + release.cover + `"</img>
                                </div>
                                <div class="album-info">
                                    <a href="` + release.url + `" target="_blank" rel="noopener noreferrer"><h2>` + release.name + `</h2></a>
                                    <a href="` + release.artist.external_urls.spotify + `" target="_blank" rel="noopener noreferrer"><h3>` + release.artistsString + `</h3></a>
                                    <p>` + release.release_date + `</p>
                                    <i class="fas fa-bars album-tracklist" title="View tracklist" id="` + release.id + `_t"></i>`;
                elementReleaseDiv += releaseLibrary;
                elementReleaseDiv += `<a href="` + release.url + `" target="_blank" rel="noopener noreferrer"><i class="fab fa-spotify" title="Open in Spotify"></i></a>
                                </div>
                            </div>
                          </div>`;
            }
        }
    });
    $('.' + releaseName).append(elementReleaseDiv);
    await selectInMenu(year, month, releaseType);
}

/* vybere rok a datum v menu */
// releaseType (a = album / t = track)
async function selectInMenu(year, month, releaseType) {
    // odstraní třídy vybraného a aktuálního roku
    $('.year').removeClass('selected-year current-year');
    $('#' + releaseType + '-' + year).addClass('current-year');

    // odstraní třídy vybraného a aktuálního měsíce
    $('.month').removeClass('selected-month current-month');
    $('#' + releaseType + '-' + year + '-' + month).addClass('current-month');
    $('.' + releaseType + '-' + year).addClass('selected-month');
}