/* =========================================
   HANA FIT — CARNET D'ENTRAÎNEMENT
========================================= */

(() => {

    const STORAGE_KEY =
        "hanaFitTraining";

    const TEMPLATE_STORAGE_KEY =
        "hanaFitTrainingTemplates";

    let exerciseLibrary = [];

    let activeExercises = [];

    let restTimerTicker = null;

    let audioContext = null;


    /* =========================================
       OUTILS
    ========================================= */

    function localDateKey(date = new Date()) {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        return `${year}-${month}-${day}`;

    }


    function formatDate(dateString) {

        if (!dateString) {
            return "—";
        }


        const parts =
            String(dateString)
                .split("-");


        if (parts.length !== 3) {
            return dateString;
        }


        const [year, month, day] =
            parts;


        return `${day}/${month}/${year}`;

    }


    function normalizeText(value) {

        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ı/g, "i")
            .trim();

    }


    function makeId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {

            return window.crypto.randomUUID();

        }


        return (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2)
        );

    }


    function safeNumber(value) {

        const number =
            Number(
                String(value ?? "")
                    .replace(",", ".")
            );


        return Number.isFinite(number)
            ? number
            : 0;

    }


    function formatNumber(value, decimals = 0) {

        return Number(value || 0)
            .toLocaleString(
                "fr-FR",
                {
                    maximumFractionDigits: decimals
                }
            );

    }



    function getExerciseMode(
        exercise
    ) {

        if (
            exercise?.mode === "cardio"
        ) {

            return "cardio";

        }


        if (
            exercise?.mode === "strength"
        ) {

            return "strength";

        }


        const category =
            normalizeText(
                exercise?.category
            );


        return category === "cardio"
            ? "cardio"
            : "strength";

    }


    function makeEmptyCardio() {

        return {
            duration: "",
            speed: "",
            intensity: "",
            calories: ""
        };

    }


    function normalizeCardio(
        cardio
    ) {

        return {
            duration:
                safeNumber(
                    cardio?.duration
                ),

            speed:
                safeNumber(
                    cardio?.speed
                ),

            intensity:
                safeNumber(
                    cardio?.intensity
                ),

            calories:
                safeNumber(
                    cardio?.calories
                )
        };

    }


    function hasCardioData(
        cardio
    ) {

        const data =
            normalizeCardio(
                cardio
            );


        return (
            data.duration > 0 ||
            data.speed > 0 ||
            data.intensity > 0 ||
            data.calories > 0
        );

    }


    /* =========================================
       STOCKAGE
    ========================================= */

    function loadTrainingHistory() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!raw) {
                return {};
            }


            const parsed =
                JSON.parse(raw);


            return (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            )
                ? parsed
                : {};

        } catch (error) {

            console.error(
                "Erreur lecture entraînement :",
                error
            );


            return {};

        }

    }


    function saveTrainingHistory(history) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(history)
        );

    }


    function getSessionsForDate(date) {

        const history =
            loadTrainingHistory();


        const sessions =
            history[date];


        return Array.isArray(sessions)
            ? sessions
            : [];

    }


    function addSessionToHistory(
        date,
        session
    ) {

        const history =
            loadTrainingHistory();


        if (
            !Array.isArray(
                history[date]
            )
        ) {

            history[date] = [];

        }


        history[date].push(
            session
        );


        saveTrainingHistory(
            history
        );

    }


    function deleteSessionFromHistory(
        date,
        sessionId,
        fallbackIndex = null
    ) {

        const history =
            loadTrainingHistory();


        if (
            !Array.isArray(
                history[date]
            )
        ) {

            return;

        }


        if (sessionId) {

            history[date] =
                history[date].filter(
                    session =>
                        session.id !== sessionId
                );

        } else if (
            fallbackIndex !== null
        ) {

            history[date].splice(
                fallbackIndex,
                1
            );

        }


        if (
            history[date].length === 0
        ) {

            delete history[date];

        }


        saveTrainingHistory(
            history
        );

    }


    /* =========================================
       BIBLIOTHÈQUE D'EXERCICES
    ========================================= */

    async function loadExerciseLibrary() {

        try {

            const response =
                await fetch(
                    "../assets/database/workouts.json"
                );


            if (!response.ok) {

                throw new Error(
                    "Impossible de charger workouts.json"
                );

            }


            const data =
                await response.json();


            exerciseLibrary =
                Array.isArray(data)
                    ? data
                    : [];


        } catch (error) {

            console.error(
                "Erreur bibliothèque exercices :",
                error
            );


            exerciseLibrary = [];

        }


        renderExerciseResults("");

    }


    function searchExercises(query) {

        const normalizedQuery =
            normalizeText(query);


        const results =
            exerciseLibrary.filter(
                exercise => {

                    const haystack =
                        normalizeText(
                            [
                                exercise.name,
                                exercise.category,
                                exercise.equipment,
                                ...(exercise.muscles || []),
                                ...(exercise.aliases || [])
                            ].join(" ")
                        );


                    return (
                        !normalizedQuery ||
                        haystack.includes(
                            normalizedQuery
                        )
                    );

                }
            );


        if (!normalizedQuery) {

            const preferredIds = [
                "hip-thrust",
                "leg-press",
                "rdl",
                "static-lunges",
                "hip-abduction",
                "hip-adduction",
                "leg-extension",
                "plank",
                "elliptical"
            ];


            return results
                .sort(
                    (a, b) => {

                        const indexA =
                            preferredIds.indexOf(
                                a.id
                            );

                        const indexB =
                            preferredIds.indexOf(
                                b.id
                            );


                        const rankA =
                            indexA === -1
                                ? 999
                                : indexA;

                        const rankB =
                            indexB === -1
                                ? 999
                                : indexB;


                        if (rankA !== rankB) {

                            return rankA - rankB;

                        }


                        return a.name.localeCompare(
                            b.name,
                            "fr"
                        );

                    }
                )
                .slice(0, 9);

        }


        return results
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name,
                        "fr"
                    )
            )
            .slice(0, 12);

    }


    function renderExerciseResults(query) {

        const container =
            document.getElementById(
                "exerciseResults"
            );


        if (!container) {
            return;
        }


        const results =
            searchExercises(query);


        container.innerHTML =
            "";


        if (
            exerciseLibrary.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    La bibliothèque d'exercices n'a pas pu être chargée.
                </p>
            `;

            return;

        }


        if (
            results.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    Aucun exercice trouvé. Tu peux ajouter le tien juste en dessous.
                </p>
            `;

            return;

        }


        results.forEach(
            exercise => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "exercise-result";


                const emoji =
                    document.createElement(
                        "span"
                    );


                emoji.className =
                    "exercise-result-emoji";


                emoji.textContent =
                    exercise.emoji || "🏋️";


                const info =
                    document.createElement(
                        "span"
                    );


                info.className =
                    "exercise-result-info";


                const name =
                    document.createElement(
                        "strong"
                    );


                name.textContent =
                    exercise.name;


                const meta =
                    document.createElement(
                        "span"
                    );


                meta.textContent =
                    [
                        exercise.category,
                        exercise.equipment
                    ]
                        .filter(Boolean)
                        .join(" · ");


                info.appendChild(
                    name
                );


                info.appendChild(
                    meta
                );


                const add =
                    document.createElement(
                        "span"
                    );


                add.className =
                    "exercise-result-add";


                add.textContent =
                    "+";


                button.appendChild(
                    emoji
                );


                button.appendChild(
                    info
                );


                button.appendChild(
                    add
                );


                button.addEventListener(
                    "click",
                    () => {

                        addExerciseToActive(
                            exercise
                        );

                    }
                );


                container.appendChild(
                    button
                );

            }
        );

    }



    /* =========================================
       SÉANCES MODÈLES
    ========================================= */

    function loadTrainingTemplates() {

        try {

            const raw =
                localStorage.getItem(
                    TEMPLATE_STORAGE_KEY
                );


            if (!raw) {
                return [];
            }


            const parsed =
                JSON.parse(raw);


            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                "Erreur lecture modèles :",
                error
            );


            return [];

        }

    }


    function saveTrainingTemplates(
        templates
    ) {

        localStorage.setItem(
            TEMPLATE_STORAGE_KEY,
            JSON.stringify(
                templates
            )
        );

    }


    function makeTemplateFromCurrentSession(
        name
    ) {

        const type =
            document.getElementById(
                "sessionType"
            )?.value ||
            "Autre";


        const exercises =
            activeExercises.map(
                exercise => {

                    const mode =
                        getExerciseMode(
                            exercise
                        );


                    return {

                        libraryId:
                            exercise.libraryId,

                        name:
                            exercise.name,

                        emoji:
                            exercise.emoji ||
                            "🏋️",

                        category:
                            exercise.category ||
                            "",

                        equipment:
                            exercise.equipment ||
                            "",

                        custom:
                            Boolean(
                                exercise.custom
                            ),

                        mode,

                        setCount:
                            mode === "strength"
                                ? Math.max(
                                    1,
                                    Array.isArray(
                                        exercise.sets
                                    )
                                        ? exercise.sets.length
                                        : 3
                                )
                                : 0,

                        restSeconds:
                            mode === "strength"
                                ? (
                                    Number(
                                        exercise.restDuration
                                    ) || 90
                                )
                                : 0

                    };

                }
            );


        return {

            id:
                makeId(),

            name,

            type,

            exercises,

            createdAt:
                new Date()
                    .toISOString()

        };

    }


    function saveCurrentSessionAsTemplate() {

        const nameInput =
            document.getElementById(
                "templateName"
            );


        if (!nameInput) {
            return;
        }


        const name =
            nameInput.value.trim();


        if (!name) {

            showSaveMessage(
                "Donne un nom à ta séance modèle.",
                true
            );

            return;

        }


        if (
            activeExercises.length === 0
        ) {

            showSaveMessage(
                "Prépare d'abord les exercices de ta séance avant de l'enregistrer comme modèle.",
                true
            );

            return;

        }


        const templates =
            loadTrainingTemplates();


        const normalizedName =
            normalizeText(
                name
            );


        const existingIndex =
            templates.findIndex(
                template =>
                    normalizeText(
                        template.name
                    ) === normalizedName
            );


        const template =
            makeTemplateFromCurrentSession(
                name
            );


        if (
            existingIndex >= 0
        ) {

            template.id =
                templates[existingIndex].id ||
                template.id;


            template.createdAt =
                templates[existingIndex].createdAt ||
                template.createdAt;


            template.updatedAt =
                new Date()
                    .toISOString();


            templates[existingIndex] =
                template;

        } else {

            templates.push(
                template
            );

        }


        saveTrainingTemplates(
            templates
        );


        nameInput.value =
            "";


        renderTrainingTemplates();


        showSaveMessage(
            existingIndex >= 0
                ? "⭐ Modèle mis à jour."
                : "⭐ Séance enregistrée comme modèle."
        );

    }


    function deleteTrainingTemplate(
        templateId
    ) {

        const templates =
            loadTrainingTemplates()
                .filter(
                    template =>
                        template.id !==
                        templateId
                );


        saveTrainingTemplates(
            templates
        );


        renderTrainingTemplates();

    }


    function startTrainingTemplate(
        template
    ) {

        if (
            !template ||
            !Array.isArray(
                template.exercises
            ) ||
            template.exercises.length === 0
        ) {

            showSaveMessage(
                "Ce modèle ne contient aucun exercice.",
                true
            );

            return;

        }


        if (restTimerTicker) {

            clearInterval(
                restTimerTicker
            );


            restTimerTicker =
                null;

        }


        activeExercises =
            template.exercises.map(
                exercise => {

                    const mode =
                        getExerciseMode(
                            exercise
                        );


                    const setCount =
                        Math.max(
                            1,
                            Number(
                                exercise.setCount
                            ) || 3
                        );


                    const restDuration =
                        Number(
                            exercise.restSeconds
                        ) || 90;


                    return {

                        instanceId:
                            makeId(),

                        libraryId:
                            exercise.libraryId ||
                            `template-${makeId()}`,

                        name:
                            exercise.name ||
                            "Exercice",

                        emoji:
                            exercise.emoji ||
                            "🏋️",

                        category:
                            exercise.category ||
                            "",

                        equipment:
                            exercise.equipment ||
                            "",

                        custom:
                            Boolean(
                                exercise.custom
                            ),

                        mode,

                        restDuration:
                            mode === "strength"
                                ? restDuration
                                : 0,

                        restRemaining:
                            mode === "strength"
                                ? restDuration
                                : 0,

                        restRunning:
                            false,

                        restEndAt:
                            null,

                        sets:
                            mode === "strength"
                                ? Array.from(
                                    {
                                        length:
                                            setCount
                                    },
                                    () =>
                                        makeEmptySet()
                                )
                                : [],

                        cardio:
                            mode === "cardio"
                                ? makeEmptyCardio()
                                : null

                    };

                }
            );


        const dateInput =
            document.getElementById(
                "sessionDate"
            );


        const typeInput =
            document.getElementById(
                "sessionType"
            );


        const durationInput =
            document.getElementById(
                "sessionDuration"
            );


        const notesInput =
            document.getElementById(
                "sessionNotes"
            );


        if (dateInput) {

            dateInput.value =
                localDateKey();

        }


        if (
            typeInput &&
            template.type
        ) {

            const optionExists =
                [...typeInput.options]
                    .some(
                        option =>
                            option.value ===
                            template.type
                    );


            if (optionExists) {

                typeInput.value =
                    template.type;

            }

        }


        if (durationInput) {

            durationInput.value =
                "";

        }


        if (notesInput) {

            notesInput.value =
                "";

        }


        renderActiveExercises();


        showSaveMessage(
            `⭐ Modèle « ${template.name} » chargé. Tes dernières performances restent affichées comme repères.`
        );


        const activeContainer =
            document.getElementById(
                "activeExercises"
            );


        if (activeContainer) {

            activeContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }



    function saveRecordedSessionAsTemplate(
        session
    ) {

        const exercises =
            Array.isArray(
                session?.exercises
            )
                ? session.exercises
                : [];


        if (
            exercises.length === 0
        ) {

            showSaveMessage(
                "Cette séance est trop ancienne pour être enregistrée comme modèle.",
                true
            );

            return;

        }


        const nameInput =
            document.getElementById(
                "templateName"
            );


        const requestedName =
            nameInput?.value.trim() ||
            session.type ||
            "Ma séance";


        const templates =
            loadTrainingTemplates();


        const normalizedName =
            normalizeText(
                requestedName
            );


        const existingIndex =
            templates.findIndex(
                template =>
                    normalizeText(
                        template.name
                    ) === normalizedName
            );


        const templateExercises =
            exercises.map(
                exercise => {

                    const mode =
                        getExerciseMode(
                            exercise
                        );


                    return {

                        libraryId:
                            exercise.libraryId ||
                            `saved-${makeId()}`,

                        name:
                            exercise.name ||
                            "Exercice",

                        emoji:
                            exercise.emoji ||
                            "🏋️",

                        category:
                            exercise.category ||
                            "",

                        equipment:
                            exercise.equipment ||
                            "",

                        custom:
                            Boolean(
                                exercise.custom
                            ),

                        mode,

                        setCount:
                            mode === "strength"
                                ? Math.max(
                                    1,
                                    Array.isArray(
                                        exercise.sets
                                    )
                                        ? exercise.sets.length
                                        : 3
                                )
                                : 0,

                        restSeconds:
                            mode === "strength"
                                ? (
                                    safeNumber(
                                        exercise.restSeconds
                                    ) || 90
                                )
                                : 0

                    };

                }
            );


        const template = {

            id:
                existingIndex >= 0
                    ? (
                        templates[existingIndex].id ||
                        makeId()
                    )
                    : makeId(),

            name:
                requestedName,

            type:
                session.type ||
                "Autre",

            exercises:
                templateExercises,

            createdAt:
                existingIndex >= 0
                    ? (
                        templates[existingIndex].createdAt ||
                        new Date().toISOString()
                    )
                    : new Date().toISOString(),

            updatedAt:
                new Date()
                    .toISOString()

        };


        if (
            existingIndex >= 0
        ) {

            templates[existingIndex] =
                template;

        } else {

            templates.push(
                template
            );

        }


        saveTrainingTemplates(
            templates
        );


        if (nameInput) {

            nameInput.value =
                "";

        }


        renderTrainingTemplates();


        showSaveMessage(
            existingIndex >= 0
                ? `⭐ Modèle « ${requestedName} » mis à jour.`
                : `⭐ Modèle « ${requestedName} » enregistré.`
        );

    }


    function renderTrainingTemplates() {

        const container =
            document.getElementById(
                "templateList"
            );


        if (!container) {
            return;
        }


        const templates =
            loadTrainingTemplates();


        container.innerHTML =
            "";


        if (
            templates.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    Aucun modèle enregistré pour le moment.
                </p>
            `;

            return;

        }


        templates
            .slice()
            .sort(
                (a, b) =>
                    String(a.name)
                        .localeCompare(
                            String(b.name),
                            "fr"
                        )
            )
            .forEach(
                template => {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "template-card";


                    const header =
                        document.createElement(
                            "div"
                        );


                    header.className =
                        "template-card-header";


                    const info =
                        document.createElement(
                            "div"
                        );


                    const title =
                        document.createElement(
                            "h3"
                        );


                    title.textContent =
                        `⭐ ${template.name}`;


                    const meta =
                        document.createElement(
                            "p"
                        );


                    const exerciseCount =
                        Array.isArray(
                            template.exercises
                        )
                            ? template.exercises.length
                            : 0;


                    meta.textContent =
                        `${template.type || "Séance"} · ${exerciseCount} exercice${exerciseCount > 1 ? "s" : ""}`;


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
                        "template-actions";


                    const startButton =
                        document.createElement(
                            "button"
                        );


                    startButton.type =
                        "button";


                    startButton.className =
                        "template-start";


                    startButton.textContent =
                        "▶ Démarrer";


                    startButton.addEventListener(
                        "click",
                        () => {

                            startTrainingTemplate(
                                template
                            );

                        }
                    );


                    const deleteButton =
                        document.createElement(
                            "button"
                        );


                    deleteButton.type =
                        "button";


                    deleteButton.className =
                        "template-delete";


                    deleteButton.textContent =
                        "×";


                    deleteButton.setAttribute(
                        "aria-label",
                        `Supprimer le modèle ${template.name}`
                    );


                    deleteButton.addEventListener(
                        "click",
                        () => {

                            deleteTrainingTemplate(
                                template.id
                            );

                        }
                    );


                    actions.appendChild(
                        startButton
                    );


                    actions.appendChild(
                        deleteButton
                    );


                    header.appendChild(
                        info
                    );


                    header.appendChild(
                        actions
                    );


                    card.appendChild(
                        header
                    );


                    if (
                        Array.isArray(
                            template.exercises
                        ) &&
                        template.exercises.length > 0
                    ) {

                        const chips =
                            document.createElement(
                                "div"
                            );


                        chips.className =
                            "template-exercises";


                        template.exercises
                            .forEach(
                                exercise => {

                                    const chip =
                                        document.createElement(
                                            "span"
                                        );


                                    chip.className =
                                        "template-exercise-chip";


                                    const mode =
                                        getExerciseMode(
                                            exercise
                                        );


                                    chip.textContent =
                                        mode === "cardio"
                                            ? `${exercise.emoji || "❤️"} ${exercise.name} · cardio`
                                            : `${exercise.emoji || "🏋️"} ${exercise.name} · ${exercise.setCount || 3} séries · ${formatRestTime(
                                                exercise.restSeconds || 90
                                            )}`;


                                    chips.appendChild(
                                        chip
                                    );

                                }
                            );


                        card.appendChild(
                            chips
                        );

                    }


                    container.appendChild(
                        card
                    );

                }
            );

    }


    function initTrainingTemplates() {

        const saveButton =
            document.getElementById(
                "saveTemplateButton"
            );


        const nameInput =
            document.getElementById(
                "templateName"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveCurrentSessionAsTemplate
            );

        }


        if (nameInput) {

            nameInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        saveCurrentSessionAsTemplate();

                    }

                }
            );

        }


        renderTrainingTemplates();

    }



    /* =========================================
       SÉANCE EN COURS
    ========================================= */

    function makeEmptySet() {

        return {
            weight: "",
            reps: "",
            rpe: ""
        };

    }


    function addExerciseToActive(
        exercise
    ) {

        const alreadyAdded =
            activeExercises.some(
                item =>
                    item.libraryId === exercise.id
            );


        if (alreadyAdded) {

            const card =
                document.querySelector(
                    `[data-active-exercise-id="${exercise.id}"]`
                );


            if (card) {

                card.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }


            return;

        }


        const mode =
            getExerciseMode(
                exercise
            );


        activeExercises.push({

            instanceId:
                makeId(),

            libraryId:
                exercise.id,

            name:
                exercise.name,

            emoji:
                exercise.emoji || "🏋️",

            category:
                exercise.category || "",

            equipment:
                exercise.equipment || "",

            custom:
                false,

            mode,

            restDuration:
                mode === "strength"
                    ? 90
                    : 0,

            restRemaining:
                mode === "strength"
                    ? 90
                    : 0,

            restRunning:
                false,

            restEndAt:
                null,

            sets:
                mode === "strength"
                    ? [
                        makeEmptySet(),
                        makeEmptySet(),
                        makeEmptySet()
                    ]
                    : [],

            cardio:
                mode === "cardio"
                    ? makeEmptyCardio()
                    : null

        });


        renderActiveExercises();

    }


    function addCustomExercise() {

        const input =
            document.getElementById(
                "customExerciseName"
            );


        const modeSelect =
            document.getElementById(
                "customExerciseMode"
            );


        if (!input) {
            return;
        }


        const name =
            input.value.trim();


        if (!name) {
            return;
        }


        const mode =
            modeSelect?.value === "cardio"
                ? "cardio"
                : "strength";


        activeExercises.push({

            instanceId:
                makeId(),

            libraryId:
                `custom-${makeId()}`,

            name,

            emoji:
                mode === "cardio"
                    ? "❤️"
                    : "✏️",

            category:
                mode === "cardio"
                    ? "Cardio"
                    : "Personnalisé",

            equipment:
                "",

            custom:
                true,

            mode,

            restDuration:
                mode === "strength"
                    ? 90
                    : 0,

            restRemaining:
                mode === "strength"
                    ? 90
                    : 0,

            restRunning:
                false,

            restEndAt:
                null,

            sets:
                mode === "strength"
                    ? [
                        makeEmptySet(),
                        makeEmptySet(),
                        makeEmptySet()
                    ]
                    : [],

            cardio:
                mode === "cardio"
                    ? makeEmptyCardio()
                    : null

        });


        input.value =
            "";


        renderActiveExercises();

    }


    function removeActiveExercise(
        instanceId
    ) {

        activeExercises =
            activeExercises.filter(
                exercise =>
                    exercise.instanceId !==
                    instanceId
            );


        renderActiveExercises();

    }


    function addSetToExercise(
        instanceId
    ) {

        const exercise =
            activeExercises.find(
                item =>
                    item.instanceId ===
                    instanceId
            );


        if (!exercise) {
            return;
        }


        exercise.sets.push(
            makeEmptySet()
        );


        renderActiveExercises();

    }


    function deleteSetFromExercise(
        instanceId,
        setIndex
    ) {

        const exercise =
            activeExercises.find(
                item =>
                    item.instanceId ===
                    instanceId
            );


        if (!exercise) {
            return;
        }


        exercise.sets.splice(
            setIndex,
            1
        );


        if (
            exercise.sets.length === 0
        ) {

            exercise.sets.push(
                makeEmptySet()
            );

        }


        renderActiveExercises();

    }


    function updateActiveSet(
        instanceId,
        setIndex,
        field,
        value
    ) {

        const exercise =
            activeExercises.find(
                item =>
                    item.instanceId ===
                    instanceId
            );


        if (
            !exercise ||
            !exercise.sets[setIndex]
        ) {

            return;

        }


        exercise.sets[setIndex][field] =
            value;

    }


    function getLastExercisePerformance(
        exerciseName
    ) {

        const history =
            loadTrainingHistory();


        const dates =
            Object.keys(history)
                .sort()
                .reverse();


        const target =
            normalizeText(
                exerciseName
            );


        for (
            const date of dates
        ) {

            const sessions =
                Array.isArray(history[date])
                    ? [...history[date]].reverse()
                    : [];


            for (
                const session of sessions
            ) {

                const exercises =
                    Array.isArray(
                        session.exercises
                    )
                        ? session.exercises
                        : [];


                const match =
                    exercises.find(
                        exercise =>
                            normalizeText(
                                exercise.name
                            ) === target
                    );


                if (match) {

                    const mode =
                        getExerciseMode(
                            match
                        );


                    if (
                        mode === "cardio"
                    ) {

                        const cardio =
                            normalizeCardio(
                                match.cardio
                            );


                        const parts = [];


                        if (
                            cardio.duration > 0
                        ) {

                            parts.push(
                                `${formatNumber(cardio.duration)} min`
                            );

                        }


                        if (
                            cardio.speed > 0
                        ) {

                            parts.push(
                                `${formatNumber(cardio.speed, 1)} km/h`
                            );

                        }


                        if (
                            cardio.intensity > 0
                        ) {

                            parts.push(
                                `intensité ${formatNumber(cardio.intensity, 1)}`
                            );

                        }


                        if (
                            cardio.calories > 0
                        ) {

                            parts.push(
                                `${formatNumber(cardio.calories)} kcal`
                            );

                        }


                        return {
                            date,
                            text:
                                parts.join(" · ") ||
                                "cardio enregistré"
                        };

                    }


                    const validSets =
                        (match.sets || [])
                            .filter(
                                set =>
                                    safeNumber(set.reps) > 0 ||
                                    safeNumber(set.weight) > 0
                            );


                    if (
                        validSets.length === 0
                    ) {

                        return {
                            date,
                            text:
                                "exercice enregistré"
                        };

                    }


                    const text =
                        validSets
                            .map(
                                set => {

                                    const weight =
                                        safeNumber(
                                            set.weight
                                        );


                                    const reps =
                                        safeNumber(
                                            set.reps
                                        );


                                    if (
                                        weight > 0 &&
                                        reps > 0
                                    ) {

                                        return `${formatNumber(weight, 1)} kg × ${formatNumber(reps)}`;

                                    }


                                    if (reps > 0) {

                                        return `${formatNumber(reps)} reps`;

                                    }


                                    return `${formatNumber(weight, 1)} kg`;

                                }
                            )
                            .join(" · ");


                    return {
                        date,
                        text
                    };

                }

            }

        }


        return null;

    }


    /* =========================================
       CHRONO DE REPOS PAR EXERCICE
    ========================================= */

    function formatRestTime(
        seconds
    ) {

        const safeSeconds =
            Math.max(
                0,
                Math.ceil(
                    Number(seconds) || 0
                )
            );


        const minutes =
            Math.floor(
                safeSeconds / 60
            );


        const remainingSeconds =
            safeSeconds % 60;


        return (
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(remainingSeconds)
                .padStart(2, "0")
        );

    }


    function findActiveExercise(
        instanceId
    ) {

        return activeExercises.find(
            exercise =>
                exercise.instanceId ===
                instanceId
        ) || null;

    }


    function getExerciseCard(
        instanceId
    ) {

        return document.querySelector(
            `[data-instance-id="${instanceId}"]`
        );

    }


    function unlockTimerAudio() {

        try {

            const AudioContextClass =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContextClass) {
                return;
            }


            if (!audioContext) {

                audioContext =
                    new AudioContextClass();

            }


            if (
                audioContext.state ===
                "suspended"
            ) {

                audioContext.resume();

            }

        } catch (error) {

            console.warn(
                "Audio du chrono indisponible :",
                error
            );

        }

    }


    function playTimerFinishedSound() {

        try {

            if (
                !audioContext ||
                audioContext.state !==
                "running"
            ) {

                return;

            }


            const oscillator =
                audioContext.createOscillator();


            const gain =
                audioContext.createGain();


            oscillator.type =
                "sine";


            oscillator.frequency.value =
                880;


            gain.gain.setValueAtTime(
                0.0001,
                audioContext.currentTime
            );


            gain.gain.exponentialRampToValueAtTime(
                0.16,
                audioContext.currentTime + 0.02
            );


            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                audioContext.currentTime + 0.32
            );


            oscillator.connect(
                gain
            );


            gain.connect(
                audioContext.destination
            );


            oscillator.start();


            oscillator.stop(
                audioContext.currentTime + 0.35
            );

        } catch (error) {

            console.warn(
                "Signal sonore indisponible :",
                error
            );

        }

    }


    function signalRestFinished(
        exercise
    ) {

        try {

            if (
                "vibrate" in navigator
            ) {

                navigator.vibrate(
                    [180, 90, 180]
                );

            }

        } catch (error) {

            console.warn(
                "Vibration indisponible :",
                error
            );

        }


        playTimerFinishedSound();


        const card =
            getExerciseCard(
                exercise.instanceId
            );


        const box =
            card?.querySelector(
                ".exercise-rest-box"
            );


        if (box) {

            box.classList.add(
                "exercise-rest-finished"
            );


            setTimeout(
                () => {

                    box.classList.remove(
                        "exercise-rest-finished"
                    );

                },
                1800
            );

        }

    }


    function updateExerciseRestUI(
        exercise
    ) {

        const card =
            getExerciseCard(
                exercise.instanceId
            );


        if (!card) {
            return;
        }


        const display =
            card.querySelector(
                ".exercise-rest-time"
            );


        const startButton =
            card.querySelector(
                ".exercise-rest-start"
            );


        const status =
            card.querySelector(
                ".exercise-rest-status"
            );


        const presetButtons =
            card.querySelectorAll(
                ".exercise-rest-preset"
            );


        if (display) {

            display.textContent =
                formatRestTime(
                    exercise.restRemaining
                );

        }


        if (startButton) {

            startButton.textContent =
                exercise.restRunning
                    ? "⏸ Pause"
                    : (
                        exercise.restRemaining <
                            exercise.restDuration &&
                        exercise.restRemaining > 0
                            ? "▶ Reprendre"
                            : "▶ Démarrer"
                    );

        }


        if (status) {

            if (
                exercise.restRunning
            ) {

                status.textContent =
                    `Repos en cours pour ${exercise.name}…`;

            } else if (
                exercise.restRemaining === 0
            ) {

                status.textContent =
                    "✅ Repos terminé.";

            } else if (
                exercise.restRemaining <
                exercise.restDuration
            ) {

                status.textContent =
                    `En pause · ${formatRestTime(
                        exercise.restRemaining
                    )} restante.`;

            } else {

                status.textContent =
                    `Prêt · repos réglé sur ${formatRestTime(
                        exercise.restDuration
                    )}.`;

            }

        }


        presetButtons.forEach(
            button => {

                const seconds =
                    Number(
                        button.dataset.seconds
                    );


                button.classList.toggle(
                    "active",
                    seconds ===
                        Number(
                            exercise.restDuration
                        )
                );

            }
        );

    }


    function stopRestTickerIfIdle() {

        const hasRunningTimer =
            activeExercises.some(
                exercise =>
                    exercise.restRunning
            );


        if (
            !hasRunningTimer &&
            restTimerTicker
        ) {

            clearInterval(
                restTimerTicker
            );


            restTimerTicker =
                null;

        }

    }


    function tickRestTimers() {

        const now =
            Date.now();


        activeExercises.forEach(
            exercise => {

                if (
                    !exercise.restRunning ||
                    !exercise.restEndAt
                ) {

                    return;

                }


                const previousRemaining =
                    Number(
                        exercise.restRemaining
                    );


                const remaining =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                exercise.restEndAt -
                                now
                            ) / 1000
                        )
                    );


                exercise.restRemaining =
                    remaining;


                if (
                    remaining <= 0
                ) {

                    exercise.restRunning =
                        false;


                    exercise.restEndAt =
                        null;


                    updateExerciseRestUI(
                        exercise
                    );


                    if (
                        previousRemaining > 0
                    ) {

                        signalRestFinished(
                            exercise
                        );

                    }


                    return;

                }


                updateExerciseRestUI(
                    exercise
                );

            }
        );


        stopRestTickerIfIdle();

    }


    function ensureRestTicker() {

        if (restTimerTicker) {
            return;
        }


        restTimerTicker =
            setInterval(
                tickRestTimers,
                250
            );

    }


    function setExerciseRestPreset(
        instanceId,
        seconds
    ) {

        const exercise =
            findActiveExercise(
                instanceId
            );


        if (!exercise) {
            return;
        }


        unlockTimerAudio();


        exercise.restDuration =
            Number(seconds);


        exercise.restRemaining =
            Number(seconds);


        exercise.restRunning =
            false;


        exercise.restEndAt =
            null;


        updateExerciseRestUI(
            exercise
        );


        stopRestTickerIfIdle();

    }


    function toggleExerciseRestTimer(
        instanceId
    ) {

        const exercise =
            findActiveExercise(
                instanceId
            );


        if (!exercise) {
            return;
        }


        unlockTimerAudio();


        if (
            exercise.restRunning
        ) {

            const remaining =
                exercise.restEndAt
                    ? Math.max(
                        0,
                        Math.ceil(
                            (
                                exercise.restEndAt -
                                Date.now()
                            ) / 1000
                        )
                    )
                    : exercise.restRemaining;


            exercise.restRemaining =
                remaining;


            exercise.restRunning =
                false;


            exercise.restEndAt =
                null;


            updateExerciseRestUI(
                exercise
            );


            stopRestTickerIfIdle();


            return;

        }


        if (
            !exercise.restRemaining ||
            exercise.restRemaining <= 0
        ) {

            exercise.restRemaining =
                exercise.restDuration ||
                90;

        }


        exercise.restEndAt =
            Date.now() +
            (
                exercise.restRemaining *
                1000
            );


        exercise.restRunning =
            true;


        updateExerciseRestUI(
            exercise
        );


        ensureRestTicker();

    }


    function resetExerciseRestTimer(
        instanceId
    ) {

        const exercise =
            findActiveExercise(
                instanceId
            );


        if (!exercise) {
            return;
        }


        exercise.restRunning =
            false;


        exercise.restEndAt =
            null;


        exercise.restRemaining =
            exercise.restDuration ||
            90;


        updateExerciseRestUI(
            exercise
        );


        stopRestTickerIfIdle();

    }


    function createExerciseRestBox(
        exercise
    ) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "exercise-rest";


        const box =
            document.createElement(
                "div"
            );


        box.className =
            "exercise-rest-box";


        const heading =
            document.createElement(
                "div"
            );


        heading.className =
            "exercise-rest-heading";


        const label =
            document.createElement(
                "strong"
            );


        label.textContent =
            "⏱️ Repos entre les séries";


        const time =
            document.createElement(
                "span"
            );


        time.className =
            "exercise-rest-time";


        time.textContent =
            formatRestTime(
                exercise.restRemaining
            );


        heading.appendChild(
            label
        );


        heading.appendChild(
            time
        );


        const presets =
            document.createElement(
                "div"
            );


        presets.className =
            "exercise-rest-presets";


        [
            [60, "60 s"],
            [90, "90 s"],
            [120, "2 min"],
            [180, "3 min"]
        ]
            .forEach(
                ([seconds, text]) => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "exercise-rest-preset";


                    button.dataset.seconds =
                        String(seconds);


                    button.textContent =
                        text;


                    button.addEventListener(
                        "click",
                        () => {

                            setExerciseRestPreset(
                                exercise.instanceId,
                                seconds
                            );

                        }
                    );


                    presets.appendChild(
                        button
                    );

                }
            );


        const controls =
            document.createElement(
                "div"
            );


        controls.className =
            "exercise-rest-controls";


        const startButton =
            document.createElement(
                "button"
            );


        startButton.type =
            "button";


        startButton.className =
            "exercise-rest-control exercise-rest-start";


        startButton.textContent =
            "▶ Démarrer";


        startButton.addEventListener(
            "click",
            () => {

                toggleExerciseRestTimer(
                    exercise.instanceId
                );

            }
        );


        const resetButton =
            document.createElement(
                "button"
            );


        resetButton.type =
            "button";


        resetButton.className =
            "exercise-rest-control exercise-rest-reset";


        resetButton.textContent =
            "↺";


        resetButton.title =
            "Réinitialiser le chrono";


        resetButton.setAttribute(
            "aria-label",
            "Réinitialiser le chrono"
        );


        resetButton.addEventListener(
            "click",
            () => {

                resetExerciseRestTimer(
                    exercise.instanceId
                );

            }
        );


        controls.appendChild(
            startButton
        );


        controls.appendChild(
            resetButton
        );


        const status =
            document.createElement(
                "p"
            );


        status.className =
            "exercise-rest-status";


        box.appendChild(
            heading
        );


        box.appendChild(
            presets
        );


        box.appendChild(
            controls
        );


        box.appendChild(
            status
        );


        wrapper.appendChild(
            box
        );


        return wrapper;

    }



    function updateActiveCardio(
        instanceId,
        field,
        value
    ) {

        const exercise =
            findActiveExercise(
                instanceId
            );


        if (!exercise) {
            return;
        }


        if (!exercise.cardio) {

            exercise.cardio =
                makeEmptyCardio();

        }


        exercise.cardio[field] =
            value;

    }


    function renderActiveExercises() {

        const container =
            document.getElementById(
                "activeExercises"
            );


        if (!container) {
            return;
        }


        container.innerHTML =
            "";


        if (
            activeExercises.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    Aucun exercice ajouté pour le moment.
                </p>
            `;

            return;

        }


        activeExercises.forEach(
            exercise => {

                const mode =
                    getExerciseMode(
                        exercise
                    );


                exercise.mode =
                    mode;


                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "exercise-card";


                card.dataset.activeExerciseId =
                    exercise.libraryId;


                card.dataset.instanceId =
                    exercise.instanceId;


                const header =
                    document.createElement(
                        "div"
                    );


                header.className =
                    "exercise-card-header";


                const titleWrap =
                    document.createElement(
                        "div"
                    );


                titleWrap.className =
                    "exercise-card-title";


                const emoji =
                    document.createElement(
                        "span"
                    );


                emoji.textContent =
                    exercise.emoji ||
                    (
                        mode === "cardio"
                            ? "❤️"
                            : "🏋️"
                    );


                const textWrap =
                    document.createElement(
                        "div"
                    );


                const name =
                    document.createElement(
                        "strong"
                    );


                name.textContent =
                    exercise.name;


                const meta =
                    document.createElement(
                        "small"
                    );


                const previous =
                    getLastExercisePerformance(
                        exercise.name
                    );


                if (previous) {

                    meta.textContent =
                        `Dernière fois ${formatDate(previous.date)} : ${previous.text}`;

                } else {

                    meta.textContent =
                        [
                            mode === "cardio"
                                ? "Cardio"
                                : exercise.category,
                            exercise.equipment
                        ]
                            .filter(Boolean)
                            .join(" · ") ||
                        (
                            mode === "cardio"
                                ? "Nouvel exercice cardio"
                                : "Nouvel exercice"
                        );

                }


                textWrap.appendChild(
                    name
                );


                textWrap.appendChild(
                    meta
                );


                titleWrap.appendChild(
                    emoji
                );


                titleWrap.appendChild(
                    textWrap
                );


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.className =
                    "remove-exercise";


                removeButton.textContent =
                    "×";


                removeButton.setAttribute(
                    "aria-label",
                    `Supprimer ${exercise.name}`
                );


                removeButton.addEventListener(
                    "click",
                    () => {

                        removeActiveExercise(
                            exercise.instanceId
                        );

                    }
                );


                header.appendChild(
                    titleWrap
                );


                header.appendChild(
                    removeButton
                );


                card.appendChild(
                    header
                );


                if (
                    mode === "cardio"
                ) {

                    if (!exercise.cardio) {

                        exercise.cardio =
                            makeEmptyCardio();

                    }


                    const fields =
                        document.createElement(
                            "div"
                        );


                    fields.className =
                        "cardio-fields";


                    const definitions = [
                        {
                            key:
                                "duration",
                            label:
                                "Durée (min)",
                            placeholder:
                                "Ex : 20",
                            step:
                                "1"
                        },
                        {
                            key:
                                "speed",
                            label:
                                "Vitesse (km/h)",
                            placeholder:
                                "Ex : 6,5",
                            step:
                                "0.1"
                        },
                        {
                            key:
                                "intensity",
                            label:
                                "Intensité / résistance",
                            placeholder:
                                "Ex : 8",
                            step:
                                "1"
                        },
                        {
                            key:
                                "calories",
                            label:
                                "Calories machine",
                            placeholder:
                                "Ex : 100",
                            step:
                                "1"
                        }
                    ];


                    definitions.forEach(
                        definition => {

                            const label =
                                document.createElement(
                                    "label"
                                );


                            label.className =
                                "cardio-field";


                            label.append(
                                document.createTextNode(
                                    definition.label
                                )
                            );


                            const input =
                                document.createElement(
                                    "input"
                                );


                            input.type =
                                "number";


                            input.min =
                                "0";


                            input.step =
                                definition.step;


                            input.inputMode =
                                "decimal";


                            input.placeholder =
                                definition.placeholder;


                            input.value =
                                exercise.cardio[
                                    definition.key
                                ] ?? "";


                            input.addEventListener(
                                "input",
                                event => {

                                    updateActiveCardio(
                                        exercise.instanceId,
                                        definition.key,
                                        event.target.value
                                    );

                                }
                            );


                            label.appendChild(
                                input
                            );


                            fields.appendChild(
                                label
                            );

                        }
                    );


                    const hint =
                        document.createElement(
                            "p"
                        );


                    hint.className =
                        "cardio-hint";


                    hint.textContent =
                        "Renseigne ce que la machine affiche. Tu n'es pas obligée de remplir tous les champs.";


                    fields.appendChild(
                        hint
                    );


                    card.appendChild(
                        fields
                    );

                } else {

                    const setsWrap =
                        document.createElement(
                            "div"
                        );


                    setsWrap.className =
                        "sets-wrap";


                    const setHead =
                        document.createElement(
                            "div"
                        );


                    setHead.className =
                        "set-head";


                    setHead.innerHTML = `
                        <span>Série</span>
                        <span>kg</span>
                        <span>Reps</span>
                        <span>RPE</span>
                        <span></span>
                    `;


                    setsWrap.appendChild(
                        setHead
                    );


                    exercise.sets.forEach(
                        (set, setIndex) => {

                            const row =
                                document.createElement(
                                    "div"
                                );


                            row.className =
                                "set-row";


                            const number =
                                document.createElement(
                                    "span"
                                );


                            number.className =
                                "set-number";


                            number.textContent =
                                String(
                                    setIndex + 1
                                );


                            const weight =
                                document.createElement(
                                    "input"
                                );


                            weight.type =
                                "number";


                            weight.min =
                                "0";


                            weight.step =
                                "0.5";


                            weight.inputMode =
                                "decimal";


                            weight.placeholder =
                                "0";


                            weight.value =
                                set.weight;


                            weight.setAttribute(
                                "aria-label",
                                `Charge série ${setIndex + 1}`
                            );


                            weight.addEventListener(
                                "input",
                                event => {

                                    updateActiveSet(
                                        exercise.instanceId,
                                        setIndex,
                                        "weight",
                                        event.target.value
                                    );

                                }
                            );


                            const reps =
                                document.createElement(
                                    "input"
                                );


                            reps.type =
                                "number";


                            reps.min =
                                "0";


                            reps.step =
                                "1";


                            reps.inputMode =
                                "numeric";


                            reps.placeholder =
                                "10";


                            reps.value =
                                set.reps;


                            reps.setAttribute(
                                "aria-label",
                                `Répétitions série ${setIndex + 1}`
                            );


                            reps.addEventListener(
                                "input",
                                event => {

                                    updateActiveSet(
                                        exercise.instanceId,
                                        setIndex,
                                        "reps",
                                        event.target.value
                                    );

                                }
                            );


                            const rpe =
                                document.createElement(
                                    "input"
                                );


                            rpe.type =
                                "number";


                            rpe.min =
                                "1";


                            rpe.max =
                                "10";


                            rpe.step =
                                "0.5";


                            rpe.inputMode =
                                "decimal";


                            rpe.placeholder =
                                "—";


                            rpe.value =
                                set.rpe;


                            rpe.setAttribute(
                                "aria-label",
                                `RPE série ${setIndex + 1}`
                            );


                            rpe.addEventListener(
                                "input",
                                event => {

                                    updateActiveSet(
                                        exercise.instanceId,
                                        setIndex,
                                        "rpe",
                                        event.target.value
                                    );

                                }
                            );


                            const deleteButton =
                                document.createElement(
                                    "button"
                                );


                            deleteButton.type =
                                "button";


                            deleteButton.className =
                                "delete-set";


                            deleteButton.textContent =
                                "×";


                            deleteButton.setAttribute(
                                "aria-label",
                                `Supprimer la série ${setIndex + 1}`
                            );


                            deleteButton.addEventListener(
                                "click",
                                () => {

                                    deleteSetFromExercise(
                                        exercise.instanceId,
                                        setIndex
                                    );

                                }
                            );


                            row.appendChild(
                                number
                            );


                            row.appendChild(
                                weight
                            );


                            row.appendChild(
                                reps
                            );


                            row.appendChild(
                                rpe
                            );


                            row.appendChild(
                                deleteButton
                            );


                            setsWrap.appendChild(
                                row
                            );

                        }
                    );


                    const addSetButton =
                        document.createElement(
                            "button"
                        );


                    addSetButton.type =
                        "button";


                    addSetButton.className =
                        "add-set-button";


                    addSetButton.textContent =
                        "＋ Ajouter une série";


                    addSetButton.addEventListener(
                        "click",
                        () => {

                            addSetToExercise(
                                exercise.instanceId
                            );

                        }
                    );


                    setsWrap.appendChild(
                        addSetButton
                    );


                    card.appendChild(
                        setsWrap
                    );


                    const restBox =
                        createExerciseRestBox(
                            exercise
                        );


                    card.appendChild(
                        restBox
                    );

                }


                container.appendChild(
                    card
                );


                if (
                    mode === "strength"
                ) {

                    updateExerciseRestUI(
                        exercise
                    );

                }

            }
        );

    }


    /* =========================================
       CALCULS
    ========================================= */

    function normalizeSets(
        sets
    ) {

        return (sets || [])
            .map(
                set => ({
                    weight:
                        safeNumber(
                            set.weight
                        ),
                    reps:
                        safeNumber(
                            set.reps
                        ),
                    rpe:
                        set.rpe === "" ||
                        set.rpe === null ||
                        set.rpe === undefined
                            ? null
                            : safeNumber(
                                set.rpe
                            )
                })
            )
            .filter(
                set =>
                    set.weight > 0 ||
                    set.reps > 0 ||
                    set.rpe !== null
            );

    }


    function countSessionSets(
        session
    ) {

        if (
            !Array.isArray(
                session.exercises
            )
        ) {

            return 0;

        }


        return session.exercises.reduce(
            (total, exercise) => {

                if (
                    getExerciseMode(
                        exercise
                    ) === "cardio"
                ) {

                    return total;

                }


                return (
                    total +
                    normalizeSets(
                        exercise.sets
                    ).length
                );

            },
            0
        );

    }


    function calculateSessionVolume(
        session
    ) {

        if (
            !Array.isArray(
                session.exercises
            )
        ) {

            return 0;

        }


        return session.exercises.reduce(
            (sessionTotal, exercise) => {

                if (
                    getExerciseMode(
                        exercise
                    ) === "cardio"
                ) {

                    return sessionTotal;

                }


                const exerciseVolume =
                    normalizeSets(
                        exercise.sets
                    ).reduce(
                        (setTotal, set) =>
                            setTotal +
                            (
                                set.weight *
                                set.reps
                            ),
                        0
                    );


                return (
                    sessionTotal +
                    exerciseVolume
                );

            },
            0
        );

    }



    function calculateSessionCardioMinutes(
        session
    ) {

        if (
            !Array.isArray(
                session.exercises
            )
        ) {

            return 0;

        }


        return session.exercises.reduce(
            (total, exercise) => {

                if (
                    getExerciseMode(
                        exercise
                    ) !== "cardio"
                ) {

                    return total;

                }


                return (
                    total +
                    normalizeCardio(
                        exercise.cardio
                    ).duration
                );

            },
            0
        );

    }


    /* =========================================
       ENREGISTRER LA SÉANCE
    ========================================= */

    function buildSessionFromForm() {

        const date =
            document.getElementById(
                "sessionDate"
            )?.value ||
            localDateKey();


        const type =
            document.getElementById(
                "sessionType"
            )?.value ||
            "Autre";


        const duration =
            safeNumber(
                document.getElementById(
                    "sessionDuration"
                )?.value
            );


        const difficulty =
            document.getElementById(
                "sessionDifficulty"
            )?.value ||
            "Modérée";


        const notes =
            document.getElementById(
                "sessionNotes"
            )?.value.trim() ||
            "";


        const exercises =
            activeExercises
                .map(
                    exercise => {

                        const mode =
                            getExerciseMode(
                                exercise
                            );


                        return {

                            libraryId:
                                exercise.libraryId,

                            name:
                                exercise.name,

                            emoji:
                                exercise.emoji,

                            category:
                                exercise.category,

                            equipment:
                                exercise.equipment,

                            custom:
                                exercise.custom,

                            mode,

                            restSeconds:
                                mode === "strength"
                                    ? (
                                        Number(
                                            exercise.restDuration
                                        ) || 90
                                    )
                                    : 0,

                            sets:
                                mode === "strength"
                                    ? normalizeSets(
                                        exercise.sets
                                    )
                                    : [],

                            cardio:
                                mode === "cardio"
                                    ? normalizeCardio(
                                        exercise.cardio
                                    )
                                    : null

                        };

                    }
                )
                .filter(
                    exercise =>
                        exercise.mode === "cardio"
                            ? hasCardioData(
                                exercise.cardio
                            )
                            : exercise.sets.length > 0
                );


        return {

            date,

            session: {
                id:
                    makeId(),

                type,

                duration,

                difficulty,

                notes,

                exercises,

                createdAt:
                    new Date()
                        .toISOString()
            }

        };

    }


    function showSaveMessage(
        text,
        isError = false
    ) {

        const message =
            document.getElementById(
                "saveMessage"
            );


        if (!message) {
            return;
        }


        message.textContent =
            text;


        message.style.display =
            "block";


        message.style.background =
            isError
                ? "#fee2e2"
                : "#dcfce7";


        message.style.color =
            isError
                ? "#991b1b"
                : "#166534";


        setTimeout(
            () => {

                message.style.display =
                    "none";

            },
            2400
        );

    }


    function resetCurrentSession() {

        activeExercises = [];


        if (restTimerTicker) {

            clearInterval(
                restTimerTicker
            );


            restTimerTicker =
                null;

        }


        const duration =
            document.getElementById(
                "sessionDuration"
            );


        const notes =
            document.getElementById(
                "sessionNotes"
            );


        if (duration) {

            duration.value =
                "";

        }


        if (notes) {

            notes.value =
                "";

        }


        renderActiveExercises();

    }


    function saveCurrentSession() {

        if (
            activeExercises.length === 0
        ) {

            showSaveMessage(
                "Ajoute au moins un exercice avant d'enregistrer.",
                true
            );

            return;

        }


        const {
            date,
            session
        } =
            buildSessionFromForm();


        if (
            session.exercises.length === 0
        ) {

            showSaveMessage(
                "Renseigne au moins une série avant d'enregistrer.",
                true
            );

            return;

        }


        addSessionToHistory(
            date,
            session
        );


        resetCurrentSession();


        renderAllHistory();


        showSaveMessage(
            "✅ Séance enregistrée."
        );

    }



    /* =========================================
       REFAIRE UNE ANCIENNE SÉANCE
    ========================================= */

    function clonePreviousSet(
        set
    ) {

        return {
            weight:
                safeNumber(
                    set?.weight
                ) > 0
                    ? safeNumber(
                        set.weight
                    )
                    : "",

            reps:
                safeNumber(
                    set?.reps
                ) > 0
                    ? safeNumber(
                        set.reps
                    )
                    : "",

            rpe:
                set?.rpe === null ||
                set?.rpe === undefined ||
                set?.rpe === ""
                    ? ""
                    : safeNumber(
                        set.rpe
                    )
        };

    }


    function repeatPreviousSession(
        session
    ) {

        const exercises =
            Array.isArray(
                session?.exercises
            )
                ? session.exercises
                : [];


        if (
            exercises.length === 0
        ) {

            showSaveMessage(
                "Cette ancienne séance ne contient pas encore de détails à recopier.",
                true
            );

            return;

        }


        if (restTimerTicker) {

            clearInterval(
                restTimerTicker
            );


            restTimerTicker =
                null;

        }


        activeExercises =
            exercises.map(
                exercise => {

                    const mode =
                        getExerciseMode(
                            exercise
                        );


                    const previousSets =
                        mode === "strength" &&
                        Array.isArray(
                            exercise.sets
                        )
                            ? exercise.sets
                                .map(
                                    clonePreviousSet
                                )
                            : [];


                    const restDuration =
                        mode === "strength"
                            ? (
                                safeNumber(
                                    exercise.restSeconds
                                ) || 90
                            )
                            : 0;


                    const previousCardio =
                        mode === "cardio"
                            ? normalizeCardio(
                                exercise.cardio
                            )
                            : null;


                    return {

                        instanceId:
                            makeId(),

                        libraryId:
                            exercise.libraryId ||
                            `repeat-${makeId()}`,

                        name:
                            exercise.name ||
                            "Exercice",

                        emoji:
                            exercise.emoji ||
                            (
                                mode === "cardio"
                                    ? "❤️"
                                    : "🏋️"
                            ),

                        category:
                            exercise.category ||
                            "",

                        equipment:
                            exercise.equipment ||
                            "",

                        custom:
                            Boolean(
                                exercise.custom
                            ),

                        mode,

                        restDuration,

                        restRemaining:
                            restDuration,

                        restRunning:
                            false,

                        restEndAt:
                            null,

                        sets:
                            mode === "strength"
                                ? (
                                    previousSets.length > 0
                                        ? previousSets
                                        : [
                                            makeEmptySet(),
                                            makeEmptySet(),
                                            makeEmptySet()
                                        ]
                                )
                                : [],

                        cardio:
                            mode === "cardio"
                                ? {
                                    duration:
                                        previousCardio.duration || "",
                                    speed:
                                        previousCardio.speed || "",
                                    intensity:
                                        previousCardio.intensity || "",
                                    calories:
                                        previousCardio.calories || ""
                                }
                                : null

                    };

                }
            );


        const dateInput =
            document.getElementById(
                "sessionDate"
            );


        const typeInput =
            document.getElementById(
                "sessionType"
            );


        const durationInput =
            document.getElementById(
                "sessionDuration"
            );


        const difficultyInput =
            document.getElementById(
                "sessionDifficulty"
            );


        const notesInput =
            document.getElementById(
                "sessionNotes"
            );


        if (dateInput) {

            dateInput.value =
                localDateKey();

        }


        if (
            typeInput &&
            session.type
        ) {

            const optionExists =
                [...typeInput.options]
                    .some(
                        option =>
                            option.value ===
                            session.type
                    );


            if (optionExists) {

                typeInput.value =
                    session.type;

            }

        }


        if (durationInput) {

            durationInput.value =
                "";

        }


        if (
            difficultyInput &&
            session.difficulty
        ) {

            const optionExists =
                [...difficultyInput.options]
                    .some(
                        option =>
                            option.value ===
                            session.difficulty
                    );


            if (optionExists) {

                difficultyInput.value =
                    session.difficulty;

            }

        }


        if (notesInput) {

            notesInput.value =
                "";

        }


        renderActiveExercises();


        showSaveMessage(
            "🔁 Séance recopiée. Ajuste tes performances au fur et à mesure."
        );


        const activeContainer =
            document.getElementById(
                "activeExercises"
            );


        if (activeContainer) {

            activeContainer.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }



    /* =========================================
       AFFICHAGE D'UNE SÉANCE
    ========================================= */

    function formatExerciseSets(
        exercise
    ) {

        const sets =
            normalizeSets(
                exercise.sets
            );


        if (
            sets.length === 0
        ) {

            return "Aucune série renseignée";

        }


        return sets
            .map(
                set => {

                    const parts = [];


                    if (
                        set.weight > 0
                    ) {

                        parts.push(
                            `${formatNumber(set.weight, 1)} kg`
                        );

                    }


                    if (
                        set.reps > 0
                    ) {

                        parts.push(
                            `${formatNumber(set.reps)} reps`
                        );

                    }


                    if (
                        set.rpe !== null &&
                        set.rpe > 0
                    ) {

                        parts.push(
                            `RPE ${formatNumber(set.rpe, 1)}`
                        );

                    }


                    return parts.join(" × ");

                }
            )
            .join(" · ");

    }


    function createSessionCard(
        session,
        date,
        index
    ) {

        const article =
            document.createElement(
                "article"
            );


        article.className =
            "session-item";


        const header =
            document.createElement(
                "div"
            );


        header.className =
            "session-item-header";


        const info =
            document.createElement(
                "div"
            );


        const title =
            document.createElement(
                "h3"
            );


        title.textContent =
            `${session.type || "Séance"} · ${formatDate(date)}`;


        const meta =
            document.createElement(
                "p"
            );


        const setCount =
            countSessionSets(
                session
            );


        const volume =
            calculateSessionVolume(
                session
            );


        const cardioMinutes =
            calculateSessionCardioMinutes(
                session
            );


        const metaParts = [];


        if (
            safeNumber(
                session.duration
            ) > 0
        ) {

            metaParts.push(
                `${formatNumber(session.duration)} min`
            );

        }


        if (
            session.difficulty
        ) {

            metaParts.push(
                session.difficulty
            );

        }


        if (
            setCount > 0
        ) {

            metaParts.push(
                `${setCount} série${setCount > 1 ? "s" : ""}`
            );

        }


        if (
            volume > 0
        ) {

            metaParts.push(
                `${formatNumber(volume, 0)} kg de volume`
            );

        }


        if (
            cardioMinutes > 0
        ) {

            metaParts.push(
                `${formatNumber(cardioMinutes)} min cardio`
            );

        }


        if (
            safeNumber(
                session.calories
            ) > 0
        ) {

            metaParts.push(
                `${formatNumber(session.calories)} kcal estimées`
            );

        }


        meta.textContent =
            metaParts.join(" · ") ||
            "Séance enregistrée";


        info.appendChild(
            title
        );


        info.appendChild(
            meta
        );


        if (
            session.notes
        ) {

            const notes =
                document.createElement(
                    "p"
                );


            notes.textContent =
                session.notes;


            info.appendChild(
                notes
            );

        }


        header.appendChild(
            info
        );


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "session-actions";


        if (
            Array.isArray(
                session.exercises
            ) &&
            session.exercises.length > 0
        ) {

            const repeatButton =
                document.createElement(
                    "button"
                );


            repeatButton.type =
                "button";


            repeatButton.className =
                "repeat-session";


            repeatButton.textContent =
                "↻ Refaire";


            repeatButton.addEventListener(
                "click",
                () => {

                    repeatPreviousSession(
                        session
                    );

                }
            );


            const templateButton =
                document.createElement(
                    "button"
                );


            templateButton.type =
                "button";


            templateButton.className =
                "session-template-button";


            templateButton.textContent =
                "⭐ Modèle";


            templateButton.title =
                "Enregistrer cette séance comme modèle";


            templateButton.addEventListener(
                "click",
                () => {

                    saveRecordedSessionAsTemplate(
                        session
                    );

                }
            );


            actions.appendChild(
                repeatButton
            );


            actions.appendChild(
                templateButton
            );

        }


        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";


        deleteButton.className =
            "delete-session";


        deleteButton.textContent =
            "×";


        deleteButton.setAttribute(
            "aria-label",
            "Supprimer cette séance"
        );


        deleteButton.addEventListener(
            "click",
            () => {

                deleteSessionFromHistory(
                    date,
                    session.id || null,
                    index
                );


                renderAllHistory();

            }
        );


        actions.appendChild(
            deleteButton
        );


        header.appendChild(
            actions
        );


        article.appendChild(
            header
        );


        const exercises =
            Array.isArray(
                session.exercises
            )
                ? session.exercises
                : [];


        if (
            exercises.length > 0
        ) {

            const list =
                document.createElement(
                    "div"
                );


            list.className =
                "session-exercise-list";


            exercises.forEach(
                exercise => {

                    const line =
                        document.createElement(
                            "div"
                        );


                    line.className =
                        "session-exercise-line";


                    if (
                        getExerciseMode(
                            exercise
                        ) === "cardio"
                    ) {

                        const cardio =
                            normalizeCardio(
                                exercise.cardio
                            );


                        const parts = [];


                        if (
                            cardio.duration > 0
                        ) {

                            parts.push(
                                `${formatNumber(cardio.duration)} min`
                            );

                        }


                        if (
                            cardio.speed > 0
                        ) {

                            parts.push(
                                `${formatNumber(cardio.speed, 1)} km/h`
                            );

                        }


                        if (
                            cardio.intensity > 0
                        ) {

                            parts.push(
                                `intensité ${formatNumber(cardio.intensity, 1)}`
                            );

                        }


                        if (
                            cardio.calories > 0
                        ) {

                            parts.push(
                                `${formatNumber(cardio.calories)} kcal`
                            );

                        }


                        line.textContent =
                            `${exercise.emoji || "❤️"} ${exercise.name} — ${parts.join(" · ") || "cardio enregistré"}`;

                    } else {

                        const restText =
                            safeNumber(
                                exercise.restSeconds
                            ) > 0
                                ? ` · repos ${formatRestTime(
                                    exercise.restSeconds
                                )}`
                                : "";


                        line.textContent =
                            `${exercise.emoji || "🏋️"} ${exercise.name} — ${formatExerciseSets(exercise)}${restText}`;

                    }


                    list.appendChild(
                        line
                    );

                }
            );


            article.appendChild(
                list
            );

        } else if (
            session.notes
        ) {

            const list =
                document.createElement(
                    "div"
                );


            list.className =
                "session-exercise-list";


            const line =
                document.createElement(
                    "div"
                );


            line.className =
                "session-exercise-line";


            line.textContent =
                `📝 ${session.notes}`;


            list.appendChild(
                line
            );


            article.appendChild(
                list
            );

        }


        return article;

    }


    /* =========================================
       RÉSUMÉ DU JOUR
    ========================================= */

    function updateTodaySummary() {

        const sessions =
            getSessionsForDate(
                localDateKey()
            );


        const totalSets =
            sessions.reduce(
                (total, session) =>
                    total +
                    countSessionSets(
                        session
                    ),
                0
            );


        const totalVolume =
            sessions.reduce(
                (total, session) =>
                    total +
                    calculateSessionVolume(
                        session
                    ),
                0
            );


        const cardioMinutes =
            sessions.reduce(
                (total, session) =>
                    total +
                    calculateSessionCardioMinutes(
                        session
                    ),
                0
            );


        const sessionsElement =
            document.getElementById(
                "todaySessions"
            );


        const setsElement =
            document.getElementById(
                "todaySets"
            );


        const volumeElement =
            document.getElementById(
                "todayVolume"
            );


        const cardioElement =
            document.getElementById(
                "todayCardio"
            );


        if (sessionsElement) {

            sessionsElement.textContent =
                sessions.length;

        }


        if (setsElement) {

            setsElement.textContent =
                totalSets;

        }


        if (volumeElement) {

            volumeElement.textContent =
                `${formatNumber(totalVolume, 0)} kg`;

        }


        if (cardioElement) {

            cardioElement.textContent =
                `${formatNumber(cardioMinutes)} min`;

        }

    }


    /* =========================================
       SÉANCES DU JOUR
    ========================================= */

    function renderTodaySessions() {

        const container =
            document.getElementById(
                "todaySessionList"
            );


        if (!container) {
            return;
        }


        const date =
            localDateKey();


        const sessions =
            getSessionsForDate(
                date
            );


        container.innerHTML =
            "";


        if (
            sessions.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    Aucune séance enregistrée aujourd'hui.
                </p>
            `;

            return;

        }


        [...sessions]
            .reverse()
            .forEach(
                (session, reversedIndex) => {

                    const originalIndex =
                        sessions.length -
                        1 -
                        reversedIndex;


                    container.appendChild(
                        createSessionCard(
                            session,
                            date,
                            originalIndex
                        )
                    );

                }
            );

    }



    /* =========================================
       PROGRESSION PAR EXERCICE
    ========================================= */

    function getExerciseProgressEntries() {

        const history =
            loadTrainingHistory();


        const map =
            new Map();


        Object.keys(history)
            .sort()
            .forEach(
                date => {

                    const sessions =
                        Array.isArray(
                            history[date]
                        )
                            ? history[date]
                            : [];


                    sessions.forEach(
                        session => {

                            const exercises =
                                Array.isArray(
                                    session.exercises
                                )
                                    ? session.exercises
                                    : [];


                            exercises.forEach(
                                exercise => {

                                    const name =
                                        exercise.name ||
                                        "Exercice";


                                    const key =
                                        normalizeText(
                                            name
                                        );


                                    const mode =
                                        getExerciseMode(
                                            exercise
                                        );


                                    if (!map.has(key)) {

                                        map.set(
                                            key,
                                            {
                                                key,
                                                name,
                                                emoji:
                                                    exercise.emoji ||
                                                    (
                                                        mode === "cardio"
                                                            ? "❤️"
                                                            : "🏋️"
                                                    ),
                                                mode,
                                                entries: []
                                            }
                                        );

                                    }


                                    if (
                                        mode === "cardio"
                                    ) {

                                        const cardio =
                                            normalizeCardio(
                                                exercise.cardio
                                            );


                                        map
                                            .get(key)
                                            .entries
                                            .push({

                                                date,

                                                sessionId:
                                                    session.id ||
                                                    "",

                                                duration:
                                                    cardio.duration,

                                                speed:
                                                    cardio.speed,

                                                intensity:
                                                    cardio.intensity,

                                                calories:
                                                    cardio.calories

                                            });


                                        return;

                                    }


                                    const sets =
                                        normalizeSets(
                                            exercise.sets
                                        );


                                    const maxWeight =
                                        sets.reduce(
                                            (max, set) =>
                                                Math.max(
                                                    max,
                                                    safeNumber(
                                                        set.weight
                                                    )
                                                ),
                                            0
                                        );


                                    const volume =
                                        sets.reduce(
                                            (total, set) =>
                                                total +
                                                (
                                                    safeNumber(
                                                        set.weight
                                                    ) *
                                                    safeNumber(
                                                        set.reps
                                                    )
                                                ),
                                            0
                                        );


                                    const topSet =
                                        [...sets]
                                            .sort(
                                                (a, b) => {

                                                    const weightDiff =
                                                        safeNumber(
                                                            b.weight
                                                        ) -
                                                        safeNumber(
                                                            a.weight
                                                        );


                                                    if (
                                                        weightDiff !== 0
                                                    ) {

                                                        return weightDiff;

                                                    }


                                                    return (
                                                        safeNumber(
                                                            b.reps
                                                        ) -
                                                        safeNumber(
                                                            a.reps
                                                        )
                                                    );

                                                }
                                            )[0] || null;


                                    map
                                        .get(key)
                                        .entries
                                        .push({

                                            date,

                                            sessionId:
                                                session.id ||
                                                "",

                                            maxWeight,

                                            volume,

                                            topSet,

                                            sets

                                        });

                                }
                            );

                        }
                    );

                }
            );


        return Array
            .from(
                map.values()
            )
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name,
                        "fr"
                    )
            );

    }


    function populateProgressExerciseSelect() {

        const select =
            document.getElementById(
                "progressExerciseSelect"
            );


        if (!select) {
            return;
        }


        const previousValue =
            select.value;


        const exercises =
            getExerciseProgressEntries();


        select.innerHTML =
            "";


        const placeholder =
            document.createElement(
                "option"
            );


        placeholder.value =
            "";


        placeholder.textContent =
            exercises.length > 0
                ? "Choisir un exercice enregistré"
                : "Aucun exercice enregistré";


        select.appendChild(
            placeholder
        );


        exercises.forEach(
            exercise => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    exercise.key;


                option.textContent =
                    `${exercise.emoji} ${exercise.name}`;


                select.appendChild(
                    option
                );

            }
        );


        const stillExists =
            exercises.some(
                exercise =>
                    exercise.key ===
                    previousValue
            );


        if (stillExists) {

            select.value =
                previousValue;

        }

    }


    function getSelectedExerciseProgress() {

        const select =
            document.getElementById(
                "progressExerciseSelect"
            );


        if (
            !select ||
            !select.value
        ) {

            return null;

        }


        return getExerciseProgressEntries()
            .find(
                exercise =>
                    exercise.key ===
                    select.value
            ) || null;

    }


    function setProgressText(
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


    function setProgressLabels(
        mode
    ) {

        if (
            mode === "cardio"
        ) {

            setProgressText(
                "progressMetric1Label",
                "DURÉE MAX"
            );


            setProgressText(
                "progressMetric2Label",
                "CALORIES MAX"
            );


            setProgressText(
                "progressMetric3Label",
                "SÉANCES"
            );


            setProgressText(
                "progressMetric4Label",
                "VITESSE MAX"
            );


            setProgressText(
                "progressChartTitle",
                "Évolution de la durée cardio"
            );


            setProgressText(
                "progressChartSubtitle",
                "minutes par séance"
            );


            return;

        }


        setProgressText(
            "progressMetric1Label",
            "CHARGE MAX"
        );


        setProgressText(
            "progressMetric2Label",
            "MEILLEUR VOLUME"
        );


        setProgressText(
            "progressMetric3Label",
            "SÉANCES"
        );


        setProgressText(
            "progressMetric4Label",
            "DERNIÈRE PERF"
        );


        setProgressText(
            "progressChartTitle",
            "Évolution de la charge maximale"
        );


        setProgressText(
            "progressChartSubtitle",
            "par séance"
        );

    }


    function clearExerciseProgress() {

        setProgressLabels(
            "strength"
        );


        setProgressText(
            "progressBestWeight",
            "—"
        );


        setProgressText(
            "progressBestVolume",
            "—"
        );


        setProgressText(
            "progressSessionCount",
            "—"
        );


        setProgressText(
            "progressLastPerformance",
            "—"
        );


        const chart =
            document.getElementById(
                "exerciseProgressChart"
            );


        if (chart) {

            chart.innerHTML = `
                <p class="empty-message">
                    Choisis un exercice pour afficher sa progression.
                </p>
            `;

        }


        const recordList =
            document.getElementById(
                "exerciseRecordList"
            );


        if (recordList) {

            recordList.innerHTML =
                "";

        }

    }


    function formatTopSet(
        topSet
    ) {

        if (!topSet) {
            return "—";
        }


        const weight =
            safeNumber(
                topSet.weight
            );


        const reps =
            safeNumber(
                topSet.reps
            );


        if (
            weight > 0 &&
            reps > 0
        ) {

            return `${formatNumber(weight, 1)} kg × ${formatNumber(reps)}`;

        }


        if (weight > 0) {

            return `${formatNumber(weight, 1)} kg`;

        }


        if (reps > 0) {

            return `${formatNumber(reps)} reps`;

        }


        return "—";

    }


    function createMetricChart(
        exercise,
        metric,
        unit,
        emptyText
    ) {

        const chart =
            document.getElementById(
                "exerciseProgressChart"
            );


        if (!chart) {
            return;
        }


        const entries =
            exercise.entries
                .filter(
                    entry =>
                        safeNumber(
                            entry[metric]
                        ) > 0
                );


        if (
            entries.length === 0
        ) {

            chart.innerHTML = `
                <p class="empty-message">
                    ${emptyText}
                </p>
            `;

            return;

        }


        if (
            entries.length === 1
        ) {

            chart.innerHTML = `
                <p class="empty-message">
                    Une seule séance enregistrée. La courbe apparaîtra à partir de deux séances.
                </p>
            `;

            return;

        }


        const width =
            760;


        const height =
            230;


        const padding = {
            top: 24,
            right: 24,
            bottom: 42,
            left: 54
        };


        const values =
            entries.map(
                entry =>
                    safeNumber(
                        entry[metric]
                    )
            );


        let minValue =
            Math.min(
                ...values
            );


        let maxValue =
            Math.max(
                ...values
            );


        if (
            minValue ===
            maxValue
        ) {

            minValue =
                Math.max(
                    0,
                    minValue -
                    Math.max(
                        1,
                        minValue * 0.1
                    )
                );


            maxValue =
                maxValue +
                Math.max(
                    1,
                    maxValue * 0.1
                );

        } else {

            const paddingValue =
                Math.max(
                    1,
                    (
                        maxValue -
                        minValue
                    ) * 0.15
                );


            minValue =
                Math.max(
                    0,
                    minValue -
                    paddingValue
                );


            maxValue =
                maxValue +
                paddingValue;

        }


        const plotWidth =
            width -
            padding.left -
            padding.right;


        const plotHeight =
            height -
            padding.top -
            padding.bottom;


        const xForIndex =
            index =>
                padding.left +
                (
                    index /
                    (
                        entries.length -
                        1
                    )
                ) *
                plotWidth;


        const yForValue =
            value =>
                padding.top +
                (
                    (
                        maxValue -
                        value
                    ) /
                    (
                        maxValue -
                        minValue
                    )
                ) *
                plotHeight;


        const points =
            entries
                .map(
                    (entry, index) =>
                        `${xForIndex(index)},${yForValue(
                            safeNumber(
                                entry[metric]
                            )
                        )}`
                )
                .join(" ");


        const gridLines = [];


        for (
            let i = 0;
            i <= 4;
            i++
        ) {

            const ratio =
                i / 4;


            const value =
                maxValue -
                (
                    maxValue -
                    minValue
                ) *
                ratio;


            const y =
                padding.top +
                plotHeight *
                ratio;


            gridLines.push(`
                <line
                    x1="${padding.left}"
                    y1="${y}"
                    x2="${width - padding.right}"
                    y2="${y}"
                    stroke="#e2e8f0"
                    stroke-width="1"
                />

                <text
                    x="${padding.left - 9}"
                    y="${y + 4}"
                    text-anchor="end"
                    fill="#64748b"
                    font-size="11"
                >
                    ${formatNumber(value, 1)}
                </text>
            `);

        }


        const pointElements =
            entries
                .map(
                    (entry, index) => {

                        const value =
                            safeNumber(
                                entry[metric]
                            );


                        const x =
                            xForIndex(
                                index
                            );


                        const y =
                            yForValue(
                                value
                            );


                        const showDate =
                            entries.length <= 8 ||
                            index === 0 ||
                            index ===
                                entries.length - 1 ||
                            index %
                                Math.ceil(
                                    entries.length / 6
                                ) === 0;


                        return `
                            <circle
                                cx="${x}"
                                cy="${y}"
                                r="4.5"
                                fill="#2563eb"
                            />

                            <text
                                x="${x}"
                                y="${y - 10}"
                                text-anchor="middle"
                                fill="#0d47a1"
                                font-size="11"
                                font-weight="700"
                            >
                                ${formatNumber(value, 1)}${unit}
                            </text>

                            ${
                                showDate
                                    ? `
                                        <text
                                            x="${x}"
                                            y="${height - 14}"
                                            text-anchor="middle"
                                            fill="#64748b"
                                            font-size="10"
                                        >
                                            ${formatDate(entry.date).slice(0,5)}
                                        </text>
                                    `
                                    : ""
                            }
                        `;

                    }
                )
                .join("");


        chart.innerHTML = `
            <svg
                viewBox="0 0 ${width} ${height}"
                preserveAspectRatio="none"
                role="img"
                aria-label="Progression de ${exercise.name}"
            >
                ${gridLines.join("")}

                <polyline
                    points="${points}"
                    fill="none"
                    stroke="#2563eb"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />

                ${pointElements}
            </svg>
        `;

    }


    function renderExerciseRecords(
        exercise
    ) {

        const list =
            document.getElementById(
                "exerciseRecordList"
            );


        if (!list) {
            return;
        }


        list.innerHTML =
            "";


        const entries =
            exercise.entries;


        if (
            exercise.mode === "cardio"
        ) {

            const bestDuration =
                [...entries]
                    .sort(
                        (a, b) =>
                            b.duration -
                            a.duration
                    )[0] || null;


            const bestCalories =
                [...entries]
                    .sort(
                        (a, b) =>
                            b.calories -
                            a.calories
                    )[0] || null;


            const bestSpeed =
                [...entries]
                    .sort(
                        (a, b) =>
                            b.speed -
                            a.speed
                    )[0] || null;


            const bestIntensity =
                [...entries]
                    .sort(
                        (a, b) =>
                            b.intensity -
                            a.intensity
                    )[0] || null;


            const records = [];


            if (
                bestDuration &&
                bestDuration.duration > 0
            ) {

                records.push(
                    `⏱️ <strong>Durée max :</strong> ${formatNumber(bestDuration.duration)} min · ${formatDate(bestDuration.date)}`
                );

            }


            if (
                bestCalories &&
                bestCalories.calories > 0
            ) {

                records.push(
                    `🔥 <strong>Calories machine max :</strong> ${formatNumber(bestCalories.calories)} kcal · ${formatDate(bestCalories.date)}`
                );

            }


            if (
                bestSpeed &&
                bestSpeed.speed > 0
            ) {

                records.push(
                    `⚡ <strong>Vitesse max :</strong> ${formatNumber(bestSpeed.speed, 1)} km/h · ${formatDate(bestSpeed.date)}`
                );

            }


            if (
                bestIntensity &&
                bestIntensity.intensity > 0
            ) {

                records.push(
                    `❤️ <strong>Intensité max :</strong> ${formatNumber(bestIntensity.intensity, 1)} · ${formatDate(bestIntensity.date)}`
                );

            }


            records.forEach(
                html => {

                    const line =
                        document.createElement(
                            "div"
                        );


                    line.className =
                        "exercise-record-line";


                    line.innerHTML =
                        html;


                    list.appendChild(
                        line
                    );

                }
            );


            return;

        }


        const bestWeightEntry =
            [...entries]
                .sort(
                    (a, b) =>
                        b.maxWeight -
                        a.maxWeight
                )[0] || null;


        const bestVolumeEntry =
            [...entries]
                .sort(
                    (a, b) =>
                        b.volume -
                        a.volume
                )[0] || null;


        if (
            bestWeightEntry &&
            bestWeightEntry.maxWeight > 0
        ) {

            const line =
                document.createElement(
                    "div"
                );


            line.className =
                "exercise-record-line";


            line.innerHTML =
                `<strong>🏆 Record de charge :</strong> ${formatNumber(
                    bestWeightEntry.maxWeight,
                    1
                )} kg · ${formatDate(
                    bestWeightEntry.date
                )}`;


            list.appendChild(
                line
            );

        }


        if (
            bestVolumeEntry &&
            bestVolumeEntry.volume > 0
        ) {

            const line =
                document.createElement(
                    "div"
                );


            line.className =
                "exercise-record-line";


            line.innerHTML =
                `<strong>📦 Record de volume :</strong> ${formatNumber(
                    bestVolumeEntry.volume,
                    0
                )} kg · ${formatDate(
                    bestVolumeEntry.date
                )}`;


            list.appendChild(
                line
            );

        }


        const firstEntry =
            entries[0];


        const lastEntry =
            entries[
                entries.length - 1
            ];


        if (
            firstEntry &&
            lastEntry &&
            firstEntry !== lastEntry &&
            firstEntry.maxWeight > 0 &&
            lastEntry.maxWeight > 0
        ) {

            const difference =
                lastEntry.maxWeight -
                firstEntry.maxWeight;


            const sign =
                difference > 0
                    ? "+"
                    : "";


            const line =
                document.createElement(
                    "div"
                );


            line.className =
                "exercise-record-line";


            line.innerHTML =
                `<strong>📈 Évolution :</strong> ${formatNumber(
                    firstEntry.maxWeight,
                    1
                )} → ${formatNumber(
                    lastEntry.maxWeight,
                    1
                )} kg (${sign}${formatNumber(
                    difference,
                    1
                )} kg)`;


            list.appendChild(
                line
            );

        }

    }


    function renderExerciseProgress() {

        const exercise =
            getSelectedExerciseProgress();


        if (!exercise) {

            clearExerciseProgress();

            return;

        }


        const entries =
            exercise.entries;


        setProgressLabels(
            exercise.mode
        );


        if (
            exercise.mode === "cardio"
        ) {

            const maxDuration =
                entries.reduce(
                    (max, entry) =>
                        Math.max(
                            max,
                            safeNumber(
                                entry.duration
                            )
                        ),
                    0
                );


            const maxCalories =
                entries.reduce(
                    (max, entry) =>
                        Math.max(
                            max,
                            safeNumber(
                                entry.calories
                            )
                        ),
                    0
                );


            const maxSpeed =
                entries.reduce(
                    (max, entry) =>
                        Math.max(
                            max,
                            safeNumber(
                                entry.speed
                            )
                        ),
                    0
                );


            setProgressText(
                "progressBestWeight",
                maxDuration > 0
                    ? `${formatNumber(maxDuration)} min`
                    : "—"
            );


            setProgressText(
                "progressBestVolume",
                maxCalories > 0
                    ? `${formatNumber(maxCalories)} kcal`
                    : "—"
            );


            setProgressText(
                "progressSessionCount",
                String(
                    entries.length
                )
            );


            setProgressText(
                "progressLastPerformance",
                maxSpeed > 0
                    ? `${formatNumber(maxSpeed, 1)} km/h`
                    : "—"
            );


            createMetricChart(
                exercise,
                "duration",
                "",
                "Aucune durée cardio enregistrée pour cet exercice."
            );


            renderExerciseRecords(
                exercise
            );


            return;

        }


        const bestWeight =
            entries.reduce(
                (max, entry) =>
                    Math.max(
                        max,
                        entry.maxWeight
                    ),
                0
            );


        const bestVolume =
            entries.reduce(
                (max, entry) =>
                    Math.max(
                        max,
                        entry.volume
                    ),
                0
            );


        const lastEntry =
            entries[
                entries.length - 1
            ];


        setProgressText(
            "progressBestWeight",
            bestWeight > 0
                ? `${formatNumber(
                    bestWeight,
                    1
                )} kg`
                : "—"
        );


        setProgressText(
            "progressBestVolume",
            bestVolume > 0
                ? `${formatNumber(
                    bestVolume,
                    0
                )} kg`
                : "—"
        );


        setProgressText(
            "progressSessionCount",
            String(
                entries.length
            )
        );


        setProgressText(
            "progressLastPerformance",
            lastEntry
                ? formatTopSet(
                    lastEntry.topSet
                )
                : "—"
        );


        createMetricChart(
            exercise,
            "maxWeight",
            "",
            "Aucune charge enregistrée pour cet exercice."
        );


        renderExerciseRecords(
            exercise
        );

    }


    function refreshExerciseProgressSection() {

        const select =
            document.getElementById(
                "progressExerciseSelect"
            );


        const previousValue =
            select?.value ||
            "";


        populateProgressExerciseSelect();


        if (
            select &&
            previousValue
        ) {

            const exists =
                [...select.options]
                    .some(
                        option =>
                            option.value ===
                            previousValue
                    );


            if (exists) {

                select.value =
                    previousValue;

            }

        }


        renderExerciseProgress();

    }


    function initExerciseProgress() {

        const select =
            document.getElementById(
                "progressExerciseSelect"
            );


        if (!select) {
            return;
        }


        select.addEventListener(
            "change",
            renderExerciseProgress
        );


        refreshExerciseProgressSection();

    }


    /* =========================================
       HISTORIQUE
    ========================================= */

    function getAllHistoryEntries() {

        const history =
            loadTrainingHistory();


        const entries = [];


        Object.keys(history)
            .forEach(
                date => {

                    const sessions =
                        Array.isArray(
                            history[date]
                        )
                            ? history[date]
                            : [];


                    sessions.forEach(
                        (session, index) => {

                            entries.push({
                                date,
                                session,
                                index
                            });

                        }
                    );

                }
            );


        return entries.sort(
            (a, b) => {

                const dateCompare =
                    String(b.date)
                        .localeCompare(
                            String(a.date)
                        );


                if (
                    dateCompare !== 0
                ) {

                    return dateCompare;

                }


                return (
                    String(
                        b.session.createdAt || ""
                    )
                        .localeCompare(
                            String(
                                a.session.createdAt || ""
                            )
                        )
                );

            }
        );

    }


    function sessionMatchesSearch(
        entry,
        query
    ) {

        const normalizedQuery =
            normalizeText(query);


        if (!normalizedQuery) {
            return true;
        }


        const session =
            entry.session;


        const exerciseNames =
            Array.isArray(
                session.exercises
            )
                ? session.exercises
                    .map(
                        exercise =>
                            exercise.name
                    )
                    .join(" ")
                : "";


        const haystack =
            normalizeText(
                [
                    entry.date,
                    formatDate(
                        entry.date
                    ),
                    session.type,
                    session.difficulty,
                    session.notes,
                    exerciseNames
                ].join(" ")
            );


        return haystack.includes(
            normalizedQuery
        );

    }


    function renderTrainingHistory() {

        const container =
            document.getElementById(
                "trainingHistory"
            );


        if (!container) {
            return;
        }


        const query =
            document.getElementById(
                "historySearch"
            )?.value ||
            "";


        const entries =
            getAllHistoryEntries()
                .filter(
                    entry =>
                        sessionMatchesSearch(
                            entry,
                            query
                        )
                );


        container.innerHTML =
            "";


        if (
            entries.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    ${query
                        ? "Aucune séance ne correspond à cette recherche."
                        : "Ton historique apparaîtra ici."}
                </p>
            `;

            return;

        }


        entries.forEach(
            entry => {

                container.appendChild(
                    createSessionCard(
                        entry.session,
                        entry.date,
                        entry.index
                    )
                );

            }
        );

    }


    function renderAllHistory() {

        updateTodaySummary();

        renderTodaySessions();

        renderTrainingHistory();

        refreshExerciseProgressSection();

        /*
         * Les performances précédentes affichées
         * dans la séance en cours sont recalculées.
         */
        renderActiveExercises();

    }


    /* =========================================
       ÉVÉNEMENTS
    ========================================= */

    function bindEvents() {

        const exerciseSearch =
            document.getElementById(
                "exerciseSearch"
            );


        if (exerciseSearch) {

            exerciseSearch.addEventListener(
                "input",
                event => {

                    renderExerciseResults(
                        event.target.value
                    );

                }
            );

        }


        const customButton =
            document.getElementById(
                "addCustomExerciseButton"
            );


        if (customButton) {

            customButton.addEventListener(
                "click",
                addCustomExercise
            );

        }


        const customInput =
            document.getElementById(
                "customExerciseName"
            );


        if (customInput) {

            customInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        addCustomExercise();

                    }

                }
            );

        }


        const saveButton =
            document.getElementById(
                "saveSessionButton"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveCurrentSession
            );

        }


        const historySearch =
            document.getElementById(
                "historySearch"
            );


        if (historySearch) {

            historySearch.addEventListener(
                "input",
                renderTrainingHistory
            );

        }

    }


    /* =========================================
       INITIALISATION
    ========================================= */

    async function initTrainingPage() {

        const dateInput =
            document.getElementById(
                "sessionDate"
            );


        if (dateInput) {

            dateInput.value =
                localDateKey();

        }


        bindEvents();

        initTrainingTemplates();

        renderActiveExercises();

        renderAllHistory();

        initExerciseProgress();

        await loadExerciseLibrary();

    }


    document.addEventListener(
        "DOMContentLoaded",
        initTrainingPage
    );

})();