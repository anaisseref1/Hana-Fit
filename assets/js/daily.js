/* =========================================
   HANA FIT — SUIVI DU JOUR
   Pas + hydratation + historique
========================================= */

(() => {

    const DAILY_KEY =
        "hanaFitDailyGoals";

    const MAIN_KEY =
        "hanaFitData";

    const SETTINGS_KEY =
        "hanaFitSettings";


    const dateInput =
        document.getElementById(
            "dailyDate"
        );

    const stepsDisplay =
        document.getElementById(
            "stepsDisplay"
        );

    const waterDisplay =
        document.getElementById(
            "waterDisplay"
        );

    const stepsProgress =
        document.getElementById(
            "stepsProgress"
        );

    const waterProgress =
        document.getElementById(
            "waterProgress"
        );

    const stepsInput =
        document.getElementById(
            "stepsInput"
        );

    const waterInput =
        document.getElementById(
            "waterInput"
        );

    const saveMessage =
        document.getElementById(
            "saveMessage"
        );


    /* =========================================
       OUTILS
    ========================================= */

    function localDateKey(
        date = new Date()
    ) {

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


    function parseLocalDate(
        dateString
    ) {

        const parts =
            String(
                dateString
            )
                .split("-")
                .map(Number);


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
            parts[2]
        );

    }


    function formatDate(
        dateString
    ) {

        const date =
            parseLocalDate(
                dateString
            );


        if (!date) {
            return dateString || "";
        }


        return date.toLocaleDateString(
            "fr-FR",
            {
                weekday:
                    "short",
                day:
                    "2-digit",
                month:
                    "2-digit"
            }
        );

    }


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
                ? JSON.parse(
                    raw
                )
                : fallback;

        } catch {

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


    function safeNumber(
        value
    ) {

        const number =
            Number(
                String(
                    value ?? ""
                ).replace(
                    ",",
                    "."
                )
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    function formatWater(
        value
    ) {

        return `${safeNumber(
            value
        )
            .toFixed(
                2
            )
            .replace(
                /0$/,
                ""
            )
            .replace(
                ".",
                ","
            )} L`;

    }


    function formatSteps(
        value
    ) {

        return Math.round(
            safeNumber(
                value
            )
        ).toLocaleString(
            "fr-FR"
        );

    }


    function getGoals() {

        const settings =
            readJson(
                SETTINGS_KEY,
                {}
            );

        const main =
            readJson(
                MAIN_KEY,
                {}
            );


        const steps =
            safeNumber(
                settings?.goals?.steps
            ) ||
            safeNumber(
                main.stepsGoal
            ) ||
            8000;


        const water =
            safeNumber(
                settings?.goals?.water
            ) ||
            safeNumber(
                main.waterGoal
            ) ||
            2.3;


        return {
            steps,
            water
        };

    }


    function readDailyHistory() {

        const value =
            readJson(
                DAILY_KEY,
                {}
            );


        return (
            value &&
            typeof value ===
                "object" &&
            !Array.isArray(
                value
            )
        )
            ? value
            : {};

    }


    function saveDailyHistory(
        history
    ) {

        writeJson(
            DAILY_KEY,
            history
        );

    }


    /* =========================================
       COMPATIBILITÉ AVEC L'ANCIENNE PAGE
    ========================================= */

    function migrateTodayIfNeeded() {

        const today =
            localDateKey();

        const history =
            readDailyHistory();


        if (
            history[
                today
            ]
        ) {

            return;

        }


        const main =
            readJson(
                MAIN_KEY,
                {}
            );


        const hasOldSteps =
            main.stepsToday !==
                undefined;

        const hasOldWater =
            main.waterToday !==
                undefined;


        if (
            !hasOldSteps &&
            !hasOldWater
        ) {

            return;

        }


        history[
            today
        ] = {
            date:
                today,

            steps:
                Math.max(
                    0,
                    safeNumber(
                        main.stepsToday
                    )
                ),

            water:
                Math.max(
                    0,
                    safeNumber(
                        main.waterToday
                    )
                ),

            updatedAt:
                new Date()
                    .toISOString()
        };


        saveDailyHistory(
            history
        );

    }


    function syncTodayToDashboard(
        entry
    ) {

        if (
            entry.date !==
            localDateKey()
        ) {

            return;

        }


        const main =
            readJson(
                MAIN_KEY,
                {}
            );


        main.stepsToday =
            Math.max(
                0,
                safeNumber(
                    entry.steps
                )
            );


        main.waterToday =
            Math.max(
                0,
                safeNumber(
                    entry.water
                )
            );


        writeJson(
            MAIN_KEY,
            main
        );

    }


    /* =========================================
       JOUR SÉLECTIONNÉ
    ========================================= */

    function selectedDate() {

        return (
            dateInput?.value ||
            localDateKey()
        );

    }


    function getSelectedEntry() {

        const date =
            selectedDate();

        const history =
            readDailyHistory();


        return {
            date,

            steps:
                Math.max(
                    0,
                    safeNumber(
                        history[
                            date
                        ]?.steps
                    )
                ),

            water:
                Math.max(
                    0,
                    safeNumber(
                        history[
                            date
                        ]?.water
                    )
                )
        };

    }


    function saveSelectedEntry(
        entry
    ) {

        const history =
            readDailyHistory();


        history[
            entry.date
        ] = {
            date:
                entry.date,

            steps:
                Math.max(
                    0,
                    Math.round(
                        safeNumber(
                            entry.steps
                        )
                    )
                ),

            water:
                Math.max(
                    0,
                    Math.round(
                        safeNumber(
                            entry.water
                        ) *
                        100
                    ) /
                    100
                ),

            updatedAt:
                new Date()
                    .toISOString()
        };


        saveDailyHistory(
            history
        );


        syncTodayToDashboard(
            history[
                entry.date
            ]
        );

    }


    /* =========================================
       AFFICHAGE
    ========================================= */

    function updateGoalLabels(
        goals
    ) {

        const stepsGoalText =
            document.getElementById(
                "stepsGoalText"
            );

        const waterGoalText =
            document.getElementById(
                "waterGoalText"
            );

        const stepsGoalSummary =
            document.getElementById(
                "stepsGoalSummary"
            );

        const waterGoalSummary =
            document.getElementById(
                "waterGoalSummary"
            );


        if (stepsGoalText) {

            stepsGoalText.textContent =
                `Objectif : ${formatSteps(
                    goals.steps
                )} pas`;

        }


        if (waterGoalText) {

            waterGoalText.textContent =
                `Objectif : ${formatWater(
                    goals.water
                )}`;

        }


        if (stepsGoalSummary) {

            stepsGoalSummary.textContent =
                formatSteps(
                    goals.steps
                );

        }


        if (waterGoalSummary) {

            waterGoalSummary.textContent =
                formatWater(
                    goals.water
                );

        }

    }


    function updateDisplay() {

        const entry =
            getSelectedEntry();

        const goals =
            getGoals();


        updateGoalLabels(
            goals
        );


        if (stepsDisplay) {

            stepsDisplay.textContent =
                formatSteps(
                    entry.steps
                );

        }


        if (waterDisplay) {

            waterDisplay.textContent =
                formatWater(
                    entry.water
                );

        }


        if (stepsInput) {

            stepsInput.value =
                entry.steps ||
                "";

        }


        if (waterInput) {

            waterInput.value =
                entry.water ||
                "";

        }


        const stepsPercentage =
            goals.steps > 0
                ? Math.min(
                    100,
                    entry.steps /
                        goals.steps *
                        100
                )
                : 0;


        const waterPercentage =
            goals.water > 0
                ? Math.min(
                    100,
                    entry.water /
                        goals.water *
                        100
                )
                : 0;


        if (stepsProgress) {

            stepsProgress.style.width =
                `${stepsPercentage}%`;

        }


        if (waterProgress) {

            waterProgress.style.width =
                `${waterPercentage}%`;

        }


        renderRemaining(
            entry,
            goals
        );


        renderGoalSummary(
            entry,
            goals
        );

    }


    function renderRemaining(
        entry,
        goals
    ) {

        const stepsRemaining =
            document.getElementById(
                "stepsRemaining"
            );

        const waterRemaining =
            document.getElementById(
                "waterRemaining"
            );


        if (stepsRemaining) {

            const remaining =
                Math.max(
                    0,
                    goals.steps -
                        entry.steps
                );


            stepsRemaining.textContent =
                remaining > 0
                    ? `Encore ${formatSteps(
                        remaining
                    )} pas pour ton objectif`
                    : "🎉 Objectif pas atteint !";

        }


        if (waterRemaining) {

            const remaining =
                Math.max(
                    0,
                    goals.water -
                        entry.water
                );


            waterRemaining.textContent =
                remaining > 0.001
                    ? `Encore ${formatWater(
                        remaining
                    )} pour ton objectif`
                    : "🎉 Objectif hydratation atteint !";

        }

    }


    function renderGoalSummary(
        entry,
        goals
    ) {

        let reached =
            0;


        if (
            goals.steps > 0 &&
            entry.steps >=
                goals.steps
        ) {

            reached++;

        }


        if (
            goals.water > 0 &&
            entry.water >=
                goals.water
        ) {

            reached++;

        }


        const element =
            document.getElementById(
                "goalsReached"
            );


        if (element) {

            element.textContent =
                `${reached} / 2`;

        }

    }


    function showConfirmation() {

        if (!saveMessage) {
            return;
        }


        saveMessage.style.display =
            "block";


        window.clearTimeout(
            showConfirmation.timeout
        );


        showConfirmation.timeout =
            window.setTimeout(
                () => {

                    saveMessage.style.display =
                        "none";

                },
                2500
            );

    }


    /* =========================================
       HISTORIQUE
    ========================================= */

    function renderHistory() {

        const container =
            document.getElementById(
                "dailyHistory"
            );


        if (!container) {
            return;
        }


        const history =
            readDailyHistory();

        const goals =
            getGoals();


        const today =
            parseLocalDate(
                localDateKey()
            );


        const dates = [];


        for (
            let offset = 0;
            offset < 7;
            offset++
        ) {

            const date =
                new Date(
                    today
                );


            date.setDate(
                date.getDate() -
                offset
            );


            const key =
                localDateKey(
                    date
                );


            if (
                history[
                    key
                ]
            ) {

                dates.push(
                    key
                );

            }

        }


        container.innerHTML =
            "";


        if (
            dates.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    Aucun suivi enregistré sur les 7 derniers jours.
                </p>
            `;

            return;

        }


        dates.forEach(
            date => {

                const entry =
                    history[
                        date
                    ];


                let reached =
                    0;


                if (
                    safeNumber(
                        entry.steps
                    ) >=
                    goals.steps
                ) {

                    reached++;

                }


                if (
                    safeNumber(
                        entry.water
                    ) >=
                    goals.water
                ) {

                    reached++;

                }


                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
                    "history-item";


                article.innerHTML = `
                    <div class="history-top">
                        <strong>${formatDate(
                            date
                        )}</strong>

                        <span>${reached} / 2 objectifs</span>
                    </div>

                    <div class="history-values">
                        <div class="history-value">
                            <span>Pas</span>
                            <strong>${formatSteps(
                                entry.steps
                            )}</strong>
                        </div>

                        <div class="history-value">
                            <span>Eau</span>
                            <strong>${formatWater(
                                entry.water
                            )}</strong>
                        </div>
                    </div>
                `;


                article.addEventListener(
                    "click",
                    () => {

                        if (dateInput) {

                            dateInput.value =
                                date;

                        }


                        updateDisplay();


                        window.scrollTo({
                            top:
                                0,
                            behavior:
                                "smooth"
                        });

                    }
                );


                container.appendChild(
                    article
                );

            }
        );

    }


    /* =========================================
       ACTIONS
    ========================================= */

    function saveSteps() {

        const entry =
            getSelectedEntry();


        entry.steps =
            Math.max(
                0,
                Math.round(
                    safeNumber(
                        stepsInput?.value
                    )
                )
            );


        saveSelectedEntry(
            entry
        );


        updateDisplay();

        renderHistory();

        showConfirmation();

    }


    function saveWater() {

        const entry =
            getSelectedEntry();


        entry.water =
            Math.max(
                0,
                Math.round(
                    safeNumber(
                        waterInput?.value
                    ) *
                    100
                ) /
                100
            );


        saveSelectedEntry(
            entry
        );


        updateDisplay();

        renderHistory();

        showConfirmation();

    }


    function addSteps(
        amount
    ) {

        const entry =
            getSelectedEntry();


        entry.steps =
            Math.max(
                0,
                entry.steps +
                    safeNumber(
                        amount
                    )
            );


        saveSelectedEntry(
            entry
        );


        updateDisplay();

        renderHistory();

        showConfirmation();

    }


    function addWater(
        amount
    ) {

        const entry =
            getSelectedEntry();


        entry.water =
            Math.max(
                0,
                Math.round(
                    (
                        entry.water +
                        safeNumber(
                            amount
                        )
                    ) *
                    100
                ) /
                100
            );


        saveSelectedEntry(
            entry
        );


        updateDisplay();

        renderHistory();

        showConfirmation();

    }


    function bindEvents() {

        document
            .getElementById(
                "saveSteps"
            )
            ?.addEventListener(
                "click",
                saveSteps
            );


        document
            .getElementById(
                "saveWater"
            )
            ?.addEventListener(
                "click",
                saveWater
            );


        document
            .querySelectorAll(
                ".step-quick"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            addSteps(
                                button.dataset.steps
                            );

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".water-quick"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            addWater(
                                button.dataset.water
                            );

                        }
                    );

                }
            );


        dateInput
            ?.addEventListener(
                "change",
                updateDisplay
            );


        document
            .getElementById(
                "todayButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (dateInput) {

                        dateInput.value =
                            localDateKey();

                    }


                    updateDisplay();

                }
            );


        stepsInput
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        saveSteps();

                    }

                }
            );


        waterInput
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        saveWater();

                    }

                }
            );

    }


    /* =========================================
       INITIALISATION
    ========================================= */

    function init() {

        migrateTodayIfNeeded();


        if (dateInput) {

            dateInput.value =
                localDateKey();

        }


        bindEvents();

        updateDisplay();

        renderHistory();

    }


    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();