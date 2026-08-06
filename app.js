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
        const savedData = localStorage.getItem("hanaFitData");

        if (!savedData) {
            return { ...DEFAULT_DATA };
        }

        return {
            ...DEFAULT_DATA,
            ...JSON.parse(savedData)
        };
    } catch (error) {
        console.error("Impossible de charger les données Hana Fit :", error);

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
        console.error("Impossible de sauvegarder les données :", error);
    }
}


function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
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

    const percentage = Math.round(
        (alreadyLost / totalToLose) * 100
    );

    return Math.max(0, Math.min(100, percentage));
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

    const progress = calculateWeightProgress();

    setText(
        "weightProgress",
        `${progress} %`
    );

    const circle =
        document.querySelector(".progress-circle");

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
        document.querySelector(".top-header h1");

    if (!title) {
        return;
    }

    const hour = new Date().getHours();

    if (hour >= 18) {
        title.textContent = "Bonsoir Hana 👋";
    } else if (hour < 12) {
        title.textContent = "Bonjour Hana 👋";
    } else {
        title.textContent = "Bon après-midi Hana 👋";
    }
}


window.hanaData = loadHanaData();
window.saveHanaData = saveHanaData;
window.updateDashboard = updateDashboard;


document.addEventListener(
    "DOMContentLoaded",
    () => {
        updateGreeting();
        updateDashboard();
        saveHanaData();
    }
);
