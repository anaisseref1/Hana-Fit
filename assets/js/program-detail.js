const programTitle = document.getElementById("program-title");
const programSubtitle = document.getElementById("program-subtitle");
const weekSelector = document.getElementById("week-selector");
const daysContainer = document.getElementById("days-container");

/* PROGRESSION SEMAINE */
const weekProgressTitle = document.getElementById("week-progress-title");
const weekProgressText = document.getElementById("week-progress-text");
const weekProgressPercent = document.getElementById("week-progress-percent");
const weekProgressBar = document.getElementById("week-progress-bar");

/* PROGRESSION GLOBALE */
const programProgressText = document.getElementById("program-progress-text");
const programProgressPercent = document.getElementById("program-progress-percent");
const programProgressBar = document.getElementById("program-progress-bar");
const programWeeksSummary = document.getElementById("program-weeks-summary");

const nehaProgramTitle = document.getElementById("neha-program-title");
const nehaProgramMessage = document.getElementById("neha-program-message");

/* COURSES */
const shoppingWeekTitle = document.getElementById("shopping-week-title");
const shoppingSubtitle = document.getElementById("shopping-subtitle");
const shoppingListContainer = document.getElementById("shopping-list-container");
const generateShoppingButton = document.getElementById("generate-shopping-list");

let activeProgram = null;
let fullProgram = null;
let recipes = [];
let foods = [];
let currentWeekNumber = 1;


/* =========================================
   PROGRAMME ACTIF
========================================= */

function getActiveProgram() {
    try {
        return JSON.parse(
            localStorage.getItem("hanaFitActiveProgram")
        );
    } catch {
        return null;
    }
}


/* =========================================
   PROGRESSION
========================================= */

function getProgressStorageKey() {
    return fullProgram
        ? `hanaFitProgramProgress_${fullProgram.id}`
        : "hanaFitProgramProgress";
}

function getProgramProgress() {
    try {
        return JSON.parse(
            localStorage.getItem(getProgressStorageKey())
        ) || {};
    } catch {
        return {};
    }
}

function saveProgramProgress(progress) {
    localStorage.setItem(
        getProgressStorageKey(),
        JSON.stringify(progress)
    );
}

function getDayProgressKey(weekNumber, dayNumber) {
    return `${weekNumber}-${dayNumber}`;
}

function isDayCompleted(weekNumber, dayNumber) {
    const progress = getProgramProgress();
    const key = getDayProgressKey(
        weekNumber,
        dayNumber
    );

    return progress[key] === true;
}

function toggleDayCompleted(weekNumber, dayNumber) {
    const progress = getProgramProgress();

    const key = getDayProgressKey(
        weekNumber,
        dayNumber
    );

    progress[key] = !progress[key];

    saveProgramProgress(progress);

    renderWeek(weekNumber);
}


/* =========================================
   PROGRESSION SEMAINE
========================================= */

function getWeekProgress(weekNumber) {
    const week = fullProgram.weeks.find(
        item => item.week === weekNumber
    );

    if (!week) {
        return {
            completed: 0,
            total: 0,
            percent: 0
        };
    }

    const total = week.days.length;

    const completed = week.days.filter(
        day =>
            isDayCompleted(
                weekNumber,
                day.day
            )
    ).length;

    const percent =
        total > 0
            ? Math.round(
                (completed / total) * 100
            )
            : 0;

    return {
        completed,
        total,
        percent
    };
}

function updateWeekProgress(weekNumber) {
    const progress =
        getWeekProgress(weekNumber);

    if (weekProgressTitle) {
        weekProgressTitle.textContent =
            `Semaine ${weekNumber}`;
    }

    if (weekProgressText) {
        weekProgressText.textContent =
            `${progress.completed}/${progress.total} jours terminés`;
    }

    if (weekProgressPercent) {
        weekProgressPercent.textContent =
            `${progress.percent}%`;
    }

    if (weekProgressBar) {
        weekProgressBar.style.width =
            `${progress.percent}%`;
    }
}


/* =========================================
   PROGRESSION GLOBALE
========================================= */

function calculateProgramProgress() {
    let totalDays = 0;
    let completedDays = 0;

    fullProgram.weeks.forEach(week => {
        week.days.forEach(day => {
            totalDays++;

            if (
                isDayCompleted(
                    week.week,
                    day.day
                )
            ) {
                completedDays++;
            }
        });
    });

    const percent =
        totalDays > 0
            ? Math.round(
                (completedDays / totalDays) * 100
            )
            : 0;

    return {
        totalDays,
        completedDays,
        percent
    };
}

function updateNehaProgramMessage(percent) {
    if (
        !nehaProgramTitle ||
        !nehaProgramMessage
    ) {
        return;
    }

    if (percent === 100) {
        nehaProgramTitle.textContent =
            "Programme terminé ! 🎉";

        nehaProgramMessage.textContent =
            "Les 28 journées sont terminées. Bravo pour ta régularité 💙";

        return;
    }

    if (percent >= 75) {
        nehaProgramTitle.textContent =
            "La dernière ligne droite 🐈";

        nehaProgramMessage.textContent =
            "Tu as déjà réalisé plus des trois quarts de ton programme.";

        return;
    }

    if (percent >= 50) {
        nehaProgramTitle.textContent =
            "Déjà la moitié 💙";

        nehaProgramMessage.textContent =
            "Ta progression se construit journée après journée.";

        return;
    }

    if (percent >= 25) {
        nehaProgramTitle.textContent =
            "Ton rythme s'installe 🌸";

        nehaProgramMessage.textContent =
            "Continue simplement à avancer une journée à la fois.";

        return;
    }

    if (percent > 0) {
        nehaProgramTitle.textContent =
            "Le programme est lancé 🐈";

        nehaProgramMessage.textContent =
            "Tes premières journées sont déjà enregistrées.";

        return;
    }

    nehaProgramTitle.textContent =
        "Une semaine à la fois 💙";

    nehaProgramMessage.textContent =
        "Chaque journée terminée te rapproche de la fin de ton programme.";
}

function renderProgramWeeksSummary() {
    if (!programWeeksSummary) {
        return;
    }

    programWeeksSummary.innerHTML = "";

    fullProgram.weeks.forEach(week => {
        const progress =
            getWeekProgress(week.week);

        const item =
            document.createElement("button");

        item.type = "button";
        item.className =
            "program-week-summary-item";

        if (
            progress.completed ===
                progress.total &&
            progress.total > 0
        ) {
            item.classList.add(
                "completed"
            );
        }

        item.innerHTML = `
            <span>
                Semaine ${week.week}
            </span>

            <strong>
                ${
                    progress.completed ===
                        progress.total &&
                    progress.total > 0
                        ? "✓ "
                        : ""
                }

                ${progress.completed}/${progress.total}
            </strong>
        `;

        item.addEventListener(
            "click",
            () => {
                renderWeek(week.week);

                weekSelector.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        );

        programWeeksSummary.appendChild(
            item
        );
    });
}

function updateProgramProgress() {
    if (!fullProgram) {
        return;
    }

    const progress =
        calculateProgramProgress();

    if (programProgressText) {
        programProgressText.textContent =
            `${progress.completedDays}/${progress.totalDays} jours terminés`;
    }

    if (programProgressPercent) {
        programProgressPercent.textContent =
            `${progress.percent}%`;
    }

    if (programProgressBar) {
        programProgressBar.style.width =
            `${progress.percent}%`;
    }

    renderProgramWeeksSummary();

    updateNehaProgramMessage(
        progress.percent
    );
}


/* =========================================
   RECETTES / ALIMENTS
========================================= */

function getRecipeById(id) {
    return recipes.find(
        recipe => recipe.id === id
    );
}

function getFoodById(id) {
    return foods.find(
        food => food.id === id
    );
}


/* =========================================
   CALCUL RECETTE
========================================= */

function normalizeMealEntry(mealValue) {
    if (
        typeof mealValue === "number" ||
        typeof mealValue === "string"
    ) {
        const recipeId =
            Number(mealValue);

        return {
            recipeId:
                Number.isFinite(recipeId)
                    ? recipeId
                    : null,

            portion: 1
        };
    }

    if (
        mealValue &&
        typeof mealValue === "object"
    ) {
        const recipeId =
            Number(
                mealValue.recipeId ??
                mealValue.id ??
                mealValue.recipe
            );

        const rawPortion =
            Number(
                mealValue.portion ??
                mealValue.multiplier ??
                1
            );

        return {
            recipeId:
                Number.isFinite(recipeId)
                    ? recipeId
                    : null,

            portion:
                Number.isFinite(rawPortion) &&
                rawPortion > 0
                    ? rawPortion
                    : 1
        };
    }

    return {
        recipeId: null,
        portion: 1
    };
}


function formatPortion(portion) {
    return Number(portion)
        .toLocaleString(
            "fr-FR",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );
}


/* =========================================
   CALCUL RECETTE
========================================= */

function calculateRecipeNutrition(
    recipe,
    portion = 1
) {
    const total = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    if (
        !recipe ||
        !Array.isArray(
            recipe.ingredients
        )
    ) {
        return total;
    }

    const portionFactor =
        Number.isFinite(
            Number(portion)
        ) &&
        Number(portion) > 0
            ? Number(portion)
            : 1;

    recipe.ingredients.forEach(
        ingredient => {
            const food =
                getFoodById(
                    ingredient.foodId
                );

            if (
                !food ||
                !food.nutrition
            ) {
                return;
            }

            const referenceAmount =
                Number(
                    food.serving?.amount
                ) ||
                100;

            const ingredientQuantity =
                Number(
                    ingredient.quantity
                ) ||
                0;

            const factor =
                (
                    ingredientQuantity *
                    portionFactor
                ) /
                referenceAmount;

            total.calories +=
                food.nutrition.calories *
                factor;

            total.protein +=
                food.nutrition.protein *
                factor;

            total.carbs +=
                food.nutrition.carbs *
                factor;

            total.fat +=
                food.nutrition.fat *
                factor;
        }
    );

    return {
        calories:
            Math.round(
                total.calories
            ),

        protein:
            Math.round(
                total.protein * 10
            ) / 10,

        carbs:
            Math.round(
                total.carbs * 10
            ) / 10,

        fat:
            Math.round(
                total.fat * 10
            ) / 10
    };
}


/* =========================================
   CALCUL JOURNÉE
========================================= */

function calculateDayNutrition(day) {
    const total = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    Object.values(
        day.meals
    ).forEach(mealValue => {
        const meal =
            normalizeMealEntry(
                mealValue
            );

        const recipe =
            getRecipeById(
                meal.recipeId
            );

        const nutrition =
            calculateRecipeNutrition(
                recipe,
                meal.portion
            );

        total.calories +=
            nutrition.calories;

        total.protein +=
            nutrition.protein;

        total.carbs +=
            nutrition.carbs;

        total.fat +=
            nutrition.fat;
    });

    return {
        calories:
            Math.round(
                total.calories
            ),

        protein:
            Math.round(
                total.protein * 10
            ) / 10,

        carbs:
            Math.round(
                total.carbs * 10
            ) / 10,

        fat:
            Math.round(
                total.fat * 10
            ) / 10
    };
}


/* =========================================
   LABELS
========================================= */

function getMealLabel(key) {
    const labels = {
        breakfast: "Petit-déjeuner",
        lunch: "Déjeuner",
        snack: "Collation",
        dinner: "Dîner"
    };

    return labels[key] || key;
}

function getMealEmoji(key) {
    const emojis = {
        breakfast: "🥣",
        lunch: "🥗",
        snack: "🍎",
        dinner: "🍝"
    };

    return emojis[key] || "🍽️";
}


/* =========================================
   STATUT CALORIQUE
========================================= */

function getCalorieStatus(calories) {
    const min =
        Number(
            fullProgram.targets
                ?.caloriesMin ??
            fullProgram.targets
                ?.min
        ) || 0;

    const max =
        Number(
            fullProgram.targets
                ?.caloriesMax ??
            fullProgram.targets
                ?.max
        ) || Infinity;

    if (calories < min) {
        return "🟠 Sous la cible";
    }

    if (calories > max) {
        return "🔴 Au-dessus de la cible";
    }

    return "🟢 Dans la cible";
}


/* =========================================
   REPAS CLIQUABLE
========================================= */

function createMealRow(
    mealKey,
    mealValue
) {
    const meal =
        normalizeMealEntry(
            mealValue
        );

    const recipeId =
        meal.recipeId;

    const portion =
        meal.portion;

    const recipe =
        getRecipeById(
            recipeId
        );

    const nutrition =
        calculateRecipeNutrition(
            recipe,
            portion
        );

    const row =
        document.createElement("a");

    row.className =
        "program-meal-row";

    row.href =
        recipe
            ? `recipe-detail.html?id=${recipeId}&portion=${portion}`
            : "#";

    row.title =
        recipe
            ? "Voir la recette"
            : "Recette introuvable";

    row.style.textDecoration =
        "none";

    row.style.color =
        "inherit";

    row.style.cursor =
        recipe
            ? "pointer"
            : "default";

    if (!recipe) {
        row.addEventListener(
            "click",
            event =>
                event.preventDefault()
        );
    }

    const portionText =
        Math.abs(
            portion - 1
        ) > 0.001
            ? ` · portion ×${formatPortion(portion)}`
            : "";

    row.innerHTML = `

        <div class="meal-row-icon">
            ${getMealEmoji(mealKey)}
        </div>

        <div class="meal-row-content">

            <span class="meal-row-label">
                ${getMealLabel(mealKey)}
            </span>

            <strong class="meal-row-name">
                ${
                    recipe
                        ? `${recipe.emoji || "🍽️"} ${recipe.name}`
                        : "Recette introuvable"
                }
            </strong>

            ${
                recipe
                    ? `
                        <span class="meal-row-macros">
                            ${nutrition.calories} kcal
                            · P ${nutrition.protein} g
                            · G ${nutrition.carbs} g
                            · L ${nutrition.fat} g
                            ${portionText}
                        </span>
                    `
                    : ""
            }

        </div>

        <span
            style="
                margin-left:auto;
                color:#94a3b8;
                font-size:18px;
            "
        >
            ›
        </span>
    `;

    return row;
}


/* =========================================
   CARTE JOURNÉE
========================================= */

function createDayCard(
    day,
    weekNumber
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "program-day-card";

    const completed =
        isDayCompleted(
            weekNumber,
            day.day
        );

    if (completed) {
        card.classList.add(
            "completed"
        );
    }

    const dayNutrition =
        calculateDayNutrition(day);

    const title =
        document.createElement(
            "div"
        );

    title.className =
        "program-day-heading";

    title.innerHTML = `
        <div>

            <span class="badge">
                JOUR ${day.day}
            </span>

            <h3>
                ${day.name}
            </h3>

        </div>
    `;

    const checkButton =
        document.createElement(
            "button"
        );

    checkButton.type =
        "button";

    checkButton.className =
        "day-check";

    checkButton.textContent =
        completed
            ? "✓"
            : "○";

    checkButton.style.border =
        completed
            ? "1px solid #bbf7d0"
            : "none";

    checkButton.style.background =
        completed
            ? "#dcfce7"
            : "#f1f5f9";

    checkButton.style.color =
        completed
            ? "#16a34a"
            : "#94a3b8";

    checkButton.style.cursor =
        "pointer";

    checkButton.addEventListener(
        "click",
        () => {
            toggleDayCompleted(
                weekNumber,
                day.day
            );
        }
    );

    title.appendChild(
        checkButton
    );

    card.appendChild(
        title
    );


    const meals =
        document.createElement(
            "div"
        );

    meals.className =
        "program-day-meals";

    Object.entries(
        day.meals
    ).forEach(
        ([mealKey, mealValue]) => {
            meals.appendChild(
                createMealRow(
                    mealKey,
                    mealValue
                )
            );
        }
    );

    card.appendChild(
        meals
    );


    const calorieStatus =
        getCalorieStatus(
            dayNutrition.calories
        );

    const total =
        document.createElement(
            "div"
        );

    total.className =
        "day-nutrition-total";

    total.innerHTML = `

        <div style="margin-bottom:12px;">

            <span class="badge">
                ${calorieStatus}
            </span>

        </div>


        <div class="day-total-title">

            <span>
                Total de la journée
            </span>

            <strong>
                ${dayNutrition.calories} kcal
            </strong>

        </div>


        <div class="day-total-macros">

            <span>
                🥩 P
                <strong>
                    ${dayNutrition.protein} g
                </strong>
            </span>

            <span>
                🌾 G
                <strong>
                    ${dayNutrition.carbs} g
                </strong>
            </span>

            <span>
                🥑 L
                <strong>
                    ${dayNutrition.fat} g
                </strong>
            </span>

        </div>
    `;

    card.appendChild(
        total
    );

    return card;
}


/* =========================================
   AFFICHAGE SEMAINE
========================================= */

function renderWeek(weekNumber) {
    const week =
        fullProgram.weeks.find(
            item =>
                item.week ===
                weekNumber
        );

    if (!week) {
        return;
    }

    currentWeekNumber =
        weekNumber;

    document
        .querySelectorAll(
            ".week-button"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                Number(
                    button.dataset.week
                ) ===
                    weekNumber
            );
        });

    daysContainer.innerHTML =
        "";

    week.days.forEach(day => {
        daysContainer.appendChild(
            createDayCard(
                day,
                weekNumber
            )
        );
    });

    activeProgram.week =
        weekNumber;

    localStorage.setItem(
        "hanaFitActiveProgram",
        JSON.stringify(
            activeProgram
        )
    );

    updateWeekProgress(
        weekNumber
    );

    updateProgramProgress();

    updateShoppingSection(
        weekNumber
    );
}


/* =========================================
   SÉLECTEUR SEMAINE
========================================= */

function renderWeekSelector() {
    weekSelector.innerHTML =
        "";

    fullProgram.weeks.forEach(
        week => {
            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "week-button";

            button.dataset.week =
                week.week;

            button.textContent =
                `Semaine ${week.week}`;

            button.addEventListener(
                "click",
                () => {
                    renderWeek(
                        week.week
                    );
                }
            );

            weekSelector.appendChild(
                button
            );
        }
    );
}


/* =========================================
   LISTE DE COURSES
========================================= */

function buildShoppingList(
    weekNumber
) {
    const week =
        fullProgram.weeks.find(
            item =>
                item.week ===
                weekNumber
        );

    if (!week) {
        return [];
    }

    const shoppingMap =
        new Map();

    week.days.forEach(day => {
        Object.values(
            day.meals
        ).forEach(mealValue => {
            const meal =
                normalizeMealEntry(
                    mealValue
                );

            const recipe =
                getRecipeById(
                    meal.recipeId
                );

            if (
                !recipe ||
                !Array.isArray(
                    recipe.ingredients
                )
            ) {
                return;
            }

            recipe.ingredients.forEach(
                ingredient => {
                    const food =
                        getFoodById(
                            ingredient.foodId
                        );

                    if (!food) {
                        return;
                    }

                    const adjustedQuantity =
                        (
                            Number(
                                ingredient.quantity
                            ) || 0
                        ) *
                        meal.portion;

                    const existing =
                        shoppingMap.get(
                            food.id
                        );

                    if (existing) {
                        existing.quantity +=
                            adjustedQuantity;
                    } else {
                        shoppingMap.set(
                            food.id,
                            {
                                id:
                                    food.id,

                                name:
                                    food.name,

                                emoji:
                                    food.emoji ||
                                    "🍽️",

                                category:
                                    food.category ||
                                    "Autres",

                                quantity:
                                    adjustedQuantity,

                                unit:
                                    food.serving?.unit ||
                                    "g"
                            }
                        );
                    }
                }
            );
        });
    });

    return Array.from(
        shoppingMap.values()
    );
}


function formatQuantity(quantity) {
    const rounded =
        Math.round(
            quantity * 10
        ) / 10;

    return Number.isInteger(
        rounded
    )
        ? rounded
        : rounded.toFixed(1);
}


function groupShoppingByCategory(
    items
) {
    const groups = {};

    items.forEach(item => {
        const category =
            item.category ||
            "Autres";

        if (!groups[category]) {
            groups[category] =
                [];
        }

        groups[category].push(
            item
        );
    });

    return groups;
}


function renderShoppingList() {
    const items =
        buildShoppingList(
            currentWeekNumber
        );

    if (items.length === 0) {
        shoppingListContainer.innerHTML = `

            <div class="shopping-empty">

                <span class="shopping-empty-icon">
                    🛍️
                </span>

                <strong>
                    Aucun ingrédient trouvé
                </strong>

            </div>
        `;

        return;
    }

    const grouped =
        groupShoppingByCategory(
            items
        );

    shoppingListContainer.innerHTML =
        "";

    Object.entries(
        grouped
    ).forEach(
        ([category, categoryItems]) => {
            const group =
                document.createElement(
                    "div"
                );

            group.className =
                "shopping-category";

            group.innerHTML = `
                <h4 class="shopping-category-title">
                    ${category}
                </h4>
            `;

            const list =
                document.createElement(
                    "div"
                );

            list.className =
                "shopping-items";

            categoryItems
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name,
                            "fr"
                        )
                )
                .forEach(item => {
                    const row =
                        document.createElement(
                            "label"
                        );

                    row.className =
                        "shopping-item";

                    row.innerHTML = `

                        <input
                            type="checkbox"
                            class="shopping-checkbox"
                        >

                        <span class="shopping-item-emoji">
                            ${item.emoji}
                        </span>

                        <span class="shopping-item-name">
                            ${item.name}
                        </span>

                        <strong class="shopping-item-quantity">
                            ${formatQuantity(item.quantity)}
                            ${item.unit}
                        </strong>
                    `;

                    list.appendChild(
                        row
                    );
                });

            group.appendChild(
                list
            );

            shoppingListContainer.appendChild(
                group
            );
        }
    );
}


/* =========================================
   ZONE COURSES
========================================= */

function updateShoppingSection(
    weekNumber
) {
    if (shoppingWeekTitle) {
        shoppingWeekTitle.textContent =
            `Courses · Semaine ${weekNumber}`;
    }

    if (shoppingSubtitle) {
        shoppingSubtitle.textContent =
            `Tous les ingrédients nécessaires pour la semaine ${weekNumber}.`;
    }

    if (shoppingListContainer) {
        shoppingListContainer.innerHTML = `

            <div class="shopping-empty">

                <span class="shopping-empty-icon">
                    🛍️
                </span>

                <strong>
                    Ta liste de la semaine ${weekNumber}
                    est prête à être générée
                </strong>

                <p>
                    Hana Fit additionnera automatiquement
                    les ingrédients des 7 jours.
                </p>

            </div>
        `;
    }
}


if (generateShoppingButton) {
    generateShoppingButton.addEventListener(
        "click",
        renderShoppingList
    );
}


/* =========================================
   CHARGEMENT
========================================= */

async function loadProgramPage() {
    try {
        activeProgram =
            getActiveProgram();

        if (!activeProgram) {
            daysContainer.innerHTML = `
                <div class="database-error">
                    Aucun programme actif.
                </div>
            `;

            return;
        }

        const [
            programsData,
            recipesData,
            foodsData
        ] =
            await Promise.all([
                Hana.database.programs(),
                Hana.database.recipes(),
                Hana.database.foods()
            ]);

        recipes =
            recipesData;

        foods =
            foodsData;

        fullProgram =
            programsData.find(
                program =>
                    program.id ===
                    activeProgram.id
            );

        if (!fullProgram) {
            throw new Error(
                "Programme introuvable"
            );
        }

        const caloriesMin =
            Number(
                fullProgram.targets
                    ?.caloriesMin ??
                fullProgram.targets
                    ?.min
            ) || 0;

        const caloriesMax =
            Number(
                fullProgram.targets
                    ?.caloriesMax ??
                fullProgram.targets
                    ?.max
            ) || 0;

        programTitle.textContent =
            `${caloriesMin}–${caloriesMax} kcal`;

        programSubtitle.textContent =
            `${fullProgram.durationWeeks} semaines · ${fullProgram.goal}`;

        renderWeekSelector();

        renderWeek(
            Number(
                activeProgram.week
            ) || 1
        );

    } catch (error) {
        console.error(error);

        daysContainer.innerHTML = `
            <div class="database-error">

                <strong>
                    Impossible de charger le programme.
                </strong>

            </div>
        `;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    loadProgramPage
);