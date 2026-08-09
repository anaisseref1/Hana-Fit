/* =========================================
   HANA FIT — PROFIL & SAUVEGARDES
   v2 : profil + sauvegardes légère/complète + restauration
========================================= */

(() => {

    const SETTINGS_KEY =
        "hanaFitSettings";

    const MAIN_DATA_KEY =
        "hanaFitData";

    const PROGRESS_KEY =
        "hanaFitProgress";

    const LAST_BACKUP_KEY =
        "hanaFitLastBackup";

    const PHOTO_DB_NAME =
        "hanaFitPrivate";

    const PHOTO_DB_VERSION =
        1;

    const PHOTO_STORE_NAME =
        "progressPhotos";


    /* =========================================
       OUTILS
    ========================================= */

    function readJson(
        key,
        fallback = {}
    ) {

        try {

            const raw =
                localStorage.getItem(
                    key
                );


            return raw
                ? JSON.parse(raw)
                : fallback;

        } catch (error) {

            console.warn(
                `Impossible de lire ${key}`,
                error
            );


            return fallback;

        }

    }


    function writeJson(
        key,
        value
    ) {

        localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );

    }


    function numberOr(
        value,
        fallback
    ) {

        const number =
            Number(
                String(
                    value ?? ""
                ).replace(",", ".")
            );


        return Number.isFinite(
            number
        )
            ? number
            : fallback;

    }


    function formatDateTime(
        iso
    ) {

        if (!iso) {
            return "—";
        }


        const date =
            new Date(
                iso
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }


        return date.toLocaleString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function fileDateStamp() {

        const date =
            new Date();


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );


        const hours =
            String(
                date.getHours()
            ).padStart(
                2,
                "0"
            );


        const minutes =
            String(
                date.getMinutes()
            ).padStart(
                2,
                "0"
            );


        return `${year}-${month}-${day}_${hours}-${minutes}`;

    }


    function showStatus(
        message,
        type = "success"
    ) {

        const element =
            document.getElementById(
                "backupStatus"
            );


        if (!element) {
            return;
        }


        element.textContent =
            message;


        element.style.display =
            "block";


        if (
            type === "error"
        ) {

            element.style.background =
                "#fee2e2";


            element.style.color =
                "#991b1b";

        } else if (
            type === "info"
        ) {

            element.style.background =
                "#eff6ff";


            element.style.color =
                "#1d4ed8";

        } else {

            element.style.background =
                "#dcfce7";


            element.style.color =
                "#166534";

        }


        window.clearTimeout(
            showStatus.timeout
        );


        showStatus.timeout =
            window.setTimeout(
                () => {

                    element.style.display =
                        "none";

                },
                4500
            );

    }


    function downloadJson(
        data,
        filename
    ) {

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        window.setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );

    }


    /* =========================================
       PROFIL
    ========================================= */

    function loadProfileForm() {

        const settings =
            readJson(
                SETTINGS_KEY,
                {}
            );


        const progress =
            readJson(
                PROGRESS_KEY,
                {}
            );


        const mainData =
            readJson(
                MAIN_DATA_KEY,
                {}
            );


        const nickname =
            settings?.user?.nickname ||
            settings?.user?.name ||
            "Hana";


        const height =
            numberOr(
                settings?.user?.height,
                153
            );


        const goalWeight =
            numberOr(
                progress?.goalWeight ??
                mainData?.goalWeight ??
                mainData?.weightGoal,
                60
            );


        const stepsGoal =
            numberOr(
                settings?.goals?.steps ??
                mainData?.stepsGoal,
                8000
            );


        const waterGoal =
            numberOr(
                settings?.goals?.water ??
                mainData?.waterGoal,
                2.3
            );


        const caloriesGoal =
            numberOr(
                settings?.goals?.calories ??
                mainData?.caloriesGoal,
                1550
            );


        const proteinGoal =
            numberOr(
                settings?.goals?.protein ??
                mainData?.proteinGoal,
                110
            );


        const values = {
            profileNickname:
                nickname,

            profileHeight:
                height,

            profileGoalWeight:
                goalWeight,

            profileStepsGoal:
                stepsGoal,

            profileWaterGoal:
                waterGoal,

            profileCaloriesGoal:
                caloriesGoal,

            profileProteinGoal:
                proteinGoal
        };


        Object.entries(
            values
        ).forEach(
            ([id, value]) => {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.value =
                        value;

                }

            }
        );


        renderProfileSummary(
            nickname,
            height,
            goalWeight,
            caloriesGoal
        );

    }


    function renderProfileSummary(
        nickname,
        height,
        goalWeight,
        caloriesGoal
    ) {

        const name =
            document.getElementById(
                "profileDisplayName"
            );


        const details =
            document.getElementById(
                "profileDisplayDetails"
            );


        if (name) {

            name.textContent =
                nickname ||
                "Hana";

        }


        if (details) {

            details.textContent =
                `${height} cm · objectif ${String(
                    goalWeight
                ).replace(
                    ".",
                    ","
                )} kg · ${Math.round(
                    Number(
                        caloriesGoal
                    ) || 1550
                ).toLocaleString(
                    "fr-FR"
                )} kcal`;

        }

    }


    function saveProfileSettings() {

        const nickname =
            document.getElementById(
                "profileNickname"
            )?.value.trim() ||
            "Hana";


        const height =
            numberOr(
                document.getElementById(
                    "profileHeight"
                )?.value,
                153
            );


        const goalWeight =
            numberOr(
                document.getElementById(
                    "profileGoalWeight"
                )?.value,
                60
            );


        const stepsGoal =
            numberOr(
                document.getElementById(
                    "profileStepsGoal"
                )?.value,
                8000
            );


        const waterGoal =
            numberOr(
                document.getElementById(
                    "profileWaterGoal"
                )?.value,
                2.3
            );


        const caloriesGoal =
            numberOr(
                document.getElementById(
                    "profileCaloriesGoal"
                )?.value,
                1550
            );


        const proteinGoal =
            numberOr(
                document.getElementById(
                    "profileProteinGoal"
                )?.value,
                110
            );


        const settings =
            readJson(
                SETTINGS_KEY,
                {}
            );


        settings.user = {
            ...(settings.user || {}),
            nickname,
            height
        };


        settings.goals = {
            ...(settings.goals || {}),
            steps:
                stepsGoal,
            water:
                waterGoal,
            calories:
                caloriesGoal,
            protein:
                proteinGoal
        };


        writeJson(
            SETTINGS_KEY,
            settings
        );


        const progress =
            readJson(
                PROGRESS_KEY,
                {}
            );


        progress.goalWeight =
            goalWeight;


        writeJson(
            PROGRESS_KEY,
            progress
        );


        const mainData =
            readJson(
                MAIN_DATA_KEY,
                {}
            );


        mainData.goalWeight =
            goalWeight;


        mainData.weightGoal =
            goalWeight;


        mainData.stepsGoal =
            stepsGoal;


        mainData.waterGoal =
            waterGoal;


        mainData.caloriesGoal =
            caloriesGoal;


        mainData.proteinGoal =
            proteinGoal;


        writeJson(
            MAIN_DATA_KEY,
            mainData
        );


        renderProfileSummary(
            nickname,
            height,
            goalWeight,
            caloriesGoal
        );


        showStatus(
            "✓ Tes paramètres Hana Fit ont été enregistrés."
        );


        refreshStorageStats();

    }


    /* =========================================
       SAUVEGARDE LÉGÈRE
    ========================================= */

    function collectHanaFitLocalStorage() {

        const data =
            {};


        for (
            let index = 0;
            index < localStorage.length;
            index++
        ) {

            const key =
                localStorage.key(
                    index
                );


            if (
                !key ||
                !key.startsWith(
                    "hanaFit"
                )
            ) {

                continue;

            }


            /*
             * La date de dernière sauvegarde n'est pas
             * nécessaire à restaurer dans une archive.
             */
            if (
                key ===
                LAST_BACKUP_KEY
            ) {

                continue;

            }


            data[key] =
                localStorage.getItem(
                    key
                );

        }


        return data;

    }


    function makeLightBackup() {

        const exportedAt =
            new Date()
                .toISOString();


        return {
            app:
                "Hana Fit",

            formatVersion:
                1,

            backupType:
                "light",

            exportedAt,

            includesPhotos:
                false,

            localStorage:
                collectHanaFitLocalStorage()
        };

    }


    function exportLightBackup() {

        try {

            const backup =
                makeLightBackup();


            downloadJson(
                backup,
                `hana-fit-sauvegarde-${fileDateStamp()}.json`
            );


            localStorage.setItem(
                LAST_BACKUP_KEY,
                backup.exportedAt
            );


            refreshStorageStats();


            showStatus(
                "📦 Sauvegarde créée. Conserve bien le fichier dans Fichiers ou iCloud."
            );

        } catch (error) {

            console.error(
                "Erreur export Hana Fit :",
                error
            );


            showStatus(
                "Impossible de créer la sauvegarde.",
                "error"
            );

        }

    }


    /* =========================================
       RESTAURATION
    ========================================= */

    function validateBackup(
        backup
    ) {

        return Boolean(
            backup &&
            backup.app === "Hana Fit" &&
            Number(
                backup.formatVersion
            ) >= 1 &&
            backup.localStorage &&
            typeof backup.localStorage ===
                "object" &&
            !Array.isArray(
                backup.localStorage
            )
        );

    }


    function clearHanaFitLocalStorage() {

        const keys = [];


        for (
            let index = 0;
            index < localStorage.length;
            index++
        ) {

            const key =
                localStorage.key(
                    index
                );


            if (
                key &&
                key.startsWith(
                    "hanaFit"
                )
            ) {

                keys.push(
                    key
                );

            }

        }


        keys.forEach(
            key => {

                localStorage.removeItem(
                    key
                );

            }
        );

    }


    async function restoreBackupFile(
        file
    ) {

        if (!file) {
            return;
        }


        try {

            showStatus(
                "Lecture de la sauvegarde…",
                "info"
            );


            const text =
                await file.text();


            const backup =
                JSON.parse(
                    text
                );


            if (
                !validateBackup(
                    backup
                )
            ) {

                throw new Error(
                    "Format de sauvegarde Hana Fit non reconnu."
                );

            }


            const isFullBackup =
                backup.includesPhotos ===
                    true &&
                Array.isArray(
                    backup.photos
                );


            const confirmationText =
                isFullBackup
                    ? "Restaurer cette sauvegarde complète remplacera les données Hana Fit locales actuelles ET les photos privées de progression. Continuer ?"
                    : "Restaurer cette sauvegarde remplacera les données Hana Fit locales actuelles. Les photos privées ne seront pas modifiées. Continuer ?";


            const confirmed =
                window.confirm(
                    confirmationText
                );


            if (!confirmed) {

                return;

            }


            showStatus(
                "Restauration en cours…",
                "info"
            );


            clearHanaFitLocalStorage();


            Object.entries(
                backup.localStorage
            ).forEach(
                ([key, value]) => {

                    if (
                        !key.startsWith(
                            "hanaFit"
                        ) ||
                        typeof value !==
                            "string"
                    ) {

                        return;

                    }


                    localStorage.setItem(
                        key,
                        value
                    );

                }
            );


            if (
                isFullBackup
            ) {

                await replaceProgressPhotos(
                    backup.photos
                );

            }


            /*
             * La restauration elle-même n'est pas considérée
             * comme une nouvelle sauvegarde.
             */
            localStorage.setItem(
                LAST_BACKUP_KEY,
                backup.exportedAt ||
                new Date()
                    .toISOString()
            );


            loadProfileForm();


            await refreshStorageStats();


            showStatus(
                isFullBackup
                    ? `↩️ Sauvegarde complète restaurée avec ${backup.photos.length} photo${backup.photos.length > 1 ? "s" : ""}.`
                    : "↩️ Sauvegarde légère restaurée avec succès."
            );


        } catch (error) {

            console.error(
                "Erreur restauration Hana Fit :",
                error
            );


            showStatus(
                "Ce fichier n'est pas une sauvegarde Hana Fit valide ou n'a pas pu être restauré.",
                "error"
            );

        } finally {

            const input =
                document.getElementById(
                    "restoreFileInput"
                );


            if (input) {

                input.value =
                    "";

            }

        }

    }


    /* =========================================
       PHOTOS PRIVÉES — INDEXEDDB
    ========================================= */

    function openPhotoDatabase() {

        return new Promise(
            (resolve, reject) => {

                if (
                    !("indexedDB" in window)
                ) {

                    resolve(
                        null
                    );

                    return;

                }


                const request =
                    indexedDB.open(
                        PHOTO_DB_NAME,
                        PHOTO_DB_VERSION
                    );


                request.onupgradeneeded =
                    event => {

                        const db =
                            event.target.result;


                        if (
                            !db.objectStoreNames.contains(
                                PHOTO_STORE_NAME
                            )
                        ) {

                            db.createObjectStore(
                                PHOTO_STORE_NAME,
                                {
                                    keyPath:
                                        "id",
                                    autoIncrement:
                                        true
                                }
                            );

                        }

                    };


                request.onsuccess =
                    () => {

                        resolve(
                            request.result
                        );

                    };


                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );

    }


    async function countProgressPhotos() {

        try {

            const db =
                await openPhotoDatabase();


            if (!db) {
                return 0;
            }


            if (
                !db.objectStoreNames.contains(
                    PHOTO_STORE_NAME
                )
            ) {

                db.close();

                return 0;

            }


            return await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            PHOTO_STORE_NAME,
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            PHOTO_STORE_NAME
                        );


                    const request =
                        store.count();


                    request.onsuccess =
                        () => {

                            resolve(
                                request.result || 0
                            );

                        };


                    request.onerror =
                        () => {

                            reject(
                                request.error
                            );

                        };


                    transaction.oncomplete =
                        () => {

                            db.close();

                        };

                }
            );

        } catch (error) {

            console.warn(
                "Impossible de compter les photos :",
                error
            );


            return 0;

        }

    }


    async function getAllProgressPhotos() {

        const db =
            await openPhotoDatabase();


        if (!db) {
            return [];
        }


        if (
            !db.objectStoreNames.contains(
                PHOTO_STORE_NAME
            )
        ) {

            db.close();

            return [];

        }


        return await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        PHOTO_STORE_NAME,
                        "readonly"
                    );


                const store =
                    transaction.objectStore(
                        PHOTO_STORE_NAME
                    );


                const request =
                    store.getAll();


                request.onsuccess =
                    () => {

                        resolve(
                            Array.isArray(
                                request.result
                            )
                                ? request.result
                                : []
                        );

                    };


                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };


                transaction.oncomplete =
                    () => {

                        db.close();

                    };

            }
        );

    }


    function blobToDataUrl(
        blob
    ) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        resolve(
                            reader.result
                        );

                    };


                reader.onerror =
                    () => {

                        reject(
                            reader.error ||
                            new Error(
                                "Impossible de lire une photo."
                            )
                        );

                    };


                reader.readAsDataURL(
                    blob
                );

            }
        );

    }


    function dataUrlToBlob(
        dataUrl
    ) {

        const parts =
            String(
                dataUrl
            ).split(",");


        if (
            parts.length < 2
        ) {

            throw new Error(
                "Photo de sauvegarde invalide."
            );

        }


        const header =
            parts[0];


        const base64 =
            parts.slice(1)
                .join(",");


        const mimeMatch =
            header.match(
                /data:([^;]+);base64/i
            );


        const mimeType =
            mimeMatch?.[1] ||
            "image/jpeg";


        const binary =
            atob(
                base64
            );


        const bytes =
            new Uint8Array(
                binary.length
            );


        for (
            let index = 0;
            index < binary.length;
            index++
        ) {

            bytes[index] =
                binary.charCodeAt(
                    index
                );

        }


        return new Blob(
            [bytes],
            {
                type:
                    mimeType
            }
        );

    }


    async function serializeProgressPhotos() {

        const photos =
            await getAllProgressPhotos();


        const serialized = [];


        for (
            const photo of photos
        ) {

            if (!photo?.blob) {
                continue;
            }


            const dataUrl =
                await blobToDataUrl(
                    photo.blob
                );


            serialized.push({
                id:
                    photo.id,

                date:
                    photo.date ||
                    "",

                pose:
                    photo.pose ||
                    "Autre",

                originalName:
                    photo.originalName ||
                    "",

                originalType:
                    photo.originalType ||
                    photo.blob.type ||
                    "",

                savedAt:
                    photo.savedAt ||
                    "",

                dataUrl
            });

        }


        return serialized;

    }


    async function replaceProgressPhotos(
        photos
    ) {

        const db =
            await openPhotoDatabase();


        if (!db) {

            throw new Error(
                "IndexedDB n'est pas disponible sur cet appareil."
            );

        }


        return await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        PHOTO_STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        PHOTO_STORE_NAME
                    );


                store.clear();


                (photos || [])
                    .forEach(
                        photo => {

                            if (
                                !photo?.dataUrl
                            ) {

                                return;

                            }


                            const blob =
                                dataUrlToBlob(
                                    photo.dataUrl
                                );


                            const restoredPhoto = {

                                date:
                                    photo.date ||
                                    "",

                                pose:
                                    photo.pose ||
                                    "Autre",

                                originalName:
                                    photo.originalName ||
                                    "",

                                originalType:
                                    photo.originalType ||
                                    blob.type ||
                                    "",

                                savedAt:
                                    photo.savedAt ||
                                    new Date()
                                        .toISOString(),

                                blob
                            };


                            /*
                             * Si l'ancienne sauvegarde possède un id valide,
                             * on peut le conserver.
                             */
                            if (
                                Number.isInteger(
                                    Number(
                                        photo.id
                                    )
                                ) &&
                                Number(
                                    photo.id
                                ) > 0
                            ) {

                                restoredPhoto.id =
                                    Number(
                                        photo.id
                                    );

                            }


                            store.put(
                                restoredPhoto
                            );

                        }
                    );


                transaction.oncomplete =
                    () => {

                        db.close();

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        const error =
                            transaction.error;


                        db.close();

                        reject(
                            error
                        );

                    };


                transaction.onabort =
                    () => {

                        const error =
                            transaction.error;


                        db.close();

                        reject(
                            error
                        );

                    };

            }
        );

    }



    function updateBackupReminder() {

        const box =
            document.getElementById(
                "backupReminder"
            );


        const icon =
            document.getElementById(
                "backupReminderIcon"
            );


        const title =
            document.getElementById(
                "backupReminderTitle"
            );


        const text =
            document.getElementById(
                "backupReminderText"
            );


        if (
            !box ||
            !icon ||
            !title ||
            !text
        ) {

            return;

        }


        const lastBackupRaw =
            localStorage.getItem(
                LAST_BACKUP_KEY
            );


        box.classList.remove(
            "good",
            "warning",
            "alert"
        );


        if (!lastBackupRaw) {

            box.classList.add(
                "alert"
            );


            icon.textContent =
                "⚠️";


            title.textContent =
                "Aucune sauvegarde récente";


            text.textContent =
                "Crée une sauvegarde maintenant pour protéger tes données Hana Fit.";

            return;

        }


        const lastBackup =
            new Date(
                lastBackupRaw
            );


        if (
            Number.isNaN(
                lastBackup.getTime()
            )
        ) {

            box.classList.add(
                "alert"
            );


            icon.textContent =
                "⚠️";


            title.textContent =
                "Date de sauvegarde inconnue";


            text.textContent =
                "Je te conseille de créer une nouvelle sauvegarde.";

            return;

        }


        const now =
            new Date();


        const elapsedMs =
            Math.max(
                0,
                now.getTime() -
                lastBackup.getTime()
            );


        const elapsedHours =
            Math.floor(
                elapsedMs /
                (
                    1000 *
                    60 *
                    60
                )
            );


        const elapsedDays =
            Math.floor(
                elapsedHours /
                24
            );


        if (
            elapsedHours < 24
        ) {

            box.classList.add(
                "good"
            );


            icon.textContent =
                "✅";


            title.textContent =
                "Sauvegarde à jour";


            if (
                elapsedHours === 0
            ) {

                text.textContent =
                    "Ta dernière sauvegarde date de moins d'une heure.";

            } else {

                text.textContent =
                    `Ta dernière sauvegarde date d'il y a ${elapsedHours} h.`;

            }


            return;

        }


        if (
            elapsedDays < 7
        ) {

            box.classList.add(
                "good"
            );


            icon.textContent =
                "✅";


            title.textContent =
                "Sauvegarde récente";


            text.textContent =
                `Ta dernière sauvegarde date d'il y a ${elapsedDays} jour${elapsedDays > 1 ? "s" : ""}.`;

            return;

        }


        if (
            elapsedDays < 14
        ) {

            box.classList.add(
                "warning"
            );


            icon.textContent =
                "🟡";


            title.textContent =
                "Une nouvelle sauvegarde serait utile";


            text.textContent =
                `Ta dernière sauvegarde date d'il y a ${elapsedDays} jours. Pense à en créer une nouvelle.`;

            return;

        }


        box.classList.add(
            "alert"
        );


        icon.textContent =
            "🔴";


        title.textContent =
            "Sauvegarde ancienne";


        text.textContent =
            `Ta dernière sauvegarde date d'il y a ${elapsedDays} jours. Je te conseille d'en créer une maintenant.`;

    }


    /* =========================================
       STOCKAGE
    ========================================= */

    async function refreshStorageStats() {

        const dataCount =
            Object.keys(
                collectHanaFitLocalStorage()
            ).length;


        const photoCount =
            await countProgressPhotos();


        const lastBackup =
            localStorage.getItem(
                LAST_BACKUP_KEY
            );


        const dataElement =
            document.getElementById(
                "storageDataCount"
            );


        const photoElement =
            document.getElementById(
                "storagePhotoCount"
            );


        const backupElement =
            document.getElementById(
                "lastBackupDate"
            );


        if (dataElement) {

            dataElement.textContent =
                String(
                    dataCount
                );

        }


        if (photoElement) {

            photoElement.textContent =
                String(
                    photoCount
                );

        }


        if (backupElement) {

            backupElement.textContent =
                lastBackup
                    ? formatDateTime(
                        lastBackup
                    )
                    : "Jamais";

        }


        updateBackupReminder();

    }


    /* =========================================
       SAUVEGARDE COMPLÈTE
    ========================================= */

    async function exportFullBackup() {

        const button =
            document.getElementById(
                "exportFullBackupButton"
            );


        const originalText =
            button?.textContent ||
            "Exporter avec mes photos";


        try {

            if (button) {

                button.disabled =
                    true;


                button.textContent =
                    "Préparation des photos…";

            }


            showStatus(
                "📸 Préparation de la sauvegarde complète…",
                "info"
            );


            const exportedAt =
                new Date()
                    .toISOString();


            const photos =
                await serializeProgressPhotos();


            const backup = {
                app:
                    "Hana Fit",

                formatVersion:
                    2,

                backupType:
                    "full",

                exportedAt,

                includesPhotos:
                    true,

                localStorage:
                    collectHanaFitLocalStorage(),

                photos
            };


            if (button) {

                button.textContent =
                    "Création du fichier…";

            }


            downloadJson(
                backup,
                `hana-fit-sauvegarde-complete-${fileDateStamp()}.json`
            );


            localStorage.setItem(
                LAST_BACKUP_KEY,
                exportedAt
            );


            await refreshStorageStats();


            showStatus(
                photos.length > 0
                    ? `📸 Sauvegarde complète créée avec ${photos.length} photo${photos.length > 1 ? "s" : ""}.`
                    : "📸 Sauvegarde complète créée. Aucune photo privée n'était enregistrée."
            );


        } catch (error) {

            console.error(
                "Erreur sauvegarde complète :",
                error
            );


            showStatus(
                "Impossible de créer la sauvegarde complète.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled =
                    false;


                button.textContent =
                    originalText;

            }

        }

    }


    /* =========================================
       SUPPRESSION LOCALE
    ========================================= */

    function deleteLocalData() {

        const firstConfirmation =
            window.confirm(
                "Supprimer toutes les données Hana Fit locales de cet appareil ?"
            );


        if (!firstConfirmation) {
            return;
        }


        const secondConfirmation =
            window.confirm(
                "Dernière confirmation : cette action effacera notamment tes suivis et tes séances locales. As-tu déjà créé une sauvegarde ?"
            );


        if (!secondConfirmation) {
            return;
        }


        clearHanaFitLocalStorage();


        /*
         * Les photos IndexedDB ne sont volontairement
         * pas supprimées dans cette première version.
         * On les gérera avec la sauvegarde complète.
         */


        loadProfileForm();


        refreshStorageStats();


        showStatus(
            "Les données Hana Fit de localStorage ont été supprimées. Les photos privées n'ont pas été touchées.",
            "info"
        );

    }


    /* =========================================
       ÉVÉNEMENTS
    ========================================= */

    function bindEvents() {

        document
            .getElementById(
                "saveProfileButton"
            )
            ?.addEventListener(
                "click",
                saveProfileSettings
            );


        document
            .getElementById(
                "exportDataButton"
            )
            ?.addEventListener(
                "click",
                exportLightBackup
            );


        document
            .getElementById(
                "exportFullBackupButton"
            )
            ?.addEventListener(
                "click",
                exportFullBackup
            );


        document
            .getElementById(
                "restoreFileInput"
            )
            ?.addEventListener(
                "change",
                event => {

                    restoreBackupFile(
                        event.target.files?.[0]
                    );

                }
            );


        document
            .getElementById(
                "deleteLocalDataButton"
            )
            ?.addEventListener(
                "click",
                deleteLocalData
            );

    }


    /* =========================================
       INITIALISATION
    ========================================= */

    async function initProfilePage() {

        loadProfileForm();


        bindEvents();


        await refreshStorageStats();

    }


    document.addEventListener(
        "DOMContentLoaded",
        initProfilePage
    );

})();