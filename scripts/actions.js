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

/* kliknutí na přidání albumu do knihovny - přidá/odebere album do/z knihovny na spotify */
$(document).on('click', '.album-like', async function (e) {
    var albumLike = e.currentTarget.id;
    var albumLikeIcon = $('#' + albumLike);
    var albumId = albumLike.replace("_l", "");
    if (albumLikeIcon.hasClass("far")) {
        // album nebylo při přidávání v knihovně
        // -> přidám ho
        var response = await putFetch(API_URL + '/me/albums?ids=' + albumId);
        if (response.status == 200) {
            albumLikeIcon.removeClass("far");
            albumLikeIcon.addClass("fas");
            albumLikeIcon.prop('title', 'Remove album from library');

        }
        else {
            // chyba
            console.log(response);
        }
    }
    else {
        // album je v knihovně
        // -> odstraním ho
        var response = await deleteFetch(API_URL + '/me/albums?ids=' + albumId);
        if (response.status == 200) {
            albumLikeIcon.removeClass("fas");
            albumLikeIcon.addClass("far");
            albumLikeIcon.prop('title', 'Add album to library');
        }
        else {
            // chyba
            console.log(response);
        }
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
        elementMenuDate.addClass('nav-hidden');
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
        elementMenuDate.addClass('nav-hidden');
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
    elementMenuDate.addClass('nav-hidden');
});

// přidaní do playlistu
// -> zobrazení seznamu playlistů
$(document).on('click', '.album-playlist', async function (e) {
    // získání id albumu
    var albumId = e.currentTarget.id;
    var albumIconPlaylists = $('#' + albumId);
    albumIconPlaylists.addClass("rotate"); // animace
    albumId = albumId.replace("_p", "");

    // získání divu albumu a skrytí ostatních položek (přehrávač)
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
        // zobrazení seznamu playlistů
        albumIconPlaylists.prop('title', 'Close playlists');
        albumIconPlaylists.addClass("album-tracklist-visible");
        await showPlaylist(albumId); // zobrazí seznam playlistů a zkontroluje existující přidání v playlistu
        //todo přidat načítání tracků k albumu (postupné načítání, při tom získávat tracky albumu)
    }

    // zrušení animace
    albumIconPlaylists.removeClass("rotate");
});








$(document).on('click', '.playlist-add', async function (e) {
    var elementId = e.currentTarget.id;
    var ids = elementId.split('_');
    var playlistId = ids[1];
    var releaseId = ids[2];

    await libraryGetReleaseTracks(releaseId);
    var playlistIcon = $('#' + elementId + ' span i');

    var release;
    // získám parametry
    var params = getHashParams();
    if (params.show == 'albums') {
        // zobrazím albumy
        release = libraryAlbums.find(x => x.id === releaseId);
    }
    else if (params.show == 'tracks') {
        // zobrazím albumy
        release = libraryTracks.find(x => x.id === releaseId);
    }
    else if (params.show == 'appears') {
        // zobrazím albumy
        release = libraryAppears.find(x => x.id === releaseId);
    }
    else if (params.show == 'compilations') {
        // zobrazím albumy
        release = libraryCompilations.find(x => x.id === releaseId);
    }

    if (playlistIcon.hasClass('fa-plus')) {
        // pridani do playlistu
        await asyncForEach(release.tracks, async releaseTrack => {
            await libraryAddToPlaylistApi(releaseTrack, playlistId, releaseId);
        });
    }
    else {
        // odebrani z playlistu
        await asyncForEach(release.tracks, async albumTrack => {
            await libraryRemoveFromPlaylistApi(albumTrack, playlistId, releaseId);
        });

    }
});


async function libraryAddToPlaylistApi(track, playlistId, albumId) {
    var url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';
    var response = await sendFetch(url, track.uri);
    if (response.status == 201) {
        // přidáno
        var playlistDivSpan = $('#p_' + playlistId + '_' + albumId + ' span');
        playlistDivSpan.html(`<i class="fas fa-minus"></i>`);

        var playlistDiv = $('#p_' + playlistId + '_' + albumId);
        playlistDiv.addClass('playlist-remove');
        playlistDiv.prop('title', `Remove release from playlist '` + playlistDiv.text() + `'`);
        var playlist = libraryPlaylists.find(x => x.id === playlistId);
        var inPlaylistObject = { track: track };
        if (!playlist.tracks.list) {
            playlist.tracks.list = [];
        }
        playlist.tracks.list.push(inPlaylistObject);

        if (defaultPlaylist)
        {
            var defaultPlaylistIcon = $('#pd_' + defaultPlaylist.id + `_` + albumId);
            defaultPlaylistIcon.removeClass('fa-plus-circle');
            defaultPlaylistIcon.addClass('fa-minus-circle');
            defaultPlaylistIcon.title = `Remove from default playlist '` + defaultPlaylist.name + `'`;
        }
    }
    else {
        // chyba
        console.log(response);
    }
}

async function libraryRemoveFromPlaylistApi(track, playlistId, albumId) {
    var url = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';
    var json = "{\"tracks\":[{\"uri\":\"" + track.uri + "\"}]}";
    var response = await deleteFetch(url, json);
    if (response.status == 200) {
        // odebráno
        var playlistDivSpan = $('#p_' + playlistId + '_' + albumId + ' span');
        playlistDivSpan.html(`<i class="fas fa-plus"></i>`);

        var playlistDiv = $('#p_' + playlistId + '_' + albumId);
        playlistDiv.removeClass('playlist-remove');
        playlistDiv.prop('title', `Add release to playlist '` + playlistDiv.text() + `'`);
        var playlist = libraryPlaylists.find(x => x.id === playlistId);

        /*var index = playlist.tracks.list.indexOf(track);
        if (index >= 0) {
            playlist.tracks.list.splice(index, 1);
        }*/
        var index = 0;
        await asyncForEach(playlist.tracks.list, async playlistTrack => {
            if (playlistTrack.track.id == track.id) {
                playlist.tracks.list.splice(index, 1);
                return;
            }
            index++;
        });

        if (defaultPlaylist)
        {
            var defaultPlaylistIcon = $('#pd_' + defaultPlaylist.id + `_` + albumId);
            defaultPlaylistIcon.removeClass('fa-minus-circle');
            defaultPlaylistIcon.addClass('fa-plus-circle');
            defaultPlaylistIcon.title = `Add to default playlist '` + defaultPlaylist.name + `'`;
        }

        /*console.log(track);
        console.log(index);
        console.log(playlist.tracks.list[index]);*/


        /*playlist.tracks.list = await playlist.tracks.list.filter(async function (obj) {
            var releasePlaylistId;
            if (obj.track) releasePlaylistId = obj.track.id;
            else if (obj.id) releasePlaylistId = obj.id;
            /*console.log(releasePlaylistId);
            console.log(track.id);*/
        /*return releasePlaylistId !== track.id;
    });
    console.log(playlist.tracks.list);*/
    }
    else {
        // chyba
        console.log(response);
    }
}


// získá playlisty uživatele
async function showPlaylist(releaseId) {
    if (!libraryPlaylists) {
        return;
    }
    if (libraryPlaylists.length < 1) {
        return;
    }

    // vytvoření elementu pro playlist
    var elementPlaylists = `<ul class="playlists">`;

    // získání tracků albumu z api
    await libraryGetReleaseTracks(releaseId);

    var release;
    // získám parametry
    var params = getHashParams();
    if (params.show == 'albums') {
        // zobrazím albumy
        release = libraryAlbums.find(x => x.id === releaseId);
    }
    else if (params.show == 'tracks') {
        // zobrazím albumy
        release = libraryTracks.find(x => x.id === releaseId);
    }
    else if (params.show == 'appears') {
        // zobrazím albumy
        release = libraryAppears.find(x => x.id === releaseId);
    }
    else if (params.show == 'compilations') {
        // zobrazím albumy
        release = libraryCompilations.find(x => x.id === releaseId);
    }

    // projde playlisty uživatele
    await asyncForEach(libraryPlaylists, async playlist => {
        // pouze pokud se jedná o playlist do kterého lze přidat album
        if (playlist.collaborative || playlist.owner.id == userId) {
            var inPlaylist = await libraryIsSongInPlaylist(playlist.tracks.list, release.tracks);
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
            elementPlaylists += `" id="p_` + playlist.id + `_` + releaseId + `" title="`
            elementPlaylists += title;
            elementPlaylists += `"><span>`;
            elementPlaylists += icon;
            elementPlaylists += `</span>` + playlist.name + `</li>`;
        }
    });
    elementPlaylists += `</ul>`;
    // získání divu albumu
    var releaseDiv = $('#' + releaseId);
    releaseDiv.append(elementPlaylists);
}

async function libraryIsSongInPlaylist(playlistTracks, releaseTracks) {
    var inPlaylist = false;
    // projde tracky playlistu
    if (!playlistTracks) {
        return inPlaylist;
    }
    await asyncForEach(playlistTracks, async playlistTrack => {
        if (inPlaylist) {
            // track je v playlistu, ukončím foreach
            return;
        }
        if (releaseTracks) {
            // projde tracky albumu
            await asyncForEach(releaseTracks, async releaseTrack => {
                // shoduje se id
                var releasePlaylistId;
                if (playlistTrack.track) releasePlaylistId = playlistTrack.track.id;
                else if (playlistTrack.id) releasePlaylistId = playlistTrack.id;
                if (releaseTrack.id == releasePlaylistId) {
                    // track je v playlistu
                    inPlaylist = true;
                    return;
                }
            });
        }
    });
    return inPlaylist;
}
// staré
async function libraryIsSongInPlaylist_old(songID, playlistID) {
    // odeslání dotazu api
    // https://api.spotify.com/v1/playlists/{id}/tracks?market={market}&limit=100
    var playlistSongs = await libraryGetPlaylistsTracksApi(API_URL + '/playlists/' + playlistID + '/tracks?market=' + userCountry + '&limit=100');

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