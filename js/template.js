function getCardBackgroundStyle(types) {
    const c1 = TYPE_COLORS[types[0]];
    if (types.length === 1) return `background:${c1};`;
    const c2 = TYPE_COLORS[types[1]];
    return `background:linear-gradient(135deg,${c1} 0%,${c1} 50%,${c2} 50%,${c2} 100%);`;
}

function getTypeBadgesHTML(types) {
    return types
        .map(t => `<span class="type-badge" style="background:${TYPE_COLORS[t]};">${capitalize(t)}</span>`)
        .join("");
}

const getCardImageHTML = p =>
    `<div class="pokemon-image-wrap"><img class="pokemon-image" src="${p.image}" alt="${p.name}" /></div>`;

function getPokemonCardHTML(p) {
    const displayName = capitalize(p.name);
    const formattedId = formatPokemonId(p.id);
    return `
        <article class="pokemon-card" style="${getCardBackgroundStyle(p.types)}"
                 onclick="openPokemonOverlay(${p.id})">
            <header class="pokemon-card-header">
                <h2 class="pokemon-name">${displayName}</h2>
                <span class="pokemon-id pokemon-id--below">#${formattedId}</span>
            </header>
            <div class="pokemon-types">${getTypeBadgesHTML(p.types)}</div>
            ${getCardImageHTML(p)}
        </article>`;
}

function getStatDisplayName(n) {
    const map = {
        "hp": "HP",
        "attack": "Attack",
        "defense": "Defense",
        "special-attack": "Sp. Atk",
        "special-defense": "Sp. Def",
        "speed": "Speed"
    };
    return map[n] || capitalize(n);
}

function getBaseStatsHTML(p) {
    if (!p.baseStats?.length) return "";
    const order = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
    const rows = order
        .map(stat => {
            const s = p.baseStats.find(x => x.name === stat);
            if (!s) return "";
            const percent = Math.min(100, Math.round((s.value / 180) * 100));
            return `
            <div class="stat-row">
                <span class="stat-label">${getStatDisplayName(stat)}</span>
                <span class="stat-number">${s.value}</span>
                <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width:${percent}%;background:${getStatColor(s.value)};"></div>
                </div>
            </div>`;
        })
        .join("");
    const totalPercent = Math.min(100, Math.round((p.totalBaseStats / 780) * 100));
    const totalColor = getStatColor(p.totalBaseStats / 6);
    return `
        ${rows}
        <div class="stat-row stat-row-total">
            <span class="stat-label">Total</span>
            <span class="stat-number">${p.totalBaseStats}</span>
            <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width:${totalPercent}%;background:${totalColor};"></div>
            </div>
        </div>`;
}

function getEvolutionEntryHTML(e) {
    const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${e.id}.png`;
    return `
        <div class="evolution-entry">
            <div class="evolution-image-wrap">
                <img class="evolution-image" src="${img}" alt="${capitalize(e.name)}"/>
            </div>
            <div class="evolution-label">#${formatPokemonId(e.id)} ${capitalize(e.name)}</div>
        </div>`;
}

function getEvolutionHTML(p) {
    if (!p.evolutionChain?.length)
        return `<p class="evolution-empty">No evolution data available.</p>`;

    return `
        <div class="evolution-chain">
            ${p.evolutionChain
            .map((e, i) =>
                getEvolutionEntryHTML(e) +
                (i < p.evolutionChain.length - 1 ? `<div class="evolution-arrow">→</div>` : "")
            )
            .join("")}
        </div>`;
}

function formatMoveName(n) {
    return n.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join(" ");
}

function getMovesHTML(p) {
    const m = p.moves || [];
    if (!m.length) return `<p class="moves-empty">No moves available.</p>`;
    return `
        <div class="moves-list">
            ${m.slice(0, 12)
            .map(move => `
                    <div class="move-row">
                        <span class="move-level">Lv. ${move.level}</span>
                        <span class="move-name">${formatMoveName(move.name)}</span>
                    </div>`)
            .join("")}
        </div>`;
}

function getPokemonOverlayHTML(p) {
    const backgroundStyle = getCardBackgroundStyle(p.types);
    const typesHTML = getTypeBadgesHTML(p.types);
    const formattedId = formatPokemonId(p.id);
    const displayName = capitalize(p.name);
    const heightCm = p.height * 10;
    const weightKg = p.weight / 10;
    const abilitiesText = p.abilities.join(", ");

    const favActive = isFavourite(p.id);
    const favClass = favActive
        ? "overlay-fav-button overlay-fav-button--active"
        : "overlay-fav-button";
    const favIcon = favActive ? "❤" : "♡";

    const genderHTML =
        p.malePercent != null && p.femalePercent != null
            ? `<span class="gender-icon male">♂</span> <span class="gender-value">${p.malePercent.toFixed(
                1
            )}%</span>&nbsp;&nbsp;<span class="gender-icon female">♀</span> <span class="gender-value">${p.femalePercent.toFixed(
                1
            )}%</span>`
            : "Genderless";

    const eggGroupsText = p.eggGroupsText || "-";
    const eggCycleText = p.eggCycleText || "-";

    const shinyHTML = p.shinyImage
        ? `<div class="shiny-wrap"><img class="shiny-image" src="${p.shinyImage}" alt="${displayName} shiny"></div>`
        : `<p class="shiny-empty">No shiny sprite available.</p>`;

    return `
        <article class="overlay-card">
            <div class="overlay-top" style="${backgroundStyle}">
                <div class="overlay-top-inner">
                    <h2 class="overlay-name">${displayName}</h2>
                    <div class="overlay-top-right">
                        <span class="overlay-id">#${formattedId}</span>
                        <button class="${favClass}" type="button" onclick="handleFavouriteClick(${p.id})">
                            ${favIcon}
                        </button>
                    </div>
                </div>
                <div class="overlay-types">${typesHTML}</div>
                <div class="overlay-image-wrap">
                    <img class="overlay-image" src="${p.image}" alt="${displayName}"/>
                </div>
            </div>

            <div class="overlay-bottom">
                <nav class="overlay-tabs">
                    <span class="overlay-tab overlay-tab--active" data-tab="about" onclick="showOverlayTab('about')">About</span>
                    <span class="overlay-tab" data-tab="stats" onclick="showOverlayTab('stats')">Base Stats</span>
                    <span class="overlay-tab" data-tab="evolution" onclick="showOverlayTab('evolution')">Evolution</span>
                    <span class="overlay-tab" data-tab="moves" onclick="showOverlayTab('moves')">Moves</span>
                    <span class="overlay-tab" data-tab="shiny" onclick="showOverlayTab('shiny')">Shiny</span>
                </nav>

                <div class="overlay-content-scroll">

                    <!-- ABOUT -->
                    <div class="overlay-section overlay-section--active" data-section="about">
                        <div class="overlay-row"><span>Species</span><span>${displayName}</span></div>
                        <div class="overlay-row"><span>Height</span><span>${heightCm} cm</span></div>
                        <div class="overlay-row"><span>Weight</span><span>${weightKg} kg</span></div>
                        <div class="overlay-row"><span>Abilities</span><span>${abilitiesText}</span></div>

                        <div class="overlay-breeding-heading">Breeding</div>
                        <div class="overlay-row"><span>Gender</span><span>${genderHTML}</span></div>
                        <div class="overlay-row"><span>Egg Groups</span><span>${eggGroupsText}</span></div>
                        <div class="overlay-row"><span>Egg Cycle</span><span>${eggCycleText}</span></div>
                    </div>

                    <!-- STATS -->
                    <div class="overlay-section" data-section="stats">
                        <div class="stats-list">${getBaseStatsHTML(p)}</div>
                        <div class="stats-type-defenses-heading">Type defenses</div>
                        <p class="stats-type-defenses-text">
                            The effectiveness of each type on ${displayName}.
                        </p>
                    </div>

                    <!-- EVOLUTION -->
                    <div class="overlay-section" data-section="evolution">
                        ${getEvolutionHTML(p)}
                    </div>

                    <!-- MOVES -->
                    <div class="overlay-section" data-section="moves">
                        ${getMovesHTML(p)}
                    </div>

                    <!-- SHINY -->
                    <div class="overlay-section" data-section="shiny">
                        ${shinyHTML}
                    </div>
                </div>

                <div class="overlay-nav-buttons">
                    <button class="overlay-nav-button" onclick="showPreviousPokemonInOverlay()">
                        <span class="overlay-nav-arrow">&larr;</span>
                        <span class="overlay-nav-label">Previous</span>
                    </button>
                    <button class="overlay-nav-button" onclick="showNextPokemonInOverlay()">
                        <span class="overlay-nav-label">Next</span>
                        <span class="overlay-nav-arrow">&rarr;</span>
                    </button>
                </div>
            </div>
        </article>`;
}