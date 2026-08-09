const programsContainer =
    document.getElementById("programs-container");


function formatProgramTitle(program) {
    return `${program.targets.caloriesMin}–${program.targets.caloriesMax} kcal`;
}


function createProgramCard(program) {
    const card =
        document.createElement("article");

    card.className =
        "program-card";

    const totalDays =
        program.durationWeeks *
        program.daysPerWeek;

    const totalMeals =
        totalDays * 4;

    card.innerHTML = `
        <div class="program-top">

            <div class="program-icon">
                ${program.emoji || "🌸"}
            </div>

            <span class="program-goal">
                ${program.goal}
            </span>

        </div>

        <h3 class="program-calories">
            ${formatProgramTitle(program)}
        </h3>

        <p class="program-description">
            ${program.title}
        </p>

        <div class="program-info">

            <div class="program-info-item">
                📅
                <strong>
                    ${program.durationWeeks} semaines
                </strong>
            </div>

            <div class="program-info-item">
                🍽️
                <strong>
                    ${totalMeals} repas
                </strong>
            </div>

            <div class="program-info-item">
                🥩
                <strong>
                    ≈ ${program.targets.protein} g protéines
                </strong>
            </div>

            <div class="program-info-item">
                🛒
                <strong>
                    Liste de courses
                </strong>
            </div>

        </div>

        <button
            type="button"
            class="button button-primary program-button"
            data-program-id="${program.id}"
        >
            ▶ Commencer
        </button>
    `;

    const button =
        card.querySelector(
            ".program-button"
        );

    button.addEventListener(
        "click",
        () => {
            selectProgram(program);
        }
    );

    return card;
}


function selectProgram(program) {
    const activeProgram = {
        id: program.id,
        name: program.name,
        title: program.title,
        week: 1,
        day: 1,
        startedAt:
            new Date().toISOString()
    };

    localStorage.setItem(
        "hanaFitActiveProgram",
        JSON.stringify(activeProgram)
    );

    window.location.href =
        "program-detail.html";
}


function showError(error) {
    console.error(error);

    programsContainer.innerHTML = `
        <div class="database-error">

            <strong>
                Impossible de charger les programmes.
            </strong>

            <p style="margin-top:8px;">
                Vérifie que la page est bien ouverte avec Live Server
                et que programs.json existe dans assets/database.
            </p>

        </div>
    `;
}


async function renderPrograms() {
    try {
        const programs =
            await Hana.database.programs();

        programsContainer.innerHTML =
            "";

        if (
            !Array.isArray(programs) ||
            programs.length === 0
        ) {
            programsContainer.innerHTML = `
                <div class="database-error">
                    Aucun programme disponible pour le moment.
                </div>
            `;

            return;
        }

        programs.forEach(
            program => {
                programsContainer.appendChild(
                    createProgramCard(program)
                );
            }
        );

    } catch (error) {
        showError(error);
    }
}


document.addEventListener(
    "DOMContentLoaded",
    renderPrograms
);