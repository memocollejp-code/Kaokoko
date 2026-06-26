/* Kaokoko Service Worker
   アプリの動作に必要な最小限のファイルをキャッシュし、オフラインでも開けるようにします。
   ファイルを更新したときは CACHE_NAME のバージョン番号を上げてください（v1 → v2 など）。
   そうすることで、古いキャッシュが破棄されて新しいファイルに置き換わります。
*/
const CACHE_NAME = "kaokoko-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

/* インストール時：アプリシェルを一括キャッシュ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* 有効化時：古いバージョンのキャッシュを削除 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* リクエスト時：キャッシュ優先、なければネットワーク、両方失敗したらindex.htmlを返す */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
