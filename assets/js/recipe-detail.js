/* =========================================
   HANA FIT — DÉTAIL D'UNE RECETTE
   Compatible avec les portions des programmes
========================================= */

const recipeEmoji =
    document.getElementById("recipe-emoji");

const recipeMeal =
    document.getElementById("recipe-meal");

const recipeTitle =
    document.getElementById("recipe-title");

const recipeSubtitle =
    document.getElementById("recipe-subtitle");

const recipeCalories =
    document.getElementById("recipe-calories");

const recipeProtein =
    document.getElementById("recipe-protein");

const recipeCarbs =
    document.getElementById("recipe-carbs");

const recipeFat =
    document.getElementById("recipe-fat");

const recipeIngredients =
    document.getElementById("recipe-ingredients");

const recipePrepTime =
    document.getElementById("recipe-prep-time");

const recipeCookTime =
    document.getElementById("recipe-cook-time");

const recipeServings =
    document.getElementById("recipe-servings");

const recipeSteps =
    document.getElementById("recipe-steps");

const recipeTip =
    document.getElementById("recipe-tip");

const recipeTipText =
    document.getElementById("recipe-tip-text");

const addRecipeButton =
    document.getElementById("add-recipe-button");


let recipes = [];
let foods = [];
let currentRecipe = null;
let currentPortion = 1;


const FAVORITES_KEY =
    "hanaFitRecipeFavorites";


/* =========================================
   PARAMÈTRES URL
========================================= */

function getRecipeIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        Number(
            params.get("id")
        );

    return Number.isFinite(id)
        ? id
        : null;

}


function getPortionFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const portion =
        Number(
            params.get("portion")
        );

    if (
        !Number.isFinite(portion) ||
        portion <= 0
    ) {

        return 1;

    }

    return portion;

}


/* =========================================
   ARRONDIS / FORMAT
========================================= */

function roundOne(value) {

    return Math.round(
        Number(value) * 10
    ) / 10;

}


function formatNumber(value) {

    const rounded =
        roundOne(value);

    return Number.isInteger(rounded)
        ? String(rounded)
        : rounded
            .toFixed(1)
            .replace(".", ",");

}


function formatQuantity(quantity) {

    return formatNumber(
        quantity
    );

}


function formatTime(minutes) {

    const value =
        Number(minutes);

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return "—";

    }

    if (value < 60) {

        return `${value} min`;

    }

    const hours =
        Math.floor(
            value / 60
        );

    const remainingMinutes =
        value % 60;

    if (
        remainingMinutes === 0
    ) {

        return `${hours} h`;

    }

    return `${hours} h ${remainingMinutes} min`;

}


/* =========================================
   FAVORIS
========================================= */

function getFavoriteRecipeIds() {

    try {

        const saved =
            localStorage.getItem(
                FAVORITES_KEY
            );

        if (saved === null) {

            const defaultFavorites =
                recipes
                    .filter(
                        recipe =>
                            recipe.favorite === true
                    )
                    .map(
                        recipe =>
                            recipe.id
                    );

            saveFavoriteRecipeIds(
                defaultFavorites
            );

            return defaultFavorites;

        }

        const parsed =
            JSON.parse(saved);

        return Array.isArray(parsed)
            ? parsed.map(Number)
            : [];

    } catch {

        return [];

    }

}


function saveFavoriteRecipeIds(ids) {

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(ids)
    );

}


function isRecipeFavorite(recipeId) {

    return getFavoriteRecipeIds()
        .includes(
            Number(recipeId)
        );

}


function toggleRecipeFavorite(recipeId) {

    const id =
        Number(recipeId);

    let favorites =
        getFavoriteRecipeIds();

    if (
        favorites.includes(id)
    ) {

        favorites =
            favorites.filter(
                favoriteId =>
                    favoriteId !== id
            );

    } else {

        favorites.push(id);

    }

    saveFavoriteRecipeIds(
        favorites
    );

    updateFavoriteButton();

}


/* =========================================
   BOUTON FAVORI
========================================= */

function createFavoriteButton() {

    if (
        document.getElementById(
            "recipe-favorite-button"
        )
    ) {

        return;

    }

    const button =
        document.createElement(
            "button"
        );

    button.type =
        "button";

    button.id =
        "recipe-favorite-button";

    button.className =
        "button button-secondary";

    button.style.marginTop =
        "14px";

    button.style.border =
        "1px solid #dbeafe";

    button.style.cursor =
        "pointer";

    button.addEventListener(
        "click",
        () => {

            if (!currentRecipe) {
                return;
            }

            toggleRecipeFavorite(
                currentRecipe.id
            );

        }
    );

    recipeSubtitle.insertAdjacentElement(
        "afterend",
        button
    );

    updateFavoriteButton();

}


function updateFavoriteButton() {

    const button =
        document.getElementById(
            "recipe-favorite-button"
        );

    if (
        !button ||
        !currentRecipe
    ) {

        return;

    }

    const favorite =
        isRecipeFavorite(
            currentRecipe.id
        );

    button.textContent =
        favorite
            ? "⭐ Retirer des favoris"
            : "☆ Ajouter aux favoris";

    button.title =
        favorite
            ? "Retirer cette recette de mes favoris"
            : "Ajouter cette recette à mes favoris";

    if (favorite) {

        button.style.background =
            "#fff7ed";

        button.style.color =
            "#9a5b00";

        button.style.borderColor =
            "#fed7aa";

    } else {

        button.style.background =
            "#eff6ff";

        button.style.color =
            "#2563eb";

        button.style.borderColor =
            "#dbeafe";

    }

}


/* =========================================
   ALIMENTS
========================================= */

function getFoodById(id) {

    return foods.find(
        food =>
            food.id === id
    );

}


/* =========================================
   CALCUL NUTRITIONNEL
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
                ) || 100;

            const ingredientQuantity =
                Number(
                    ingredient.quantity
                ) || 0;

            const factor =
                (
                    ingredientQuantity /
                    referenceAmount
                ) *
                portionFactor;

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
            roundOne(
                total.protein
            ),

        carbs:
            roundOne(
                total.carbs
            ),

        fat:
            roundOne(
                total.fat
            )

    };

}


/* =========================================
   INGRÉDIENTS
========================================= */

function renderIngredients(
    recipe,
    portion
) {

    recipeIngredients.innerHTML =
        "";

    if (
        !Array.isArray(
            recipe.ingredients
        ) ||
        recipe.ingredients.length === 0
    ) {

        recipeIngredients.innerHTML = `

            <div class="database-error">
                Aucun ingrédient enregistré.
            </div>

        `;

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

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "shopping-item";

            row.style.cursor =
                "default";

            const adjustedQuantity =
                Number(
                    ingredient.quantity
                ) *
                portion;

            row.innerHTML = `

                <span></span>

                <span class="shopping-item-emoji">
                    ${food.emoji || "🍽️"}
                </span>

                <span class="shopping-item-name">
                    ${food.name}
                </span>

                <strong class="shopping-item-quantity">

                    ${formatQuantity(
                        adjustedQuantity
                    )}

                    ${food.serving?.unit || "g"}

                </strong>

            `;

            recipeIngredients.appendChild(
                row
            );

        }
    );

}


/* =========================================
   ÉTAPES
========================================= */

function renderInstructions(recipe) {

    recipeSteps.innerHTML =
        "";

    if (
        !Array.isArray(
            recipe.instructions
        ) ||
        recipe.instructions.length === 0
    ) {

        recipeSteps.innerHTML = `

            <div class="recipe-step">

                <div class="recipe-step-number">
                    ?
                </div>

                <p>
                    Les étapes de préparation
                    seront ajoutées prochainement.
                </p>

            </div>

        `;

        return;

    }

    recipe.instructions.forEach(
        (instruction, index) => {

            const step =
                document.createElement(
                    "div"
                );

            step.className =
                "recipe-step";

            step.innerHTML = `

                <div class="recipe-step-number">
                    ${index + 1}
                </div>

                <p>
                    ${instruction}
                </p>

            `;

            recipeSteps.appendChild(
                step
            );

        }
    );

}


/* =========================================
   ASTUCE
========================================= */

function renderTip(recipe) {

    if (
        recipe.tip &&
        String(recipe.tip).trim()
    ) {

        recipeTip.hidden =
            false;

        recipeTipText.textContent =
            recipe.tip;

    } else {

        recipeTip.hidden =
            true;

        recipeTipText.textContent =
            "";

    }

}


/* =========================================
   INFOS PRÉPARATION / PORTION
========================================= */

function renderPreparationInfo(
    recipe,
    portion
) {

    recipePrepTime.textContent =
        formatTime(
            recipe.prepTime
        );

    recipeCookTime.textContent =
        formatTime(
            recipe.cookTime
        );

    const baseServings =
        Number(
            recipe.servings
        ) > 0
            ? Number(
                recipe.servings
            )
            : 1;

    const adjustedServings =
        baseServings *
        portion;

    recipeServings.textContent =
        `${formatNumber(adjustedServings)} portion${
            adjustedServings > 1
                ? "s"
                : ""
        }`;

}


/* =========================================
   AFFICHER LA RECETTE
========================================= */

function renderRecipe(
    recipe,
    portion
) {

    const nutrition =
        calculateRecipeNutrition(
            recipe,
            portion
        );

    recipeEmoji.textContent =
        recipe.emoji ||
        "🍽️";

    recipeMeal.textContent =
        recipe.meal
            ? recipe.meal.toUpperCase()
            : "RECETTE";

    recipeTitle.textContent =
        recipe.name;

    const ingredientCount =
        recipe.ingredients?.length ||
        0;

    const portionText =
        Math.abs(
            portion - 1
        ) > 0.001
            ? ` · portion ×${formatNumber(portion)}`
            : "";

    recipeSubtitle.textContent =
        `${ingredientCount} ingrédient${
            ingredientCount > 1
                ? "s"
                : ""
        }${portionText} · ${nutrition.calories} kcal`;

    recipeCalories.textContent =
        nutrition.calories;

    recipeProtein.textContent =
        nutrition.protein;

    recipeCarbs.textContent =
        nutrition.carbs;

    recipeFat.textContent =
        nutrition.fat;

    renderPreparationInfo(
        recipe,
        portion
    );

    renderIngredients(
        recipe,
        portion
    );

    renderInstructions(
        recipe
    );

    renderTip(
        recipe
    );

    createFavoriteButton();

    if (addRecipeButton) {

        addRecipeButton.textContent =
            Math.abs(
                portion - 1
            ) > 0.001
                ? `＋ Ajouter la portion ×${formatNumber(portion)} à ma journée`
                : "＋ Ajouter à ma journée";

    }

}


/* =========================================
   ERREUR
========================================= */

function showRecipeError(message) {

    recipeEmoji.textContent =
        "⚠️";

    recipeMeal.textContent =
        "RECETTE";

    recipeTitle.textContent =
        "Recette introuvable";

    recipeSubtitle.textContent =
        message;

    recipeIngredients.innerHTML = `

        <div class="database-error">

            <strong>
                Impossible d'afficher cette recette.
            </strong>

            <p style="margin-top:8px;">
                ${message}
            </p>

        </div>

    `;

    recipeSteps.innerHTML = `

        <div class="database-error">
            Préparation indisponible.
        </div>

    `;

    if (addRecipeButton) {

        addRecipeButton.disabled =
            true;

    }

}


/* =========================================
   AJOUTER À MA JOURNÉE
========================================= */

if (addRecipeButton) {

    addRecipeButton.addEventListener(
        "click",
        () => {

            if (!currentRecipe) {
                return;
            }

            localStorage.setItem(
                "hanaFitSelectedRecipe",
                JSON.stringify({

                    recipeId:
                        currentRecipe.id,

                    portion:
                        currentPortion,

                    selectedAt:
                        new Date()
                            .toISOString()

                })
            );

            window.location.href =
                "nutrition.html";

        }
    );

}


/* =========================================
   CHARGEMENT
========================================= */

async function loadRecipePage() {

    try {

        const recipeId =
            getRecipeIdFromUrl();

        currentPortion =
            getPortionFromUrl();

        if (!recipeId) {

            showRecipeError(
                "Aucun identifiant de recette n'a été indiqué."
            );

            return;

        }

        const [
            recipesData,
            foodsData
        ] =
            await Promise.all([

                Hana.database.recipes(),

                Hana.database.foods()

            ]);

        recipes =
            recipesData;

        foods =
            foodsData;

        currentRecipe =
            recipes.find(
                recipe =>
                    recipe.id ===
                    recipeId
            );

        if (!currentRecipe) {

            showRecipeError(
                `La recette n°${recipeId} n'existe pas dans recipes.json.`
            );

            return;

        }

        getFavoriteRecipeIds();

        renderRecipe(
            currentRecipe,
            currentPortion
        );

    } catch (error) {

        console.error(
            error
        );

        showRecipeError(
            "Vérifie recipes.json, foods.json et Live Server."
        );

    }

}


/* =========================================
   INITIALISATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadRecipePage
);