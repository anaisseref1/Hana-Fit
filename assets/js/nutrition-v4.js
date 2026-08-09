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

const barcodeScanButton = document.getElementById("barcodeScanButton");
const barcodeScannerOverlay = document.getElementById("barcodeScannerOverlay");
const barcodeScannerVideo = document.getElementById("barcodeScannerVideo");
const barcodeScannerCloseButton = document.getElementById("barcodeScannerCloseButton");
const barcodeLiveStatus = document.getElementById("barcodeLiveStatus");
const barcodeManualInput = document.getElementById("barcodeManualInput");
const barcodeLookupButton = document.getElementById("barcodeLookupButton");
const barcodeStatus = document.getElementById("barcodeStatus");
const scannedProductCard = document.getElementById("scannedProductCard");
const scannedProductMeta = document.getElementById("scannedProductMeta");
const scannedProductName = document.getElementById("scannedProductName");
const scannedProductUnit = document.getElementById("scannedProductUnit");
const scannedProductCalories = document.getElementById("scannedProductCalories");
const scannedProductProtein = document.getElementById("scannedProductProtein");
const scannedProductCarbs = document.getElementById("scannedProductCarbs");
const scannedProductFat = document.getElementById("scannedProductFat");
const scannedProductFiber = document.getElementById("scannedProductFiber");
const saveScannedProductButton = document.getElementById("saveScannedProductButton");
const cancelScannedProductButton = document.getElementById("cancelScannedProductButton");

const CUSTOM_FOODS_KEY = "hanaFitCustomFoods";

let foodDatabase = [];
let selectedDatabaseFood = null;
let scannedProductDraft = null;

let liveScannerReader = null;
let liveScannerControls = null;
let liveScannerStarting = false;
let liveScannerFound = false;

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

    if (meal.barcode) {
        sourceLabel = " · Produit scanné";
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
   PRODUITS PERSONNELS + CODE-BARRES
========================================= */

function readCustomFoods() {
    try {
        const raw =
            localStorage.getItem(
                CUSTOM_FOODS_KEY
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
            "Impossible de lire les produits personnels :",
            error
        );

        return [];
    }
}


function saveCustomFoods(foods) {
    localStorage.setItem(
        CUSTOM_FOODS_KEY,
        JSON.stringify(
            Array.isArray(foods)
                ? foods
                : []
        )
    );
}


function normalizeBarcode(value) {
    return String(
        value || ""
    )
        .replace(/\D/g, "")
        .trim();
}


function findCustomFoodByBarcode(barcode) {
    const normalized =
        normalizeBarcode(barcode);

    return readCustomFoods().find(
        food =>
            normalizeBarcode(
                food.barcode
            ) === normalized
    ) || null;
}


function upsertCustomFood(food) {
    const foods =
        readCustomFoods();

    const normalized =
        normalizeBarcode(
            food.barcode
        );

    const index =
        foods.findIndex(
            item =>
                normalizeBarcode(
                    item.barcode
                ) === normalized
        );

    if (index >= 0) {
        foods[index] = food;
    } else {
        foods.unshift(food);
    }

    saveCustomFoods(foods);
}


function mergeCustomFoodsIntoDatabase(
    staticFoods
) {
    const customFoods =
        readCustomFoods();

    const customBarcodes =
        new Set(
            customFoods
                .map(
                    food =>
                        normalizeBarcode(
                            food.barcode
                        )
                )
                .filter(Boolean)
        );

    const cleanStaticFoods =
        (Array.isArray(staticFoods)
            ? staticFoods
            : []
        )
            .filter(
                food =>
                    !food.barcode ||
                    !customBarcodes.has(
                        normalizeBarcode(
                            food.barcode
                        )
                    )
            );

    return [
        ...customFoods,
        ...cleanStaticFoods
    ];
}


function refreshCustomFoodInDatabase(food) {
    foodDatabase =
        foodDatabase.filter(
            item =>
                !(
                    item.barcode &&
                    normalizeBarcode(
                        item.barcode
                    ) ===
                    normalizeBarcode(
                        food.barcode
                    )
                )
        );

    foodDatabase.unshift(food);
}


function setBarcodeStatus(
    message,
    type = ""
) {
    if (!barcodeStatus) {
        return;
    }

    barcodeStatus.textContent =
        message;

    barcodeStatus.classList.remove(
        "success",
        "error"
    );

    if (
        type === "success" ||
        type === "error"
    ) {
        barcodeStatus.classList.add(
            type
        );
    }
}


function firstFiniteNumber(
    ...values
) {
    for (
        const value of values
    ) {
        const number =
            Number(value);

        if (
            Number.isFinite(number)
        ) {
            return number;
        }
    }

    return 0;
}


function detectProductUnit(product) {
    const text =
        normalizeText(
            [
                product?.product_quantity_unit,
                product?.serving_size,
                product?.quantity
            ]
                .filter(Boolean)
                .join(" ")
        );

    if (
        /\bml\b|\bcl\b|\blitre\b|\bliter\b|\bl\b/.test(
            text
        )
    ) {
        return "ml";
    }

    return "g";
}


function mapOpenFoodFactsProduct(
    product,
    barcode
) {
    const nutriments =
        product?.nutriments ||
        {};

    const kcal =
        firstFiniteNumber(
            nutriments["energy-kcal_100g"],
            nutriments["energy-kcal"],
            Number(nutriments.energy_100g) > 0
                ? Number(nutriments.energy_100g) / 4.184
                : 0
        );

    return {
        barcode:
            normalizeBarcode(
                product?.code ||
                barcode
            ),

        name:
            String(
                product?.product_name ||
                product?.generic_name ||
                `Produit ${barcode}`
            )
                .trim(),

        brand:
            String(
                product?.brands ||
                ""
            )
                .trim(),

        unit:
            detectProductUnit(
                product
            ),

        calories:
            roundOne(kcal),

        protein:
            roundOne(
                firstFiniteNumber(
                    nutriments.proteins_100g,
                    nutriments.proteins
                )
            ),

        carbs:
            roundOne(
                firstFiniteNumber(
                    nutriments.carbohydrates_100g,
                    nutriments.carbohydrates
                )
            ),

        fat:
            roundOne(
                firstFiniteNumber(
                    nutriments.fat_100g,
                    nutriments.fat
                )
            ),

        fiber:
            roundOne(
                firstFiniteNumber(
                    nutriments.fiber_100g,
                    nutriments.fiber
                )
            )
    };
}


function hideScannedProductCard() {
    scannedProductDraft =
        null;

    if (scannedProductCard) {
        scannedProductCard.hidden =
            true;
    }
}


function renderScannedProductDraft(
    draft
) {
    scannedProductDraft =
        draft;

    if (
        !scannedProductCard ||
        !draft
    ) {
        return;
    }

    scannedProductCard.hidden =
        false;

    scannedProductMeta.textContent =
        [
            draft.brand,
            `code ${draft.barcode}`
        ]
            .filter(Boolean)
            .join(" · ");

    scannedProductName.value =
        draft.name || "";

    scannedProductUnit.value =
        draft.unit === "ml"
            ? "ml"
            : "g";

    scannedProductCalories.value =
        draft.calories;

    scannedProductProtein.value =
        draft.protein;

    scannedProductCarbs.value =
        draft.carbs;

    scannedProductFat.value =
        draft.fat;

    scannedProductFiber.value =
        draft.fiber;

    scannedProductCard.scrollIntoView({
        behavior:
            "smooth",
        block:
            "nearest"
    });
}


async function fetchOpenFoodFactsProduct(
    barcode
) {
    const code =
        normalizeBarcode(
            barcode
        );

    if (
        code.length < 8 ||
        code.length > 18
    ) {
        throw new Error(
            "Le code-barres semble incomplet."
        );
    }

    /*
     * Open Food Facts documente actuellement
     * son endpoint produit v2 dans son guide
     * spécifique au scan de codes-barres.
     */
    const fields = [
        "code",
        "product_name",
        "generic_name",
        "brands",
        "quantity",
        "product_quantity_unit",
        "serving_size",
        "nutriments"
    ]
        .join(",");

    const url =
        "https://world.openfoodfacts.org/api/v2/product/" +
        encodeURIComponent(code) +
        ".json?fields=" +
        encodeURIComponent(fields);

    const response =
        await fetch(
            url,
            {
                method:
                    "GET",
                mode:
                    "cors",
                cache:
                    "no-store"
            }
        );

    if (!response.ok) {
        throw new Error(
            response.status === 404
                ? "Produit absent d'Open Food Facts."
                : "Open Food Facts ne répond pas pour le moment."
        );
    }

    const data =
        await response.json();

    if (
        Number(data?.status) !== 1 ||
        !data?.product
    ) {
        throw new Error(
            "Produit introuvable dans Open Food Facts."
        );
    }

    return mapOpenFoodFactsProduct(
        data.product,
        code
    );
}


async function lookupBarcode(
    rawBarcode
) {
    const barcode =
        normalizeBarcode(
            rawBarcode
        );

    if (
        barcode.length < 8 ||
        barcode.length > 18
    ) {
        setBarcodeStatus(
            "Je n'ai pas reconnu un code-barres complet. Tu peux le saisir manuellement.",
            "error"
        );

        return;
    }

    if (barcodeManualInput) {
        barcodeManualInput.value =
            barcode;
    }

    hideScannedProductCard();

    const localFood =
        findCustomFoodByBarcode(
            barcode
        );

    if (localFood) {
        setBarcodeStatus(
            "✅ Ce produit est déjà enregistré dans ta base Hana Fit. Je l'ai sélectionné.",
            "success"
        );

        selectDatabaseFood(
            localFood
        );

        selectedFoodCard?.scrollIntoView({
            behavior:
                "smooth",
            block:
                "nearest"
        });

        return;
    }

    if (!navigator.onLine) {
        setBarcodeStatus(
            "Tu es hors ligne. Ce produit n'est pas encore dans ta base personnelle.",
            "error"
        );

        return;
    }

    setBarcodeStatus(
        "🔎 Code reconnu. Recherche du produit dans Open Food Facts…"
    );

    try {
        const draft =
            await fetchOpenFoodFactsProduct(
                barcode
            );

        renderScannedProductDraft(
            draft
        );

        setBarcodeStatus(
            "✅ Produit trouvé. Vérifie les valeurs de l'étiquette puis enregistre-le dans Hana Fit.",
            "success"
        );

    } catch (error) {
        console.error(
            "Recherche code-barres :",
            error
        );

        setBarcodeStatus(
            `${error.message || "Produit introuvable."} Tu peux utiliser l'ajout manuel juste en dessous.`,
            "error"
        );
    }
}


function setLiveScannerStatus(
    message,
    type = ""
) {
    if (!barcodeLiveStatus) {
        return;
    }

    barcodeLiveStatus.textContent =
        message;

    barcodeLiveStatus.classList.remove(
        "success",
        "error"
    );

    if (
        type === "success" ||
        type === "error"
    ) {
        barcodeLiveStatus.classList.add(
            type
        );
    }
}


function openLiveScannerOverlay() {
    if (!barcodeScannerOverlay) {
        return;
    }

    barcodeScannerOverlay.hidden =
        false;

    document.body.classList.add(
        "barcode-scanner-open"
    );
}


function closeLiveScannerOverlay() {
    if (!barcodeScannerOverlay) {
        return;
    }

    barcodeScannerOverlay.hidden =
        true;

    document.body.classList.remove(
        "barcode-scanner-open"
    );
}


function stopVideoTracks() {
    const stream =
        barcodeScannerVideo?.srcObject;

    if (
        stream &&
        typeof stream.getTracks ===
            "function"
    ) {
        stream
            .getTracks()
            .forEach(
                track => {
                    try {
                        track.stop();
                    } catch {
                        // Rien à faire.
                    }
                }
            );
    }

    if (barcodeScannerVideo) {
        barcodeScannerVideo.srcObject =
            null;
    }
}


function stopLiveBarcodeScanner(
    hideOverlay = true
) {
    try {
        liveScannerControls?.stop?.();
    } catch {
        // Rien à faire.
    }

    liveScannerControls =
        null;

    try {
        liveScannerReader?.reset?.();
    } catch {
        // Certaines versions n'exposent pas reset().
    }

    stopVideoTracks();

    liveScannerReader =
        null;

    liveScannerStarting =
        false;

    liveScannerFound =
        false;

    if (hideOverlay) {
        closeLiveScannerOverlay();
    }
}


function getCameraErrorMessage(
    error
) {
    const name =
        error?.name ||
        "";

    if (
        name ===
        "NotAllowedError" ||
        name ===
        "PermissionDeniedError"
    ) {
        return "L'accès à la caméra a été refusé. Autorise la caméra pour Hana Fit dans Safari puis réessaie.";
    }

    if (
        name ===
        "NotFoundError" ||
        name ===
        "DevicesNotFoundError"
    ) {
        return "Aucune caméra compatible n'a été trouvée.";
    }

    if (
        name ===
        "NotReadableError" ||
        name ===
        "TrackStartError"
    ) {
        return "La caméra est déjà utilisée par une autre application. Ferme-la puis réessaie.";
    }

    return "Impossible d'ouvrir le scanner pour le moment. Tu peux toujours saisir le code-barres manuellement.";
}


async function startLiveBarcodeScanner() {
    if (
        liveScannerStarting ||
        liveScannerControls
    ) {
        return;
    }

    if (
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia
    ) {
        setBarcodeStatus(
            "Le scanner caméra nécessite une connexion sécurisée HTTPS. La saisie manuelle reste disponible.",
            "error"
        );

        return;
    }

    if (
        !window.ZXingBrowser ||
        !window.ZXingBrowser
            .BrowserMultiFormatReader
    ) {
        setBarcodeStatus(
            "Le lecteur de code-barres n'a pas pu se charger. Vérifie ta connexion puis réessaie.",
            "error"
        );

        return;
    }

    liveScannerStarting =
        true;

    liveScannerFound =
        false;

    openLiveScannerOverlay();

    setLiveScannerStatus(
        "Place le code-barres dans le cadre. Hana Fit le détecte automatiquement."
    );

    try {
        liveScannerReader =
            new window.ZXingBrowser
                .BrowserMultiFormatReader();

        const constraints = {
            audio:
                false,

            video: {
                facingMode: {
                    ideal:
                        "environment"
                },

                width: {
                    ideal:
                        1280
                },

                height: {
                    ideal:
                        720
                },

                frameRate: {
                    ideal:
                        30,
                    max:
                        30
                }
            }
        };

        const controls =
            await liveScannerReader
                .decodeFromConstraints(
                    constraints,
                    barcodeScannerVideo,
                    (
                        result,
                        error,
                        callbackControls
                    ) => {
                        if (
                            !result ||
                            liveScannerFound
                        ) {
                            return;
                        }

                        const code =
                            normalizeBarcode(
                                result?.getText?.() ||
                                result?.text ||
                                ""
                            );

                        if (!code) {
                            return;
                        }

                        liveScannerFound =
                            true;

                        setLiveScannerStatus(
                            `✅ Code détecté : ${code}`,
                            "success"
                        );

                        try {
                            callbackControls
                                ?.stop?.();
                        } catch {
                            // Rien à faire.
                        }

                        liveScannerControls =
                            null;

                        stopVideoTracks();

                        if (
                            typeof navigator.vibrate ===
                            "function"
                        ) {
                            navigator.vibrate(
                                70
                            );
                        }

                        window.setTimeout(
                            async () => {
                                closeLiveScannerOverlay();

                                liveScannerReader =
                                    null;

                                liveScannerStarting =
                                    false;

                                await lookupBarcode(
                                    code
                                );

                                liveScannerFound =
                                    false;
                            },
                            180
                        );
                    }
                );

        liveScannerStarting =
            false;

        if (liveScannerFound) {
            try {
                controls?.stop?.();
            } catch {
                // Rien à faire.
            }

            liveScannerControls =
                null;

            return;
        }

        liveScannerControls =
            controls;

    } catch (error) {
        console.error(
            "Scanner caméra :",
            error
        );

        const message =
            getCameraErrorMessage(
                error
            );

        stopLiveBarcodeScanner(
            true
        );

        setBarcodeStatus(
            message,
            "error"
        );
    }
}


function saveScannedProduct() {
    if (!scannedProductDraft) {
        return;
    }

    const barcode =
        normalizeBarcode(
            scannedProductDraft.barcode
        );

    const name =
        scannedProductName.value.trim();

    const calories =
        Number(
            scannedProductCalories.value
        );

    const protein =
        Number(
            scannedProductProtein.value
        );

    const carbs =
        Number(
            scannedProductCarbs.value
        );

    const fat =
        Number(
            scannedProductFat.value
        );

    const fiber =
        Number(
            scannedProductFiber.value
        ) || 0;

    const values = [
        calories,
        protein,
        carbs,
        fat,
        fiber
    ];

    if (
        !name ||
        values.some(
            value =>
                !Number.isFinite(value) ||
                value < 0
        )
    ) {
        setBarcodeStatus(
            "Vérifie le nom et les valeurs nutritionnelles avant d'enregistrer.",
            "error"
        );

        return;
    }

    const food = {
        id:
            `scan-${barcode}`,

        name,

        emoji:
            "📦",

        category:
            "Produits scannés",

        favorite:
            false,

        isPantry:
            false,

        barcode,

        brand:
            scannedProductDraft.brand ||
            "",

        source:
            "openfoodfacts",

        serving: {
            amount:
                100,

            unit:
                scannedProductUnit.value === "ml"
                    ? "ml"
                    : "g"
        },

        nutrition: {
            calories:
                roundOne(calories),

            protein:
                roundOne(protein),

            carbs:
                roundOne(carbs),

            fat:
                roundOne(fat),

            fiber:
                roundOne(fiber)
        },

        savedAt:
            new Date()
                .toISOString()
    };

    upsertCustomFood(
        food
    );

    refreshCustomFoodInDatabase(
        food
    );

    hideScannedProductCard();

    setBarcodeStatus(
        "✅ Produit enregistré dans ta base personnelle Hana Fit. Il sera désormais retrouvé dans la recherche et reconnu lors d'un prochain scan.",
        "success"
    );

    selectDatabaseFood(
        food
    );
}


if (barcodeScanButton) {
    barcodeScanButton.addEventListener(
        "click",
        startLiveBarcodeScanner
    );
}


if (barcodeScannerCloseButton) {
    barcodeScannerCloseButton.addEventListener(
        "click",
        () => {
            stopLiveBarcodeScanner(
                true
            );

            setBarcodeStatus(
                "Scanner fermé. Tu peux le rouvrir ou saisir le code manuellement."
            );
        }
    );
}


window.addEventListener(
    "pagehide",
    () => {
        if (
            liveScannerControls ||
            liveScannerStarting
        ) {
            stopLiveBarcodeScanner(
                true
            );
        }
    }
);


document.addEventListener(
    "visibilitychange",
    () => {
        if (
            document.hidden &&
            (
                liveScannerControls ||
                liveScannerStarting
            )
        ) {
            stopLiveBarcodeScanner(
                true
            );
        }
    }
);


if (barcodeLookupButton) {
    barcodeLookupButton.addEventListener(
        "click",
        () => {
            lookupBarcode(
                barcodeManualInput?.value
            );
        }
    );
}


if (barcodeManualInput) {
    barcodeManualInput.addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                "Enter"
            ) {
                event.preventDefault();

                lookupBarcode(
                    barcodeManualInput.value
                );
            }
        }
    );
}


if (saveScannedProductButton) {
    saveScannedProductButton.addEventListener(
        "click",
        saveScannedProduct
    );
}


if (cancelScannedProductButton) {
    cancelScannedProductButton.addEventListener(
        "click",
        () => {
            hideScannedProductCard();

            setBarcodeStatus(
                "Produit non enregistré. Tu peux scanner un autre code-barres."
            );
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
                        ${food.barcode ? ` · code ${food.barcode}` : ""}
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

                barcode:
                    selectedDatabaseFood.barcode ||
                    null,

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
        const staticFoods =
            await loadDatabaseFile(
                "foods.json"
            );

        foodDatabase =
            mergeCustomFoodsIntoDatabase(
                staticFoods
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
    if (barcodeStatus) {
        setBarcodeStatus(
            "📷 Scanner prêt. Ouvre la caméra et vise simplement le code-barres."
        );
    }

    await Promise.all([
        loadFoodDatabase(),
        importSelectedRecipe(),
        loadNutritionTargets()
    ]);

    renderMeals();
}

initNutrition();
