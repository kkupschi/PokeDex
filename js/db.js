// Type Colors
const TYPE_COLORS = {
    normal: "#A8A77A",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F7D02C",
    grass: "#7AC74C",
    ice: "#96D9D6",
    fighting: "#C22E28",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#D685AD"
};

// Generation Ranges
const GENERATION_RANGES = {
    1: { start: 1, end: 151 },
    2: { start: 152, end: 251 },
    3: { start: 252, end: 386 },
    4: { start: 387, end: 493 },
    5: { start: 494, end: 649 },
    6: { start: 650, end: 721 },
    7: { start: 722, end: 809 },
    8: { start: 810, end: 898 },
    9: { start: 899, end: 1025 }
};

// Base Stat Color
function getStatColor(base) {
    if (base <= 79) return "#5bc0de";
    if (base <= 109) return "#28a745";
    if (base <= 149) return "#ffc107";
    return "#dc3545";
}

// ID Formatierung von 0 zu 1000+
function formatPokemonId(id) {
    return String(id).padStart(4, "0");
}

// Capitalize
function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}