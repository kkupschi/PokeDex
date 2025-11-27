const API_BASE = 'https://pokeapi.co/api/v2';

let pokemonList = [];
let currentOffset = 0;
let currentOverlayIndex = 0;
const PAGE_SIZE = 30;


function init() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadGen1Btn = document.getElementById('loadGen1Btn');

    loadMoreBtn.onclick = loadNextPage;
    loadGen1Btn.onclick = loadGen1Demo;

    document.getElementById('closeOverlayBtn').onclick = closeOverlay;

    const overlay = document.getElementById('overlay');
    overlay.onclick = (event) => {
        if (event.target.id === 'overlay') {
            closeOverlay();
        }
    };

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn && nextBtn) {
        prevBtn.onclick = showPrevPokemon;
        nextBtn.onclick = showNextPokemon;
    }

    loadNextPage();
}

function loadNextPage() {
    fetchPokemonList(currentOffset, PAGE_SIZE).then(renderPokemonCards);
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
        .then((response) => response.json())
        .then((data) => {
            const detailPromises = data.results.map((item) =>
                fetch(item.url).then((res) => res.json())
            );

            return Promise.all(detailPromises).then((details) => {
                pokemonList = pokemonList.concat(details);
                return pokemonList;
            });
        })
        .catch((error) => {
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

function createPokemonCardHtml(pokemon) {
    const name = capitalize(pokemon.name);
    const id = formatId(pokemon.id);
    const types = pokemon.types;
    const spriteUrl = pokemon.sprites.other['official-artwork'].front_default;
    const moves = pokemon.moves.slice(0, 4);

    const primaryType = types[0].type.name;
    const secondaryType = types[1] ? types[1].type.name : null;

    const primaryColor = TYPE_COLORS[primaryType] || '#777';
    const secondaryColor = secondaryType ? TYPE_COLORS[secondaryType] : primaryColor;

    const typeBadgesHtml = createTypeBadgesHtml(types);

    const movesHtml = moves
        .map(moveInfo => `<li>${capitalize(moveInfo.move.name)}</li>`)
        .join('');

    return `
        <article
            class="pokemon-card"
            style="background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});"
            onclick="openOverlay(${pokemon.id})"
        >
            <header class="pokemon-header">
                <span class="pokemon-name">${name}</span>
                <span class="pokemon-id">#${id}</span>
            </header>

            <div class="pokemon-types">
                ${typeBadgesHtml}
            </div>

            <div class="pokemon-sprite-wrapper">
                <img class="pokemon-sprite" src="${spriteUrl}" alt="${name}">
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

function formatId(id) {
    const paddedId = String(id).padStart(3, '0');
    return `#${paddedId}`;
}

function formatMoveName(moveName) {
    return moveName
        .split('-')
        .map((part) => capitalize(part))
        .join(' ');
}

function formatStatName(rawName) {
    return rawName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

// ---------- STATS & MOVES FÜR OVERLAY ----------

function buildStatsHtml(pokemon) {
    if (!pokemon || !pokemon.stats) {
        return '<p>No stats available.</p>';
    }

    return pokemon.stats
        .map((statObj) => {
            const base = statObj.base_stat;
            const label = formatStatName(statObj.stat.name);
            const percentage = Math.min((base / 254) * 100, 100);
            const color = getStatColor(base);

            return /*html*/ `
        <div class="stat-row">
          <span class="stat-label">${label}</span>
          <div class="stat-bar">
            <div class="stat-bar-fill"
                 style="width: ${percentage}%; background-color: ${color};">
            </div>
          </div>
          <span class="stat-value">${base}</span>
        </div>
      `;
        })
        .join('');
}

function getStatColor(base) {
    if (base <= 79) {
        return '#5bc0de';
    } else if (base <= 109) {
        return '#28a745';
    } else if (base <= 149) {
        return '#ffc107';
    } else {
        return '#dc3545';
    }
}

function buildMovesHtml(pokemon) {
    if (!pokemon || !pokemon.moves) return '<p>No moves available.</p>';

    const moves = pokemon.moves.slice(0, 4).map(m => formatMoveName(m.move.name));

    while (moves.length < 4) {
        moves.push('-');
    }

    return /*html*/ `
    <div class="moves-grid">
      <div class="move">${moves[0]}</div>
      <div class="move">${moves[1]}</div>
      <div class="move">${moves[2]}</div>
      <div class="move">${moves[3]}</div>
    </div>
  `;
}

function createTypeBadgesHtml(types) {
    return types
        .map((typeInfo) => {
            const typeName = typeInfo.type.name;
            const color = TYPE_COLORS[typeName] || '#777';

            return `
                <span
                    class="type-badge"
                    style="background-color: ${color};"
                >
                    ${capitalize(typeName)}
                </span>
            `;
        })
        .join('');
}

// ---------- OVERLAY / GROSSE KARTE ----------

function openOverlay(index) {
    currentOverlayIndex = index;
    const pokemon = pokemonList[index];

    fillOverlayWithPokemon(pokemon);

    document.getElementById('overlay').classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeOverlay() {
    document.getElementById('overlay').classList.remove('visible');
    document.body.classList.remove('no-scroll');
}

function showNextPokemon() {
    if (!pokemonList.length) return;

    currentOverlayIndex = (currentOverlayIndex + 1) % pokemonList.length;
    fillOverlayWithPokemon(pokemonList[currentOverlayIndex]);
}

function showPrevPokemon() {
    if (!pokemonList.length) return;

    currentOverlayIndex =
        (currentOverlayIndex - 1 + pokemonList.length) % pokemonList.length;
    fillOverlayWithPokemon(pokemonList[currentOverlayIndex]);
}

function fillOverlayWithPokemon(pokemon) {
    const card = document.getElementById('overlayCard');
    if (!card || !pokemon) return;

    const name = capitalize(pokemon.name);
    const id = String(pokemon.id).padStart(3, '0');

    const spriteUrl =
        pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default ||
        '';

    const types = pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name);

    const { primaryColor, secondaryColor } = getTypeGradientColors(types);

    const typeBadgesHtml = types
        .map(
            (type) =>
                `<span class="type-badge type-${type}">${capitalize(type)}</span>`
        )
        .join('');

    const statsHtml = buildStatsHtml(pokemon);
    const movesHtml = buildMovesHtml(pokemon);

    card.style.background = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

    card.innerHTML = /*html*/ `
    <header class="overlay-header">
      <div>
        <h2 class="overlay-title">${name}</h2>
        <div class="overlay-types">
          ${typeBadgesHtml}
        </div>
      </div>
      <span class="overlay-id">#${id}</span>
    </header>

    <div class="overlay-body">
      <div class="overlay-left">
        <img class="overlay-sprite" src="${spriteUrl}" alt="${name}">
      </div>

      <div class="overlay-right">
        <section class="overlay-section">
          <h3>Base stats</h3>
          ${statsHtml}
        </section>

        <section class="overlay-section">
          <h3>Moves</h3>
          <ul class="overlay-moves-list">
            ${movesHtml}
          </ul>
        </section>
      </div>
    </div>
  `;
}

init();