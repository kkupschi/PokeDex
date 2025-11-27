const API_BASE = 'https://pokeapi.co/api/v2';

let pokemonList = [];
let currentOffset = 0;
const PAGE_SIZE = 30;

function init() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadGen1Btn = document.getElementById('loadGen1Btn');

    loadMoreBtn.onclick = loadNextPage;
    loadGen1Btn.onclick = loadGen1Demo;

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

    pokemonList.forEach(pokemon => {
        const cardHtml = createPokemonCardHtml(pokemon);
        grid.innerHTML += cardHtml;
    });
}

function createPokemonCardHtml(pokemon) {
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

init();