// PRÁCE S ALBUMEM //

/* kliknutí na zobrazení seznamu skladeb albumu - zobrazení přehrávače alba */
$(document).on('click', '.album-tracklist', function (e) {
    var albumTracklist = e.currentTarget.id;
    var albumId = albumTracklist.replace("_t", "");
    viewTracklist(albumId);
});

function viewTracklist(albumId) {
    var albumDiv = $('#' + albumId);
    var albumTracklistIcon = $('#' + albumId + '_t');
    if (albumDiv.find('.album-player').length > 0) {
        // již je zobrazený přehrávač = odstraním ho
        albumDiv.children('.album-player').remove();
        albumTracklistIcon.prop('title', 'View tracklist');
        albumTracklistIcon.removeClass("album-tracklist-visible");
    }
    else {
        // zobrazím přehrávač alba
        var player = '<iframe class="album-player" src="https://open.spotify.com/embed/album/' + albumId + '" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>';
        albumDiv.append(player);
        albumTracklistIcon.prop('title', 'Close tracklist');
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
    $('.nav-date').scrollIntoView();
});

/*$(document).on('click', '.album', function (e) {
    var albumId = e.currentTarget.id;
    var albumTracklistIcon = $('#' + albumId + "_t");
    viewTracklist(albumId, albumTracklistIcon);
});*/


// MENU //

/* menu - kliknutí na rok */
$(document).on('click', '.year', function (e) {
    var id = e.currentTarget.id;
    var idSplit = id.split('-');
    var year = idSplit[1];

    var params = getHashParams();
    var releaseType;
    if (params.show == 'albums') {
        releaseType = 'a';
    }
    else if (params.show == 'tracks') {
        releaseType = 't';
    }
    else if (params.show == 'appears') {
        releaseType = 'p';
    }
    else if (params.show == 'compilations') {
        releaseType = 'c';
    }
    else {
        return;
    }
    viewReleases(releaseType, year);
});

/* menu - kliknutí na měsíc */
$(document).on('click', '.month', function (e) {
    // získám rok a měsíc z id
    var id = e.currentTarget.id;
    var idSplit = id.split('-');
    var year = idSplit[1];
    var month = idSplit[2];
    // zobrazí alba vybraného měsíce
    var params = getHashParams();
    var releaseType;
    if (params.show == 'albums') {
        releaseType = 'a';
    }
    else if (params.show == 'tracks') {
        releaseType = 't';
    }
    else if (params.show == 'appears') {
        releaseType = 'p';
    }
    else if (params.show == 'compilations') {
        releaseType = 'c';
    }
    else {
        return;
    }
    viewReleases(releaseType, year, month);
});