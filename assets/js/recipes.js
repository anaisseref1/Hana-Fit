/* =========================================
   HANA FIT — BIBLIOTHÈQUE DE RECETTES
========================================= */

const recipesContainer =
    document.getElementById("recipes-container");

const recipesCount =
    document.getElementById("recipes-count");

const recipeSearch =
    document.getElementById("recipe-search");

const recipeFilters =
    document.querySelectorAll(".recipe-filter");


let recipes = [];
let foods = [];

let activeFilter = "all";
let searchTerm = "";

const FAVORITES_KEY =
    "hanaFitRecipeFavorites";


/* =========================================
   FAVORIS
========================================= */

function getFavoriteRecipeIds() {

    try {

        const saved =
            localStorage.getItem(
                FAVORITES_KEY
            );


        /*
         * Au tout premier lancement,
         * on utilise les favoris déjà
         * indiqués dans recipes.json.
         */
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
            ? parsed
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

    const favorites =
        getFavoriteRecipeIds();


    return favorites.includes(
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


    /*
     * On réaffiche immédiatement
     * la bibliothèque.
     */
    renderRecipes();

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

function calculateRecipeNutrition(recipe) {

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
                food.serving?.amount ||
                100;


            const factor =
                ingredient.quantity /
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
   EMOJI REPAS
========================================= */

function getMealEmoji(meal) {

    const emojis = {

        "Petit-déjeuner":
            "🥣",

        "Déjeuner":
            "🥗",

        "Collation":
            "🍎",

        "Dîner":
            "🍝"

    };


    return emojis[meal] ||
        "🍽️";

}


/* =========================================
   CRÉER UNE CARTE
========================================= */

function createRecipeCard(recipe) {

    const nutrition =
        calculateRecipeNutrition(
            recipe
        );


    const favorite =
        isRecipeFavorite(
            recipe.id
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "recipe-card";


    card.tabIndex =
        0;


    card.setAttribute(
        "role",
        "link"
    );


    card.setAttribute(
        "aria-label",
        `Voir la recette ${recipe.name}`
    );


    card.innerHTML = `

        <div class="recipe-card-top">

            <div class="recipe-card-emoji">
                ${recipe.emoji || "🍽️"}
            </div>


            <button
                type="button"
                class="recipe-favorite"
                aria-label="${
                    favorite
                        ? "Retirer des favoris"
                        : "Ajouter aux favoris"
                }"
                title="${
                    favorite
                        ? "Retirer des favoris"
                        : "Ajouter aux favoris"
                }"
                style="
                    border:none;
                    cursor:pointer;
                "
            >
                ${favorite ? "⭐" : "☆"}
            </button>

        </div>


        <div class="recipe-card-content">

            <span class="recipe-meal-badge">

                ${getMealEmoji(recipe.meal)}
                ${recipe.meal || "Recette"}

            </span>


            <h3>
                ${recipe.name}
            </h3>


            <p class="recipe-ingredient-count">

                ${recipe.ingredients?.length || 0}

                ${
                    recipe.ingredients?.length === 1
                        ? "ingrédient"
                        : "ingrédients"
                }

            </p>


            <div class="recipe-card-calories">

                <strong>
                    ${nutrition.calories}
                </strong>

                <span>
                    kcal
                </span>

            </div>


            <div class="recipe-card-macros">

                <span>

                    🥩

                    <strong>
                        ${nutrition.protein} g
                    </strong>

                    P

                </span>


                <span>

                    🌾

                    <strong>
                        ${nutrition.carbs} g
                    </strong>

                    G

                </span>


                <span>

                    🥑

                    <strong>
                        ${nutrition.fat} g
                    </strong>

                    L

                </span>

            </div>

        </div>


        <div class="recipe-card-footer">

            <span>
                Voir la recette
            </span>

            <strong>
                ›
            </strong>

        </div>

    `;


    /* OUVRIR LA RECETTE */

    card.addEventListener(
        "click",
        () => {

            window.location.href =
                `recipe-detail.html?id=${recipe.id}`;

        }
    );


    /* ACCESSIBILITÉ CLAVIER */

    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                window.location.href =
                    `recipe-detail.html?id=${recipe.id}`;

            }

        }
    );


    /* ÉTOILE FAVORI */

    const favoriteButton =
        card.querySelector(
            ".recipe-favorite"
        );


    favoriteButton.addEventListener(
        "click",
        event => {

            /*
             * Empêche l'ouverture
             * de la fiche recette.
             */
            event.stopPropagation();


            toggleRecipeFavorite(
                recipe.id
            );

        }
    );


    favoriteButton.addEventListener(
        "keydown",
        event => {

            /*
             * Empêche Enter/Espace
             * de déclencher aussi la carte.
             */
            event.stopPropagation();

        }
    );


    return card;

}


/* =========================================
   NORMALISATION RECHERCHE
========================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );

}


/* =========================================
   FILTRER LES RECETTES
========================================= */

function getFilteredRecipes() {

    const favoriteIds =
        getFavoriteRecipeIds();


    const normalizedSearch =
        normalizeText(
            searchTerm
        );


    return recipes.filter(
        recipe => {

            let matchesFilter =
                true;


            /* FAVORIS */

            if (
                activeFilter ===
                "favorites"
            ) {

                matchesFilter =
                    favoriteIds.includes(
                        recipe.id
                    );

            }


            /* TYPE DE REPAS */

            else if (
                activeFilter !==
                "all"
            ) {

                matchesFilter =
                    recipe.meal ===
                    activeFilter;

            }


            /* RECHERCHE */

            const matchesSearch =
                normalizeText(
                    recipe.name
                ).includes(
                    normalizedSearch
                );


            return (
                matchesFilter &&
                matchesSearch
            );

        }
    );

}


/* =========================================
   AFFICHER LES RECETTES
========================================= */

function renderRecipes() {

    const filteredRecipes =
        getFilteredRecipes();


    recipesContainer.innerHTML =
        "";


    if (recipesCount) {

        recipesCount.textContent =
            `${filteredRecipes.length} recette${
                filteredRecipes.length > 1
                    ? "s"
                    : ""
            }`;

    }


    if (
        filteredRecipes.length === 0
    ) {

        recipesContainer.innerHTML = `

            <div class="recipe-empty card">

                <div class="recipe-empty-icon">
                    ${
                        activeFilter ===
                        "favorites"
                            ? "⭐"
                            : "🔎"
                    }
                </div>


                <h3>

                    ${
                        activeFilter ===
                        "favorites"
                            ? "Aucune recette favorite"
                            : "Aucune recette trouvée"
                    }

                </h3>


                <p>

                    ${
                        activeFilter ===
                        "favorites"
                            ? "Clique sur ☆ pour enregistrer tes recettes préférées."
                            : "Essaie une autre recherche ou une autre catégorie."
                    }

                </p>

            </div>

        `;


        return;

    }


    filteredRecipes.forEach(
        recipe => {

            recipesContainer.appendChild(
                createRecipeCard(
                    recipe
                )
            );

        }
    );

}


/* =========================================
   RECHERCHE
========================================= */

if (recipeSearch) {

    recipeSearch.addEventListener(
        "input",
        event => {

            searchTerm =
                event.target.value
                    .trim();


            renderRecipes();

        }
    );

}


/* =========================================
   FILTRES
========================================= */

recipeFilters.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                activeFilter =
                    button.dataset.filter;


                recipeFilters.forEach(
                    filterButton => {

                        filterButton
                            .classList
                            .remove(
                                "active"
                            );

                    }
                );


                button
                    .classList
                    .add(
                        "active"
                    );


                renderRecipes();

            }
        );

    }
);


/* =========================================
   CHARGEMENT
========================================= */

async function loadRecipesPage() {

    try {

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


        /*
         * Initialise les favoris
         * si nécessaire.
         */
        getFavoriteRecipeIds();


        renderRecipes();


    } catch (error) {

        console.error(
            "Erreur chargement recettes :",
            error
        );


        recipesContainer.innerHTML = `

            <div class="database-error">

                <strong>
                    Impossible de charger les recettes.
                </strong>

                <p style="margin-top:8px;">
                    Vérifie recipes.json,
                    foods.json et Live Server.
                </p>

            </div>

        `;


        if (recipesCount) {

            recipesCount.textContent =
                "Erreur de chargement";

        }

    }

}


/* =========================================
   INITIALISATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadRecipesPage
);