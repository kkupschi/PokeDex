// === Type Colors & Utility-Funktionen (für Template & Overlay) ===
const TYPE_COLORS = {
    normal: "#A8A77A",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F7D02C",
    grass: "#7AC74C",
    ice: "#96D9D6",
    fighting: "#C22E28",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#D685AD"
};

// Base Stat Color (für Stat-Balken)
function getStatColor(base) {
    if (base <= 79) return "#5bc0de";
    if (base <= 109) return "#28a745";
    if (base <= 149) return "#ffc107";
    return "#dc3545";
}

// ID als 4-stellige Nummer formatieren (1 -> 0001)
function formatPokemonId(id) {
    return String(id).padStart(4, "0");
}

// Erstes Zeichen groß machen
function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

// === Globale Datenstrukturen ===
const pokemonList = [];
const pokemonCache = {};
const speciesCache = {};
let favouriteIds = [];

// === Helper ===
function convertToJson(response) {
    return response.json();
}

function fetchJson(url) {
    return fetch(url).then(convertToJson);
}

function logPokemonError(error) {
    console.warn("Error loading Pokémon:", error);
}

// === Favourites im LocalStorage ===
function loadFavouritesFromStorage() {
    const raw = localStorage.getItem("pokedex_favourites") || "[]";
    try {
        const parsed = JSON.parse(raw);
        favouriteIds = Array.isArray(parsed) ? parsed : [];
    } catch {
        favouriteIds = [];
    }
}

function saveFavouritesToStorage() {
    localStorage.setItem("pokedex_favourites", JSON.stringify(favouriteIds));
}

function isFavourite(id) {
    return favouriteIds.includes(id);
}

function toggleFavourite(id) {
    if (isFavourite(id)) {
        favouriteIds = favouriteIds.filter(f => f !== id);
    } else {
        favouriteIds.push(id);
    }
    saveFavouritesToStorage();
}

// === API-Extraktion: Bilder, Typen, Stats, Breeding, Moves ===
function getPokemonImageFromApi(apiPokemon) {
    const s = apiPokemon.sprites;
    return s.other["official-artwork"].front_default ||
        s.other.dream_world.front_default ||
        s.front_default;
}

function getShinyImageFromApi(apiPokemon) {
    const s = apiPokemon.sprites;
    const official = s.other && s.other["official-artwork"];
    return (official && official.front_shiny) || s.front_shiny || null;
}

function getTypesFromApi(apiPokemon) {
    return apiPokemon.types.map(t => t.type.name);
}

function getAbilitiesFromApi(apiPokemon) {
    return apiPokemon.abilities.map(a => capitalize(a.ability.name));
}

function getBaseStatsFromApi(apiPokemon) {
    const stats = apiPokemon.stats.map(s => ({
        name: s.stat.name,
        value: s.base_stat
    }));
    const total = stats.reduce((sum, s) => sum + s.value, 0);
    return { baseStats: stats, totalBaseStats: total };
}

function getGenderPercents(apiSpecies) {
    if (!apiSpecies || typeof apiSpecies.gender_rate !== "number") {
        return { male: null, female: null };
    }
    if (apiSpecies.gender_rate < 0) {
        return { male: null, female: null };
    }
    const female = (apiSpecies.gender_rate / 8) * 100;
    const male = 100 - female;
    return { male: male, female: female };
}

function getEggGroupsText(apiSpecies) {
    if (!apiSpecies || !Array.isArray(apiSpecies.egg_groups)) {
        return "-";
    }
    const names = apiSpecies.egg_groups.map(g => capitalize(g.name));
    return names.length === 0 ? "-" : names.join(", ");
}

function getEggCycleText(apiSpecies) {
    if (!apiSpecies || typeof apiSpecies.hatch_counter !== "number") {
        return "-";
    }
    return apiSpecies.hatch_counter + " cycles";
}

function getBreedingInfoFromSpecies(apiSpecies) {
    const percents = getGenderPercents(apiSpecies);
    return {
        malePercent: percents.male,
        femalePercent: percents.female,
        eggGroupsText: getEggGroupsText(apiSpecies),
        eggCycleText: getEggCycleText(apiSpecies)
    };
}

function getLevelUpMovesFromApi(apiPokemon) {
    return apiPokemon.moves
        .filter(m => m.version_group_details[0]?.move_learn_method.name === "level-up")
        .map(m => ({
            name: m.move.name,
            level: m.version_group_details[0].level_learned_at
        }))
        .filter(m => m.level > 0)
        .sort((a, b) => a.level - b.level);
}

// === Evolution-Chain ===
function getIdFromSpeciesUrl(url) {
    return Number(url.split("/").filter(Boolean).pop());
}

function collectEvolutionEntries(node, result) {
    const id = getIdFromSpeciesUrl(node.species.url);
    if (id) {
        result.push({ id: id, name: node.species.name });
    }
    if (Array.isArray(node.evolves_to)) {
        node.evolves_to.forEach(n => collectEvolutionEntries(n, result));
    }
}

function parseEvolutionChain(chainRoot) {
    const result = [];
    if (chainRoot) {
        collectEvolutionEntries(chainRoot, result);
    }
    return result;
}

function loadEvolutionChainForSpecies(apiSpecies) {
    if (!apiSpecies || !apiSpecies.evolution_chain) {
        return Promise.resolve([]);
    }
    const url = apiSpecies.evolution_chain.url;
    if (!url) {
        return Promise.resolve([]);
    }
    return fetchJson(url)
        .then(data => parseEvolutionChain(data.chain))
        .catch(() => []);
}

// === Pokémon-Objekt erstellen ===
function createPokemonFromApiData(apiPokemon, apiSpecies, evolutionChain) {
    const types = getTypesFromApi(apiPokemon);
    const image = getPokemonImageFromApi(apiPokemon);
    const shiny = getShinyImageFromApi(apiPokemon);
    const abilities = getAbilitiesFromApi(apiPokemon);
    const stats = getBaseStatsFromApi(apiPokemon);
    const breeding = getBreedingInfoFromSpecies(apiSpecies);
    const moves = getLevelUpMovesFromApi(apiPokemon);

    return {
        id: apiPokemon.id,
        name: apiPokemon.name,
        types: types,
        image: image,
        shinyImage: shiny,
        height: apiPokemon.height,
        weight: apiPokemon.weight,
        abilities: abilities,
        baseStats: stats.baseStats,
        totalBaseStats: stats.totalBaseStats,
        malePercent: breeding.malePercent,
        femalePercent: breeding.femalePercent,
        eggGroupsText: breeding.eggGroupsText,
        eggCycleText: breeding.eggCycleText,
        evolutionChain: evolutionChain,
        moves: moves
    };
}

function addPokemonToList(pokemon) {
    pokemonList.push(pokemon);
    pokemonList.sort((a, b) => a.id - b.id);
}

// Laden von Pokémon
function loadSinglePokemon(id, onChange) {
    if (pokemonCache[id] && speciesCache[id]) {
        const evo = pokemonCache[id].evolutionChain || [];
        const p = createPokemonFromApiData(pokemonCache[id], speciesCache[id], evo);
        addPokemonToList(p);
        if (onChange) onChange(pokemonList);
        return;
    }

    const pURL = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const sURL = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

    fetchJson(pURL)
        .then(apiPokemon => {
            pokemonCache[id] = apiPokemon;
            return fetchJson(sURL).then(apiSpecies => {
                speciesCache[id] = apiSpecies;
                return loadEvolutionChainForSpecies(apiSpecies).then(evo => {
                    apiPokemon.evolutionChain = evo;
                    const p = createPokemonFromApiData(apiPokemon, apiSpecies, evo);
                    addPokemonToList(p);
                    if (onChange) onChange(pokemonList);
                });
            });
        })
        .catch(logPokemonError);
}

/* Lädt einen Bereich an IDs (inklusive). */
function loadPokemonRange(startId, endId, onChange) {
    for (let id = startId; id <= endId; id++) {
        loadSinglePokemon(id, onChange);
    }
}