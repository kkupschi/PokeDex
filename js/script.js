const INITIAL_POKEMON_COUNT = 30;
const LOAD_MORE_COUNT = 30;
let nextPokemonId = INITIAL_POKEMON_COUNT + 1;
let isLoadingMore = false;
const pokemonList = [];
const pokemonCache = {};
const speciesCache = {};
let favouriteIds = [];
let currentFilterMode = "all";
let currentGenerationFilter = null;
let currentOverlayIndex = 0;
let lastScrollY = 0;
const pokemonGridElement = document.getElementById("pokemon-grid");
const overlayElement = document.getElementById("overlay");
const overlayContentElement = document.getElementById("overlay-content");
const loadMoreButtonElement = document.getElementById("load-more-button");
const loadMoreLoaderElement = document.getElementById("load-more-loader");
const searchInputElement = document.getElementById("search-input");
const searchMessageElement = document.getElementById("search-message");

// Helper Funktionen
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function convertToJson(r) {
    return r.json();
}

function logPokemonError(e) {
    console.warn("Error loading Pokémon:", e);
}

function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}

function lockBodyScroll() {
    lastScrollY = window.scrollY;
    const scrollbar = getScrollbarWidth();
    document.body.style.position = "fixed";
    document.body.style.top = `-${lastScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.paddingRight = scrollbar + "px";
}

function unlockBodyScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.paddingRight = "";
    window.scrollTo(0, lastScrollY);
}

// API Extraktion
function getPokemonImageFromApi(apiPokemon) {
    const s = apiPokemon.sprites;
    return s.other["official-artwork"].front_default ||
        s.other.dream_world.front_default ||
        s.front_default;
}

function getShinyImageFromApi(apiPokemon) {
    const s = apiPokemon.sprites;
    return (s.other && s.other["official-artwork"] && s.other["official-artwork"].front_shiny)
        || s.front_shiny
        || null;
}

function getTypesFromApi(api) {
    return api.types.map(t => t.type.name);
}

function getAbilitiesFromApi(api) {
    return api.abilities.map(a => capitalize(a.ability.name));
}

function getBaseStatsFromApi(api) {
    const stats = api.stats.map(s => ({
        name: s.stat.name,
        value: s.base_stat
    }));
    const total = stats.reduce((a, b) => a + b.value, 0);
    return { baseStats: stats, totalBaseStats: total };
}

function getBreedingInfoFromSpecies(api) {
    const female = api.gender_rate >= 0 ? (api.gender_rate / 8) * 100 : null;
    const male = female !== null ? 100 - female : null;
    const eggGroups = api.egg_groups.map(g => capitalize(g.name)).join(", ") || "-";
    const eggCycle = api.hatch_counter ? api.hatch_counter + " cycles" : "-";
    return { malePercent: male, femalePercent: female, eggGroupsText: eggGroups, eggCycleText: eggCycle };
}

function getLevelUpMovesFromApi(api) {
    return api.moves
        .filter(m => m.version_group_details[0]?.move_learn_method.name === "level-up")
        .map(m => ({
            name: m.move.name,
            level: m.version_group_details[0].level_learned_at
        }))
        .filter(m => m.level > 0)
        .sort((a, b) => a.level - b.level);
}

// Evolution
function getIdFromSpeciesUrl(url) {
    return Number(url.split("/").filter(Boolean).pop());
}

function collectEvolutionEntries(node, res) {
    const id = getIdFromSpeciesUrl(node.species.url);
    if (id) res.push({ id, name: node.species.name });
    node.evolves_to?.forEach(n => collectEvolutionEntries(n, res));
}

function loadEvolutionChainForSpecies(apiSpecies) {
    const url = apiSpecies?.evolution_chain?.url;
    if (!url) return Promise.resolve([]);
    return fetch(url)
        .then(convertToJson)
        .then(d => {
            const result = [];
            collectEvolutionEntries(d.chain, result);
            return result;
        })
        .catch(() => []);
}

// Pokémon Creation
function createPokemonFromApiData(apiPokemon, apiSpecies, evo) {
    return {
        id: apiPokemon.id,
        name: apiPokemon.name,
        types: getTypesFromApi(apiPokemon),
        image: getPokemonImageFromApi(apiPokemon),
        shinyImage: getShinyImageFromApi(apiPokemon),
        height: apiPokemon.height,
        weight: apiPokemon.weight,
        abilities: getAbilitiesFromApi(apiPokemon),
        baseStats: getBaseStatsFromApi(apiPokemon).baseStats,
        totalBaseStats: getBaseStatsFromApi(apiPokemon).totalBaseStats,
        malePercent: getBreedingInfoFromSpecies(apiSpecies).malePercent,
        femalePercent: getBreedingInfoFromSpecies(apiSpecies).femalePercent,
        eggGroupsText: getBreedingInfoFromSpecies(apiSpecies).eggGroupsText,
        eggCycleText: getBreedingInfoFromSpecies(apiSpecies).eggCycleText,
        evolutionChain: evo,
        moves: getLevelUpMovesFromApi(apiPokemon)
    };
}

function createPkmn(species, pokemon) {
    const evo = pokemon.evolutionChain || [];
    const p = createPokemonFromApiData(pokemon, species, evo);
    pokemonList.push(p);
    pokemonList.sort((a, b) => a.id - b.id);
    renderPokemonGrid(getBaseListForCurrentFilter());
}

// Render
function renderPokemonGrid(list) {
    pokemonGridElement.innerHTML = list.map(getPokemonCardHTML).join("");
}

// Load Single Pokémon
function loadSinglePokemon(id) {
    if (pokemonCache[id] && speciesCache[id]) {
        return createPkmn(speciesCache[id], pokemonCache[id]);
    }
    const pURL = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const sURL = `https://pokeapi.co/api/v2/pokemon-species/${id}`;
    fetch(pURL)
        .then(convertToJson)
        .then(p => {
            pokemonCache[id] = p;
            return fetch(sURL)
                .then(convertToJson)
                .then(s => {
                    speciesCache[id] = s;
                    loadEvolutionChainForSpecies(s).then(evo => {
                        p.evolutionChain = evo;
                        createPkmn(s, p);
                    });
                });
        })
        .catch(logPokemonError);
}

// Overlay
function findPokemonIndexById(id) {
    return pokemonList.findIndex(p => p.id === id);
}

function showPokemonInOverlayByIndex(i, dir) {
    const p = pokemonList[i];
    overlayContentElement.innerHTML = getPokemonOverlayHTML(p);
    currentOverlayIndex = i;

    const card = overlayContentElement.querySelector(".overlay-card");
    if (dir === "left") card.classList.add("overlay-card--flip-left");
    if (dir === "right") card.classList.add("overlay-card--flip-right");
}

function openPokemonOverlay(id) {
    const i = findPokemonIndexById(id);
    if (i < 0) return;
    showPokemonInOverlayByIndex(i);
    overlayElement.classList.remove("hidden");
    lastScrollY = window.scrollY;
    document.body.style.left = "0";
    document.body.style.right = "0";
    lockBodyScroll();
}

function closeOverlay() {
    overlayElement.classList.add("hidden");
    document.body.style.left = '';
    document.body.style.right = '';
    unlockBodyScroll();
}

function showPreviousPokemonInOverlay() {
    if (currentOverlayIndex > 0)
        showPokemonInOverlayByIndex(currentOverlayIndex - 1, "left");
}

function showNextPokemonInOverlay() {
    if (currentOverlayIndex < pokemonList.length - 1)
        showPokemonInOverlayByIndex(currentOverlayIndex + 1, "right");
}

function handleFavouriteClick(id) {
    toggleFavourite(id);
    const btn = document.querySelector(".overlay-fav-button");
    if (!btn) return;
    btn.classList.toggle("overlay-fav-button--active", isFavourite(id));
    btn.textContent = isFavourite(id) ? "❤" : "♡";
}

function handleOverlayClick(e) {
    if (e.target.id === "overlay") closeOverlay();
}

// Tabs
function showOverlayTab(tab) {
    overlayContentElement.querySelectorAll(".overlay-tab")
        .forEach(t => t.classList.toggle("overlay-tab--active", t.dataset.tab === tab));
    overlayContentElement.querySelectorAll(".overlay-section")
        .forEach(s => s.classList.toggle("overlay-section--active", s.dataset.section === tab));
}

// Favourites
function loadFavouritesFromStorage() {
    favouriteIds = JSON.parse(localStorage.getItem("pokedex_favourites") || "[]");
}

function saveFavouritesToStorage() {
    localStorage.setItem("pokedex_favourites", JSON.stringify(favouriteIds));
}

function isFavourite(id) {
    return favouriteIds.includes(id);
}

function toggleFavourite(id) {
    isFavourite(id)
        ? favouriteIds = favouriteIds.filter(f => f !== id)
        : favouriteIds.push(id);
    saveFavouritesToStorage();
}

// Filters
function getBaseListForCurrentFilter() {
    let list = pokemonList;
    if (currentFilterMode === "favourites") list = pokemonList.filter(p => isFavourite(p.id));
    if (currentFilterMode === "generation") list = filterListByGeneration(list, currentGenerationFilter);
    return list;
}

function filterListByGeneration(list, gen) {
    const r = GENERATION_RANGES[gen];
    return list.filter(p => p.id >= r.start && p.id <= r.end);
}

function showAllPokemon() {
    currentFilterMode = "all";
    resetSearch();
    renderPokemonGrid(pokemonList);
}

function showFavouritePokemon() {
    currentFilterMode = "favourites";
    resetSearch();
    renderPokemonGrid(getBaseListForCurrentFilter());
}

function showGeneration(gen) {
    currentFilterMode = "generation";
    currentGenerationFilter = gen;
    resetSearch();
    ensureGenerationLoaded(gen, 30);
    renderPokemonGrid(getBaseListForCurrentFilter());
}

function ensureGenerationLoaded(gen, minCount) {
    const r = GENERATION_RANGES[gen];
    const loaded = pokemonList.filter(p => p.id >= r.start && p.id <= r.end).length;
    for (let id = r.start; id <= r.end && loaded + id - r.start < minCount; id++)
        if (!pokemonCache[id]) loadSinglePokemon(id);
}

// Load More
function handleLoadMoreClick() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    loadMoreButtonElement.disabled = true;
    loadMoreLoaderElement.classList.remove("hidden");

    for (let id = nextPokemonId; id < nextPokemonId + LOAD_MORE_COUNT; id++)
        loadSinglePokemon(id);
    nextPokemonId += LOAD_MORE_COUNT;
    setTimeout(() => {
        isLoadingMore = false;
        loadMoreButtonElement.disabled = false;
        loadMoreLoaderElement.classList.add("hidden");
    }, 1000);
}

// Search
function resetSearch() {
    searchInputElement.value = "";
    searchMessageElement.textContent = "";
}

function handleSearchInput(value) {
    const term = value.trim().toLowerCase();
    const base = getBaseListForCurrentFilter();
    if (!term) return resetSearchAndRender(base);
    if (term.length < 3) return tooShortSearch(base);
    const filtered = base.filter(p => p.name.includes(term));
    searchMessageElement.textContent = filtered.length ? "" : "No Pokémon found.";
    renderPokemonGrid(filtered);
}

function resetSearchAndRender(list) {
    searchMessageElement.textContent = "";
    renderPokemonGrid(list);
}

function tooShortSearch(list) {
    searchMessageElement.textContent = "Please enter at least 3 characters.";
    renderPokemonGrid(list);
}

function loadInitialPokemon() {
    pokemonList.length = 0;
    pokemonGridElement.innerHTML = "";
    for (let id = 1; id <= INITIAL_POKEMON_COUNT; id++)
        loadSinglePokemon(id);
}

loadFavouritesFromStorage();
loadInitialPokemon();