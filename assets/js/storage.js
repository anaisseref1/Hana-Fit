const HANA_STORAGE_KEYS = {
    main: "hanaFitData",
    nutrition: "hanaFitNutrition",
    wellbeing: "hanaFitWellbeing",
    training: "hanaFitTraining",
    dailyGoals: "hanaFitDailyGoals"
};


function readStorage(key, fallback = {}) {
    try {
        const savedValue =
            localStorage.getItem(key);

        if (!savedValue) {
            return fallback;
        }

        return JSON.parse(savedValue);
    } catch (error) {
        console.error(
            `Impossible de lire les données "${key}" :`,
            error
        );

        return fallback;
    }
}


function writeStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.error(
            `Impossible d’enregistrer les données "${key}" :`,
            error
        );

        return false;
    }
}


function getTodayKey() {
    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function loadMainData() {
    return readStorage(
        HANA_STORAGE_KEYS.main,
        {}
    );
}


function saveMainData(data) {
    return writeStorage(
        HANA_STORAGE_KEYS.main,
        data
    );
}


function loadDailyHistory(storageKey) {
    return readStorage(
        storageKey,
        {}
    );
}


function getTodayEntries(storageKey) {
    const history =
        loadDailyHistory(storageKey);

    return history[getTodayKey()] || [];
}


function saveTodayEntries(
    storageKey,
    entries
) {
    const history =
        loadDailyHistory(storageKey);

    history[getTodayKey()] =
        entries;

    return writeStorage(
        storageKey,
        history
    );
}


window.HanaStorage = {
    keys: HANA_STORAGE_KEYS,
    read: readStorage,
    write: writeStorage,
    today: getTodayKey,
    loadMainData,
    saveMainData,
    loadDailyHistory,
    getTodayEntries,
    saveTodayEntries
};