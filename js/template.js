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

// Hilfsfunktion: Anzeige-Namen für Stats
// Hilfsfunktion: Anzeige-Namen für Stats
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
    const totalBarPercent = Math.min(100, Math.round((total / 780) * 100)); // 6*130 ~ mittlerer Wert
    const totalColor = getStatColor(total / 6); // Durchschnitt einfärben

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

    const heightCm = pokemon.height * 10;   // API: decimetres -> cm
    const weightKg = pokemon.weight / 10;   // API: hectograms -> kg
    const abilitiesText = pokemon.abilities.join(', ');

    const baseStatsHTML = getBaseStatsHTML(pokemon);

    return ''
        + '<article class="overlay-card">'
        + '  <div class="overlay-top" style="' + backgroundStyle + '">'
        + '    <div class="overlay-top-inner">'
        + '      <h2 class="overlay-name">' + displayName + '</h2>'
        + '      <span class="overlay-id">#' + formattedId + '</span>'
        + '    </div>'
        + '    <div class="overlay-types">' + typesHTML + '</div>'
        + '    <div class="overlay-image-wrap">'
        + '      <img class="overlay-image" src="' + pokemon.image + '" alt="' + displayName + '"/>'
        + '    </div>'
        + '  </div>'
        + '  <div class="overlay-bottom">'
        + '    <nav class="overlay-tabs">'
        + '      <span class="overlay-tab overlay-tab--active" data-tab="about" onclick="showOverlayTab(\'about\')">About</span>'
        + '      <span class="overlay-tab" data-tab="stats" onclick="showOverlayTab(\'stats\')">Base Stats</span>'
        + '      <span class="overlay-tab" data-tab="gender" onclick="showOverlayTab(\'gender\')">Gender</span>'
        + '      <span class="overlay-tab" data-tab="shiny" onclick="showOverlayTab(\'shiny\')">Shiny</span>'
        + '    </nav>'

        // About-Section
        + '    <div class="overlay-section overlay-section--active" data-section="about">'
        + '      <div class="overlay-row"><span>Species</span><span>' + displayName + '</span></div>'
        + '      <div class="overlay-row"><span>Height</span><span>' + heightCm + ' cm</span></div>'
        + '      <div class="overlay-row"><span>Weight</span><span>' + weightKg + ' kg</span></div>'
        + '      <div class="overlay-row"><span>Abilities</span><span>' + abilitiesText + '</span></div>'
        + '    </div>'

        // Base-Stats-Section
        + '    <div class="overlay-section" data-section="stats">'
        + '      <div class="stats-list">'
        + baseStatsHTML
        + '      </div>'
        + '      <div class="stats-type-defenses-heading">Type defenses</div>'
        + '      <p class="stats-type-defenses-text">'
        + '        The effectiveness of each type on ' + displayName + '.'
        + '      </p>'
        + '    </div>'

        // Platzhalter für Gender & Shiny (später)
        + '    <div class="overlay-section" data-section="gender">'
        + '      <p>Gender details will be shown here.</p>'
        + '    </div>'
        + '    <div class="overlay-section" data-section="shiny">'
        + '      <p>Shiny sprite and info will be shown here.</p>'
        + '    </div>'

        // Navigation Buttons
        + '    <div class="overlay-nav-buttons">'
        + '      <button class="overlay-nav-button" onclick="showPreviousPokemonInOverlay()">'
        + '        <span class="overlay-nav-arrow">&larr;</span>'
        + '        <span class="overlay-nav-label">Previous</span>'
        + '      </button>'
        + '      <button class="overlay-nav-button" onclick="showNextPokemonInOverlay()">'
        + '        <span class="overlay-nav-label">Next</span>'
        + '        <span class="overlay-nav-arrow">&rarr;</span>'
        + '      </button>'
        + '    </div>'

        + '  </div>'
        + '</article>';
}