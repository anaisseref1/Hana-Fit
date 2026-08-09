/* =========================================
   HANA FIT — NUTRITION
   Objectifs dynamiques + portions recettes
========================================= */

const foodForm = document.getElementById("foodForm");
const mealList = document.getElementById("mealList");

const foodDatabaseSearch = document.getElementById("foodDatabaseSearch");
const foodDatabaseResults = document.getElementById("foodDatabaseResults");
const selectedFoodCard = document.getElementById("selectedFoodCard");
const selectedFoodEmoji = document.getElementById("selectedFoodEmoji");
const selectedFoodName = document.getElementById("selectedFoodName");
const selectedFoodReference = document.getElementById("selectedFoodReference");
const selectedFoodQuantity = document.getElementById("selectedFoodQuantity");
const selectedFoodUnit = document.getElementById("selectedFoodUnit");
const databaseMealType = document.getElementById("databaseMealType");
const selectedFoodCalories = document.getElementById("selectedFoodCalories");
const selectedFoodProtein = document.getElementById("selectedFoodProtein");
const selectedFoodCarbs = document.getElementById("selectedFoodCarbs");
const selectedFoodFat = document.getElementById("selectedFoodFat");
const addDatabaseFoodButton = document.getElementById("addDatabaseFoodButton");

let foodDatabase = [];
let selectedDatabaseFood = null;

let nutritionTargets = {
    minCalories: 1500,
    maxCalories: 1550,
    protein: 110,
    programName: "1500-1550"
};


/* =========================================
   OUTILS
========================================= */

function roundOne(value) {
    return Math.round(Number(value) * 10) / 10;
}

function formatPortion(value) {
    const rounded = roundOne(value);
    return Number.isInteger(rounded)
        ? String(rounded)
        : rounded.toFixed(1).replace(".", ",");
}

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

async function loadDatabaseFile(filename) {
    const response = await fetch(`../assets/database/${filename}`);

    if (!response.ok) {
        throw new Error(`Impossible de charger ${filename}`);
    }

    return await response.json();
}


/* =========================================
   STOCKAGE DU JOUR
========================================= */

function getTodayMeals() {
    return window.HanaStorage.getTodayEntries(
        window.HanaStorage.keys.nutrition
    );
}

function saveTodayMeals(meals) {
    window.HanaStorage.saveTodayEntries(
        window.HanaStorage.keys.nutrition,
        meals
    );
}


/* =========================================
   PROGRAMME ACTIF / OBJECTIFS
========================================= */

function readActiveProgramSelection() {
    const raw = localStorage.getItem("hanaFitActiveProgram");

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function findActiveProgram(programs, selection) {
    if (!Array.isArray(programs) || programs.length === 0) {
        return null;
    }

    if (!selection) {
        return (
            programs.find(program => program.name === "1500-1550") ||
            programs.find(program => Number(program.id) === 1) ||
            programs[0]
        );
    }

    if (typeof selection === "object") {
        const possibleId =
            selection.id ??
            selection.programId ??
            selection.program?.id;

        const possibleName =
            selection.name ??
            selection.programName ??
            selection.key ??
            selection.slug ??
            selection.program?.name;

        if (possibleId !== undefined) {
            const byId = programs.find(
                program => Number(program.id) === Number(possibleId)
            );

            if (byId) {
                return byId;
            }
        }

        if (possibleName) {
            const byName = programs.find(
                program => String(program.name) === String(possibleName)
            );

            if (byName) {
                return byName;
            }
        }
    }

    const selectionText = String(selection);

    return (
        programs.find(program => String(program.name) === selectionText) ||
        programs.find(program => String(program.id) === selectionText) ||
        programs.find(program => program.name === "1500-1550") ||
        programs[0]
    );
}

async function loadNutritionTargets() {
    try {
        const programs = await loadDatabaseFile("programs.json");
        const selection = readActiveProgramSelection();
        const activeProgram = findActiveProgram(programs, selection);

        if (!activeProgram) {
            return;
        }

        const targets = activeProgram.targets || {};

        nutritionTargets = {
            minCalories:
                Number(targets.caloriesMin ?? targets.min) || 1500,

            maxCalories:
                Number(targets.caloriesMax ?? targets.max) || 1550,

            protein:
                Number(targets.protein) || 110,

            programName:
                activeProgram.name || "1500-1550"
        };

        const mainData = window.HanaStorage.loadMainData();

        mainData.calorieGoal = nutritionTargets.maxCalories;
        mainData.calorieGoalMin = nutritionTargets.minCalories;
        mainData.proteinGoal = nutritionTargets.protein;
        mainData.activeProgram = nutritionTargets.programName;

        window.HanaStorage.saveMainData(mainData);

    } catch (error) {
        console.error("Erreur objectifs nutrition :", error);
    }
}


/* =========================================
   TOTALS JOURNÉE
========================================= */

function calculateTotals(meals) {
    return meals.reduce(
        (totals, meal) => {
            totals.calories += Number(meal.calories) || 0;
            totals.protein += Number(meal.protein) || 0;
            totals.carbs += Number(meal.carbs) || 0;
            totals.fat += Number(meal.fat) || 0;
            return totals;
        },
        {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        }
    );
}

function updateMainData(totals) {
    const mainData = window.HanaStorage.loadMainData();

    mainData.caloriesToday = Math.round(totals.calories);
    mainData.proteinToday = Math.round(totals.protein);

    mainData.calorieGoal = nutritionTargets.maxCalories;
    mainData.calorieGoalMin = nutritionTargets.minCalories;
    mainData.proteinGoal = nutritionTargets.protein;
    mainData.activeProgram = nutritionTargets.programName;

    window.HanaStorage.saveMainData(mainData);
}

function updateTotals(meals) {
    const totals = calculateTotals(meals);

    const calories = Math.round(totals.calories);
    const protein = roundOne(totals.protein);
    const carbs = roundOne(totals.carbs);
    const fat = roundOne(totals.fat);

    document.getElementById("summaryCalories").textContent =
        `${calories} / ${nutritionTargets.maxCalories}`;

    document.getElementById("summaryProtein").textContent =
        `${protein} / ${nutritionTargets.protein} g`;

    document.getElementById("summaryCarbs").textContent =
        `${carbs} g`;

    document.getElementById("summaryFat").textContent =
        `${fat} g`;

    document.getElementById("totalCalories").textContent =
        `${calories} kcal`;

    document.getElementById("totalProtein").textContent =
        `${protein} g`;

    document.getElementById("totalCarbs").textContent =
        `${carbs} g`;

    document.getElementById("totalFat").textContent =
        `${fat} g`;

    updateMainData(totals);
}


/* =========================================
   AFFICHAGE JOURNAL
========================================= */

function deleteMeal(index) {
    const meals = getTodayMeals();

    meals.splice(index, 1);
    saveTodayMeals(meals);
    renderMeals();
}

function createMealElement(meal, index) {
    const article = document.createElement("article");

    article.className = "food-item";

    let sourceLabel = "";

    if (meal.source === "recipe") {
        sourceLabel = " · Recette Hana Fit";
    }

    if (meal.source === "database") {
        sourceLabel = " · Base Hana Fit";
    }

    const portion =
        Number(meal.portion) > 0
            ? Number(meal.portion)
            : 1;

    const portionLabel =
        meal.source === "recipe" &&
        Math.abs(portion - 1) > 0.001
            ? ` · portion ×${formatPortion(portion)}`
            : "";

    const quantityLabel =
        meal.source === "database" &&
        meal.quantity &&
        meal.unit
            ? ` · ${formatPortion(meal.quantity)} ${meal.unit}`
            : "";

    article.innerHTML = `
        <div>
            <h3>${meal.name}</h3>

            <p>
                ${meal.mealType || "Repas"}
                ${sourceLabel}
                ${portionLabel}
                ${quantityLabel}
            </p>

            <strong>
                ${Math.round(Number(meal.calories) || 0)} kcal
                · P ${roundOne(meal.protein || 0)} g
                · G ${roundOne(meal.carbs || 0)} g
                · L ${roundOne(meal.fat || 0)} g
            </strong>
        </div>

        <button
            type="button"
            class="delete-button"
            aria-label="Supprimer"
            title="Supprimer"
        >
            ×
        </button>
    `;

    article
        .querySelector(".delete-button")
        .addEventListener(
            "click",
            () => deleteMeal(index)
        );

    return article;
}

function renderMeals() {
    const meals = getTodayMeals();

    mealList.innerHTML = "";

    if (meals.length === 0) {
        mealList.innerHTML = `
            <p class="empty-message">
                Aucun repas ajouté aujourd'hui.
            </p>
        `;
    } else {
        meals.forEach(
            (meal, index) => {
                mealList.appendChild(
                    createMealElement(meal, index)
                );
            }
        );
    }

    updateTotals(meals);
}


/* =========================================
   AJOUT MANUEL
========================================= */

function createMealFromForm() {
    return {
        name:
            document.getElementById("foodName").value.trim(),

        mealType:
            document.getElementById("mealType").value,

        calories:
            Number(document.getElementById("foodCalories").value),

        protein:
            Number(document.getElementById("foodProtein").value),

        carbs:
            Number(document.getElementById("foodCarbs").value),

        fat:
            Number(document.getElementById("foodFat").value),

        source:
            "manual",

        addedAt:
            new Date().toISOString()
    };
}

if (foodForm) {
    foodForm.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            const meals = getTodayMeals();

            meals.push(
                createMealFromForm()
            );

            saveTodayMeals(meals);

            foodForm.reset();

            renderMeals();
        }
    );
}


/* =========================================
   BASE ALIMENTAIRE
========================================= */

function calculateFoodNutrition(food, quantity) {
    if (!food || !food.nutrition) {
        return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };
    }

    const referenceAmount =
        Number(food.serving?.amount) || 100;

    const amount =
        Number(quantity) || 0;

    const factor =
        amount / referenceAmount;

    return {
        calories:
            Math.round(
                food.nutrition.calories *
                factor
            ),

        protein:
            roundOne(
                food.nutrition.protein *
                factor
            ),

        carbs:
            roundOne(
                food.nutrition.carbs *
                factor
            ),

        fat:
            roundOne(
                food.nutrition.fat *
                factor
            )
    };
}

function renderFoodSearchResults(search) {
    if (!foodDatabaseResults) {
        return;
    }

    foodDatabaseResults.innerHTML = "";

    const term =
        normalizeText(search);

    if (term.length === 0) {
        return;
    }

    const results =
        foodDatabase
            .filter(
                food => {
                    const name =
                        normalizeText(food.name);

                    const category =
                        normalizeText(food.category);

                    return (
                        name.includes(term) ||
                        category.includes(term)
                    );
                }
            )
            .slice(0, 8);

    if (results.length === 0) {
        foodDatabaseResults.innerHTML = `
            <p class="empty-message">
                Aucun aliment trouvé dans Hana Fit.
            </p>
        `;

        return;
    }

    results.forEach(
        food => {
            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "food-search-result";

            button.innerHTML = `
                <span class="food-result-emoji">
                    ${food.emoji || "🍽️"}
                </span>

                <span class="food-result-info">
                    <strong>
                        ${food.name}
                    </strong>

                    <span>
                        ${food.category || "Aliment"}
                        · pour
                        ${food.serving?.amount || 100}
                        ${food.serving?.unit || "g"}
                    </span>
                </span>

                <span class="food-result-calories">
                    ${food.nutrition?.calories || 0}
                    kcal
                </span>
            `;

            button.addEventListener(
                "click",
                () => selectDatabaseFood(food)
            );

            foodDatabaseResults.appendChild(button);
        }
    );
}

function selectDatabaseFood(food) {
    selectedDatabaseFood = food;

    selectedFoodCard.hidden = false;
    selectedFoodEmoji.textContent = food.emoji || "🍽️";
    selectedFoodName.textContent = food.name;

    const amount =
        food.serving?.amount || 100;

    const unit =
        food.serving?.unit || "g";

    selectedFoodReference.textContent =
        `Valeurs de référence pour ${amount} ${unit}`;

    selectedFoodUnit.textContent = unit;
    selectedFoodQuantity.value = amount;

    foodDatabaseSearch.value = food.name;
    foodDatabaseResults.innerHTML = "";

    updateSelectedFoodMacros();
}

function updateSelectedFoodMacros() {
    if (!selectedDatabaseFood) {
        return;
    }

    const quantity =
        Number(selectedFoodQuantity.value);

    const nutrition =
        calculateFoodNutrition(
            selectedDatabaseFood,
            quantity
        );

    selectedFoodCalories.textContent =
        `${nutrition.calories} kcal`;

    selectedFoodProtein.textContent =
        `${nutrition.protein} g`;

    selectedFoodCarbs.textContent =
        `${nutrition.carbs} g`;

    selectedFoodFat.textContent =
        `${nutrition.fat} g`;
}

if (foodDatabaseSearch) {
    foodDatabaseSearch.addEventListener(
        "input",
        event => {
            if (
                selectedDatabaseFood &&
                event.target.value !== selectedDatabaseFood.name
            ) {
                selectedDatabaseFood = null;
                selectedFoodCard.hidden = true;
            }

            renderFoodSearchResults(
                event.target.value
            );
        }
    );
}

if (selectedFoodQuantity) {
    selectedFoodQuantity.addEventListener(
        "input",
        updateSelectedFoodMacros
    );
}

if (addDatabaseFoodButton) {
    addDatabaseFoodButton.addEventListener(
        "click",
        () => {
            if (!selectedDatabaseFood) {
                return;
            }

            const quantity =
                Number(selectedFoodQuantity.value);

            if (
                !Number.isFinite(quantity) ||
                quantity <= 0
            ) {
                selectedFoodQuantity.focus();
                return;
            }

            const nutrition =
                calculateFoodNutrition(
                    selectedDatabaseFood,
                    quantity
                );

            const unit =
                selectedDatabaseFood.serving?.unit || "g";

            const meals =
                getTodayMeals();

            meals.push({
                name:
                    `${selectedDatabaseFood.emoji || "🍽️"} ${selectedDatabaseFood.name}`,

                mealType:
                    databaseMealType.value,

                quantity,
                unit,

                calories:
                    nutrition.calories,

                protein:
                    nutrition.protein,

                carbs:
                    nutrition.carbs,

                fat:
                    nutrition.fat,

                foodId:
                    selectedDatabaseFood.id,

                source:
                    "database",

                addedAt:
                    new Date().toISOString()
            });

            saveTodayMeals(meals);

            selectedDatabaseFood = null;
            selectedFoodCard.hidden = true;
            foodDatabaseSearch.value = "";
            foodDatabaseResults.innerHTML = "";

            renderMeals();
        }
    );
}


/* =========================================
   CALCUL RECETTE + PORTION
========================================= */

function calculateRecipeNutrition(
    recipe,
    foods,
    portion = 1
) {
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };

    const portionFactor =
        Number(portion) > 0
            ? Number(portion)
            : 1;

    if (
        !recipe ||
        !Array.isArray(recipe.ingredients)
    ) {
        return totals;
    }

    recipe.ingredients.forEach(
        ingredient => {
            const food =
                foods.find(
                    item =>
                        item.id ===
                        ingredient.foodId
                );

            if (!food || !food.nutrition) {
                return;
            }

            const reference =
                Number(food.serving?.amount) || 100;

            const factor =
                (
                    Number(ingredient.quantity) /
                    reference
                ) *
                portionFactor;

            totals.calories +=
                food.nutrition.calories *
                factor;

            totals.protein +=
                food.nutrition.protein *
                factor;

            totals.carbs +=
                food.nutrition.carbs *
                factor;

            totals.fat +=
                food.nutrition.fat *
                factor;
        }
    );

    return {
        calories:
            Math.round(totals.calories),

        protein:
            roundOne(totals.protein),

        carbs:
            roundOne(totals.carbs),

        fat:
            roundOne(totals.fat)
    };
}


/* =========================================
   IMPORT RECETTE
========================================= */

async function importSelectedRecipe() {
    const selectedRecipeRaw =
        localStorage.getItem(
            "hanaFitSelectedRecipe"
        );

    if (!selectedRecipeRaw) {
        return;
    }

    /*
     * IMPORTANT :
     * suppression immédiate avant les await,
     * pour empêcher les doublons au refresh.
     */
    localStorage.removeItem(
        "hanaFitSelectedRecipe"
    );

    try {
        const selectedRecipe =
            JSON.parse(
                selectedRecipeRaw
            );

        if (!selectedRecipe.recipeId) {
            return;
        }

        const portion =
            Number(selectedRecipe.portion) > 0
                ? Number(selectedRecipe.portion)
                : 1;

        const [
            recipes,
            foods
        ] =
            await Promise.all([
                loadDatabaseFile("recipes.json"),
                loadDatabaseFile("foods.json")
            ]);

        const recipe =
            recipes.find(
                item =>
                    item.id ===
                    Number(
                        selectedRecipe.recipeId
                    )
            );

        if (!recipe) {
            throw new Error(
                "Recette introuvable"
            );
        }

        const nutrition =
            calculateRecipeNutrition(
                recipe,
                foods,
                portion
            );

        const meals =
            getTodayMeals();

        meals.push({
            name:
                `${recipe.emoji || "🍽️"} ${recipe.name}`,

            mealType:
                recipe.meal || "Repas",

            portion,

            calories:
                nutrition.calories,

            protein:
                nutrition.protein,

            carbs:
                nutrition.carbs,

            fat:
                nutrition.fat,

            recipeId:
                recipe.id,

            source:
                "recipe",

            addedAt:
                new Date().toISOString()
        });

        saveTodayMeals(meals);

    } catch (error) {
        console.error(
            "Erreur import recette :",
            error
        );
    }
}


/* =========================================
   CHARGER ALIMENTS
========================================= */

async function loadFoodDatabase() {
    try {
        foodDatabase =
            await loadDatabaseFile(
                "foods.json"
            );

    } catch (error) {
        console.error(
            "Erreur base alimentaire :",
            error
        );

        if (foodDatabaseResults) {
            foodDatabaseResults.innerHTML = `
                <p class="empty-message">
                    Impossible de charger la base alimentaire.
                </p>
            `;
        }
    }
}


/* =========================================
   INITIALISATION
========================================= */

async function initNutrition() {
    await Promise.all([
        loadFoodDatabase(),
        importSelectedRecipe(),
        loadNutritionTargets()
    ]);

    renderMeals();
}

initNutrition();