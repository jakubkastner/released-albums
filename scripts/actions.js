// PRÁCE S ALBUMEM //

/* kliknutí na zobrazení seznamu skladeb albumu - zobrazení přehrávače alba */
$(document).on('click', '.album-tracklist', function (e) {
    var albumTracklist = e.currentTarget.id;
    var albumId = albumTracklist.replace("_t", "");
    var albumTracklistIcon = $('#' + albumTracklist);
    viewTracklist(albumId, albumTracklistIcon);
});

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

/*$(document).on('click', '.album', function (e) {
    var albumId = e.currentTarget.id;
    var albumTracklistIcon = $('#' + albumId + "_t");
    viewTracklist(albumId, albumTracklistIcon);
});*/


// MENU //

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