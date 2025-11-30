const INITIAL_POKEMON_COUNT = 30;
const pokemonList = [];
let currentOverlayIndex = 0;
let lastScrollY = 0;
const pokemonGridElement = document.getElementById('pokemon-grid');
const overlayElement = document.getElementById('overlay');
const overlayContentElement = document.getElementById('overlay-content');

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

        for (let g = 0; g < apiSpecies.egg_groups.length; g++) {
            const groupName = apiSpecies.egg_groups[g].name;
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

function createPokemonFromApiData(apiPokemon, apiSpecies) {
    const types = getTypesFromApi(apiPokemon);
    const abilities = getAbilitiesFromApi(apiPokemon);
    const baseStatsInfo = getBaseStatsFromApi(apiPokemon);
    const breedingInfo = getBreedingInfoFromSpecies(apiSpecies);

    return {
        id: apiPokemon.id, name: apiPokemon.name, types: types,
        image: getPokemonImageFromApi(apiPokemon),
        height: apiPokemon.height, weight: apiPokemon.weight,
        abilities: abilities,
        baseStats: baseStatsInfo.baseStats,
        totalBaseStats: baseStatsInfo.totalBaseStats,
        malePercent: breedingInfo.malePercent,
        femalePercent: breedingInfo.femalePercent,
        eggGroupsText: breedingInfo.eggGroupsText,
        eggCycleText: breedingInfo.eggCycleText
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
                    const pokemon = createPokemonFromApiData(pokemonData, speciesData);
                    pokemonList.push(pokemon);
                    pokemonList.sort(function (a, b) {
                        return a.id - b.id;
                    });
                    renderPokemonGrid(pokemonList);
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

/* ===== Startpunkt ===== */


loadInitialPokemon();