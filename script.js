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

function showNextPokemon() {
    const nextIndex = (currentOverlayIndex + 1) % pokemonList.length;
    flipToIndex(nextIndex);
}

function showPrevPokemon() {
    const prevIndex =
        (currentOverlayIndex - 1 + pokemonList.length) % pokemonList.length;
    flipToIndex(prevIndex);
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