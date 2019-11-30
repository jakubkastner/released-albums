// ALBUMY //

function show(list, text) {
    if (!list) {
        showError('No ' + text, 'Cannot get any album, because you are following only artists without albums.');
        return;
    }
    if (list.length < 1) {
        showError('No ' + text, 'Cannot get any album, because you are following only artists without albums.');
        return;
    }

    // zobrazím roky vydaných alb umělců v menu
    elementTitle.text('All released ' + text);
    addMenuYears(list, text);
    // získám rok a měsíc nejnovějšího alba
    var date = list[0].release.split('-');
    var year = date[0];
    var month = date[1];
    // zobrazení v menu
    $('#' + year).addClass('current-year');
    $('#m' + year).addClass('selected-month');
    $('#' + year + '-all').addClass('current-month');
    // zobrazení albumů
    //viewAlbums(year, month);
    // dodělat -> nefunguje správně

    viewAlbums(year, 0, list, text);
    //viewAll = true;
    elementMessage.remove();
    elementLoader.hide();

}

// zobrazí alba
// nevyuživáno
function showAlbums() {
    if (!libraryAlbums) {
        showError('No albums', 'Cannot get any album, because you are following only artists without albums.');
        return;
    }
    if (libraryAlbums.length < 1) {
        showError('No albums', 'Cannot get any album, because you are following only artists without albums.');
        return;
    }

    // zobrazím roky vydaných alb umělců v menu
    elementTitle.text('All released albums');
    addMenuYears();
    // získám rok a měsíc nejnovějšího alba
    var date = libraryAlbums[0].release.split('-');
    var year = date[0];
    var month = date[1];
    // zobrazení v menu
    $('#' + year).addClass('current-year');
    $('#m' + year).addClass('selected-month');
    $('#' + year + '-all').addClass('current-month');
    // zobrazení albumů
    //viewAlbums(year, month);
    // dodělat -> nefunguje správně

    viewAlbums(year, 0);
    //viewAll = true;
    elementMessage.remove();
    elementLoader.hide();
}


/* zobrazení albumů z vybraného měsíce a roku */
function viewAlbums(year, month, list, text) {
    // TODO : sem přidat vybírání prvků v menu (nebo spíš do vlastní funkce)
    var elementAlbums = $('.' + text);
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
        elementTitle.text('All ' + text + ' releases');
    }
    else if (month === 0) {
        // zobrazuji alba ve vybraném roce
        elementTitle.text('Released ' + text + ' in ' + year);
    }
    else if (month < 0) {
        // zobrazuji alba ve vybraném měsíci, který není ve spotify vyplněn
        elementTitle.text('Released ' + text + ' in ' + year + ' with undefined month');
    }
    else {
        // zobrazuji alba ve vybraném měsíci
        elementTitle.text('Released ' + text + ' in ' + year + '-' + month);
    }
    var albumsDiv = '';
    list.forEach(album => {
        // projdu získaná alba a získám měsíc a rok
        var realese = album.release.split('-');
        var albumYear = realese[0];
        var albumMonth = realese[1];
        if (year == albumYear || viewAll) {
            // zobrazuji všechna alba nebo se jedná o vybraný rok
            if ((month === 0) || (month === albumMonth) || (month < 0 && !albumMonth) || viewAll) {
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

/* menu - přidání roků */
async function addMenuYears(list, text) {
    var years = [];
    years.push('all');
    list.forEach(album => {
        // projde získané alba a získá z nich rok
        var date = album.release.split('-');
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
    years.forEach(year => {
        // pro každý získaný rok, získám měsíce
        addMenuMonths(year, text);
        elementMenuYear = $('.year');
        elementMenuMonth = $('.month');
    });
}

/* menu - přidání měsíců */
function addMenuMonths(yearToAdd, text) {
    if (yearToAdd === 'all') {
        yearToAdd = 0;
    }
    var elementMenu = $('<div class="nav-' + text + '"></div>');
    elementMenuYears.append(elementMenu);

    var elementYear = $('<div id="y' + yearToAdd + '" class="nav-year"></div>');
    elementMenu.append(elementYear);

    if (yearToAdd === 0) {
        elementYear.append('<li><a class="year" id="' + yearToAdd + '">' + 'all' + '</a></li>');
        return;
    }
    var months = [];
    var undefinedMonth = false; // měsíc není ve spotify vyplněn
    months.push('all');
    libraryAlbums.forEach(album => {
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
    elementYear.append('<li><a class="year" id="' + yearToAdd + '" title="Click to view months in ' + yearToAdd + '">' + yearToAdd + '</a></li>');
    // přidá měsíce vybraného roku do menu
    elementYear.append('<div class="months" id="m' + yearToAdd + '"></div>');
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