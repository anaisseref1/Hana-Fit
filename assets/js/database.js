Hana.database = (() => {

    async function load(file) {

        const response = await fetch(
            `../assets/database/${file}`
        );

        if (!response.ok) {

            throw new Error(
                `Impossible de charger ${file}`
            );

        }

        return await response.json();

    }

    async function foods() {

        return await load(
            "foods.json"
        );

    }

    async function recipes() {

        return await load(
            "recipes.json"
        );

    }

    async function programs() {

        return await load(
            "programs.json"
        );

    }

    async function getFood(id) {

        const list =
            await foods();

        return list.find(
            food => food.id === id
        );

    }

    async function getRecipe(id) {

        const list =
            await recipes();

        return list.find(
            recipe => recipe.id === id
        );

    }

    async function getProgram(name) {

        const list =
            await programs();

        return list.find(
            program =>
                program.name === name
        );

    }

    return {

        foods,

        recipes,

        programs,

        getFood,

        getRecipe,

        getProgram

    };

})();