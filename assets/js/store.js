const Hana = {};

Hana.store = (() => {

    const STORAGE_KEYS = {
        dashboard: "hanaFitData",
        nutrition: "hanaFitNutrition",
        wellbeing: "hanaFitWellbeing",
        training: "hanaFitTraining",
        daily: "hanaFitDailyGoals",
        settings: "hanaFitSettings"
    };

    function read(key, fallback = {}) {

        try {

            const value = localStorage.getItem(key);

            return value
                ? JSON.parse(value)
                : fallback;

        } catch {

            return fallback;

        }

    }

    function write(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }

    function todayKey() {

        const d = new Date();

        return d.toISOString().split("T")[0];

    }

    return {

        read,

        write,

        todayKey,

        keys: STORAGE_KEYS,

        dashboard() {

            return read(
                STORAGE_KEYS.dashboard,
                {}
            );

        },

        saveDashboard(data) {

            write(
                STORAGE_KEYS.dashboard,
                data
            );

        },

        nutrition() {

            return read(
                STORAGE_KEYS.nutrition,
                {}
            );

        },

        saveNutrition(data) {

            write(
                STORAGE_KEYS.nutrition,
                data
            );

        },

        wellbeing() {

            return read(
                STORAGE_KEYS.wellbeing,
                {}
            );

        },

        saveWellbeing(data) {

            write(
                STORAGE_KEYS.wellbeing,
                data
            );

        },

        training() {

            return read(
                STORAGE_KEYS.training,
                {}
            );

        },

        saveTraining(data) {

            write(
                STORAGE_KEYS.training,
                data
            );

        },

        settings() {

            return read(
                STORAGE_KEYS.settings,
                {}
            );

        },

        saveSettings(data) {

            write(
                STORAGE_KEYS.settings,
                data
            );

        }

    };

})();