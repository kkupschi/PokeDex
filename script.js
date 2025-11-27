const API_BASE = 'https://pokeapi.co/api/v2';

let currentOverlayIndex = 0;
let pokemonList = [];
let currentOffset = 0;
const PAGE_SIZE = 30;

function init() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadGen1Btn = document.getElementById('loadGen1Btn');

    loadMoreBtn.onclick = loadNextPage;
    loadGen1Btn.onclick = loadGen1Demo;

    document.getElementById('closeOverlayBtn').onclick = closeOverlay;
    document.getElementById('prevBtn').onclick = showPrevPokemon;
    document.getElementById('nextBtn').onclick = showNextPokemon;

    const overlay = document.getElementById('overlay');
    overlay.onclick = function (event) {
        if (event.target.id === 'overlay') {
            closeOverlay();
        }
    };

    loadNextPage();
}

function loadNextPage() {
    fetchPokemonList(currentOffset, PAGE_SIZE)
        .then(renderPokemonCards);
    currentOffset += PAGE_SIZE;
}

function loadGen1Demo() {
    currentOffset = 0;
    pokemonList = [];
    document.getElementById('cardGrid').innerHTML = '';
    loadNextPage();
}

function fetchPokemonList(offset, limit) {
    const url = `${API_BASE}/pokemon?offset=${offset}&limit=${limit}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            const detailPromises = data.results.map(item =>
                fetch(item.url).then(res => res.json())
            );

            return Promise.all(detailPromises).then(details => {
                pokemonList = pokemonList.concat(details);
                return pokemonList;
            });
        })
        .catch(error => {
            console.error('Error while loading Pokémon:', error);
            return pokemonList;
        });
}

function renderPokemonCards() {
    const grid = document.getElementById('cardGrid');
    grid.innerHTML = '';

    pokemonList.forEach((pokemon, index) => {
        const cardHtml = createPokemonCardHtml(pokemon, index);
        grid.innerHTML += cardHtml;
    });
}

function createPokemonCardHtml(pokemon, index) {
    const name = capitalize(pokemon.name);
    const id = `#${String(pokemon.id).padStart(3, '0')}`;

    const types = pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map(t => t.type.name);

    const { primaryColor, secondaryColor } = getTypeGradientColors(types);

    const typeBadgesHtml = types
        .map(typeName => `<span class="type-badge">${capitalize(typeName)}</span>`)
        .join('');

    const moves = pokemon.moves.slice(0, 4).map(m => m.move.name);
    const movesHtml = moves
        .map(moveName => `<li>${formatMoveName(moveName)}</li>`)
        .join('');

    const spriteUrl =
        pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default ||
        '';

    return `
    <article
      class="pokemon-card"
      style="background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});"
      onclick="openOverlay(${index})"
    >
      <header class="pokemon-header">
        <span class="pokemon-name">${name}</span>
        <span class="pokemon-id">${id}</span>
      </header>

      <div class="pokemon-types">
        ${typeBadgesHtml}
      </div>

      <div class="pokemon-sprite-wrapper">
        <img
          class="pokemon-sprite"
          src="${spriteUrl}"
          alt="${name}"
        >
      </div>

      <section class="pokemon-moves">
        <div class="moves-title">Moves</div>
        <ul class="moves-list">
          ${movesHtml}
        </ul>
      </section>
    </article>
  `;
}

function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatMoveName(moveName) {
    return moveName
        .split('-')
        .map(part => capitalize(part))
        .join(' ');
}

function openOverlay(index) {
    currentOverlayIndex = index;
    fillOverlayWithPokemon(pokemonList[index]);

    document.getElementById('overlay').classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeOverlay() {
    document.getElementById('overlay').classList.remove('visible');
    document.body.classList.remove('no-scroll');
}

function showNextPokemon() {
    const lastIndex = pokemonList.length - 1;
    const targetIndex =
        currentOverlayIndex >= lastIndex ? 0 : currentOverlayIndex + 1;

    animateOverlayFlip('next', targetIndex);
}

function showPrevPokemon() {
    const lastIndex = pokemonList.length - 1;
    const targetIndex =
        currentOverlayIndex <= 0 ? lastIndex : currentOverlayIndex - 1;

    animateOverlayFlip('prev', targetIndex);
}

function animateOverlayFlip(direction, newIndex) {
    const card = document.querySelector('.overlay-card');
    if (!card) {
        return;
    }

    const flipClass = direction === 'next' ? 'flip-next' : 'flip-prev';

    card.classList.remove('flip-next', 'flip-prev');
    card.classList.add(flipClass);

    // Nach der ersten Hälfte Inhalt wechseln
    setTimeout(function () {
        currentOverlayIndex = newIndex;
        fillOverlayWithPokemon(pokemonList[currentOverlayIndex]);
    }, 200);

    // Animation-Klasse wieder entfernen
    setTimeout(function () {
        card.classList.remove('flip-next', 'flip-prev');
    }, 400);
}

function fillOverlayWithPokemon(pokemon) {
    const card = document.getElementById('overlayCard');

    const name = capitalize(pokemon.name);
    const id = `#${String(pokemon.id).padStart(3, '0')}`;

    const types = pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map(t => t.type.name);

    const { primaryColor, secondaryColor } = getTypeGradientColors(types);

    const typeBadgesHtml = types
        .map(typeName => `<span class="type-badge">${capitalize(typeName)}</span>`)
        .join('');

    const spriteUrl =
        pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default ||
        '';

    const moves = pokemon.moves.slice(0, 6).map(m => m.move.name);
    const movesHtml = moves
        .map(moveName => `<li>${formatMoveName(moveName)}</li>`)
        .join('');

    card.style.background = `linear-gradient(145deg, ${primaryColor}, ${secondaryColor})`;

    card.innerHTML = `
    <header class="overlay-header">
      <div class="overlay-name">${name}</div>
      <div class="overlay-id">${id}</div>
    </header>

    <div class="overlay-types">
      ${typeBadgesHtml}
    </div>

    <div class="overlay-sprite-wrapper">
      <img class="overlay-sprite" src="${spriteUrl}" alt="${name}">
    </div>

    <div class="overlay-section-title">Moves</div>
    <ul class="overlay-moves-list">
      ${movesHtml}
    </ul>
  `;
}


function flipToIndex(newIndex) {
    const card = document.getElementById('overlayCard');
    card.classList.add('flip');

    setTimeout(function () {
        currentOverlayIndex = newIndex;
        fillOverlayWithPokemon(pokemonList[newIndex]);
        card.classList.remove('flip');
    }, 180);
}

init();