const INITIAL_POKEMON_COUNT = 30;
const pokemonList = [];
let currentOverlayIndex = 0;
let lastScrollY = 0;
const pokemonGridElement = document.getElementById('pokemon-grid');
const overlayElement = document.getElementById('overlay');
const overlayContentElement = document.getElementById('overlay-content');

/* Wählt das beste Bild aus den API-Daten aus.*/
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

function createPokemonFromApiData(apiPokemon) {
    const types = [];
    for (let i = 0; i < apiPokemon.types.length; i++) {
        const typeName = apiPokemon.types[i].type.name;
        types.push(typeName);
    }

    const abilities = [];
    for (let j = 0; j < apiPokemon.abilities.length; j++) {
        const abilityName = apiPokemon.abilities[j].ability.name;
        abilities.push(capitalize(abilityName));
    }

    const pokemon = {
        id: apiPokemon.id,
        name: apiPokemon.name,
        types: types,
        image: getPokemonImageFromApi(apiPokemon),

        height: apiPokemon.height,
        weight: apiPokemon.weight,
        abilities: abilities
    };

    return pokemon;
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
    const url = 'https://pokeapi.co/api/v2/pokemon/' + id;

    fetch(url)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            const pokemon = createPokemonFromApiData(data);

            pokemonList.push(pokemon);

            pokemonList.sort(function (a, b) {
                return a.id - b.id;
            });

            renderPokemonGrid(pokemonList);
        })
        .catch(function (error) {
            console.log('Fehler beim Laden von Pokémon mit ID ' + id, error);
        });
}

function loadInitialPokemon() {
    for (let id = 1; id <= INITIAL_POKEMON_COUNT; id++) {
        loadSinglePokemon(id);
    }
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

/* ===== Startpunkt ===== */

loadInitialPokemon();