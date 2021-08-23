importScripts("https://cdn.ampproject.org/sw/amp-sw.js");
//regexp: /\.(png|jpg|css|js)/,

AMP_SW.init({
    assetCachingOptions: [
        {
            regexp: /\.(png|jpg|css)/,
            cachingStrategy: "CACHE_FIRST"
        }
    ],
    offlinePageOptions: [{
        url: "/offline.html",
        assets: []
    }],
    linkPrefetchOptions: {}
});