// Hintergrund-Farbverlauf basierend auf Typen
function getCardBackgroundStyle(types) {
    const firstType = types[0];
    const firstColor = TYPE_COLORS[firstType];

    if (types.length === 1) {
        return "background:" + firstColor + ";";
    }

    const secondType = types[1];
    const secondColor = TYPE_COLORS[secondType];

    return (
        "background: linear-gradient(135deg, " +
        firstColor +
        " 0%, " +
        firstColor +
        " 50%, " +
        secondColor +
        " 50%, " +
        secondColor +
        " 100%);"
    );
}

// Typ-Badges HTML
function getTypeBadgesHTML(types) {
    let html = "";

    for (let i = 0; i < types.length; i++) {
        const typeName = types[i];
        const color = TYPE_COLORS[typeName];

        html =
            html +
            '<span class="type-badge" style="background:' +
            color +
            ';">' +
            capitalize(typeName) +
            "</span>";
    }

    return html;
}

// Bild in kleiner Karte
function getCardImageHTML(pokemon) {
    return (
        '<div class="pokemon-image-wrap">' +
        '<img class="pokemon-image" src="' +
        pokemon.image +
        '" alt="' +
        pokemon.name +
        '" />' +
        "</div>"
    );
}

// Kleine Pokémon-Karte
function getPokemonCardHTML(pokemon) {
    const cardStyle = getCardBackgroundStyle(pokemon.types);
    const typesHTML = getTypeBadgesHTML(pokemon.types);
    const imageHTML = getCardImageHTML(pokemon);
    const formattedId = formatPokemonId(pokemon.id);
    const displayName = capitalize(pokemon.name);

    return (
        '<article class="pokemon-card" ' +
        'style="' +
        cardStyle +
        '" ' +
        'onclick="openPokemonOverlay(' +
        pokemon.id +
        ')">' +
        '<header class="pokemon-card-header">' +
        '<h2 class="pokemon-name">' +
        displayName +
        "</h2>" +
        '<span class="pokemon-id">#' +
        formattedId +
        "</span>" +
        "</header>" +
        '<div class="pokemon-types">' +
        typesHTML +
        "</div>" +
        imageHTML +
        "</article>"
    );
}

function getStatDisplayName(statName) {
    if (statName === 'hp') {
        return 'HP';
    }

    if (statName === 'attack') {
        return 'Attack';
    }

    if (statName === 'defense') {
        return 'Defense';
    }

    if (statName === 'special-attack') {
        return 'Sp. Atk';
    }

    if (statName === 'special-defense') {
        return 'Sp. Def';
    }

    if (statName === 'speed') {
        return 'Speed';
    }

    return capitalize(statName);
}

// HTML für Base-Stats-Liste
function getBaseStatsHTML(pokemon) {
    if (!pokemon.baseStats || pokemon.baseStats.length === 0) {
        return '';
    }

    const orderedNames = [
        'hp',
        'attack',
        'defense',
        'special-attack',
        'special-defense',
        'speed'
    ];

    let html = '';

    for (let i = 0; i < orderedNames.length; i++) {
        const wantedName = orderedNames[i];
        let foundStat = null;

        for (let j = 0; j < pokemon.baseStats.length; j++) {
            const stat = pokemon.baseStats[j];
            if (stat.name === wantedName) {
                foundStat = stat;
                break;
            }
        }

        if (!foundStat) {
            continue;
        }

        const base = foundStat.value;
        const label = getStatDisplayName(foundStat.name);
        const barColor = getStatColor(base);
        const barPercent = Math.min(100, Math.round((base / 180) * 100));

        html = html
            + '<div class="stat-row">'
            + '<span class="stat-label">' + label + '</span>'
            + '<span class="stat-number">' + base + '</span>'
            + '<div class="stat-bar-track">'
            + '  <div class="stat-bar-fill" '
            + '       style="width:' + barPercent + '%; background:' + barColor + ';"></div>'
            + '</div>'
            + '</div>';
    }

    // Total-Zeile
    const total = pokemon.totalBaseStats;
    const totalBarPercent = Math.min(100, Math.round((total / 780) * 100));
    const totalColor = getStatColor(total / 6);

    html = html
        + '<div class="stat-row stat-row-total">'
        + '<span class="stat-label">Total</span>'
        + '<span class="stat-number">' + total + '</span>'
        + '<div class="stat-bar-track">'
        + '  <div class="stat-bar-fill" '
        + '       style="width:' + totalBarPercent + '%; background:' + totalColor + ';"></div>'
        + '</div>'
        + '</div>';

    return html;
}

// Overlay-Inhalt (große Karte)
function getPokemonOverlayHTML(pokemon) {
    const backgroundStyle = getCardBackgroundStyle(pokemon.types);
    const typesHTML = getTypeBadgesHTML(pokemon.types);
    const formattedId = formatPokemonId(pokemon.id);
    const displayName = capitalize(pokemon.name);

    const heightCm = pokemon.height * 10;
    const weightKg = pokemon.weight / 10;
    const abilitiesText = pokemon.abilities.join(', ');

    const baseStatsHTML = getBaseStatsHTML(pokemon);

    // Favoriten Status
    const favActive = isFavourite(pokemon.id);
    const favButtonClass = favActive
        ? 'overlay-fav-button overlay-fav-button--active'
        : 'overlay-fav-button';
    const favIcon = favActive ? '❤' : '♡';

    // Gender HTML
    let genderHTML = 'Genderless';
    if (pokemon.malePercent != null && pokemon.femalePercent != null) {
        genderHTML =
            '<span class="gender-icon male">♂</span>' +
            ' <span class="gender-value">' + pokemon.malePercent.toFixed(1) + '%</span>' +
            '&nbsp;&nbsp;' +
            '<span class="gender-icon female">♀</span>' +
            ' <span class="gender-value">' + pokemon.femalePercent.toFixed(1) + '%</span>';
    }

    const eggGroupsText = pokemon.eggGroupsText || '-';
    const eggCycleText = pokemon.eggCycleText || '-';

    return (
        '<article class="overlay-card">' +

        // TOP
        '  <div class="overlay-top" style="' + backgroundStyle + '">' +
        '    <div class="overlay-top-inner">' +
        '      <h2 class="overlay-name">' + displayName + '</h2>' +
        '      <div class="overlay-top-right">' +
        '        <span class="overlay-id">#' + formattedId + '</span>' +
        '        <button class="' + favButtonClass + '" type="button" onclick="handleFavouriteClick(' + pokemon.id + ')">' + favIcon +
        '        </button>' +
        '      </div>' +
        '    </div>' +
        '    <div class="overlay-types">' + typesHTML + '</div>' +
        '    <div class="overlay-image-wrap">' +
        '      <img class="overlay-image" src="' + pokemon.image + '" alt="' + displayName + '"/>' +
        '    </div>' +
        '  </div>' +

        // BOTTOM
        '  <div class="overlay-bottom">' +

        // Tabs
        '    <nav class="overlay-tabs">' +
        '      <span class="overlay-tab overlay-tab--active" data-tab="about" onclick="showOverlayTab(\'about\')">About</span>' +
        '      <span class="overlay-tab" data-tab="stats" onclick="showOverlayTab(\'stats\')">Base Stats</span>' +
        '      <span class="overlay-tab" data-tab="evolution" onclick="showOverlayTab(\'evolution\')">Evolution</span>' +
        '      <span class="overlay-tab" data-tab="moves" onclick="showOverlayTab(\'moves\')">Moves</span>' +
        '    </nav>' +

        // ABOUT
        '    <div class="overlay-section overlay-section--active" data-section="about">' +
        '      <div class="overlay-row"><span>Species</span><span>' + displayName + '</span></div>' +
        '      <div class="overlay-row"><span>Height</span><span>' + heightCm + ' cm</span></div>' +
        '      <div class="overlay-row"><span>Weight</span><span>' + weightKg + ' kg</span></div>' +
        '      <div class="overlay-row"><span>Abilities</span><span>' + abilitiesText + '</span></div>' +

        '      <div class="overlay-breeding-heading">Breeding</div>' +
        '      <div class="overlay-row"><span>Gender</span><span>' + genderHTML + '</span></div>' +
        '      <div class="overlay-row"><span>Egg Groups</span><span>' + eggGroupsText + '</span></div>' +
        '      <div class="overlay-row"><span>Egg Cycle</span><span>' + eggCycleText + '</span></div>' +
        '    </div>' +

        // BASE STATS
        '    <div class="overlay-section" data-section="stats">' +
        '      <div class="stats-list">' +
        baseStatsHTML +
        '      </div>' +
        '      <div class="stats-type-defenses-heading">Type defenses</div>' +
        '      <p class="stats-type-defenses-text">The effectiveness of each type on ' + displayName + '.</p>' +
        '    </div>' +

        // EVOLUTION (Platzhalter)
        '    <div class="overlay-section" data-section="evolution">' +
        '      <p>Evolution chain will be shown here.</p>' +
        '    </div>' +

        // MOVES (Platzhalter)
        '    <div class="overlay-section" data-section="moves">' +
        '      <p>Moves list will be shown here.</p>' +
        '    </div>' +

        // NAV BUTTONS
        '    <div class="overlay-nav-buttons">' +
        '      <button class="overlay-nav-button" onclick="showPreviousPokemonInOverlay()">' +
        '        <span class="overlay-nav-arrow">&larr;</span>' +
        '        <span class="overlay-nav-label">Previous</span>' +
        '      </button>' +
        '      <button class="overlay-nav-button" onclick="showNextPokemonInOverlay()">' +
        '        <span class="overlay-nav-label">Next</span>' +
        '        <span class="overlay-nav-arrow">&rarr;</span>' +
        '      </button>' +
        '    </div>' +

        '  </div>' +
        '</article>'
    );
}