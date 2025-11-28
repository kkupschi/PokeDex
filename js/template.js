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

// Overlay-Inhalt (große Karte)
function getPokemonOverlayHTML(pokemon) {
    const backgroundStyle = getCardBackgroundStyle(pokemon.types);
    const typesHTML = getTypeBadgesHTML(pokemon.types);
    const formattedId = formatPokemonId(pokemon.id);
    const displayName = capitalize(pokemon.name);

    const heightCm = pokemon.height * 10;
    const weightKg = pokemon.weight / 10;
    const abilitiesText = pokemon.abilities.join(', ');

    const genderText = pokemon.genderText || 'Genderless';
    const eggGroupsText = pokemon.eggGroupsText || '-';
    const eggCycleText = pokemon.eggCycleText || '-';

    return (
        '<article class="overlay-card">' +

        '  <div class="overlay-top" style="' + backgroundStyle + '">' +
        '    <div class="overlay-top-inner">' +
        '      <h2 class="overlay-name">' + displayName + '</h2>' +
        '      <div class="overlay-top-right">' +
        '        <span class="overlay-id">#' + formattedId + '</span>' +
        '        <button class="overlay-fav-button" type="button">❤</button>' +
        '      </div>' +
        '    </div>' +

        '    <div class="overlay-types">' +
        typesHTML +
        '    </div>' +

        '    <div class="overlay-image-wrap">' +
        '      <img class="overlay-image" src="' + pokemon.image + '" alt="' + displayName + '"/>' +
        '    </div>' +
        '  </div>' +

        '  <div class="overlay-bottom">' +

        '    <nav class="overlay-tabs">' +
        '      <span class="overlay-tab overlay-tab--active">About</span>' +
        '      <span class="overlay-tab">Base Stats</span>' +
        '      <span class="overlay-tab">Gender</span>' +
        '      <span class="overlay-tab">Shiny</span>' +
        '    </nav>' +

        '    <div class="overlay-section">' +

        '      <div class="overlay-row">' +
        '        <span>Species</span><span>' + displayName + '</span>' +
        '      </div>' +

        '      <div class="overlay-row">' +
        '        <span>Height</span><span>' + heightCm + ' cm</span>' +
        '      </div>' +

        '      <div class="overlay-row">' +
        '        <span>Weight</span><span>' + weightKg + ' kg</span>' +
        '      </div>' +

        '      <div class="overlay-row">' +
        '        <span>Abilities</span><span>' + abilitiesText + '</span>' +
        '      </div>' +

        '      <div class="overlay-breeding-heading">Breeding</div>' +

        '      <div class="overlay-row">' +
        '        <span>Gender</span><span>' + genderText + '</span>' +
        '      </div>' +

        '      <div class="overlay-row">' +
        '        <span>Egg Groups</span><span>' + eggGroupsText + '</span>' +
        '      </div>' +

        '      <div class="overlay-row">' +
        '        <span>Egg Cycle</span><span>' + eggCycleText + '</span>' +
        '      </div>' +

        '    </div>' +

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
