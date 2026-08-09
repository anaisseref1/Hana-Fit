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
            localStorage.getItem("hanaFitData");

        if (!savedData) {
            return { ...DEFAULT_DATA };
        }

        return {
            ...DEFAULT_DATA,
            ...JSON.parse(savedData)
        };
    } catch (error) {
        console.error(
            "Impossible de charger les données Hana Fit :",
            error
        );

        return { ...DEFAULT_DATA };
    }
}


function saveHanaData() {
    try {
        localStorage.setItem(
            "hanaFitData",
            JSON.stringify(window.hanaData)
        );
    } catch (error) {
        console.error(
            "Impossible de sauvegarder les données :",
            error
        );
    }
}


function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
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


function calculateWeightProgress() {
    const totalToLose =
        window.hanaData.startWeight -
        window.hanaData.goalWeight;

    const alreadyLost =
        window.hanaData.startWeight -
        window.hanaData.currentWeight;

    if (totalToLose <= 0) {
        return 0;
    }

    const percentage =
        Math.round(
            (alreadyLost / totalToLose) * 100
        );

    return Math.max(
        0,
        Math.min(100, percentage)
    );
}


function updateDashboard() {
    setText(
        "currentWeight",
        Number(window.hanaData.currentWeight)
            .toFixed(1)
            .replace(".", ",")
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
        Number(window.hanaData.stepsToday)
            .toLocaleString("fr-FR")
    );

    setText(
        "waterToday",
        Number(window.hanaData.waterToday)
            .toFixed(1)
            .replace(".", ",")
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
        new Date().getHours();

    if (hour >= 18) {
        title.textContent =
            "Bonsoir Hana 👋";
    } else if (hour < 12) {
        title.textContent =
            "Bonjour Hana 👋";
    } else {
        title.textContent =
            "Bon après-midi Hana 👋";
    }
}


function loadWellbeingHistory() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "hanaFitWellbeing"
            )
        ) || {};
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
        history[getTodayKey()];

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

    const nehaMessage =
        document.getElementById(
            "nehaMessage"
        );

    const completed =
        isWellbeingCompletedToday();

    if (wellbeingCheckbox) {
        wellbeingCheckbox.checked =
            completed;

        wellbeingCheckbox.disabled =
            completed;
    }

    if (nehaMessage) {
        if (completed) {
            nehaMessage.textContent =
                "Bravo Hana ! Ton journal bien-être du jour est enregistré 💙";
        } else {
            nehaMessage.textContent =
                "Pense à remplir ton suivi bien-être aujourd’hui. Quelques secondes suffisent 🌿";
        }
    }
}


function loadDailyGoals() {
    try {
        const savedGoals =
            JSON.parse(
                localStorage.getItem(
                    "hanaFitDailyGoals"
                )
            ) || {};

        const todayGoals =
            savedGoals[getTodayKey()] || {};

        const goalIds = [
            "goalCalories",
            "goalProtein",
            "goalSteps",
            "goalWater"
        ];

        goalIds.forEach(id => {
            const checkbox =
                document.getElementById(id);

            if (checkbox) {
                checkbox.checked =
                    Boolean(todayGoals[id]);
            }
        });
    } catch (error) {
        console.error(
            "Impossible de charger les objectifs :",
            error
        );
    }
}


function saveDailyGoals() {
    try {
        const savedGoals =
            JSON.parse(
                localStorage.getItem(
                    "hanaFitDailyGoals"
                )
            ) || {};

        const todayGoals = {};

        const goalIds = [
            "goalCalories",
            "goalProtein",
            "goalSteps",
            "goalWater"
        ];

        goalIds.forEach(id => {
            const checkbox =
                document.getElementById(id);

            todayGoals[id] =
                checkbox
                    ? checkbox.checked
                    : false;
        });

        savedGoals[getTodayKey()] =
            todayGoals;

        localStorage.setItem(
            "hanaFitDailyGoals",
            JSON.stringify(savedGoals)
        );
    } catch (error) {
        console.error(
            "Impossible d’enregistrer les objectifs :",
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

    goalIds.forEach(id => {
        const checkbox =
            document.getElementById(id);

        if (checkbox) {
            checkbox.addEventListener(
                "change",
                saveDailyGoals
            );
        }
    });
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

        loadDailyGoals();
        activateDailyGoalSaving();

        updateWellbeingGoal();

        saveHanaData();
    }
);


window.addEventListener(
    "pageshow",
    () => {
        updateWellbeingGoal();
    }
);