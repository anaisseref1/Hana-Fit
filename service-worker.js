/* =========================================
   HANA FIT — SERVICE WORKER
   Offline + cache de l'application
========================================= */

const CACHE_NAME =
    "hana-fit-v2-2026-08-09";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",

    "./assets/css/components.css",
    "./assets/css/nutrition.css",
    "./assets/css/profile.css",
    "./assets/css/programs.css",
    "./assets/css/progress.css",
    "./assets/css/recipes.css",
    "./assets/css/style.css",
    "./assets/css/training.css",
    "./assets/css/wellbeing.css",

    "./assets/database/foods.json",
    "./assets/database/programs.json",
    "./assets/database/quotes.json",
    "./assets/database/recipes.json",
    "./assets/database/settings.json",
    "./assets/database/training-programs.json",
    "./assets/database/workouts.json",

    "./assets/icons/apple-touch-icon.png",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",

    "./assets/images/neha.png",

    "./assets/js/app.js",
    "./assets/js/daily.js",
    "./assets/js/database.js",
    "./assets/js/neha.js",
    "./assets/js/nutrition.js",
    "./assets/js/profile.js",
    "./assets/js/program-detail.js",
    "./assets/js/programs.js",
    "./assets/js/progress.js",
    "./assets/js/recipe-detail.js",
    "./assets/js/recipes.js",
    "./assets/js/storage.js",
    "./assets/js/store.js",
    "./assets/js/training.js",
    "./assets/js/utils.js",
    "./assets/js/wellbeing.js",

    "./pages/daily.html",
    "./pages/nutrition-guide.html",
    "./pages/nutrition.html",
    "./pages/profile.html",
    "./pages/program-detail.html",
    "./pages/programs.html",
    "./pages/progress.html",
    "./pages/recipe-detail.html",
    "./pages/recipes.html",
    "./pages/training.html",
    "./pages/wellbeing.html"
];


/* =========================================
   INSTALLATION
========================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(
            caches
                .open(
                    CACHE_NAME
                )
                .then(
                    async cache => {

                        const results =
                            await Promise.allSettled(
                                APP_FILES.map(
                                    file =>
                                        cache.add(
                                            file
                                        )
                                )
                            );


                        results.forEach(
                            (
                                result,
                                index
                            ) => {

                                if (
                                    result.status ===
                                    "rejected"
                                ) {

                                    console.warn(
                                        "Hana Fit : fichier non mis en cache",
                                        APP_FILES[
                                            index
                                        ]
                                    );

                                }

                            }
                        );

                    }
                )
                .then(
                    () =>
                        self.skipWaiting()
                )
        );

    }
);


/* =========================================
   ACTIVATION
========================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(
            caches
                .keys()
                .then(
                    keys =>
                        Promise.all(
                            keys
                                .filter(
                                    key =>
                                        key.startsWith(
                                            "hana-fit-"
                                        ) &&
                                        key !==
                                            CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )
                        )
                )
                .then(
                    () =>
                        self.clients.claim()
                )
        );

    }
);


/* =========================================
   RÉSEAU + MODE HORS LIGNE
========================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        if (
            request.method !==
            "GET"
        ) {

            return;

        }


        const requestUrl =
            new URL(
                request.url
            );


        if (
            requestUrl.origin !==
            self.location.origin
        ) {

            return;

        }


        event.respondWith(
            fetch(
                request
            )
                .then(
                    response => {

                        if (
                            !response ||
                            response.status !==
                                200
                        ) {

                            return response;

                        }


                        const copy =
                            response.clone();


                        caches
                            .open(
                                CACHE_NAME
                            )
                            .then(
                                cache =>
                                    cache.put(
                                        request,
                                        copy
                                    )
                            );


                        return response;

                    }
                )
                .catch(
                    async () => {

                        const cached =
                            await caches.match(
                                request
                            );


                        if (cached) {

                            return cached;

                        }


                        if (
                            request.mode ===
                            "navigate"
                        ) {

                            return (
                                await caches.match(
                                    "./index.html"
                                )
                            );

                        }


                        return new Response(
                            "",
                            {
                                status:
                                    503,
                                statusText:
                                    "Hana Fit hors ligne"
                            }
                        );

                    }
                )
        );

    }
);