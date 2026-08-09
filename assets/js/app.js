const DEFAULT_DATA = {
    currentWeight: 65.3,
    startWeight: 68.6,
    goalWeight: 60,

    caloriesToday: 0,
    caloriesGoal: 1550,

    proteinToday: 0,
    proteinGoal: 110,

    stepsToday: 0,
    stepsGoal: 8000,

    waterToday: 0,
    waterGoal: 2.3,

    meals: [],
    workouts: [],
    weightHistory: []
};


function loadHanaData() {

    try {

        const savedData =
            localStorage.getItem(
                "hanaFitData"
            );


        if (!savedData) {

            return {
                ...DEFAULT_DATA
            };

        }


        return {
            ...DEFAULT_DATA,
            ...JSON.parse(
                savedData
            )
        };

    } catch (error) {

        console.error(
            "Impossible de charger les données Hana Fit :",
            error
        );


        return {
            ...DEFAULT_DATA
        };

    }

}


function saveHanaData() {

    try {

        localStorage.setItem(
            "hanaFitData",
            JSON.stringify(
                window.hanaData
            )
        );

    } catch (error) {

        console.error(
            "Impossible de sauvegarder les données :",
            error
        );

    }

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function getTodayKey() {

    const today =
        new Date();


    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function calculateWeightProgress() {

    const totalToLose =
        window.hanaData.startWeight -
        window.hanaData.goalWeight;


    const alreadyLost =
        window.hanaData.startWeight -
        window.hanaData.currentWeight;


    if (
        totalToLose <= 0
    ) {

        return 0;

    }


    const percentage =
        Math.round(
            (
                alreadyLost /
                totalToLose
            ) *
            100
        );


    return Math.max(
        0,
        Math.min(
            100,
            percentage
        )
    );

}


function updateDashboard() {

    setText(
        "currentWeight",
        Number(
            window.hanaData.currentWeight
        )
            .toFixed(1)
            .replace(
                ".",
                ","
            )
    );


    setText(
        "caloriesToday",
        window.hanaData.caloriesToday
    );


    setText(
        "caloriesGoal",
        window.hanaData.caloriesGoal
    );


    setText(
        "proteinToday",
        window.hanaData.proteinToday
    );


    setText(
        "proteinGoal",
        window.hanaData.proteinGoal
    );


    setText(
        "stepsToday",
        Number(
            window.hanaData.stepsToday
        )
            .toLocaleString(
                "fr-FR"
            )
    );


    setText(
        "waterToday",
        Number(
            window.hanaData.waterToday
        )
            .toFixed(1)
            .replace(
                ".",
                ","
            )
    );


    const progress =
        calculateWeightProgress();


    setText(
        "weightProgress",
        `${progress} %`
    );


    const circle =
        document.querySelector(
            ".progress-circle"
        );


    if (circle) {

        circle.style.background = `
            radial-gradient(
                circle,
                white 57%,
                transparent 59%
            ),
            conic-gradient(
                #2563eb ${progress}%,
                #dbeafe 0
            )
        `;

    }

}


function updateGreeting() {

    const title =
        document.querySelector(
            ".top-header h1"
        );


    if (!title) {

        return;

    }


    const hour =
        new Date()
            .getHours();


    if (
        hour >= 18
    ) {

        title.textContent =
            "Bonsoir Hana 👋";

    } else if (
        hour < 12
    ) {

        title.textContent =
            "Bonjour Hana 👋";

    } else {

        title.textContent =
            "Bon après-midi Hana 👋";

    }

}


function loadWellbeingHistory() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    "hanaFitWellbeing"
                )
            ) ||
            {}
        );

    } catch (error) {

        console.error(
            "Impossible de charger le suivi bien-être :",
            error
        );


        return {};

    }

}


function isWellbeingCompletedToday() {

    const history =
        loadWellbeingHistory();


    const todayEntry =
        history[
            getTodayKey()
        ];


    return Boolean(
        todayEntry &&
        todayEntry.completed
    );

}


function updateWellbeingGoal() {

    const wellbeingCheckbox =
        document.getElementById(
            "goalWellness"
        );


    const completed =
        isWellbeingCompletedToday();


    if (wellbeingCheckbox) {

        wellbeingCheckbox.checked =
            completed;

        wellbeingCheckbox.disabled =
            completed;

    }


    /*
     * NEHA est désormais gérée par neha.js.
     * Cette fonction ne modifie donc plus
     * son message.
     */

    if (
        window.HanaNeha &&
        typeof window.HanaNeha.refresh ===
            "function"
    ) {

        window.HanaNeha.refresh();

    }


    if (
        typeof updateTodayOverview ===
            "function"
    ) {

        updateTodayOverview();

    }

}


const HOME_GOALS_KEY =
    "hanaFitHomeGoals";


function readJsonStorage(
    key,
    fallback = {}
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );


        return raw
            ? JSON.parse(
                raw
            )
            : fallback;

    } catch (error) {

        console.error(
            `Impossible de lire ${key} :`,
            error
        );


        return fallback;

    }

}


function getResolvedGoals() {

    const settings =
        readJsonStorage(
            "hanaFitSettings",
            {}
        );


    const settingsGoals =
        settings.goals ||
        {};


    function chooseNumber(
        ...values
    ) {

        for (
            const value of values
        ) {

            const number =
                Number(
                    value
                );


            if (
                Number.isFinite(
                    number
                ) &&
                number > 0
            ) {

                return number;

            }

        }


        return 0;

    }


    return {
        calories:
            chooseNumber(
                window.hanaData.caloriesGoal,
                settingsGoals.calories,
                1550
            ),

        protein:
            chooseNumber(
                window.hanaData.proteinGoal,
                settingsGoals.protein,
                110
            ),

        steps:
            chooseNumber(
                window.hanaData.stepsGoal,
                settingsGoals.steps,
                8000
            ),

        water:
            chooseNumber(
                window.hanaData.waterGoal,
                settingsGoals.water,
                2.3
            ),

        goalWeight:
            chooseNumber(
                window.hanaData.goalWeight,
                settingsGoals.weight,
                60
            )
    };

}


function updateGoalLabels() {

    const goals =
        getResolvedGoals();


    setText(
        "caloriesGoal",
        Math.round(
            goals.calories
        )
    );


    setText(
        "proteinGoal",
        Math.round(
            goals.protein
        )
    );


    setText(
        "stepsGoalDisplay",
        Math.round(
            goals.steps
        )
            .toLocaleString(
                "fr-FR"
            )
    );


    setText(
        "waterGoalDisplay",
        Number(
            goals.water
        )
            .toFixed(1)
            .replace(
                ".",
                ","
            )
    );


    setText(
        "goalCaloriesValue",
        Math.round(
            goals.calories
        )
            .toLocaleString(
                "fr-FR"
            )
    );


    setText(
        "goalProteinValue",
        Math.round(
            goals.protein
        )
    );


    setText(
        "goalStepsValue",
        Math.round(
            goals.steps
        )
            .toLocaleString(
                "fr-FR"
            )
    );


    setText(
        "goalWaterValue",
        Number(
            goals.water
        )
            .toFixed(1)
            .replace(
                ".",
                ","
            )
    );


    setText(
        "goalWeightDisplay",
        Number(
            goals.goalWeight
        )
            .toFixed(1)
            .replace(
                ".",
                ","
            )
            .replace(
                ",0",
                ""
            )
    );

}


function loadDailyGoals() {

    const savedGoals =
        readJsonStorage(
            HOME_GOALS_KEY,
            {}
        );


    const todayGoals =
        savedGoals[
            getTodayKey()
        ] ||
        {};


    const goalIds = [
        "goalCalories",
        "goalProtein",
        "goalSteps",
        "goalWater"
    ];


    goalIds.forEach(
        id => {

            const checkbox =
                document.getElementById(
                    id
                );


            if (checkbox) {

                checkbox.checked =
                    Boolean(
                        todayGoals[
                            id
                        ]
                    );

            }

        }
    );

}


function saveDailyGoals() {

    try {

        const savedGoals =
            readJsonStorage(
                HOME_GOALS_KEY,
                {}
            );


        const todayGoals =
            {};


        const goalIds = [
            "goalCalories",
            "goalProtein",
            "goalSteps",
            "goalWater"
        ];


        goalIds.forEach(
            id => {

                const checkbox =
                    document.getElementById(
                        id
                    );


                todayGoals[
                    id
                ] =
                    checkbox
                        ? checkbox.checked
                        : false;

            }
        );


        savedGoals[
            getTodayKey()
        ] =
            todayGoals;


        localStorage.setItem(
            HOME_GOALS_KEY,
            JSON.stringify(
                savedGoals
            )
        );


        updateTodayOverview();

    } catch (error) {

        console.error(
            "Impossible d’enregistrer les objectifs de l’accueil :",
            error
        );

    }

}


function activateDailyGoalSaving() {

    const goalIds = [
        "goalCalories",
        "goalProtein",
        "goalSteps",
        "goalWater"
    ];


    goalIds.forEach(
        id => {

            const checkbox =
                document.getElementById(
                    id
                );


            if (checkbox) {

                checkbox.addEventListener(
                    "change",
                    saveDailyGoals
                );

            }

        }
    );

}


function getTodayTrainingSessions() {

    const history =
        readJsonStorage(
            "hanaFitTraining",
            {}
        );


    const sessions =
        history[
            getTodayKey()
        ];


    return Array.isArray(
        sessions
    )
        ? sessions
        : [];

}


function updateTodayOverview() {

    const sessions =
        getTodayTrainingSessions();


    if (
        sessions.length > 0
    ) {

        setText(
            "todayTrainingStatus",
            sessions.length === 1
                ? "Séance enregistrée ✅"
                : `${sessions.length} séances enregistrées ✅`
        );


        setText(
            "todayTrainingDetail",
            "Ta séance du jour est dans le carnet"
        );

    } else {

        setText(
            "todayTrainingStatus",
            "Aucune séance enregistrée"
        );


        setText(
            "todayTrainingDetail",
            "Jour de repos ou séance à venir"
        );

    }


    const wellbeingCompleted =
        isWellbeingCompletedToday();


    setText(
        "todayWellbeingStatus",
        wellbeingCompleted
            ? "Suivi rempli ✅"
            : "À compléter"
    );


    setText(
        "todayWellbeingDetail",
        wellbeingCompleted
            ? "Ton point bien-être est enregistré"
            : "Quelques secondes pour faire le point"
    );


    const goalIds = [
        "goalCalories",
        "goalProtein",
        "goalSteps",
        "goalWater",
        "goalWellness"
    ];


    const checkedCount =
        goalIds.reduce(
            (
                total,
                id
            ) => {

                const checkbox =
                    document.getElementById(
                        id
                    );


                return total +
                    (
                        checkbox &&
                        checkbox.checked
                            ? 1
                            : 0
                    );

            },
            0
        );


    setText(
        "todayGoalsStatus",
        `${checkedCount} / ${goalIds.length}`
    );


    let detail =
        "Avance à ton rythme";


    if (
        checkedCount ===
        goalIds.length
    ) {

        detail =
            "Tous les repères du jour sont cochés ✨";

    } else if (
        checkedCount >= 3
    ) {

        detail =
            "La journée est déjà bien avancée 💙";

    }


    setText(
        "todayGoalsDetail",
        detail
    );

}


function parseLocalDateKey(
    dateString
) {

    const parts =
        String(
            dateString ||
            ""
        )
            .split("-")
            .map(
                Number
            );


    if (
        parts.length !== 3 ||
        parts.some(
            value =>
                !Number.isFinite(
                    value
                )
        )
    ) {

        return null;

    }


    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2],
        12,
        0,
        0,
        0
    );

}


function getWeekMonday(
    date
) {

    const result =
        new Date(
            date
        );


    result.setHours(
        12,
        0,
        0,
        0
    );


    const day =
        result.getDay();


    result.setDate(
        result.getDate() +
        (
            day === 0
                ? -6
                : 1 - day
        )
    );


    return result;

}


function addDays(
    date,
    days
) {

    const result =
        new Date(
            date
        );


    result.setDate(
        result.getDate() +
        days
    );


    return result;

}


function averageWeights(
    entries
) {

    const values =
        entries
            .map(
                entry =>
                    Number(
                        entry.weight
                    )
            )
            .filter(
                value =>
                    Number.isFinite(
                        value
                    )
            );


    if (
        values.length === 0
    ) {

        return null;

    }


    return values.reduce(
        (
            total,
            value
        ) =>
            total + value,
        0
    ) /
    values.length;

}


function updateWeeklyTrendHome() {

    const progress =
        readJsonStorage(
            "hanaFitProgress",
            {}
        );


    const weights =
        Array.isArray(
            progress.weights
        )
            ? progress.weights
            : [];


    if (
        weights.length === 0
    ) {

        setText(
            "weeklyAverageHome",
            "—"
        );


        setText(
            "weeklyTrendHome",
            "Pas encore de données"
        );


        return;

    }


    const now =
        new Date();


    const currentMonday =
        getWeekMonday(
            now
        );


    const previousMonday =
        addDays(
            currentMonday,
            -7
        );


    function entriesForWeek(
        monday
    ) {

        const start =
            getTodayKeyFromDate(
                monday
            );


        const end =
            getTodayKeyFromDate(
                addDays(
                    monday,
                    6
                )
            );


        return weights.filter(
            entry =>
                parseLocalDateKey(
                    entry.date
                ) &&
                entry.date >= start &&
                entry.date <= end
        );

    }


    const currentAverage =
        averageWeights(
            entriesForWeek(
                currentMonday
            )
        );


    const previousAverage =
        averageWeights(
            entriesForWeek(
                previousMonday
            )
        );


    setText(
        "weeklyAverageHome",
        Number.isFinite(
            currentAverage
        )
            ? `${currentAverage
                .toFixed(1)
                .replace(".", ",")} kg`
            : "—"
    );


    if (
        !Number.isFinite(
            currentAverage
        )
    ) {

        setText(
            "weeklyTrendHome",
            "En attente"
        );


        return;

    }


    if (
        !Number.isFinite(
            previousAverage
        )
    ) {

        setText(
            "weeklyTrendHome",
            "Première moyenne"
        );


        return;

    }


    const difference =
        currentAverage -
        previousAverage;


    const absoluteDifference =
        Math.abs(
            difference
        );


    let arrow =
        "→";

    let label =
        "stable";


    if (
        difference <= -0.15
    ) {

        arrow =
            "↘";

        label =
            "baisse";

    } else if (
        difference >= 0.15
    ) {

        arrow =
            "↗";

        label =
            "hausse";

    }


    const sign =
        difference > 0
            ? "+"
            : "";


    setText(
        "weeklyTrendHome",
        `${arrow} ${label} · ${sign}${difference
            .toFixed(1)
            .replace(".", ",")} kg`
    );

}


function getTodayKeyFromDate(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );

    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return `${year}-${month}-${day}`;

}


window.hanaData =
    loadHanaData();


window.saveHanaData =
    saveHanaData;


window.updateDashboard =
    updateDashboard;


document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateGreeting();

        updateDashboard();

        updateGoalLabels();

        loadDailyGoals();

        activateDailyGoalSaving();

        updateWellbeingGoal();

        updateTodayOverview();

        updateWeeklyTrendHome();

        saveHanaData();

    }
);


window.addEventListener(
    "pageshow",
    () => {

        window.hanaData =
            loadHanaData();

        updateGreeting();

        updateDashboard();

        updateGoalLabels();

        loadDailyGoals();

        updateWellbeingGoal();

        updateTodayOverview();

        updateWeeklyTrendHome();

    }
);