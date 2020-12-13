
// calc release duration
var duration = 0;
await asyncForEach(release.tracks.items, async releaseTrack => {
    duration += releaseTrack.duration_ms;
});
duration = 1000 * Math.round(duration / 1000);
var durationDate = new Date(duration);
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
var durationResult = addZero(durationDate.getUTCHours()) + ':' + addZero(durationDate.getUTCMinutes()) + ':' + addZero(durationDate.getUTCSeconds());
release.duration = durationResult;