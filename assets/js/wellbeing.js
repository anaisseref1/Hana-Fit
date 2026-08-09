/* =========================================
   HANA FIT — BIEN-ÊTRE
   Journal + tendances + historique
========================================= */

(() => {

    const STORAGE_KEY =
        "hanaFitWellbeing";

    const COMPLETED_KEY =
        "hanaFitWellbeingCompleted";


    const form =
        document.getElementById(
            "wellbeingForm"
        );

    const dateInput =
        document.getElementById(
            "wellbeingDate"
        );

    const bedtime =
        document.getElementById(
            "bedtime"
        );

    const wakeTime =
        document.getElementById(
            "wakeTime"
        );

    const nightAwakenings =
        document.getElementById(
            "nightAwakenings"
        );

    const napTaken =
        document.getElementById(
            "napTaken"
        );

    const napMinutes =
        document.getElementById(
            "napMinutes"
        );

    const napDurationBox =
        document.getElementById(
            "napDurationBox"
        );

    const energy =
        document.getElementById(
            "energy"
        );

    const stress =
        document.getElementById(
            "stress"
        );

    const energyValue =
        document.getElementById(
            "energyValue"
        );

    const stressValue =
        document.getElementById(
            "stressValue"
        );

    const sleepDurationPreview =
        document.getElementById(
            "sleepDurationPreview"
        );

    const notes =
        document.getElementById(
            "dailyNotes"
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

        const [
            year,
            month,
            day
        ] =
            String(
                dateString
            )
                .split("-")
                .map(Number);


        if (
            !year ||
            !month ||
            !day
        ) {

            return null;

        }


        return new Date(
            year,
            month - 1,
            day
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
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }


    function formatShortDate(
        dateString
    ) {

        const date =
            parseLocalDate(
                dateString
            );


        if (!date) {
            return "";
        }


        return date.toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit"
            }
        );

    }


    function safeNumber(
        value
    ) {

        const number =
            Number(
                value
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    function average(
        values
    ) {

        const valid =
            values.filter(
                value =>
                    Number.isFinite(
                        Number(value)
                    )
            )
            .map(Number);


        if (
            valid.length === 0
        ) {

            return 0;

        }


        return (
            valid.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) /
            valid.length
        );

    }


    function readHistory() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );


            const parsed =
                raw
                    ? JSON.parse(raw)
                    : {};


            return (
                parsed &&
                typeof parsed ===
                    "object" &&
                !Array.isArray(
                    parsed
                )
            )
                ? parsed
                : {};

        } catch {

            return {};

        }

    }


    function saveHistory(
        history
    ) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                history
            )
        );

    }


    function getSelectedValue(
        name
    ) {

        const selected =
            document.querySelector(
                `input[name="${name}"]:checked`
            );


        return selected
            ? selected.value
            : "";

    }


    function setSelectedValue(
        name,
        value
    ) {

        document
            .querySelectorAll(
                `input[name="${name}"]`
            )
            .forEach(
                input => {

                    input.checked =
                        input.value ===
                        String(
                            value ?? ""
                        );

                }
            );

    }


    function getSelectedPains() {

        return Array.from(
            document.querySelectorAll(
                ".pain-option input:checked"
            )
        ).map(
            input =>
                input.value
        );

    }


    function setSelectedPains(
        pains
    ) {

        const selected =
            Array.isArray(
                pains
            )
                ? pains
                : [];


        document
            .querySelectorAll(
                ".pain-option input"
            )
            .forEach(
                input => {

                    input.checked =
                        selected.includes(
                            input.value
                        );

                }
            );

    }


    function calculateSleepMinutes(
        bedtimeValue,
        wakeValue
    ) {

        if (
            !bedtimeValue ||
            !wakeValue
        ) {

            return 0;

        }


        const [
            bedHour,
            bedMinute
        ] =
            bedtimeValue
                .split(":")
                .map(Number);


        const [
            wakeHourValue,
            wakeMinuteValue
        ] =
            wakeValue
                .split(":")
                .map(Number);


        if (
            [
                bedHour,
                bedMinute,
                wakeHourValue,
                wakeMinuteValue
            ].some(
                value =>
                    !Number.isFinite(
                        value
                    )
            )
        ) {

            return 0;

        }


        const bedTotal =
            bedHour * 60 +
            bedMinute;


        let wakeTotal =
            wakeHourValue * 60 +
            wakeMinuteValue;


        if (
            wakeTotal <=
            bedTotal
        ) {

            wakeTotal +=
                24 * 60;

        }


        const duration =
            wakeTotal -
            bedTotal;


        /*
         * On évite d'afficher une durée impossible
         * en cas d'erreur de saisie.
         */
        return duration <=
            20 * 60
                ? duration
                : 0;

    }


    function formatMinutes(
        minutes
    ) {

        const value =
            safeNumber(
                minutes
            );


        if (
            value <= 0
        ) {

            return "—";

        }


        const hours =
            Math.floor(
                value / 60
            );


        const mins =
            Math.round(
                value % 60
            );


        if (
            hours === 0
        ) {

            return `${mins} min`;

        }


        return `${hours} h ${String(
            mins
        ).padStart(
            2,
            "0"
        )}`;

    }



    function updateNapState() {

        if (
            !napTaken ||
            !napDurationBox
        ) {

            return;

        }


        napDurationBox.hidden =
            !napTaken.checked;


        if (napMinutes) {

            napMinutes.disabled =
                !napTaken.checked;


            if (
                !napTaken.checked
            ) {

                napMinutes.value =
                    "";

            }

        }

    }


    function updateSleepPreview() {

        if (!sleepDurationPreview) {
            return;
        }


        const minutes =
            calculateSleepMinutes(
                bedtime?.value,
                wakeTime?.value
            );


        sleepDurationPreview.textContent =
            `Durée estimée : ${formatMinutes(
                minutes
            )}`;

    }


    function moodScore(
        mood
    ) {

        const map = {
            "tres-difficile":
                1,
            difficile:
                2,
            neutre:
                3,
            bonne:
                4,
            "tres-bonne":
                5
        };


        return map[mood] || 0;

    }


    function moodLabel(
        mood
    ) {

        const map = {
            "tres-bonne":
                "😄 Très bonne",
            bonne:
                "🙂 Bonne",
            neutre:
                "😐 Neutre",
            difficile:
                "🙁 Difficile",
            "tres-difficile":
                "😢 Très difficile"
        };


        return map[mood] || "—";

    }


    function calculateWellbeingScore(
        entry
    ) {

        const components = [];


        const sleepQuality =
            safeNumber(
                entry.sleepQuality
            );


        if (
            sleepQuality >= 1 &&
            sleepQuality <= 5
        ) {

            components.push(
                sleepQuality /
                    5 *
                    100
            );

        }


        const mood =
            moodScore(
                entry.mood
            );


        if (
            mood > 0
        ) {

            components.push(
                mood /
                    5 *
                    100
            );

        }


        const energyValue =
            safeNumber(
                entry.energy
            );


        if (
            energyValue >= 1 &&
            energyValue <= 10
        ) {

            components.push(
                energyValue /
                    10 *
                    100
            );

        }


        const stressValue =
            safeNumber(
                entry.stress
            );


        if (
            stressValue >= 1 &&
            stressValue <= 10
        ) {

            components.push(
                (
                    11 -
                    stressValue
                ) /
                    10 *
                    100
            );

        }


        if (
            entry.bloating
        ) {

            const bloatingScores = {
                aucun:
                    100,
                leger:
                    70,
                important:
                    35
            };


            if (
                bloatingScores[
                    entry.bloating
                ] !== undefined
            ) {

                components.push(
                    bloatingScores[
                        entry.bloating
                    ]
                );

            }

        }


        if (
            entry.retention
        ) {

            const retentionScores = {
                aucune:
                    100,
                legere:
                    70,
                importante:
                    35
            };


            if (
                retentionScores[
                    entry.retention
                ] !== undefined
            ) {

                components.push(
                    retentionScores[
                        entry.retention
                    ]
                );

            }

        }


        if (
            components.length === 0
        ) {

            return 0;

        }


        return Math.round(
            average(
                components
            )
        );

    }


    function scoreLabel(
        score
    ) {

        if (
            score <= 0
        ) {
            return "—";
        }

        if (
            score >= 80
        ) {
            return `${score} / 100 🌿`;
        }

        if (
            score >= 60
        ) {
            return `${score} / 100 🙂`;
        }

        if (
            score >= 40
        ) {
            return `${score} / 100 😐`;
        }

        return `${score} / 100 🫶`;
    }


    /* =========================================
       FORMULAIRE
    ========================================= */

    function createEntryFromForm() {

        const date =
            dateInput?.value ||
            localDateKey();


        const sleepMinutes =
            calculateSleepMinutes(
                bedtime?.value,
                wakeTime?.value
            );


        const entry = {
            date,

            bedtime:
                bedtime?.value ||
                "",

            wakeTime:
                wakeTime?.value ||
                "",

            sleepMinutes,

            sleepQuality:
                getSelectedValue(
                    "sleepQuality"
                ),

            nightAwakenings:
                safeNumber(
                    nightAwakenings?.value
                ),

            napTaken:
                Boolean(
                    napTaken?.checked
                ),

            napMinutes:
                napTaken?.checked
                    ? safeNumber(
                        napMinutes?.value
                    )
                    : 0,

            mood:
                getSelectedValue(
                    "mood"
                ),

            energy:
                safeNumber(
                    energy?.value
                ),

            stress:
                safeNumber(
                    stress?.value
                ),

            transit:
                getSelectedValue(
                    "transit"
                ),

            bloating:
                getSelectedValue(
                    "bloating"
                ),

            retention:
                getSelectedValue(
                    "retention"
                ),

            spotting:
                getSelectedValue(
                    "spotting"
                ),

            cramps:
                safeNumber(
                    getSelectedValue(
                        "cramps"
                    )
                ),

            pains:
                getSelectedPains(),

            notes:
                notes?.value.trim() ||
                "",

            completed:
                true,

            updatedAt:
                new Date()
                    .toISOString()
        };


        entry.score =
            calculateWellbeingScore(
                entry
            );


        return entry;

    }


    function resetFormForDate(
        date
    ) {

        form?.reset();


        if (dateInput) {

            dateInput.value =
                date;

        }


        if (energy) {

            energy.value =
                5;

        }


        if (stress) {

            stress.value =
                5;

        }


        if (napTaken) {

            napTaken.checked =
                false;

        }


        updateNapState();


        updateRangeLabels();


        updateSleepPreview();

    }


    function fillForm(
        entry
    ) {

        if (!entry) {
            return;
        }


        if (dateInput) {

            dateInput.value =
                entry.date ||
                dateInput.value;

        }


        if (bedtime) {

            bedtime.value =
                entry.bedtime ||
                "";

        }


        if (wakeTime) {

            wakeTime.value =
                entry.wakeTime ||
                "";

        }


        if (nightAwakenings) {

            nightAwakenings.value =
                safeNumber(
                    entry.nightAwakenings
                ) || "";

        }


        if (napTaken) {

            napTaken.checked =
                Boolean(
                    entry.napTaken
                ) ||
                safeNumber(
                    entry.napMinutes
                ) > 0;

        }


        updateNapState();


        if (
            napMinutes &&
            napTaken?.checked
        ) {

            napMinutes.value =
                safeNumber(
                    entry.napMinutes
                ) || "";

        }


        setSelectedValue(
            "sleepQuality",
            entry.sleepQuality
        );


        setSelectedValue(
            "mood",
            entry.mood
        );


        if (energy) {

            energy.value =
                safeNumber(
                    entry.energy
                ) || 5;

        }


        if (stress) {

            stress.value =
                safeNumber(
                    entry.stress
                ) || 5;

        }


        setSelectedValue(
            "transit",
            entry.transit
        );


        setSelectedValue(
            "bloating",
            entry.bloating
        );


        setSelectedValue(
            "retention",
            entry.retention
        );


        setSelectedValue(
            "spotting",
            entry.spotting
        );


        setSelectedValue(
            "cramps",
            entry.cramps
        );


        setSelectedPains(
            entry.pains
        );


        if (notes) {

            notes.value =
                entry.notes ||
                "";

        }


        updateRangeLabels();


        updateSleepPreview();

    }


    function loadSelectedDate() {

        const date =
            dateInput?.value ||
            localDateKey();


        const history =
            readHistory();


        const entry =
            history[date];


        resetFormForDate(
            date
        );


        if (entry) {

            fillForm({
                ...entry,
                date
            });

        }

    }


    function updateRangeLabels() {

        if (
            energy &&
            energyValue
        ) {

            energyValue.textContent =
                `${energy.value} / 10`;

        }


        if (
            stress &&
            stressValue
        ) {

            stressValue.textContent =
                `${stress.value} / 10`;

        }

    }


    function showSavedMessage() {

        if (!saveMessage) {
            return;
        }


        saveMessage.style.display =
            "block";


        window.clearTimeout(
            showSavedMessage.timeout
        );


        showSavedMessage.timeout =
            window.setTimeout(
                () => {

                    saveMessage.style.display =
                        "none";

                },
                3500
            );

    }


    function saveCurrentEntry() {

        const entry =
            createEntryFromForm();


        const history =
            readHistory();


        history[
            entry.date
        ] =
            entry;


        saveHistory(
            history
        );


        if (
            entry.date ===
            localDateKey()
        ) {

            localStorage.setItem(
                COMPLETED_KEY,
                "true"
            );

        }


        showSavedMessage();


        refreshAll();

    }


    /* =========================================
       RÉSUMÉ DU JOUR
    ========================================= */

    function renderTodaySummary() {

        const history =
            readHistory();


        const today =
            history[
                localDateKey()
            ];


        const scoreElement =
            document.getElementById(
                "todayWellbeingScore"
            );


        const sleepElement =
            document.getElementById(
                "todaySleepDuration"
            );


        const energyElement =
            document.getElementById(
                "todayEnergy"
            );


        const stressElement =
            document.getElementById(
                "todayStress"
            );


        if (!today) {

            if (scoreElement) {
                scoreElement.textContent =
                    "—";
            }

            if (sleepElement) {
                sleepElement.textContent =
                    "—";
            }

            if (energyElement) {
                energyElement.textContent =
                    "—";
            }

            if (stressElement) {
                stressElement.textContent =
                    "—";
            }

            return;

        }


        const score =
            safeNumber(
                today.score
            ) ||
            calculateWellbeingScore(
                today
            );


        const sleepMinutes =
            safeNumber(
                today.sleepMinutes
            ) ||
            calculateSleepMinutes(
                today.bedtime,
                today.wakeTime
            );


        if (scoreElement) {

            scoreElement.textContent =
                scoreLabel(
                    score
                );

        }


        if (sleepElement) {

            const nap =
                safeNumber(
                    today.napMinutes
                );


            sleepElement.textContent =
                nap > 0
                    ? `${formatMinutes(
                        sleepMinutes
                    )} + ${formatMinutes(
                        nap
                    )} 💤`
                    : formatMinutes(
                        sleepMinutes
                    );

        }


        if (energyElement) {

            energyElement.textContent =
                safeNumber(
                    today.energy
                ) > 0
                    ? `${today.energy} / 10`
                    : "—";

        }


        if (stressElement) {

            stressElement.textContent =
                safeNumber(
                    today.stress
                ) > 0
                    ? `${today.stress} / 10`
                    : "—";

        }

    }


    /* =========================================
       TENDANCES
    ========================================= */

    function getEntriesForLastDays(
        days
    ) {

        const history =
            readHistory();


        const today =
            parseLocalDate(
                localDateKey()
            );


        const start =
            new Date(
                today
            );


        start.setDate(
            start.getDate() -
            (
                days -
                1
            )
        );


        return Object
            .keys(
                history
            )
            .sort()
            .filter(
                dateKey => {

                    const date =
                        parseLocalDate(
                            dateKey
                        );


                    return (
                        date &&
                        date >= start &&
                        date <= today
                    );

                }
            )
            .map(
                dateKey => ({
                    ...history[
                        dateKey
                    ],
                    date:
                        dateKey
                })
            );

    }


    function renderTrendStats(
        entries,
        days
    ) {

        const title =
            document.getElementById(
                "trendPeriodTitle"
            );


        if (title) {

            title.textContent =
                `${days} derniers jours`;

        }


        const tracked =
            document.getElementById(
                "trendDaysTracked"
            );


        const averageEnergy =
            document.getElementById(
                "trendAverageEnergy"
            );


        const averageStress =
            document.getElementById(
                "trendAverageStress"
            );


        const averageSleep =
            document.getElementById(
                "trendAverageSleep"
            );


        if (tracked) {

            tracked.textContent =
                String(
                    entries.length
                );

        }


        const energies =
            entries
                .map(
                    entry =>
                        safeNumber(
                            entry.energy
                        )
                )
                .filter(
                    value =>
                        value > 0
                );


        const stresses =
            entries
                .map(
                    entry =>
                        safeNumber(
                            entry.stress
                        )
                )
                .filter(
                    value =>
                        value > 0
                );


        const sleeps =
            entries
                .map(
                    entry =>
                        safeNumber(
                            entry.sleepMinutes
                        ) ||
                        calculateSleepMinutes(
                            entry.bedtime,
                            entry.wakeTime
                        )
                )
                .filter(
                    value =>
                        value > 0
                );


        if (averageEnergy) {

            averageEnergy.textContent =
                energies.length
                    ? `${average(
                        energies
                    ).toFixed(
                        1
                    ).replace(
                        ".",
                        ","
                    )} / 10`
                    : "—";

        }


        if (averageStress) {

            averageStress.textContent =
                stresses.length
                    ? `${average(
                        stresses
                    ).toFixed(
                        1
                    ).replace(
                        ".",
                        ","
                    )} / 10`
                    : "—";

        }


        if (averageSleep) {

            averageSleep.textContent =
                sleeps.length
                    ? formatMinutes(
                        average(
                            sleeps
                        )
                    )
                    : "—";

        }

    }


    function renderTrendChart(
        entries
    ) {

        const container =
            document.getElementById(
                "wellbeingTrendChart"
            );


        if (!container) {
            return;
        }


        const points =
            entries
                .map(
                    entry => ({
                        date:
                            entry.date,
                        score:
                            safeNumber(
                                entry.score
                            ) ||
                            calculateWellbeingScore(
                                entry
                            )
                    })
                )
                .filter(
                    point =>
                        point.score > 0
                );


        if (
            points.length < 2
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    La courbe apparaîtra à partir de deux journées avec suffisamment d'informations.
                </p>
            `;

            return;

        }


        const width =
            760;

        const height =
            230;

        const padding = {
            top:
                28,
            right:
                24,
            bottom:
                42,
            left:
                44
        };


        const plotWidth =
            width -
            padding.left -
            padding.right;


        const plotHeight =
            height -
            padding.top -
            padding.bottom;


        const x =
            index =>
                padding.left +
                (
                    index /
                    (
                        points.length -
                        1
                    )
                ) *
                plotWidth;


        const y =
            score =>
                padding.top +
                (
                    (
                        100 -
                        score
                    ) /
                    100
                ) *
                plotHeight;


        const polyline =
            points
                .map(
                    (point, index) =>
                        `${x(index)},${y(
                            point.score
                        )}`
                )
                .join(" ");


        const gridLines =
            [25,50,75,100]
                .map(
                    value => {

                        const lineY =
                            y(
                                value
                            );


                        return `
                            <line
                                x1="${padding.left}"
                                y1="${lineY}"
                                x2="${width - padding.right}"
                                y2="${lineY}"
                                stroke="#e2e8f0"
                                stroke-width="1"
                            />

                            <text
                                x="${padding.left - 8}"
                                y="${lineY + 4}"
                                text-anchor="end"
                                fill="#64748b"
                                font-size="10"
                            >
                                ${value}
                            </text>
                        `;

                    }
                )
                .join("");


        const dots =
            points
                .map(
                    (point, index) => {

                        const px =
                            x(
                                index
                            );


                        const py =
                            y(
                                point.score
                            );


                        const showDate =
                            points.length <= 8 ||
                            index === 0 ||
                            index ===
                                points.length - 1 ||
                            index %
                                Math.ceil(
                                    points.length /
                                    6
                                ) === 0;


                        return `
                            <circle
                                cx="${px}"
                                cy="${py}"
                                r="4.5"
                                fill="#2563eb"
                            />

                            <text
                                x="${px}"
                                y="${py - 10}"
                                text-anchor="middle"
                                fill="#0d47a1"
                                font-size="10"
                                font-weight="800"
                            >
                                ${point.score}
                            </text>

                            ${
                                showDate
                                    ? `
                                        <text
                                            x="${px}"
                                            y="${height - 14}"
                                            text-anchor="middle"
                                            fill="#64748b"
                                            font-size="10"
                                        >
                                            ${formatShortDate(
                                                point.date
                                            )}
                                        </text>
                                    `
                                    : ""
                            }
                        `;

                    }
                )
                .join("");


        container.innerHTML = `
            <svg
                viewBox="0 0 ${width} ${height}"
                preserveAspectRatio="none"
                role="img"
                aria-label="Évolution du repère bien-être"
            >
                ${gridLines}

                <polyline
                    points="${polyline}"
                    fill="none"
                    stroke="#2563eb"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />

                ${dots}
            </svg>
        `;

    }


    /* =========================================
       OBSERVATIONS
    ========================================= */

    function renderInsights(
        entries
    ) {

        const container =
            document.getElementById(
                "wellbeingInsights"
            );


        if (!container) {
            return;
        }


        const insights = [];


        if (
            entries.length < 3
        ) {

            container.innerHTML = `
                <div class="insight-item">
                    <span>🌱</span>
                    <div>
                        Enregistre au moins trois journées pour commencer à faire apparaître des observations.
                    </div>
                </div>
            `;

            return;

        }


        const sleepEntries =
            entries.filter(
                entry =>
                    safeNumber(
                        entry.sleepMinutes
                    ) > 0 ||
                    (
                        entry.bedtime &&
                        entry.wakeTime
                    )
            );


        if (
            sleepEntries.length >= 3
        ) {

            const averageSleep =
                average(
                    sleepEntries.map(
                        entry =>
                            safeNumber(
                                entry.sleepMinutes
                            ) ||
                            calculateSleepMinutes(
                                entry.bedtime,
                                entry.wakeTime
                            )
                    )
                );


            insights.push({
                icon:
                    "😴",
                text:
                    `Sur cette période, ta durée de sommeil enregistrée est en moyenne de ${formatMinutes(
                        averageSleep
                    )}.`
            });

        }


        const energyValues =
            entries
                .map(
                    entry =>
                        safeNumber(
                            entry.energy
                        )
                )
                .filter(
                    value =>
                        value > 0
                );


        if (
            energyValues.length >= 3
        ) {

            insights.push({
                icon:
                    "⚡",
                text:
                    `Ton énergie moyenne est de ${average(
                        energyValues
                    ).toFixed(
                        1
                    ).replace(
                        ".",
                        ","
                    )} / 10 sur les journées renseignées.`
            });

        }


        const transitEntries =
            entries.filter(
                entry =>
                    entry.transit
            );


        if (
            transitEntries.length >= 3
        ) {

            const normalCount =
                transitEntries.filter(
                    entry =>
                        entry.transit ===
                        "normal"
                ).length;


            insights.push({
                icon:
                    "🚽",
                text:
                    `Transit noté « normal » sur ${normalCount} journée${normalCount > 1 ? "s" : ""} sur ${transitEntries.length} renseignée${transitEntries.length > 1 ? "s" : ""}.`
            });

        }


        const comparable =
            entries.filter(
                entry =>
                    safeNumber(
                        entry.sleepQuality
                    ) > 0 &&
                    safeNumber(
                        entry.energy
                    ) > 0
            );


        const betterSleep =
            comparable.filter(
                entry =>
                    safeNumber(
                        entry.sleepQuality
                    ) >= 4
            );


        const lowerSleep =
            comparable.filter(
                entry =>
                    safeNumber(
                        entry.sleepQuality
                    ) <= 3
            );


        if (
            betterSleep.length >= 2 &&
            lowerSleep.length >= 2
        ) {

            const goodEnergy =
                average(
                    betterSleep.map(
                        entry =>
                            safeNumber(
                                entry.energy
                            )
                    )
                );


            const lowerEnergy =
                average(
                    lowerSleep.map(
                        entry =>
                            safeNumber(
                                entry.energy
                            )
                    )
                );


            const difference =
                goodEnergy -
                lowerEnergy;


            if (
                Math.abs(
                    difference
                ) >= 0.7
            ) {

                insights.push({
                    icon:
                        "🔎",
                    text:
                        difference > 0
                            ? `Dans tes données, les journées après un sommeil noté bon/excellent ont environ ${difference.toFixed(
                                1
                            ).replace(
                                ".",
                                ","
                            )} point d'énergie de plus en moyenne. C'est une association dans ton journal, pas une preuve de cause.`
                            : `Dans tes données actuelles, une meilleure qualité de sommeil ne correspond pas encore à une énergie plus élevée. Il faudra davantage de journées pour voir si une tendance se précise.`
                });

            }

        }




        const spottingEntries =
            entries.filter(
                entry =>
                    entry.spotting &&
                    entry.spotting !==
                        "aucun"
            );


        if (
            spottingEntries.length >= 2
        ) {

            const brownCount =
                spottingEntries.filter(
                    entry =>
                        entry.spotting ===
                        "brun"
                ).length;


            insights.push({
                icon:
                    "🌙",
                text:
                    `Tu as noté du spotting sur ${spottingEntries.length} journée${spottingEntries.length > 1 ? "s" : ""} de cette période${brownCount > 0 ? `, dont ${brownCount} avec des pertes brunes` : ""}.`
            });

        }


        if (
            spottingEntries.length >= 2
        ) {

            const spottingWithHeadache =
                spottingEntries.filter(
                    entry =>
                        Array.isArray(
                            entry.pains
                        ) &&
                        entry.pains.includes(
                            "tete"
                        )
                );


            if (
                spottingWithHeadache.length > 0
            ) {

                insights.push({
                    icon:
                        "🔎",
                    text:
                        `Un mal de tête a été noté sur ${spottingWithHeadache.length} des ${spottingEntries.length} journées avec spotting enregistrées. C'est seulement une association dans ton journal, pas une preuve de cause.`
                });

            }

        }


        const napEntries =
            entries.filter(
                entry =>
                    safeNumber(
                        entry.napMinutes
                    ) > 0
            );


        if (
            napEntries.length >= 2
        ) {

            const averageNap =
                average(
                    napEntries.map(
                        entry =>
                            safeNumber(
                                entry.napMinutes
                            )
                    )
                );


            insights.push({
                icon:
                    "💤",
                text:
                    `Tu as enregistré ${napEntries.length} siestes sur cette période, d'une durée moyenne de ${formatMinutes(
                        averageNap
                    )}.`
            });

        }


        if (
            insights.length === 0
        ) {

            insights.push({
                icon:
                    "🌿",
                text:
                    "Tes données commencent à s'accumuler. Continue quelques jours pour faire apparaître des tendances plus parlantes."
            });

        }


        container.innerHTML =
            "";


        insights
            .slice(
                0,
                4
            )
            .forEach(
                insight => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "insight-item";


                    const icon =
                        document.createElement(
                            "span"
                        );


                    icon.textContent =
                        insight.icon;


                    const text =
                        document.createElement(
                            "div"
                        );


                    text.textContent =
                        insight.text;


                    item.appendChild(
                        icon
                    );


                    item.appendChild(
                        text
                    );


                    container.appendChild(
                        item
                    );

                }
            );

    }


    /* =========================================
       HISTORIQUE
    ========================================= */

    function renderHistory() {

        const container =
            document.getElementById(
                "wellbeingHistory"
            );


        if (!container) {
            return;
        }


        const history =
            readHistory();


        const dates =
            Object.keys(
                history
            )
            .sort()
            .reverse()
            .slice(
                0,
                12
            );


        container.innerHTML =
            "";


        if (
            dates.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    Aucun suivi enregistré.
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


                const score =
                    safeNumber(
                        entry.score
                    ) ||
                    calculateWellbeingScore(
                        entry
                    );


                const sleepMinutes =
                    safeNumber(
                        entry.sleepMinutes
                    ) ||
                    calculateSleepMinutes(
                        entry.bedtime,
                        entry.wakeTime
                    );


                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
                    "history-item";


                const info =
                    document.createElement(
                        "div"
                    );


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    `${formatDate(
                        date
                    )} · ${scoreLabel(
                        score
                    )}`;


                const meta =
                    document.createElement(
                        "p"
                    );


                const parts = [];


                if (
                    sleepMinutes > 0
                ) {

                    parts.push(
                        `😴 ${formatMinutes(
                            sleepMinutes
                        )}`
                    );

                }


                const nap =
                    safeNumber(
                        entry.napMinutes
                    );


                if (
                    nap > 0
                ) {

                    parts.push(
                        `💤 sieste ${formatMinutes(
                            nap
                        )}`
                    );

                }


                if (
                    safeNumber(
                        entry.energy
                    ) > 0
                ) {

                    parts.push(
                        `⚡ ${entry.energy}/10`
                    );

                }


                if (
                    safeNumber(
                        entry.stress
                    ) > 0
                ) {

                    parts.push(
                        `🧠 ${entry.stress}/10`
                    );

                }


                if (
                    entry.mood
                ) {

                    parts.push(
                        moodLabel(
                            entry.mood
                        )
                    );

                }


                if (
                    entry.spotting &&
                    entry.spotting !==
                        "aucun"
                ) {

                    parts.push(
                        entry.spotting === "brun"
                            ? "🤎 spotting brun"
                            : "❤️ spotting rouge"
                    );

                }


                meta.textContent =
                    parts.join(
                        " · "
                    ) ||
                    "Suivi enregistré";


                info.appendChild(
                    title
                );


                info.appendChild(
                    meta
                );


                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "history-actions";


                const edit =
                    document.createElement(
                        "button"
                    );


                edit.type =
                    "button";


                edit.className =
                    "edit-entry";


                edit.textContent =
                    "Modifier";


                edit.addEventListener(
                    "click",
                    () => {

                        if (dateInput) {

                            dateInput.value =
                                date;

                        }


                        loadSelectedDate();


                        form?.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                    }
                );


                const remove =
                    document.createElement(
                        "button"
                    );


                remove.type =
                    "button";


                remove.className =
                    "delete-entry";


                remove.textContent =
                    "Supprimer";


                remove.addEventListener(
                    "click",
                    () => {

                        const confirmed =
                            window.confirm(
                                `Supprimer le suivi bien-être du ${formatDate(
                                    date
                                )} ?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        const currentHistory =
                            readHistory();


                        delete currentHistory[
                            date
                        ];


                        saveHistory(
                            currentHistory
                        );


                        if (
                            date ===
                            localDateKey()
                        ) {

                            localStorage.removeItem(
                                COMPLETED_KEY
                            );

                        }


                        if (
                            dateInput?.value ===
                            date
                        ) {

                            resetFormForDate(
                                date
                            );

                        }


                        refreshAll();

                    }
                );


                actions.appendChild(
                    edit
                );


                actions.appendChild(
                    remove
                );


                article.appendChild(
                    info
                );


                article.appendChild(
                    actions
                );


                container.appendChild(
                    article
                );

            }
        );

    }


    /* =========================================
       RAFRAÎCHISSEMENT
    ========================================= */

    function renderTrends() {

        const period =
            safeNumber(
                document.getElementById(
                    "trendPeriod"
                )?.value
            ) || 7;


        const entries =
            getEntriesForLastDays(
                period
            );


        renderTrendStats(
            entries,
            period
        );


        renderTrendChart(
            entries
        );


        renderInsights(
            entries
        );

    }


    function refreshAll() {

        renderTodaySummary();

        renderTrends();

        renderHistory();

    }


    /* =========================================
       ÉVÉNEMENTS
    ========================================= */

    function bindEvents() {

        energy
            ?.addEventListener(
                "input",
                updateRangeLabels
            );


        stress
            ?.addEventListener(
                "input",
                updateRangeLabels
            );


        bedtime
            ?.addEventListener(
                "input",
                updateSleepPreview
            );


        wakeTime
            ?.addEventListener(
                "input",
                updateSleepPreview
            );


        napTaken
            ?.addEventListener(
                "change",
                updateNapState
            );


        dateInput
            ?.addEventListener(
                "change",
                loadSelectedDate
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


                    loadSelectedDate();

                }
            );


        document
            .getElementById(
                "trendPeriod"
            )
            ?.addEventListener(
                "change",
                renderTrends
            );


        form
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    saveCurrentEntry();

                }
            );

    }


    /* =========================================
       INITIALISATION
    ========================================= */

    function init() {

        if (dateInput) {

            dateInput.value =
                localDateKey();

        }


        updateNapState();

        updateRangeLabels();

        updateSleepPreview();

        bindEvents();

        loadSelectedDate();

        refreshAll();

    }


    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();