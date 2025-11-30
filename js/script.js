const INITIAL_POKEMON_COUNT = 30;
const LOAD_MORE_COUNT = 30;
const pokemonList = [];
let currentOverlayIndex = 0;
let lastScrollY = 0;
let nextPokemonId = INITIAL_POKEMON_COUNT + 1;
let isLoadingMore = false;
const pokemonGridElement = document.getElementById('pokemon-grid');
const overlayElement = document.getElementById('overlay');
const overlayContentElement = document.getElementById('overlay-content');
const loadMoreButtonElement = document.getElementById('load-more-button');
const loadMoreLoaderElement = document.getElementById('load-more-loader');
let favouriteIds = [];
const searchInputElement = document.getElementById('search-input');
const searchMessageElement = document.getElementById('search-message');
let currentFilterMode = 'all';

function getPokemonImageFromApi(apiPokemon) {
    const sprites = apiPokemon.sprites;
    const artwork = sprites.other['official-artwork'].front_default;
    const dreamWorld = sprites.other.dream_world.front_default;
    const defaultSprite = sprites.front_default;
    if (artwork) {
        return artwork;
    }
    if (dreamWorld) {
        return dreamWorld;
    }
    return defaultSprite;
}

function getTypesFromApi(apiPokemon) {
    const types = [];
    for (let i = 0; i < apiPokemon.types.length; i++) {
        const typeName = apiPokemon.types[i].type.name;
        types.push(typeName);
    }
    return types;
}

function getAbilitiesFromApi(apiPokemon) {
    const abilities = [];
    for (let j = 0; j < apiPokemon.abilities.length; j++) {
        const abilityName = apiPokemon.abilities[j].ability.name;
        abilities.push(capitalize(abilityName));
    }
    return abilities;
}

function getBaseStatsFromApi(apiPokemon) {
    const baseStats = [];
    let totalBaseStats = 0;
    for (let k = 0; k < apiPokemon.stats.length; k++) {
        const apiStat = apiPokemon.stats[k];
        const statName = apiStat.stat.name;
        const baseValue = apiStat.base_stat;
        totalBaseStats = totalBaseStats + baseValue;
        baseStats.push({
            name: statName,
            value: baseValue
        });
    }
    return {
        baseStats: baseStats,
        totalBaseStats: totalBaseStats
    };
}

function getBreedingInfoFromSpecies(apiSpecies) {
    let malePercent = null;
    let femalePercent = null;
    if (apiSpecies && typeof apiSpecies.gender_rate === 'number') {
        if (apiSpecies.gender_rate >= 0) {
            const female = (apiSpecies.gender_rate / 8) * 100;
            const male = 100 - female;
            malePercent = male;
            femalePercent = female;
        }
    }
    let eggGroupsText = '-';
    if (apiSpecies && Array.isArray(apiSpecies.egg_groups)) {
        const eggGroups = [];
        for (let i = 0; i < apiSpecies.egg_groups.length; i++) {
            const groupName = apiSpecies.egg_groups[i].name;
            eggGroups.push(capitalize(groupName));
        }
        if (eggGroups.length > 0) {
            eggGroupsText = eggGroups.join(', ');
        }
    }
    let eggCycleText = '-';
    if (apiSpecies && typeof apiSpecies.hatch_counter === 'number') {
        eggCycleText = apiSpecies.hatch_counter + ' cycles';
    }
    return {
        malePercent: malePercent,
        femalePercent: femalePercent,
        eggGroupsText: eggGroupsText,
        eggCycleText: eggCycleText
    };
}

function getLevelUpMovesFromApi(apiPokemon) {
    const result = [];
    const moves = apiPokemon.moves || [];
    for (let i = 0; i < moves.length; i++) {
        const moveEntry = moves[i];
        const details = moveEntry.version_group_details;
        if (!details || details.length === 0) {
            continue;
        }
        const first = details[0];
        if (first.move_learn_method.name !== 'level-up') {
            continue;
        }
        if (!first.level_learned_at) {
            continue;
        }
        result.push({
            name: moveEntry.move.name,
            level: first.level_learned_at
        });
    }
    result.sort(function (a, b) {
        return a.level - b.level;
    });
    return result;
}

function loadFavouritesFromStorage() {
    const raw = localStorage.getItem('pokedex_favourites');
    if (!raw) {
        favouriteIds = [];
        return;
    }
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            favouriteIds = parsed;
        } else {
            favouriteIds = [];
        }
    } catch (error) {
        favouriteIds = [];
    }
}

function saveFavouritesToStorage() {
    const json = JSON.stringify(favouriteIds);
    localStorage.setItem('pokedex_favourites', json);
}

function isFavourite(id) {
    return favouriteIds.indexOf(id) !== -1;
}

function toggleFavourite(id) {
    const index = favouriteIds.indexOf(id);
    if (index === -1) {
        favouriteIds.push(id);
    } else {
        favouriteIds.splice(index, 1);
    }
    saveFavouritesToStorage();
}

function getFavouritePokemonList() {
    const result = [];

    for (let i = 0; i < pokemonList.length; i++) {
        const pokemon = pokemonList[i];

        if (isFavourite(pokemon.id)) {
            result.push(pokemon);
        }
    }

    return result;
}

function getIdFromSpeciesUrl(url) {
    const parts = url.split('/');
    for (let i = parts.length - 1; i >= 0; i--) {
        const value = parts[i];
        if (value !== '') {
            return Number(value);
        }
    }
    return null;
}

function collectEvolutionEntries(node, result) {
    const id = getIdFromSpeciesUrl(node.species.url);
    const name = node.species.name;
    if (id) {
        result.push({
            id: id,
            name: name
        });
    }
    if (!node.evolves_to) {
        return;
    }
    for (let i = 0; i < node.evolves_to.length; i++) {
        collectEvolutionEntries(node.evolves_to[i], result);
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
    return fetch(url)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            return parseEvolutionChain(data.chain);
        })
        .catch(function () {
            return [];
        });
}

function createPokemonFromApiData(apiPokemon, apiSpecies, evolutionChain) {
    const types = getTypesFromApi(apiPokemon);
    const abilities = getAbilitiesFromApi(apiPokemon);
    const baseStatsInfo = getBaseStatsFromApi(apiPokemon);
    const breedingInfo = getBreedingInfoFromSpecies(apiSpecies);
    const moves = getLevelUpMovesFromApi(apiPokemon);
    return {
        id: apiPokemon.id,
        name: apiPokemon.name,
        types: types,
        image: getPokemonImageFromApi(apiPokemon),
        height: apiPokemon.height,
        weight: apiPokemon.weight,
        abilities: abilities,
        baseStats: baseStatsInfo.baseStats,
        totalBaseStats: baseStatsInfo.totalBaseStats,
        malePercent: breedingInfo.malePercent,
        femalePercent: breedingInfo.femalePercent,
        eggGroupsText: breedingInfo.eggGroupsText,
        eggCycleText: breedingInfo.eggCycleText,
        evolutionChain: evolutionChain,
        moves: moves
    };
}

function renderPokemonGrid(pokemonArray) {
    let html = '';
    for (let i = 0; i < pokemonArray.length; i++) {
        const pokemon = pokemonArray[i];
        html = html + getPokemonCardHTML(pokemon);
    }
    pokemonGridElement.innerHTML = html;
}

function loadSinglePokemon(id) {
    const pokemonUrl = 'https://pokeapi.co/api/v2/pokemon/' + id;
    const speciesUrl = 'https://pokeapi.co/api/v2/pokemon-species/' + id;

    fetch(pokemonUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (pokemonData) {
            return fetch(speciesUrl)
                .then(function (response) {
                    return response.json();
                })
                .then(function (speciesData) {
                    return loadEvolutionChainForSpecies(speciesData)
                        .then(function (evolutionChain) {
                            const pokemon = createPokemonFromApiData(
                                pokemonData,
                                speciesData,
                                evolutionChain
                            );
                            pokemonList.push(pokemon);
                            pokemonList.sort(function (a, b) {
                                return a.id - b.id;
                            });
                            renderPokemonGrid(pokemonList);
                        });
                });
        })
        .catch(function (error) {
            console.log('Fehler beim Laden von Pokémon mit ID ' + id, error);
        });
}

/* ===== Overlay-Logik ===== */
function findPokemonIndexById(id) {
    for (let i = 0; i < pokemonList.length; i++) {
        if (pokemonList[i].id === id) {
            return i;
        }
    }
    return -1;
}

function showPokemonInOverlayByIndex(index, direction) {
    if (index < 0 || index >= pokemonList.length) {
        return;
    }
    const pokemon = pokemonList[index];
    const html = getPokemonOverlayHTML(pokemon);
    overlayContentElement.innerHTML = html;
    currentOverlayIndex = index;
    const cardElement = overlayContentElement.querySelector('.overlay-card');
    if (!cardElement) {
        return;
    }
    if (direction === 'left') {
        cardElement.classList.add('overlay-card--flip-left');
    } else if (direction === 'right') {
        cardElement.classList.add('overlay-card--flip-right');
    }
}

function openPokemonOverlay(id) {
    const index = findPokemonIndexById(id);
    if (index === -1) {
        return;
    }
    showPokemonInOverlayByIndex(index, null);
    overlayElement.classList.remove('hidden');
    lastScrollY = window.scrollY || window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lastScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
}

function closeOverlay() {
    overlayElement.classList.add('hidden');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, lastScrollY);
}

function showPreviousPokemonInOverlay() {
    const newIndex = currentOverlayIndex - 1;
    if (newIndex < 0) {
        return;
    }
    showPokemonInOverlayByIndex(newIndex, 'left');
}

function showNextPokemonInOverlay() {
    const newIndex = currentOverlayIndex + 1;
    if (newIndex >= pokemonList.length) {
        return;
    }
    showPokemonInOverlayByIndex(newIndex, 'right');
}

function handleFavouriteClick(id) {
    toggleFavourite(id);
    const button = document.querySelector('.overlay-fav-button');
    if (!button) {
        return;
    }
    if (isFavourite(id)) {
        button.classList.add('overlay-fav-button--active');
        button.textContent = '❤';
    } else {
        button.classList.remove('overlay-fav-button--active');
        button.textContent = '♡';
    }
}

function handleOverlayClick(event) {
    if (event.target.id === 'overlay') {
        closeOverlay();
    }
}

function showOverlayTab(tabName) {
    const tabs = overlayContentElement.querySelectorAll('.overlay-tab');
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const tabKey = tab.getAttribute('data-tab');
        if (tabKey === tabName) {
            tab.classList.add('overlay-tab--active');
        } else {
            tab.classList.remove('overlay-tab--active');
        }
    }

    // Inhalte (Sections) umschalten
    const sections = overlayContentElement.querySelectorAll('.overlay-section');
    for (let j = 0; j < sections.length; j++) {
        const section = sections[j];
        const sectionKey = section.getAttribute('data-section');
        if (sectionKey === tabName) {
            section.classList.add('overlay-section--active');
        } else {
            section.classList.remove('overlay-section--active');
        }
    }
}

function showAllPokemon() {
    currentFilterMode = 'all';
    resetSearch();
    renderPokemonGrid(pokemonList);
}

function showFavouritePokemon() {
    currentFilterMode = 'favourites';
    resetSearch();
    const favourites = getFavouritePokemonList();
    renderPokemonGrid(favourites);
}

function loadInitialPokemon() {
    pokemonList.length = 0;
    pokemonGridElement.innerHTML = '';
    for (let id = 1; id <= INITIAL_POKEMON_COUNT; id++) {
        loadSinglePokemon(id);
    }
}

function handleLoadMoreClick() {
    if (isLoadingMore) {
        return;
    }
    isLoadingMore = true;
    loadMoreButtonElement.disabled = true;
    loadMoreLoaderElement.classList.remove('hidden');
    const startId = nextPokemonId;
    const endId = nextPokemonId + LOAD_MORE_COUNT - 1;
    for (let id = startId; id <= endId; id++) {
        loadSinglePokemon(id);
    }
    nextPokemonId = endId + 1;
    setTimeout(function () {
        isLoadingMore = false;
        loadMoreButtonElement.disabled = false;
        loadMoreLoaderElement.classList.add('hidden');
    }, 1000);
}

/* ===== Such Button ===== */
function resetSearch() {
    if (!searchInputElement || !searchMessageElement) {
        return;
    }

    searchInputElement.value = '';
    searchMessageElement.textContent = '';
}

function getBaseListForCurrentFilter() {
    if (currentFilterMode === 'favourites') {
        return getFavouritePokemonList();
    }

    return pokemonList;
}

function filterPokemonListByName(list, term) {
    const result = [];
    const lowerTerm = term.toLowerCase();

    for (let i = 0; i < list.length; i++) {
        const pokemon = list[i];
        const name = pokemon.name.toLowerCase();

        if (name.indexOf(lowerTerm) !== -1) {
            result.push(pokemon);
        }
    }

    return result;
}

function handleSearchInput(rawValue) {
    if (!searchInputElement || !searchMessageElement) {
        return;
    }

    const value = rawValue.trim();
    const length = value.length;
    const baseList = getBaseListForCurrentFilter();

    if (length === 0) {
        searchMessageElement.textContent = '';
        renderPokemonGrid(baseList);
        return;
    }

    if (length < 3) {
        searchMessageElement.textContent = 'Please enter at least 3 characters.';
        renderPokemonGrid(baseList);
        return;
    }

    const filtered = filterPokemonListByName(baseList, value);

    if (filtered.length === 0) {
        searchMessageElement.textContent = 'No Pokémon found.';
    } else {
        searchMessageElement.textContent = '';
    }

    renderPokemonGrid(filtered);
}

/* ===== Startpunkt ===== */

loadFavouritesFromStorage();
loadInitialPokemon();