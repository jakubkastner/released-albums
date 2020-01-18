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
    albumDiv.children('.playlists').remove();
    var albumIconPlaylist = $('#' + albumId + '_p');
    albumIconPlaylist.removeClass('rotate');
    albumIconPlaylist.removeClass('album-tracklist-visible');
    // TODO - ZASTAVIT NAČÍTÁNÍ PLAYLISTŮ !!!!!!!!!!!!!
    
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
                albumLikeIcon.prop('title', 'Remove album from library');
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
                albumLikeIcon.prop('title', 'Add album to library');
            },
            error: function (result) {
                console.log(result.message);
            }
        });
    }
    //$('.nav-date').scrollIntoView();
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
    if (params.year == year || year == 0) {        
        leftNavigationDate.addClass('nav-hidden');
    }
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
    if (params.year == year && params.month == month) {        
        leftNavigationDate.addClass('nav-hidden');
        return;
    }
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
    leftNavigationDate.addClass('nav-hidden');
});

$(document).on('click', '.album-playlist', async function (e) {
    var albumId = e.currentTarget.id;
    var albumIconPlaylists = $('#' + albumId);
    albumIconPlaylists.addClass("rotate");
    albumId = albumId.replace("_p", "");
    var albumDiv = $('#' + albumId);
    albumDiv.children('.album-player').remove();
    var albumIconTracklist = $('#' + albumId + '_t');
    albumIconTracklist.removeClass('album-tracklist-visible');
    if (albumIconPlaylists.hasClass('album-tracklist-visible')) {
        // již je zobrazený seznam playlistu = odstraním ho
        albumDiv.children('.playlists').remove();
        albumIconPlaylists.prop('title', 'Add to playlist');
        albumIconPlaylists.removeClass("album-tracklist-visible");
    }
    else {
        albumIconPlaylists.prop('title', 'Close playlists');
        albumIconPlaylists.addClass("album-tracklist-visible");
        await libraryGetPlaylists(albumId);
    }
    albumIconPlaylists.removeClass("rotate");
});

async function libraryGetPlaylists(albumId) {
    // zobrazení načítání
    //showLoading('Getting list of your followed artists');

    // odeslání dotazu api
    var playlists = await libraryGetPlaylistsApi(API_URL + '/me/playlists?limit=50');

    if (!playlists) {
        return;
    }
    if (playlists.length < 1) {
        // nebyli získáni žádní interpreti
        // TODO nice2have: zobrazit tlačítko - načíst znovu
        return;
    }
    var albumDiv = $('#' + albumId);
    var elementPlaylists = `<ul class="playlists">`;
    var albumTracks = await libraryGetAlbumTracksApi(albumId);
    // https://api.spotify.com/v1/albums/{id}}/tracks?market={market}&limit=50
    await asyncForEach(playlists, async playlist => {
        if (playlist.collaborative || playlist.owner.id == userId) {
            var inPlaylist = true;
            await asyncForEach(albumTracks, async albumTrack => {
                var prevInPlaylist = inPlaylist;
                inPlaylist = await libraryIsSongInPlaylist(albumTrack.id, playlist.id);
                if (inPlaylist && !prevInPlaylist) {
                    inPlaylist = false;
                }
            });

            var icon;
            var title;
            var classEl = '';
            if (inPlaylist) {
                icon = `<i class="fas fa-minus"></i>`;
                title = `Remove release from playlist '` + playlist.name + `'`;
                classEl = ' playlist-remove';
            }
            else {
                icon = `<i class="fas fa-plus"></i>`;
                title = `Add release to playlist '` + playlist.name + `'`;
            }


            elementPlaylists += `<li class="playlist-add`;
            elementPlaylists += classEl;
            elementPlaylists += `" id="p_` + playlist.id + `_` + albumId + `" title="`
            elementPlaylists += title;
            elementPlaylists += `"><span>`;
            elementPlaylists += icon;
            elementPlaylists += `</span>` + playlist.name + `</li>`;
            // přidáno (v playlistu) <i class="fas fa-check"></i>
            // přidat 
        }
    });
    elementPlaylists += `</ul>`;
    albumDiv.append(elementPlaylists);
}

async function libraryGetPlaylistsApi(url) {
    // získá json z api
    var json = await fetchJson(url, 'Failed to get list of your playlists:'); // !!

    if (json == null) {
        // chyba získávání
        return null;
    }

    // získá umělce
    var playlists = json.items;
    if (!playlists) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return null;
    }
    if (playlists.length < 1) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return null;
    }

    if (json.next) {
        // existuje další stránka seznamu umělců
        // -> odešle se další dotaz
        var newPlaylistList = await libraryGetPlaylistsApi(json.next);
        playlists = playlists.concat(newPlaylistList);
    }
    return playlists;
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
        showError('No playlists can be obtained', 'no album songs'); // !!
        return null;
    }
    if (tracks.length < 1) {
        showError('No playlists can be obtained', 'no album songs'); // !!
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

async function libraryIsSongInPlaylist(songID, playlistID) {
    // odeslání dotazu api
    // https://api.spotify.com/v1/playlists/{id}/tracks?market={market}&limit=100
    var playlistSongs = await libraryGetPlaylistsApi(API_URL + '/playlists/' + playlistID + '/tracks?market=' + userCountry + '&limit=100');

    if (!playlistSongs) {
        return false;
    }
    if (playlistSongs.length < 1) {
        return false;
    }
    var inPlaylist = false;
    await asyncForEach(playlistSongs, async song => {
        if (song.track.id == songID) {
            inPlaylist = true;
            return;
        }
    });
    return inPlaylist;
}
// https://api.spotify.com/v1/albums/{id}}/tracks?market={market}&limit=50
async function libraryGetAlbumTracksApi(albumId) {
    // získá json z api
    var url = 'https://api.spotify.com/v1/albums/' + albumId + '/tracks?market=' + userCountry + '&limit=50';
    var json = await fetchJson(url, 'Failed to get list of your playlists:'); // !!
    if (json == null) {
        // chyba získávání
        return null;
    }

    // získá umělce
    var tracks = json.items;
    if (!tracks) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
        return null;
    }
    if (tracks.length < 1) {
        //showError('No playlists can be obtained', 'You are not following any artist.'); // !!
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






$(document).on('click', '.playlist-add', async function (e) {
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var playlistId = ids[1];
    var albumId = ids[2];

    var albumTracks = await libraryGetAlbumTracksApi(albumId);
    var playlistDiv = $('#' + elementId + ' span i');

    if (playlistDiv.hasClass('fa-plus')) {
        // pridani do playlistu
        await asyncForEach(albumTracks, async albumTrack => {
            var inPlaylist = await libraryIsSongInPlaylist(albumTrack.id, playlistId);
            if (!inPlaylist) {
                // není v playlistu
                await libraryAddToPlaylistApi(albumTrack.uri, playlistId, albumId);
            }
        });
    }
    else {
        // odebrani z playlistu
        await asyncForEach(albumTracks, async albumTrack => {
            var inPlaylist = await libraryIsSongInPlaylist(albumTrack.id, playlistId);
            if (inPlaylist) {
                // je v playlistu
                await libraryRemoveFromPlaylistApi(albumTrack.uri, playlistId, albumId);
            }
        });

    }
});


async function libraryAddToPlaylistApi(trackUri, playlistId, albumId) {
    var url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';
    var response = await sendFetch(url, trackUri);
    if (response.status == 201) {
        // přidáno
        var playlistDivSpan = $('#p_' + playlistId + '_' + albumId + ' span');
        playlistDivSpan.html(`<i class="fas fa-minus"></i>`);

        var playlistDiv = $('#p_' + playlistId + '_' + albumId);
        playlistDiv.addClass('playlist-remove');
        playlistDiv.prop('title', `Remove release from playlist '` + playlistDiv.text() + `'`);
    }
    else {
        // chyba
        console.log(response);
    }
}

async function libraryRemoveFromPlaylistApi(trackUri, playlistId, albumId) {
    var url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';
    var json = "{\"tracks\":[{\"uri\":\"" + trackUri + "\"}]}";
    var response = await deleteFetch(url, json);
    if (response.status == 200) {
        // odebráno
        var playlistDivSpan = $('#p_' + playlistId + '_' + albumId + ' span');
        playlistDivSpan.html(`<i class="fas fa-plus"></i>`);

        var playlistDiv = $('#p_' + playlistId + '_' + albumId);
        playlistDiv.removeClass('playlist-remove');
        playlistDiv.prop('title', `Add release to playlist '` + playlistDiv.text() + `'`);
    }
    else {
        // chyba
        console.log(response);
    }
}



///{ "tracks": [{ "uri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" },{ "uri": "spotify:track:1301WleyT98MSxVHPZCA6M" }] }