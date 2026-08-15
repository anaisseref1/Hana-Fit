/* =========================================
   HANA FIT — MON VOYAGE
   Pesées + mensurations + paliers
========================================= */

const weightForm =
    document.getElementById("weightForm");

const weightDate =
    document.getElementById("weightDate");

const weightValue =
    document.getElementById("weightValue");

const currentWeightElement =
    document.getElementById("currentWeight");

const startWeightElement =
    document.getElementById("startWeight");

const goalWeightElement =
    document.getElementById("goalWeight");

const journeyProgressBar =
    document.getElementById("journeyProgressBar");

const journeyLost =
    document.getElementById("journeyLost");

const journeyPercent =
    document.getElementById("journeyPercent");

const journeyRemaining =
    document.getElementById("journeyRemaining");

const weightHistory =
    document.getElementById("weightHistory");

const milestoneGrid =
    document.getElementById("milestoneGrid");

const saveMeasurementsButton =
    document.getElementById("saveMeasurementsButton");

const measurementDate =
    document.getElementById("measurementDate");

const measureChest =
    document.getElementById("measureChest");

const measureWaist =
    document.getElementById("measureWaist");

const measureNavel =
    document.getElementById("measureNavel");

const measureHips =
    document.getElementById("measureHips");

const measureThigh =
    document.getElementById("measureThigh");

const measureArm =
    document.getElementById("measureArm");

const measureShoulders =
    document.getElementById("measureShoulders");


/* =========================================
   CONFIGURATION
========================================= */

const PROGRESS_STORAGE_KEY =
    "hanaFitProgress";

const MAIN_DATA_KEY =
    "hanaFitData";

const DEFAULTS = {
    startWeight: 68.6,
    currentWeight: 65.3,
    goalWeight: 60
};

let weightChartPeriod = "1m";


/* =========================================
   OUTILS
========================================= */

function localDateKey(date = new Date()) {

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

    return `${year}-${month}-${day}`;

}


function formatNumber(value) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {

        return "—";

    }

    return number
        .toFixed(1)
        .replace(
            ".",
            ","
        );

}


function formatWeight(value) {

    return `${formatNumber(value)} kg`;

}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const parts =
        dateString.split("-");

    if (
        parts.length !== 3
    ) {

        return dateString;

    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        Math.max(
            value,
            min
        ),
        max
    );

}


/* =========================================
   DONNÉES PRINCIPALES DE L'ACCUEIL
========================================= */

function readMainData() {

    try {

        const raw =
            localStorage.getItem(
                MAIN_DATA_KEY
            );

        return raw
            ? JSON.parse(raw)
            : {};

    } catch {

        return {};

    }

}


function saveMainData(data) {

    localStorage.setItem(
        MAIN_DATA_KEY,
        JSON.stringify(data)
    );

}


/* =========================================
   DONNÉES MON VOYAGE
========================================= */

function createDefaultProgressData() {

    const mainData =
        readMainData();


    const currentFromHome =
        Number(
            mainData.currentWeight ??
            mainData.weightCurrent ??
            mainData.weight
        );


    const startFromHome =
        Number(
            mainData.startWeight ??
            mainData.weightStart
        );


    const goalFromHome =
        Number(
            mainData.goalWeight ??
            mainData.weightGoal
        );


    return {

        startWeight:
            Number.isFinite(
                startFromHome
            ) &&
            startFromHome > 0
                ? startFromHome
                : DEFAULTS.startWeight,

        goalWeight:
            Number.isFinite(
                goalFromHome
            ) &&
            goalFromHome > 0
                ? goalFromHome
                : DEFAULTS.goalWeight,

        currentWeight:
            Number.isFinite(
                currentFromHome
            ) &&
            currentFromHome > 0
                ? currentFromHome
                : DEFAULTS.currentWeight,

        weights: [],

        measurements: []

    };

}


function getProgressData() {

    try {

        const raw =
            localStorage.getItem(
                PROGRESS_STORAGE_KEY
            );


        if (!raw) {

            const defaults =
                createDefaultProgressData();

            saveProgressData(
                defaults
            );

            return defaults;

        }


        const parsed =
            JSON.parse(raw);


        return {

            startWeight:
                Number(
                    parsed.startWeight
                ) ||
                DEFAULTS.startWeight,

            goalWeight:
                Number(
                    parsed.goalWeight
                ) ||
                DEFAULTS.goalWeight,

            currentWeight:
                Number(
                    parsed.currentWeight
                ) ||
                DEFAULTS.currentWeight,

            weights:
                Array.isArray(
                    parsed.weights
                )
                    ? parsed.weights
                    : [],

            measurements:
                Array.isArray(
                    parsed.measurements
                )
                    ? parsed.measurements
                    : []

        };


    } catch {

        return createDefaultProgressData();

    }

}


function saveProgressData(data) {

    localStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =========================================
   SYNCHRONISATION AVEC L'ACCUEIL
========================================= */

function syncCurrentWeightToHome(
    currentWeight,
    startWeight,
    goalWeight
) {

    const mainData =
        readMainData();


    /*
     * On conserve les autres données de l'accueil
     * et on ajoute les valeurs de Mon Voyage.
     */

    mainData.currentWeight =
        currentWeight;

    mainData.startWeight =
        startWeight;

    mainData.goalWeight =
        goalWeight;


    saveMainData(
        mainData
    );

}


/* =========================================
   DERNIÈRE PESÉE
========================================= */

function getLatestWeightEntry(weights) {

    if (
        !Array.isArray(weights) ||
        weights.length === 0
    ) {

        return null;

    }


    return [...weights]
        .sort(
            (a, b) =>
                String(b.date)
                    .localeCompare(
                        String(a.date)
                    )
        )[0];

}


/* =========================================
   STATISTIQUES PRINCIPALES
========================================= */

function renderJourneyStats() {

    const data =
        getProgressData();


    const latest =
        getLatestWeightEntry(
            data.weights
        );


    const currentWeight =
        latest
            ? Number(
                latest.weight
            )
            : Number(
                data.currentWeight
            );


    currentWeightElement.textContent =
        formatWeight(
            currentWeight
        );


    startWeightElement.textContent =
        formatWeight(
            data.startWeight
        );


    goalWeightElement.textContent =
        formatWeight(
            data.goalWeight
        );


    const totalToLose =
        data.startWeight -
        data.goalWeight;


    const lost =
        data.startWeight -
        currentWeight;


    const remaining =
        currentWeight -
        data.goalWeight;


    let percent =
        totalToLose > 0
            ? (
                lost /
                totalToLose
            ) * 100
            : 0;


    percent =
        clamp(
            percent,
            0,
            100
        );


    journeyProgressBar.style.width =
        `${percent}%`;


    journeyPercent.textContent =
        `${Math.round(percent)} %`;


    if (lost >= 0) {

        journeyLost.textContent =
            `${formatNumber(lost)} kg parcourus`;

    } else {

        journeyLost.textContent =
            `${formatNumber(
                Math.abs(lost)
            )} kg au-dessus du départ`;

    }


    if (remaining > 0) {

        journeyRemaining.textContent =
            `${formatNumber(remaining)} kg restants`;

    } else {

        journeyRemaining.textContent =
            "Objectif atteint 🎉";

    }


    data.currentWeight =
        currentWeight;


    saveProgressData(
        data
    );


    syncCurrentWeightToHome(
        currentWeight,
        data.startWeight,
        data.goalWeight
    );


    renderMilestones(
        currentWeight
    );

}




/* =========================================
   TENDANCE HEBDOMADAIRE
========================================= */

function parseDateKey(
    dateString
) {

    const parts =
        String(
            dateString || ""
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


    const [
        year,
        month,
        day
    ] =
        parts;


    return new Date(
        year,
        month - 1,
        day,
        12,
        0,
        0,
        0
    );

}


function addDays(
    date,
    numberOfDays
) {

    const result =
        new Date(
            date
        );


    result.setDate(
        result.getDate() +
        numberOfDays
    );


    return result;

}


function getMonday(
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


    const distance =
        day === 0
            ? -6
            : 1 - day;


    result.setDate(
        result.getDate() +
        distance
    );


    return result;

}


function averageWeightEntries(
    entries
) {

    if (
        !Array.isArray(
            entries
        ) ||
        entries.length === 0
    ) {

        return null;

    }


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


    return (
        values.reduce(
            (total, value) =>
                total + value,
            0
        ) /
        values.length
    );

}


function getValidWeightEntries() {

    const data =
        getProgressData();


    return data.weights
        .filter(
            entry =>
                entry.date &&
                parseDateKey(
                    entry.date
                ) &&
                Number.isFinite(
                    Number(
                        entry.weight
                    )
                )
        )
        .map(
            entry => ({
                ...entry,
                weight:
                    Number(
                        entry.weight
                    )
            })
        );

}


function getEntriesForWeek(
    weekStart,
    entries
) {

    const startKey =
        localDateKey(
            weekStart
        );


    const endKey =
        localDateKey(
            addDays(
                weekStart,
                6
            )
        );


    return entries
        .filter(
            entry =>
                entry.date >=
                    startKey &&
                entry.date <=
                    endKey
        )
        .sort(
            (a, b) =>
                String(
                    a.date
                )
                    .localeCompare(
                        String(
                            b.date
                        )
                    )
        );

}


function formatWeekRange(
    weekStart
) {

    const weekEnd =
        addDays(
            weekStart,
            6
        );


    return (
        `${String(
            weekStart.getDate()
        ).padStart(2, "0")}/${String(
            weekStart.getMonth() + 1
        ).padStart(2, "0")}` +
        " au " +
        `${String(
            weekEnd.getDate()
        ).padStart(2, "0")}/${String(
            weekEnd.getMonth() + 1
        ).padStart(2, "0")}`
    );

}


function getWeeklySummaries(
    limit = 8
) {

    const entries =
        getValidWeightEntries();


    const groups =
        new Map();


    entries.forEach(
        entry => {

            const date =
                parseDateKey(
                    entry.date
                );


            if (!date) {
                return;
            }


            const monday =
                getMonday(
                    date
                );


            const key =
                localDateKey(
                    monday
                );


            if (
                !groups.has(
                    key
                )
            ) {

                groups.set(
                    key,
                    {
                        weekStart:
                            monday,

                        entries:
                            []
                    }
                );

            }


            groups
                .get(
                    key
                )
                .entries
                .push(
                    entry
                );

        }
    );


    return [...groups.values()]
        .map(
            group => ({
                weekStart:
                    group.weekStart,

                count:
                    group.entries.length,

                average:
                    averageWeightEntries(
                        group.entries
                    ),

                entries:
                    group.entries
            })
        )
        .filter(
            summary =>
                Number.isFinite(
                    summary.average
                )
        )
        .sort(
            (a, b) =>
                b.weekStart -
                a.weekStart
        )
        .slice(
            0,
            limit
        );

}


function renderWeeklyAverageHistory() {

    const container =
        document.getElementById(
            "weeklyAverageHistory"
        );


    if (!container) {
        return;
    }


    const summaries =
        getWeeklySummaries(
            8
        );


    container.innerHTML =
        "";


    if (
        summaries.length === 0
    ) {

        container.innerHTML = `

            <p class="empty-message">
                Pas encore de moyenne hebdomadaire.
            </p>

        `;


        return;

    }


    summaries.forEach(
        summary => {

            const row =
                document.createElement(
                    "article"
                );


            row.className =
                "weekly-average-item";


            const info =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                `Semaine du ${formatWeekRange(
                    summary.weekStart
                )}`;


            const meta =
                document.createElement(
                    "span"
                );


            meta.textContent =
                `${summary.count} pesée${
                    summary.count > 1
                        ? "s"
                        : ""
                }`;


            const value =
                document.createElement(
                    "span"
                );


            value.className =
                "weekly-average-value";


            value.textContent =
                formatWeight(
                    summary.average
                );


            info.appendChild(
                title
            );


            info.appendChild(
                meta
            );


            row.appendChild(
                info
            );


            row.appendChild(
                value
            );


            container.appendChild(
                row
            );

        }
    );

}


function renderWeeklyTrend() {

    const currentAverageElement =
        document.getElementById(
            "currentWeekAverage"
        );

    const previousAverageElement =
        document.getElementById(
            "previousWeekAverage"
        );

    const differenceElement =
        document.getElementById(
            "weeklyDifference"
        );

    const countElement =
        document.getElementById(
            "currentWeekCount"
        );

    const iconElement =
        document.getElementById(
            "weeklyTrendIcon"
        );

    const titleElement =
        document.getElementById(
            "weeklyTrendTitle"
        );

    const messageElement =
        document.getElementById(
            "weeklyTrendMessage"
        );


    if (
        !currentAverageElement ||
        !previousAverageElement ||
        !differenceElement ||
        !countElement ||
        !iconElement ||
        !titleElement ||
        !messageElement
    ) {

        renderWeeklyAverageHistory();

        return;

    }


    const today =
        new Date();


    const currentWeekStart =
        getMonday(
            today
        );


    const previousWeekStart =
        addDays(
            currentWeekStart,
            -7
        );


    const entries =
        getValidWeightEntries();


    const currentEntries =
        getEntriesForWeek(
            currentWeekStart,
            entries
        );


    const previousEntries =
        getEntriesForWeek(
            previousWeekStart,
            entries
        );


    const currentAverage =
        averageWeightEntries(
            currentEntries
        );


    const previousAverage =
        averageWeightEntries(
            previousEntries
        );


    currentAverageElement.textContent =
        Number.isFinite(
            currentAverage
        )
            ? formatWeight(
                currentAverage
            )
            : "—";


    previousAverageElement.textContent =
        Number.isFinite(
            previousAverage
        )
            ? formatWeight(
                previousAverage
            )
            : "—";


    countElement.textContent =
        String(
            currentEntries.length
        );


    if (
        !Number.isFinite(
            currentAverage
        )
    ) {

        differenceElement.textContent =
            "—";

        iconElement.textContent =
            "…";

        titleElement.textContent =
            "Pas encore de moyenne cette semaine";

        messageElement.textContent =
            "Ajoute au moins une pesée cette semaine pour commencer le calcul.";


        renderWeeklyAverageHistory();

        return;

    }


    if (
        !Number.isFinite(
            previousAverage
        )
    ) {

        differenceElement.textContent =
            "—";

        iconElement.textContent =
            "•";

        titleElement.textContent =
            "Première moyenne disponible";

        messageElement.textContent =
            `Moyenne actuelle : ${formatWeight(
                currentAverage
            )} à partir de ${currentEntries.length} pesée${
                currentEntries.length > 1
                    ? "s"
                    : ""
            }. La comparaison apparaîtra dès qu'une semaine précédente sera disponible.`;


        renderWeeklyAverageHistory();

        return;

    }


    const difference =
        currentAverage -
        previousAverage;


    const roundedDifference =
        Math.round(
            difference *
            100
        ) /
        100;


    differenceElement.textContent =
        `${roundedDifference > 0 ? "+" : ""}${formatNumber(
            roundedDifference
        )} kg`;


    const absoluteDifference =
        Math.abs(
            difference
        );


    const provisionalText =
        currentEntries.length < 3
            ? " Tendance encore provisoire avec peu de pesées cette semaine."
            : "";


    if (
        difference <= -0.15
    ) {

        iconElement.textContent =
            "↘";

        titleElement.textContent =
            "Tendance en baisse";

        messageElement.textContent =
            `La moyenne de cette semaine est ${formatNumber(
                absoluteDifference
            )} kg plus basse que celle de la semaine précédente.${provisionalText}`;

    } else if (
        difference >= 0.15
    ) {

        iconElement.textContent =
            "↗";

        titleElement.textContent =
            "Tendance en hausse";

        messageElement.textContent =
            `La moyenne de cette semaine est ${formatNumber(
                absoluteDifference
            )} kg plus haute que celle de la semaine précédente.${provisionalText}`;

    } else {

        iconElement.textContent =
            "→";

        titleElement.textContent =
            "Tendance stable";

        messageElement.textContent =
            `Les deux moyennes sont très proches : ${formatNumber(
                absoluteDifference
            )} kg d'écart.${provisionalText}`;

    }


    renderWeeklyAverageHistory();

}



/* =========================================
   AJOUT / MODIFICATION PESÉE
========================================= */

function saveWeightEntry(
    date,
    weight
) {

    const data =
        getProgressData();


    const numericWeight =
        Number(weight);


    if (
        !date ||
        !Number.isFinite(
            numericWeight
        ) ||
        numericWeight <= 0
    ) {

        return false;

    }


    const existingIndex =
        data.weights.findIndex(
            item =>
                item.date === date
        );


    const entry = {
        date,
        weight:
            Math.round(
                numericWeight *
                10
            ) / 10,

        savedAt:
            new Date()
                .toISOString()
    };


    /*
     * Une seule pesée par date :
     * si la date existe déjà, on la remplace.
     */

    if (
        existingIndex >= 0
    ) {

        data.weights[
            existingIndex
        ] = entry;

    } else {

        data.weights.push(
            entry
        );

    }


    const latest =
        getLatestWeightEntry(
            data.weights
        );


    if (latest) {

        data.currentWeight =
            latest.weight;

    }


    saveProgressData(
        data
    );


    return true;

}


/* =========================================
   SUPPRESSION PESÉE
========================================= */

function deleteWeightEntry(
    date
) {

    const data =
        getProgressData();


    data.weights =
        data.weights.filter(
            entry =>
                entry.date !== date
        );


    const latest =
        getLatestWeightEntry(
            data.weights
        );


    data.currentWeight =
        latest
            ? Number(
                latest.weight
            )
            : DEFAULTS.currentWeight;


    saveProgressData(
        data
    );


    renderAll();

}


/* =========================================
   HISTORIQUE PESÉES
========================================= */

function renderWeightHistory() {

    const data =
        getProgressData();


    const sorted =
        [...data.weights]
            .sort(
                (a, b) =>
                    String(b.date)
                        .localeCompare(
                            String(a.date)
                        )
            );


    weightHistory.innerHTML =
        "";


    if (
        sorted.length === 0
    ) {

        weightHistory.innerHTML = `

            <p class="empty-message">
                Aucune pesée enregistrée.
            </p>

        `;

        return;

    }


    sorted.forEach(
        entry => {

            const row =
                document.createElement(
                    "article"
                );


            row.className =
                "history-item";


            const info =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                "Pesée";


            const date =
                document.createElement(
                    "span"
                );


            date.className =
                "history-date";


            date.textContent =
                formatDate(
                    entry.date
                );


            info.appendChild(
                title
            );


            info.appendChild(
                document.createElement(
                    "br"
                )
            );


            info.appendChild(
                date
            );


            const value =
                document.createElement(
                    "span"
                );


            value.className =
                "history-weight";


            value.textContent =
                formatWeight(
                    entry.weight
                );


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "delete-history";


            deleteButton.textContent =
                "×";


            deleteButton.title =
                "Supprimer cette pesée";


            deleteButton.setAttribute(
                "aria-label",
                "Supprimer cette pesée"
            );


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteWeightEntry(
                        entry.date
                    );

                }
            );


            row.appendChild(
                info
            );


            row.appendChild(
                value
            );


            row.appendChild(
                deleteButton
            );


            weightHistory.appendChild(
                row
            );

        }
    );

}


/* =========================================
   PALIERS
========================================= */

function renderMilestones(
    currentWeight
) {

    if (!milestoneGrid) {
        return;
    }


    const data =
        getProgressData();


    const recordedWeights = [
        Number(
            currentWeight
        ),
        ...data.weights
            .map(
                entry =>
                    Number(
                        entry.weight
                    )
            )
    ]
        .filter(
            value =>
                Number.isFinite(
                    value
                ) &&
                value > 0
        );


    const lowestRecordedWeight =
        recordedWeights.length > 0
            ? Math.min(
                ...recordedWeights
            )
            : Number(
                currentWeight
            );


    milestoneGrid
        .querySelectorAll(
            ".milestone"
        )
        .forEach(
            milestone => {

                const target =
                    Number(
                        milestone.dataset.weight
                    );


                const reached =
                    Number.isFinite(
                        target
                    ) &&
                    lowestRecordedWeight <=
                    target;


                milestone.classList.toggle(
                    "reached",
                    reached
                );


                const existingState =
                    milestone.querySelector(
                        ".milestone-state"
                    );


                if (existingState) {

                    existingState.remove();

                }


                const state =
                    document.createElement(
                        "span"
                    );


                state.className =
                    "milestone-state";


                state.textContent =
                    reached
                        ? "✓ Atteint"
                        : "À venir";


                if (reached) {

                    state.style.color =
                        "#16a34a";

                    state.style.fontWeight =
                        "800";

                }


                milestone.appendChild(
                    state
                );

            }
        );

}


/* =========================================
   FORMULAIRE PESÉE
========================================= */

if (weightForm) {

    weightForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const saved =
                saveWeightEntry(
                    weightDate.value,
                    weightValue.value
                );


            if (!saved) {
                return;
            }


            weightValue.value =
                "";


            renderAll();

        }
    );

}


/* =========================================
   MENSURATIONS
========================================= */

function getMeasurementValues() {

    return {

        chest:
            measureChest.value
                ? Number(
                    measureChest.value
                )
                : null,

        waist:
            measureWaist.value
                ? Number(
                    measureWaist.value
                )
                : null,

        navel:
            measureNavel.value
                ? Number(
                    measureNavel.value
                )
                : null,

        hips:
            measureHips.value
                ? Number(
                    measureHips.value
                )
                : null,

        thigh:
            measureThigh.value
                ? Number(
                    measureThigh.value
                )
                : null,

        arm:
            measureArm.value
                ? Number(
                    measureArm.value
                )
                : null,

        shoulders:
            measureShoulders.value
                ? Number(
                    measureShoulders.value
                )
                : null

    };

}


function hasAtLeastOneMeasurement(
    measurements
) {

    return Object.values(
        measurements
    ).some(
        value =>
            Number.isFinite(
                value
            ) &&
            value > 0
    );

}


function clearMeasurementInputs() {

    [
        measureChest,
        measureWaist,
        measureNavel,
        measureHips,
        measureThigh,
        measureArm,
        measureShoulders
    ].forEach(
        input => {

            input.value =
                "";

        }
    );

}


function saveMeasurements() {

    const data =
        getProgressData();


    const values =
        getMeasurementValues();


    if (
        !hasAtLeastOneMeasurement(
            values
        )
    ) {

        const originalText =
            saveMeasurementsButton.textContent;


        saveMeasurementsButton.textContent =
            "Ajoute au moins une mesure";


        setTimeout(
            () => {

                saveMeasurementsButton.textContent =
                    originalText;

            },
            1800
        );


        return;

    }


    const date =
        measurementDate.value ||
        localDateKey();


    const entry = {

        date,

        ...values,

        savedAt:
            new Date()
                .toISOString()

    };


    const existingIndex =
        data.measurements.findIndex(
            item =>
                item.date === date
        );


    if (
        existingIndex >= 0
    ) {

        data.measurements[
            existingIndex
        ] = entry;

    } else {

        data.measurements.push(
            entry
        );

    }


    saveProgressData(
        data
    );


    renderAll();


    clearMeasurementInputs();


    measurementDate.value =
        localDateKey();


    const originalText =
        saveMeasurementsButton.textContent;


    saveMeasurementsButton.textContent =
        "✓ Mensurations enregistrées";


    setTimeout(
        () => {

            saveMeasurementsButton.textContent =
                originalText;

        },
        1800
    );

}


/* =========================================
   BOUTON MENSURATIONS
========================================= */

if (saveMeasurementsButton) {

    saveMeasurementsButton.addEventListener(
        "click",
        saveMeasurements
    );

}



/* =========================================
   COURBE DE POIDS — PÉRIODES + SCROLL + TOOLTIP
========================================= */

const WEIGHT_CHART_PERIODS = {
    "7d": {
        days: 7,
        mode: "raw",
        note: "Pesées détaillées des 7 derniers jours."
    },

    "1m": {
        days: 30,
        mode: "raw",
        note: "Pesées détaillées du dernier mois."
    },

    "3m": {
        days: 90,
        mode: "weekly",
        note: "Vue sur 3 mois : une moyenne par semaine."
    },

    "1y": {
        days: 365,
        mode: "monthly",
        note: "Vue sur 1 an : une moyenne par mois."
    },

    "all": {
        days: null,
        mode: "monthly",
        note: "Vue globale : une moyenne par mois."
    }
};


function startOfMonth(date) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
        12,
        0,
        0,
        0
    );

}


function monthLabel(date) {

    return date
        .toLocaleDateString(
            "fr-FR",
            {
                month: "short",
                year: "2-digit"
            }
        )
        .replace(".", "");

}


function monthLongLabel(date) {

    const label =
        date.toLocaleDateString(
            "fr-FR",
            {
                month: "long",
                year: "numeric"
            }
        );

    return label.charAt(0).toUpperCase() +
        label.slice(1);

}


function getChartEntriesForPeriod(
    allEntries,
    periodKey
) {

    const config =
        WEIGHT_CHART_PERIODS[
            periodKey
        ] ||
        WEIGHT_CHART_PERIODS["1m"];


    if (
        allEntries.length === 0 ||
        !config.days
    ) {

        return allEntries;

    }


    const latestDate =
        parseDateKey(
            allEntries[
                allEntries.length - 1
            ].date
        );


    if (!latestDate) {
        return allEntries;
    }


    const firstDate =
        addDays(
            latestDate,
            -(config.days - 1)
        );


    return allEntries.filter(
        entry => {

            const date =
                parseDateKey(
                    entry.date
                );


            return (
                date &&
                date >= firstDate &&
                date <= latestDate
            );

        }
    );

}


function aggregateChartEntries(
    entries,
    mode
) {

    if (
        mode === "raw" ||
        entries.length === 0
    ) {

        return entries.map(
            entry => ({
                date: entry.date,
                weight: Number(entry.weight),

                label:
                    formatDate(
                        entry.date
                    ).slice(
                        0,
                        5
                    ),

                tooltip:
                    `${formatDate(
                        entry.date
                    )} — ${formatWeight(
                        entry.weight
                    )}`
            })
        );

    }


    const groups =
        new Map();


    entries.forEach(
        entry => {

            const date =
                parseDateKey(
                    entry.date
                );


            if (!date) {
                return;
            }


            let groupDate;
            let key;


            if (
                mode === "weekly"
            ) {

                groupDate =
                    getMonday(
                        date
                    );

                key =
                    `w-${localDateKey(
                        groupDate
                    )}`;

            } else {

                groupDate =
                    startOfMonth(
                        date
                    );

                key =
                    `m-${groupDate.getFullYear()}-${String(
                        groupDate.getMonth() + 1
                    ).padStart(
                        2,
                        "0"
                    )}`;

            }


            if (
                !groups.has(
                    key
                )
            ) {

                groups.set(
                    key,
                    {
                        date: groupDate,
                        entries: []
                    }
                );

            }


            groups
                .get(
                    key
                )
                .entries
                .push(
                    entry
                );

        }
    );


    return [...groups.values()]
        .sort(
            (a, b) =>
                a.date - b.date
        )
        .map(
            group => {

                const average =
                    averageWeightEntries(
                        group.entries
                    );


                if (
                    mode === "weekly"
                ) {

                    return {
                        date:
                            localDateKey(
                                group.date
                            ),

                        weight:
                            average,

                        label:
                            `Sem. ${String(
                                group.date.getDate()
                            ).padStart(
                                2,
                                "0"
                            )}/${String(
                                group.date.getMonth() + 1
                            ).padStart(
                                2,
                                "0"
                            )}`,

                        tooltip:
                            `Semaine du ${formatDate(
                                localDateKey(
                                    group.date
                                )
                            )} — moyenne ${formatWeight(
                                average
                            )}`
                    };

                }


                return {
                    date:
                        localDateKey(
                            group.date
                        ),

                    weight:
                        average,

                    label:
                        monthLabel(
                            group.date
                        ),

                    tooltip:
                        `${monthLongLabel(
                            group.date
                        )} — moyenne ${formatWeight(
                            average
                        )}`
                };

            }
        )
        .filter(
            entry =>
                Number.isFinite(
                    Number(
                        entry.weight
                    )
                )
        );

}


function hideWeightChartTooltip() {

    const tooltip =
        document.getElementById(
            "weightChartTooltip"
        );


    if (!tooltip) {
        return;
    }


    tooltip.classList.remove(
        "visible"
    );


    document
        .querySelectorAll(
            ".chart-point.active"
        )
        .forEach(
            point =>
                point.classList.remove(
                    "active"
                )
        );

}


function showWeightChartTooltip(
    pointElement,
    text
) {

    const viewport =
        document.getElementById(
            "weightChartViewport"
        );

    const tooltip =
        document.getElementById(
            "weightChartTooltip"
        );


    if (
        !viewport ||
        !tooltip ||
        !pointElement
    ) {

        return;

    }


    hideWeightChartTooltip();

    pointElement.classList.add(
        "active"
    );

    tooltip.textContent =
        text;


    const viewportRect =
        viewport.getBoundingClientRect();

    const pointRect =
        pointElement.getBoundingClientRect();


    const rawLeft =
        pointRect.left -
        viewportRect.left +
        pointRect.width / 2;


    const rawTop =
        pointRect.top -
        viewportRect.top -
        7;


    const safeLeft =
        clamp(
            rawLeft,
            88,
            Math.max(
                88,
                viewport.clientWidth - 88
            )
        );


    tooltip.style.left =
        `${safeLeft}px`;

    tooltip.style.top =
        `${Math.max(
            46,
            rawTop
        )}px`;

    tooltip.classList.add(
        "visible"
    );

}


function bindWeightChartInteractions() {

    const toolbar =
        document.getElementById(
            "weightChartToolbar"
        );

    const viewport =
        document.getElementById(
            "weightChartViewport"
        );


    if (toolbar) {

        toolbar
            .querySelectorAll(
                "[data-chart-period]"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.chartPeriod ===
                            weightChartPeriod
                    );


                    button.onclick =
                        () => {

                            const nextPeriod =
                                button.dataset.chartPeriod;


                            if (
                                !WEIGHT_CHART_PERIODS[
                                    nextPeriod
                                ]
                            ) {

                                return;

                            }


                            weightChartPeriod =
                                nextPeriod;

                            renderWeightChart();

                        };

                }
            );

    }


    document
        .querySelectorAll(
            ".chart-point"
        )
        .forEach(
            point => {

                const show =
                    event => {

                        event.preventDefault();

                        showWeightChartTooltip(
                            point,
                            point.dataset.tooltip ||
                                ""
                        );

                    };


                point.addEventListener(
                    "click",
                    show
                );

                point.addEventListener(
                    "pointerdown",
                    show
                );

                point.addEventListener(
                    "focus",
                    () =>
                        showWeightChartTooltip(
                            point,
                            point.dataset.tooltip ||
                                ""
                        )
                );

                point.addEventListener(
                    "blur",
                    hideWeightChartTooltip
                );

            }
        );


    if (viewport) {

        viewport.onscroll =
            hideWeightChartTooltip;

    }

}


function renderWeightChart() {

    const container =
        document.getElementById(
            "weightChart"
        );

    const viewport =
        document.getElementById(
            "weightChartViewport"
        );

    const note =
        document.getElementById(
            "weightChartPeriodNote"
        );


    if (!container) {
        return;
    }


    const config =
        WEIGHT_CHART_PERIODS[
            weightChartPeriod
        ] ||
        WEIGHT_CHART_PERIODS["1m"];


    if (note) {

        note.textContent =
            config.note;

    }


    const data =
        getProgressData();


    const allEntries =
        [...data.weights]
            .filter(
                entry =>
                    entry.date &&
                    parseDateKey(
                        entry.date
                    ) &&
                    Number.isFinite(
                        Number(
                            entry.weight
                        )
                    )
            )
            .map(
                entry => ({
                    ...entry,
                    weight:
                        Number(
                            entry.weight
                        )
                })
            )
            .sort(
                (a, b) =>
                    String(
                        a.date
                    )
                        .localeCompare(
                            String(
                                b.date
                            )
                        )
            );


    const periodEntries =
        getChartEntriesForPeriod(
            allEntries,
            weightChartPeriod
        );


    const entries =
        aggregateChartEntries(
            periodEntries,
            config.mode
        );


    if (
        entries.length === 0
    ) {

        container.innerHTML = `

            <div class="chart-empty">
                Aucune pesée disponible pour cette période.
            </div>

        `;

        bindWeightChartInteractions();
        return;

    }


    const spacing =
        config.mode === "raw"
            ? 72
            : config.mode === "weekly"
                ? 92
                : 106;


    const height =
        260;


    const padding = {
        top: 28,
        right: 42,
        bottom: 48,
        left: 56
    };


    const width =
        Math.max(
            690,
            padding.left +
            padding.right +
            Math.max(
                1,
                entries.length - 1
            ) *
            spacing
        );


    const values =
        entries.map(
            entry =>
                Number(
                    entry.weight
                )
        );


    let minWeight =
        Math.min(
            ...values,
            Number(
                data.goalWeight
            )
        );


    let maxWeight =
        Math.max(
            ...values,
            Number(
                data.startWeight
            )
        );


    minWeight =
        Math.floor(
            (
                minWeight -
                0.8
            ) *
            2
        ) /
        2;


    maxWeight =
        Math.ceil(
            (
                maxWeight +
                0.8
            ) *
            2
        ) /
        2;


    if (
        maxWeight === minWeight
    ) {

        maxWeight += 1;
        minWeight -= 1;

    }


    const innerWidth =
        width -
        padding.left -
        padding.right;


    const innerHeight =
        height -
        padding.top -
        padding.bottom;


    function xPosition(index) {

        if (
            entries.length === 1
        ) {

            return (
                padding.left +
                innerWidth / 2
            );

        }


        return (
            padding.left +
            index *
            spacing
        );

    }


    function yPosition(weight) {

        return (
            padding.top +
            (
                (
                    maxWeight -
                    weight
                ) /
                (
                    maxWeight -
                    minWeight
                )
            ) *
            innerHeight
        );

    }


    const points =
        entries.map(
            (entry, index) => ({
                x:
                    xPosition(
                        index
                    ),

                y:
                    yPosition(
                        Number(
                            entry.weight
                        )
                    ),

                weight:
                    Number(
                        entry.weight
                    ),

                date:
                    entry.date,

                label:
                    entry.label,

                tooltip:
                    entry.tooltip
            })
        );


    const polyline =
        points
            .map(
                point =>
                    `${point.x},${point.y}`
            )
            .join(
                " "
            );


    const gridSteps =
        4;

    const gridLines =
        [];


    for (
        let index = 0;
        index <= gridSteps;
        index++
    ) {

        const ratio =
            index /
            gridSteps;


        const value =
            maxWeight -
            (
                maxWeight -
                minWeight
            ) *
            ratio;


        const y =
            padding.top +
            innerHeight *
            ratio;


        gridLines.push(`

            <line
                x1="${padding.left}"
                y1="${y}"
                x2="${width - padding.right}"
                y2="${y}"
                stroke="#dbeafe"
                stroke-width="1"
            />

            <text
                x="${padding.left - 10}"
                y="${y + 4}"
                text-anchor="end"
                font-size="11"
                fill="#64748b"
            >
                ${formatNumber(
                    value
                )}
            </text>

        `);

    }


    const pointElements =
        points
            .map(
                point => `

                    <g
                        class="chart-point"
                        tabindex="0"
                        role="button"
                        aria-label="${point.tooltip}"
                        data-tooltip="${point.tooltip}"
                    >

                        <circle
                            cx="${point.x}"
                            cy="${point.y}"
                            r="5"
                            fill="#2563eb"
                            stroke="#ffffff"
                            stroke-width="3"
                        />

                        <circle
                            cx="${point.x}"
                            cy="${point.y}"
                            r="15"
                            fill="transparent"
                        />

                        <text
                            x="${point.x}"
                            y="${height - 15}"
                            text-anchor="middle"
                            font-size="10"
                            fill="#64748b"
                            pointer-events="none"
                        >
                            ${point.label}
                        </text>

                    </g>

                `
            )
            .join(
                ""
            );


    const goalY =
        yPosition(
            Number(
                data.goalWeight
            )
        );


    const lineMarkup =
        points.length > 1
            ? `

                <polyline
                    points="${polyline}"
                    fill="none"
                    stroke="#2563eb"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />

            `
            : "";


    container.innerHTML = `

        <svg
            viewBox="0 0 ${width} ${height}"
            width="${width}"
            height="${height}"
            role="img"
            aria-label="Courbe d'évolution du poids"
        >

            ${gridLines.join("")}

            <line
                x1="${padding.left}"
                y1="${goalY}"
                x2="${width - padding.right}"
                y2="${goalY}"
                stroke="#16a34a"
                stroke-width="1.8"
                stroke-dasharray="7 6"
                opacity=".9"
            />

            <text
                x="${width - padding.right}"
                y="${goalY - 8}"
                text-anchor="end"
                font-size="11"
                font-weight="800"
                fill="#16a34a"
            >
                Objectif ${formatNumber(
                    data.goalWeight
                )} kg
            </text>

            ${lineMarkup}

            ${pointElements}

        </svg>

    `;


    bindWeightChartInteractions();


    if (viewport) {

        requestAnimationFrame(
            () => {

                viewport.scrollLeft =
                    Math.max(
                        0,
                        viewport.scrollWidth -
                        viewport.clientWidth
                    );

            }
        );

    }

}


/* =========================================
   HISTORIQUE DES MENSURATIONS
========================================= */

const measurementLabels = {

    chest:
        "Poitrine",

    waist:
        "Taille",

    navel:
        "Nombril",

    hips:
        "Hanches",

    thigh:
        "Cuisse",

    arm:
        "Bras",

    shoulders:
        "Épaules"

};


function getSortedMeasurements() {

    const data =
        getProgressData();


    return [...data.measurements]
        .sort(
            (a, b) =>
                String(b.date)
                    .localeCompare(
                        String(a.date)
                    )
        );

}


function renderLatestMeasurements() {

    const container =
        document.getElementById(
            "latestMeasurements"
        );


    if (!container) {
        return;
    }


    const entries =
        getSortedMeasurements();


    container.innerHTML =
        "";


    if (
        entries.length === 0
    ) {

        return;

    }


    const latest =
        entries[0];


    const preferredKeys = [
        "waist",
        "hips",
        "thigh",
        "arm"
    ];


    preferredKeys.forEach(
        key => {

            const value =
                Number(
                    latest[key]
                );


            if (
                !Number.isFinite(value) ||
                value <= 0
            ) {

                return;

            }


            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "measurement-summary-item";


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                measurementLabels[key];


            const strong =
                document.createElement(
                    "strong"
                );


            strong.textContent =
                `${formatNumber(value)} cm`;


            item.appendChild(
                label
            );


            item.appendChild(
                strong
            );


            container.appendChild(
                item
            );

        }
    );

}


function deleteMeasurementEntry(
    date
) {

    const data =
        getProgressData();


    data.measurements =
        data.measurements.filter(
            entry =>
                entry.date !== date
        );


    saveProgressData(
        data
    );


    renderAll();

}


function renderMeasurementHistory() {

    const container =
        document.getElementById(
            "measurementHistory"
        );


    if (!container) {
        return;
    }


    const entries =
        getSortedMeasurements();


    container.innerHTML =
        "";


    if (
        entries.length === 0
    ) {

        container.innerHTML = `

            <p class="empty-message">
                Aucune mensuration enregistrée.
            </p>

        `;

        return;

    }


    entries.forEach(
        entry => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "measurement-entry";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "measurement-entry-header";


            const titleBlock =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                "Mensurations";


            const date =
                document.createElement(
                    "span"
                );


            date.textContent =
                formatDate(
                    entry.date
                );


            titleBlock.appendChild(
                title
            );


            titleBlock.appendChild(
                document.createElement(
                    "br"
                )
            );


            titleBlock.appendChild(
                date
            );


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "measurement-entry-actions";


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "delete-measurement";


            deleteButton.textContent =
                "×";


            deleteButton.title =
                "Supprimer ces mensurations";


            deleteButton.setAttribute(
                "aria-label",
                "Supprimer ces mensurations"
            );


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteMeasurementEntry(
                        entry.date
                    );

                }
            );


            actions.appendChild(
                deleteButton
            );


            header.appendChild(
                titleBlock
            );


            header.appendChild(
                actions
            );


            const values =
                document.createElement(
                    "div"
                );


            values.className =
                "measurement-values";


            Object.entries(
                measurementLabels
            ).forEach(
                ([key, label]) => {

                    const numericValue =
                        Number(
                            entry[key]
                        );


                    if (
                        !Number.isFinite(
                            numericValue
                        ) ||
                        numericValue <= 0
                    ) {

                        return;

                    }


                    const chip =
                        document.createElement(
                            "span"
                        );


                    chip.className =
                        "measurement-chip";


                    chip.textContent =
                        `${label} · ${formatNumber(
                            numericValue
                        )} cm`;


                    values.appendChild(
                        chip
                    );

                }
            );


            card.appendChild(
                header
            );


            card.appendChild(
                values
            );


            container.appendChild(
                card
            );

        }
    );

}



/* =========================================
   PHOTOS DE PROGRESSION — INDEXEDDB
   Les images restent dans le stockage local
   du navigateur et ne sont pas envoyées à GitHub.
========================================= */

const PHOTO_DB_NAME =
    "hanaFitPrivate";

const PHOTO_DB_VERSION =
    1;

const PHOTO_STORE_NAME =
    "progressPhotos";


function openPhotoDatabase() {

    return new Promise(
        (resolve, reject) => {

            if (
                !("indexedDB" in window)
            ) {

                reject(
                    new Error(
                        "IndexedDB n'est pas disponible sur cet appareil."
                    )
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

                        const store =
                            db.createObjectStore(
                                PHOTO_STORE_NAME,
                                {
                                    keyPath: "id",
                                    autoIncrement: true
                                }
                            );


                        store.createIndex(
                            "date",
                            "date",
                            {
                                unique: false
                            }
                        );


                        store.createIndex(
                            "pose",
                            "pose",
                            {
                                unique: false
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
                        request.error ||
                        new Error(
                            "Impossible d'ouvrir le stockage privé des photos."
                        )
                    );

                };

        }
    );

}


/* =========================================
   LECTURE DES PHOTOS
========================================= */

async function getAllProgressPhotos() {

    const db =
        await openPhotoDatabase();


    return new Promise(
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

                    const items =
                        Array.isArray(
                            request.result
                        )
                            ? request.result
                            : [];


                    resolve(
                        items.sort(
                            (a, b) => {

                                const dateCompare =
                                    String(
                                        b.date || ""
                                    )
                                        .localeCompare(
                                            String(
                                                a.date || ""
                                            )
                                        );


                                if (
                                    dateCompare !== 0
                                ) {

                                    return dateCompare;

                                }


                                return (
                                    Number(
                                        b.id || 0
                                    ) -
                                    Number(
                                        a.id || 0
                                    )
                                );

                            }
                        )
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error ||
                        new Error(
                            "Impossible de lire les photos."
                        )
                    );

                };


            transaction.oncomplete =
                () => {

                    db.close();

                };

        }
    );

}


/* =========================================
   AJOUT D'UNE PHOTO
========================================= */

async function addProgressPhoto(
    photo
) {

    const db =
        await openPhotoDatabase();


    return new Promise(
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


            const request =
                store.add(
                    photo
                );


            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                () => {

                    reject(
                        request.error ||
                        new Error(
                            "Impossible d'enregistrer la photo."
                        )
                    );

                };


            transaction.oncomplete =
                () => {

                    db.close();

                };

        }
    );

}


/* =========================================
   SUPPRESSION D'UNE PHOTO
========================================= */

async function deleteProgressPhoto(
    id
) {

    const db =
        await openPhotoDatabase();


    return new Promise(
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


            const request =
                store.delete(
                    Number(id)
                );


            request.onsuccess =
                () => {

                    resolve();

                };


            request.onerror =
                () => {

                    reject(
                        request.error ||
                        new Error(
                            "Impossible de supprimer la photo."
                        )
                    );

                };


            transaction.oncomplete =
                () => {

                    db.close();

                };

        }
    );

}


/* =========================================
   COMPRESSION DE L'IMAGE
========================================= */

function loadImageFromFile(
    file
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            resolve(
                                image
                            );

                        };


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Impossible de lire cette image."
                                )
                            );

                        };


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Impossible de lire ce fichier."
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


async function compressProgressPhoto(
    file
) {

    const image =
        await loadImageFromFile(
            file
        );


    const maxDimension =
        1600;


    let width =
        image.naturalWidth ||
        image.width;


    let height =
        image.naturalHeight ||
        image.height;


    if (
        width > maxDimension ||
        height > maxDimension
    ) {

        const ratio =
            Math.min(
                maxDimension / width,
                maxDimension / height
            );


        width =
            Math.round(
                width * ratio
            );


        height =
            Math.round(
                height * ratio
            );

    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        width;


    canvas.height =
        height;


    const context =
        canvas.getContext(
            "2d"
        );


    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );


    return new Promise(
        (resolve, reject) => {

            canvas.toBlob(
                blob => {

                    if (!blob) {

                        reject(
                            new Error(
                                "Impossible de préparer la photo."
                            )
                        );

                        return;

                    }


                    resolve(
                        blob
                    );

                },
                "image/jpeg",
                0.82
            );

        }
    );

}


/* =========================================
   AFFICHAGE GALERIE
========================================= */

function createPhotoCard(
    photo
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "progress-photo-card";


    const image =
        document.createElement(
            "img"
        );


    const objectUrl =
        URL.createObjectURL(
            photo.blob
        );


    image.src =
        objectUrl;


    image.alt =
        `Photo de progression ${photo.pose || ""} du ${formatDate(
            photo.date
        )}`;


    image.loading =
        "lazy";


    image.addEventListener(
        "load",
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        },
        {
            once: true
        }
    );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-photo";


    deleteButton.textContent =
        "×";


    deleteButton.title =
        "Supprimer cette photo";


    deleteButton.setAttribute(
        "aria-label",
        "Supprimer cette photo"
    );


    deleteButton.addEventListener(
        "click",
        async () => {

            try {

                deleteButton.disabled =
                    true;


                await deleteProgressPhoto(
                    photo.id
                );


                await renderPhotoGallery();

                await refreshPhotoComparison();


            } catch (error) {

                console.error(
                    "Erreur suppression photo :",
                    error
                );


                deleteButton.disabled =
                    false;

            }

        }
    );


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "progress-photo-info";


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        photo.pose ||
        "Photo";


    const date =
        document.createElement(
            "span"
        );


    date.textContent =
        formatDate(
            photo.date
        );


    info.appendChild(
        title
    );


    info.appendChild(
        date
    );


    card.appendChild(
        image
    );


    card.appendChild(
        deleteButton
    );


    card.appendChild(
        info
    );


    return card;

}


async function renderPhotoGallery() {

    const gallery =
        document.getElementById(
            "photoGallery"
        );


    if (!gallery) {
        return;
    }


    gallery.innerHTML = `

        <p class="photo-empty">
            Chargement des photos…
        </p>

    `;


    try {

        const photos =
            await getAllProgressPhotos();


        gallery.innerHTML =
            "";


        if (
            photos.length === 0
        ) {

            gallery.innerHTML = `

                <p class="photo-empty">
                    Aucune photo de progression enregistrée.
                </p>

            `;

            return;

        }


        photos.forEach(
            photo => {

                gallery.appendChild(
                    createPhotoCard(
                        photo
                    )
                );

            }
        );


    } catch (error) {

        console.error(
            "Erreur galerie photos :",
            error
        );


        gallery.innerHTML = `

            <p class="photo-empty">
                Impossible d'accéder au stockage privé des photos sur cet appareil.
            </p>

        `;

    }

}


/* =========================================
   ENREGISTRER UNE PHOTO
========================================= */

async function saveSelectedProgressPhoto() {

    const photoInput =
        document.getElementById(
            "photoInput"
        );


    const photoDate =
        document.getElementById(
            "photoDate"
        );


    const photoPose =
        document.getElementById(
            "photoPose"
        );


    const saveButton =
        document.getElementById(
            "savePhotoButton"
        );


    if (
        !photoInput ||
        !photoDate ||
        !photoPose ||
        !saveButton
    ) {

        return;

    }


    const file =
        photoInput.files?.[0];


    if (!file) {

        const originalText =
            saveButton.textContent;


        saveButton.textContent =
            "Choisis une photo";


        setTimeout(
            () => {

                saveButton.textContent =
                    originalText;

            },
            1600
        );


        return;

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        const originalText =
            saveButton.textContent;


        saveButton.textContent =
            "Fichier image uniquement";


        setTimeout(
            () => {

                saveButton.textContent =
                    originalText;

            },
            1800
        );


        return;

    }


    try {

        const originalText =
            saveButton.textContent;


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Préparation…";


        const blob =
            await compressProgressPhoto(
                file
            );


        saveButton.textContent =
            "Enregistrement…";


        await addProgressPhoto({

            date:
                photoDate.value ||
                localDateKey(),

            pose:
                photoPose.value ||
                "Autre",

            blob,

            originalName:
                file.name,

            originalType:
                file.type,

            savedAt:
                new Date()
                    .toISOString()

        });


        photoInput.value =
            "";


        saveButton.textContent =
            "✓ Photo enregistrée";


        await renderPhotoGallery();

        await refreshPhotoComparison();


        setTimeout(
            () => {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    originalText;

            },
            1400
        );


    } catch (error) {

        console.error(
            "Erreur enregistrement photo :",
            error
        );


        saveButton.disabled =
            false;


        saveButton.textContent =
            "Erreur — réessaie";


        setTimeout(
            () => {

                saveButton.textContent =
                    "＋ Ajouter la photo";

            },
            2000
        );

    }

}


/* =========================================
   INITIALISATION DES PHOTOS
========================================= */

function initProgressPhotos() {

    const photoDate =
        document.getElementById(
            "photoDate"
        );


    const saveButton =
        document.getElementById(
            "savePhotoButton"
        );


    if (
        photoDate &&
        !photoDate.value
    ) {

        photoDate.value =
            localDateKey();

    }


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveSelectedProgressPhoto
        );

    }


    renderPhotoGallery();

}



/* =========================================
   COMPARATIF AVANT / APRÈS
========================================= */

let comparisonPhotosCache = [];


function getComparisonElements() {

    return {

        beforeSelect:
            document.getElementById(
                "compareBeforeSelect"
            ),

        afterSelect:
            document.getElementById(
                "compareAfterSelect"
            ),

        beforePreview:
            document.getElementById(
                "compareBeforePreview"
            ),

        afterPreview:
            document.getElementById(
                "compareAfterPreview"
            ),

        beforeTitle:
            document.getElementById(
                "compareBeforeTitle"
            ),

        afterTitle:
            document.getElementById(
                "compareAfterTitle"
            ),

        beforeDate:
            document.getElementById(
                "compareBeforeDate"
            ),

        afterDate:
            document.getElementById(
                "compareAfterDate"
            )

    };

}


function findComparisonPhoto(
    id
) {

    const numericId =
        Number(id);


    return comparisonPhotosCache.find(
        photo =>
            Number(photo.id) ===
            numericId
    ) || null;

}


function createComparisonOption(
    photo
) {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        String(
            photo.id
        );


    option.textContent =
        `${formatDate(
            photo.date
        )} · ${photo.pose || "Photo"}`;


    return option;

}


function fillComparisonSelect(
    select,
    photos,
    previousValue
) {

    if (!select) {
        return;
    }


    select.innerHTML =
        "";


    const placeholder =
        document.createElement(
            "option"
        );


    placeholder.value =
        "";


    placeholder.textContent =
        photos.length === 0
            ? "Aucune photo disponible"
            : "Choisir une photo";


    select.appendChild(
        placeholder
    );


    photos.forEach(
        photo => {

            select.appendChild(
                createComparisonOption(
                    photo
                )
            );

        }
    );


    const stillExists =
        photos.some(
            photo =>
                String(photo.id) ===
                String(previousValue)
        );


    select.value =
        stillExists
            ? String(previousValue)
            : "";

}


function clearComparisonPreview(
    side
) {

    const elements =
        getComparisonElements();


    const preview =
        side === "before"
            ? elements.beforePreview
            : elements.afterPreview;


    const title =
        side === "before"
            ? elements.beforeTitle
            : elements.afterTitle;


    const date =
        side === "before"
            ? elements.beforeDate
            : elements.afterDate;


    if (preview) {

        preview.className =
            "comparison-placeholder";


        preview.innerHTML =
            side === "before"
                ? "Sélectionne ta photo « avant »."
                : "Sélectionne ta photo « après ».";

    }


    if (title) {

        title.textContent =
            side === "before"
                ? "Avant"
                : "Après";

    }


    if (date) {

        date.textContent =
            "—";

    }

}


function renderComparisonPreview(
    side,
    photoId
) {

    const photo =
        findComparisonPhoto(
            photoId
        );


    if (!photo) {

        clearComparisonPreview(
            side
        );

        return;

    }


    const elements =
        getComparisonElements();


    const preview =
        side === "before"
            ? elements.beforePreview
            : elements.afterPreview;


    const title =
        side === "before"
            ? elements.beforeTitle
            : elements.afterTitle;


    const date =
        side === "before"
            ? elements.beforeDate
            : elements.afterDate;


    if (!preview) {
        return;
    }


    preview.className =
        "";


    preview.innerHTML =
        "";


    const image =
        document.createElement(
            "img"
        );


    const objectUrl =
        URL.createObjectURL(
            photo.blob
        );


    image.src =
        objectUrl;


    image.alt =
        `${side === "before" ? "Photo avant" : "Photo après"} · ${photo.pose || "progression"} · ${formatDate(
            photo.date
        )}`;


    image.style.display =
        "block";


    image.style.width =
        "100%";


    image.style.aspectRatio =
        "3 / 4";


    image.style.objectFit =
        "cover";


    image.addEventListener(
        "load",
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        },
        {
            once: true
        }
    );


    preview.appendChild(
        image
    );


    if (title) {

        title.textContent =
            `${side === "before" ? "Avant" : "Après"} · ${photo.pose || "Photo"}`;

    }


    if (date) {

        date.textContent =
            formatDate(
                photo.date
            );

    }

}


async function refreshPhotoComparison() {

    const elements =
        getComparisonElements();


    if (
        !elements.beforeSelect ||
        !elements.afterSelect
    ) {

        return;

    }


    const previousBefore =
        elements.beforeSelect.value;


    const previousAfter =
        elements.afterSelect.value;


    try {

        /*
         * getAllProgressPhotos renvoie les photos
         * de la plus récente à la plus ancienne.
         */

        const photos =
            await getAllProgressPhotos();


        comparisonPhotosCache =
            photos;


        /*
         * Pour la liste "avant", on affiche
         * naturellement les plus anciennes en premier.
         */

        const oldestFirst =
            [...photos].reverse();


        fillComparisonSelect(
            elements.beforeSelect,
            oldestFirst,
            previousBefore
        );


        /*
         * Pour la liste "après", les plus récentes
         * restent en premier.
         */

        fillComparisonSelect(
            elements.afterSelect,
            photos,
            previousAfter
        );


        if (
            elements.beforeSelect.value
        ) {

            renderComparisonPreview(
                "before",
                elements.beforeSelect.value
            );

        } else {

            clearComparisonPreview(
                "before"
            );

        }


        if (
            elements.afterSelect.value
        ) {

            renderComparisonPreview(
                "after",
                elements.afterSelect.value
            );

        } else {

            clearComparisonPreview(
                "after"
            );

        }


    } catch (error) {

        console.error(
            "Erreur comparatif photos :",
            error
        );


        comparisonPhotosCache =
            [];


        fillComparisonSelect(
            elements.beforeSelect,
            [],
            ""
        );


        fillComparisonSelect(
            elements.afterSelect,
            [],
            ""
        );


        clearComparisonPreview(
            "before"
        );


        clearComparisonPreview(
            "after"
        );

    }

}


function initPhotoComparison() {

    const elements =
        getComparisonElements();


    if (
        !elements.beforeSelect ||
        !elements.afterSelect
    ) {

        return;

    }


    elements.beforeSelect.addEventListener(
        "change",
        event => {

            renderComparisonPreview(
                "before",
                event.target.value
            );

        }
    );


    elements.afterSelect.addEventListener(
        "change",
        event => {

            renderComparisonPreview(
                "after",
                event.target.value
            );

        }
    );


    refreshPhotoComparison();

}


/* =========================================
   AFFICHAGE GLOBAL
========================================= */

function renderAll() {

    renderJourneyStats();

    renderWeeklyTrend();

    renderWeightHistory();

    renderWeightChart();

    renderLatestMeasurements();

    renderMeasurementHistory();

}


/* =========================================
   INITIALISATION
========================================= */

function initProgressPage() {

    const today =
        localDateKey();


    if (weightDate) {

        weightDate.value =
            today;

    }


    if (measurementDate) {

        measurementDate.value =
            today;

    }


    renderAll();

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initProgressPage();

        initProgressPhotos();

        initPhotoComparison();

    }
);
