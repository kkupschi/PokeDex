// script.js

let currentGeneration = 1;
let nextPokemonId = GENERATION_RANGES[currentGeneration].start;
const batchSize = 30;

let isLoading = false;
const pokemonCache = {};

function init() {
    console.log('PokeDex init');

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.addEventListener('click', handleLoadMoreClick);

    loadInitialPokemon();
}

function loadInitialPokemon() {
    loadNextBatch();
}

function handleLoadMoreClick() {
    loadNextBatch();
}

function loadNextBatch() {
    if (isLoading) {
        return;
    }

    isLoading = true;
    updateLoadingState(true);

    console.log('Would load next batch starting from ID:', nextPokemonId);

    setTimeout(() => {
        isLoading = false;
        updateLoadingState(false);
    }, 500);
}

function updateLoadingState(loading) {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadStatus = document.getElementById('loadStatus');

    if (loading) {
        loadMoreBtn.disabled = true;
        loadStatus.textContent = 'Loading Pokémon...';
    } else {
        loadMoreBtn.disabled = false;
        loadStatus.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', init);
