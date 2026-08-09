/* =========================================
   HANA FIT — NEHA
   Messages motivants et contextuels
========================================= */

(() => {

    const QUOTES_PATH =
        "assets/database/quotes.json";


    let quoteLibrary =
        [];


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


    function readStorage(
        key,
        fallback
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
                `NEHA : impossible de lire ${key}`,
                error
            );


            return fallback;

        }

    }


    function safeNumber(
        value
    ) {

        const number =
            Number(
                String(
                    value ?? ""
                )
                    .replace(
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


    function getMainData() {

        return readStorage(
            "hanaFitData",
            {}
        );

    }


    function getTodayTrainingSessions() {

        const history =
            readStorage(
                "hanaFitTraining",
                {}
            );


        const sessions =
            history[
                localDateKey()
            ];


        return Array.isArray(
            sessions
        )
            ? sessions
            : [];

    }


    function getTodayWellbeing() {

        const history =
            readStorage(
                "hanaFitWellbeing",
                {}
            );


        return (
            history[
                localDateKey()
            ] ||
            null
        );

    }


    function countReachedGoals(
        data
    ) {

        let reached =
            0;


        const protein =
            safeNumber(
                data.proteinToday
            );

        const proteinGoal =
            safeNumber(
                data.proteinGoal
            ) || 110;


        if (
            proteinGoal > 0 &&
            protein >= proteinGoal
        ) {

            reached++;

        }


        const steps =
            safeNumber(
                data.stepsToday
            );

        const stepsGoal =
            safeNumber(
                data.stepsGoal
            ) || 8000;


        if (
            stepsGoal > 0 &&
            steps >= stepsGoal
        ) {

            reached++;

        }


        const water =
            safeNumber(
                data.waterToday
            );

        const waterGoal =
            safeNumber(
                data.waterGoal
            ) || 2.3;


        if (
            waterGoal > 0 &&
            water >= waterGoal
        ) {

            reached++;

        }


        return reached;

    }


    function chooseContext() {

        const now =
            new Date();

        const hour =
            now.getHours();

        const data =
            getMainData();

        const sessions =
            getTodayTrainingSessions();

        const wellbeing =
            getTodayWellbeing();


        const protein =
            safeNumber(
                data.proteinToday
            );

        const proteinGoal =
            safeNumber(
                data.proteinGoal
            ) || 110;


        const steps =
            safeNumber(
                data.stepsToday
            );

        const stepsGoal =
            safeNumber(
                data.stepsGoal
            ) || 8000;


        const water =
            safeNumber(
                data.waterToday
            );

        const waterGoal =
            safeNumber(
                data.waterGoal
            ) || 2.3;


        const reachedGoals =
            countReachedGoals(
                data
            );


        /*
         * Les situations positives ou importantes
         * passent avant les simples rappels.
         */

        if (
            sessions.length > 0
        ) {

            return {
                type:
                    "training_success",

                title:
                    "Belle séance 💪"
            };

        }


        if (
            reachedGoals >= 3
        ) {

            return {
                type:
                    "daily_success",

                title:
                    "Belle journée 💙"
            };

        }


        if (
            proteinGoal > 0 &&
            protein >= proteinGoal
        ) {

            return {
                type:
                    "protein_success",

                title:
                    "Objectif protéines atteint 💪"
            };

        }


        if (
            stepsGoal > 0 &&
            steps >= stepsGoal
        ) {

            return {
                type:
                    "steps_success",

                title:
                    "Objectif pas atteint 🐾"
            };

        }


        if (
            waterGoal > 0 &&
            water >= waterGoal
        ) {

            return {
                type:
                    "water_success",

                title:
                    "Hydratation au top 💧"
            };

        }


        if (
            wellbeing &&
            wellbeing.completed
        ) {

            const energy =
                safeNumber(
                    wellbeing.energy
                );

            const stress =
                safeNumber(
                    wellbeing.stress
                );


            if (
                (
                    energy > 0 &&
                    energy <= 4
                ) ||
                stress >= 8
            ) {

                return {
                    type:
                        "gentle_day",

                    title:
                        "Journée douceur 🌿"
                };

            }


            return {
                type:
                    "wellbeing_success",

                title:
                    "Bien-être enregistré 🌿"
            };

        }


        /*
         * Rappels légers uniquement à partir
         * de l'après-midi.
         */

        if (
            hour >= 14 &&
            waterGoal > 0 &&
            water <
                waterGoal * 0.45
        ) {

            return {
                type:
                    "water_reminder",

                title:
                    "Petit rappel de NEHA 🐈"
            };

        }


        if (
            hour >= 15 &&
            stepsGoal > 0 &&
            steps <
                stepsGoal * 0.55
        ) {

            return {
                type:
                    "steps",

                title:
                    "Quelques pas ? 🐾"
            };

        }


        if (
            hour < 11
        ) {

            return {
                type:
                    "welcome",

                title:
                    "Bonjour de NEHA 🌸"
            };

        }


        if (
            hour >= 20
        ) {

            return {
                type:
                    "evening",

                title:
                    "Fin de journée 🌙"
            };

        }


        /*
         * En dehors d'un contexte particulier,
         * on alterne entre motivation,
         * nutrition et progression.
         */

        const fallbackTypes = [
            {
                type:
                    "motivation",

                title:
                    "On avance ensemble 💙"
            },
            {
                type:
                    "nutrition",

                title:
                    "Repère du jour 🍽️"
            },
            {
                type:
                    "progress",

                title:
                    "Petit rappel 💙"
            },
            {
                type:
                    "rest",

                title:
                    "À ton rythme 🌿"
            }
        ];


        const index =
            dailyIndex(
                fallbackTypes.length,
                "fallback"
            );


        return fallbackTypes[
            index
        ];

    }


    function dailyIndex(
        length,
        salt = ""
    ) {

        if (
            length <= 0
        ) {

            return 0;

        }


        const key =
            `${localDateKey()}-${salt}`;


        let hash =
            0;


        for (
            let i = 0;
            i < key.length;
            i++
        ) {

            hash =
                (
                    (
                        hash << 5
                    ) -
                    hash
                ) +
                key.charCodeAt(
                    i
                );

            hash |=
                0;

        }


        return (
            Math.abs(
                hash
            ) %
            length
        );

    }


    function getQuoteByType(
        type
    ) {

        const matches =
            quoteLibrary.filter(
                quote =>
                    quote.type ===
                    type
            );


        if (
            matches.length === 0
        ) {

            return null;

        }


        return matches[
            dailyIndex(
                matches.length,
                type
            )
        ];

    }


    function renderNeha() {

        const messageElement =
            document.getElementById(
                "nehaMessage"
            );


        if (
            !messageElement
        ) {

            return;

        }


        const titleElement =
            document.querySelector(
                ".mascot-message h2"
            );


        const context =
            chooseContext();


        let quote =
            getQuoteByType(
                context.type
            );


        if (
            !quote
        ) {

            quote =
                getQuoteByType(
                    "motivation"
                );

        }


        if (
            titleElement
        ) {

            titleElement.textContent =
                context.title;

        }


        if (
            quote
        ) {

            messageElement.textContent =
                quote.message;

        }

    }


    async function loadQuotes() {

        try {

            const response =
                await fetch(
                    QUOTES_PATH,
                    {
                        cache:
                            "no-cache"
                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    "Impossible de charger quotes.json"
                );

            }


            const data =
                await response.json();


            quoteLibrary =
                Array.isArray(
                    data
                )
                    ? data
                    : [];

        } catch (error) {

            console.error(
                "NEHA : erreur de chargement des phrases",
                error
            );


            quoteLibrary = [
                {
                    id:
                        0,

                    type:
                        "motivation",

                    message:
                        "Une journée imparfaite n'efface jamais tous tes efforts. 💙"
                }
            ];

        }


        renderNeha();

    }


    document.addEventListener(
        "DOMContentLoaded",
        loadQuotes
    );


    window.addEventListener(
        "pageshow",
        () => {

            if (
                quoteLibrary.length > 0
            ) {

                renderNeha();

            }

        }
    );


    window.addEventListener(
        "storage",
        event => {

            const watchedKeys = [
                "hanaFitData",
                "hanaFitTraining",
                "hanaFitWellbeing"
            ];


            if (
                watchedKeys.includes(
                    event.key
                )
            ) {

                renderNeha();

            }

        }
    );


    window.HanaNeha = {
        refresh:
            renderNeha
    };

})();