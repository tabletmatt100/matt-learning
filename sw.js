/* ==========================================================================
   sw.js — Offline-Capable Service Worker for matt-learning
   Caches all articles, shared CSS/JS, and KaTeX math fonts on first visit,
   plus dynamically discovers any new articles listed in index.html.
   ========================================================================== */

var CACHE_NAME = 'matt-learning-v26';

var CORE_ASSETS = [
  './',
  './index.html',
  './common.css',
  './common.js',
  './srs-cards.json',
  './manifest.json',
  './icon.svg',
  /* Articles */
  './attention.html',
  './backpropagation.html',
  './bias-variance.html',
  './calculus-refresher.html',
  './calibration.html',
  './class-imbalance.html',
  './deepconf.html',
  './feature-engineering.html',
  './gkd.html',
  './linear-algebra-refresher.html',
  './lora.html',
  './metrics-refresher.html',
  './reinforcement-learning.html',
  './rl-algorithms.html',
  './template.html',
  './template2.html',
  './training-hyperparameters.html',
  /* KaTeX CSS & JS */
  './katex/katex.min.css',
  './katex/katex.min.js',
  './katex/contrib/auto-render.min.js',
  /* KaTeX woff2 Fonts */
  './katex/fonts/KaTeX_AMS-Regular.woff2',
  './katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  './katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  './katex/fonts/KaTeX_Fraktur-Bold.woff2',
  './katex/fonts/KaTeX_Fraktur-Regular.woff2',
  './katex/fonts/KaTeX_Main-Bold.woff2',
  './katex/fonts/KaTeX_Main-BoldItalic.woff2',
  './katex/fonts/KaTeX_Main-Italic.woff2',
  './katex/fonts/KaTeX_Main-Regular.woff2',
  './katex/fonts/KaTeX_Math-BoldItalic.woff2',
  './katex/fonts/KaTeX_Math-Italic.woff2',
  './katex/fonts/KaTeX_SansSerif-Bold.woff2',
  './katex/fonts/KaTeX_SansSerif-Italic.woff2',
  './katex/fonts/KaTeX_SansSerif-Regular.woff2',
  './katex/fonts/KaTeX_Script-Regular.woff2',
  './katex/fonts/KaTeX_Size1-Regular.woff2',
  './katex/fonts/KaTeX_Size2-Regular.woff2',
  './katex/fonts/KaTeX_Size3-Regular.woff2',
  './katex/fonts/KaTeX_Size4-Regular.woff2',
  './katex/fonts/KaTeX_Typewriter-Regular.woff2'
];

/* Discover any newly added article links in index.html and cache them */
function syncArticlesFromIndex(cache, indexText) {
  var matches = indexText.match(/href="([a-zA-Z0-9._-]+\.html)"/g) || [];
  var urls = [];
  for (var i = 0; i < matches.length; i++) {
    var file = matches[i].slice(6, -1);
    urls.push('./' + file);
  }
  return Promise.all(
    urls.map(function (u) {
      return cache.match(u).then(function (hit) {
        if (!hit) {
          return fetch(u).then(function (res) {
            if (res && res.ok) { return cache.put(u, res); }
          }).catch(function () {});
        }
      });
    })
  );
}

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(
        CORE_ASSETS.map(function (url) {
          return fetch(url, { cache: 'reload' })
            .then(function (res) {
              if (res && res.ok) {
                return cache.put(url, res);
              }
            })
            .catch(function () {});
        })
      );
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) { return; }

  var isFontOrKatex = url.pathname.indexOf('/katex/') !== -1;

  if (isFontOrKatex) {
    /* Cache-first for immutable KaTeX fonts and scripts */
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (cached) {
        if (cached) { return cached; }
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  /* Network-first with instant cache fallback for HTML, CSS, JS */
  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, copy);
            if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
              res.clone().text().then(function (txt) {
                syncArticlesFromIndex(cache, txt);
              }).catch(function () {});
            }
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (cached) {
          if (cached) { return cached; }
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
