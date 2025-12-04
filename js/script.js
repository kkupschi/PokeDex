const INITIAL_POKEMON_COUNT = 30;
const LOAD_MORE_COUNT = 30;
let nextPokemonId = INITIAL_POKEMON_COUNT + 1;
let isLoadingMore = false;
let currentFilterMode = "all";
let currentOverlayIndex = 0;
let lastScrollY = 0;

// --- DOM-Elemente ---
const pokemonGridElement = document.getElementById("pokemon-grid");
const overlayElement = document.getElementById("overlay");
const overlayContentElement = document.getElementById("overlay-content");
const loadMoreButtonElement = document.getElementById("load-more-button");
const loadMoreLoaderElement = document.getElementById("load-more-loader");
const searchInputElement = document.getElementById("search-input");
const searchMessageElement = document.getElementById("search-message");

// --- Scroll-Lock fürs Overlay ---
function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}

function lockBodyScroll() {
    lastScrollY = window.scrollY;
    const scrollbar = getScrollbarWidth();
    document.body.style.position = "fixed";
    document.body.style.top = `-${lastScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.paddingRight = scrollbar + "px";
}

function unlockBodyScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.paddingRight = "";
    window.scrollTo(0, lastScrollY);
}

// --- Rendering ---
function renderPokemonGrid(list) {
    pokemonGridElement.innerHTML = list.map(getPokemonCardHTML).join("");
}

function getFavouritePokemonList() {
    return pokemonList.filter(p => isFavourite(p.id));
}

function getBaseListForCurrentFilter() {
    return currentFilterMode === "favourites"
        ? getFavouritePokemonList()
        : pokemonList;
}

function handlePokemonDataChanged() {
    renderPokemonGrid(getBaseListForCurrentFilter());
}

// --- Overlay-Logik ---
function findPokemonIndexById(id) {
    return pokemonList.findIndex(p => p.id === id);
}

function showPokemonInOverlayByIndex(index, direction) {
    const pokemon = pokemonList[index];
    if (!pokemon) return;
    overlayContentElement.innerHTML = getPokemonOverlayHTML(pokemon);
    currentOverlayIndex = index;
    const card = overlayContentElement.querySelector(".overlay-card");
    if (!card) return;
    if (direction === "left") {
        card.classList.add("overlay-card--flip-left");
    } else if (direction === "right") {
        card.classList.add("overlay-card--flip-right");
    }
}

function openPokemonOverlay(id) {
    const index = findPokemonIndexById(id);
    if (index < 0) return;
    showPokemonInOverlayByIndex(index);
    overlayElement.classList.remove("hidden");
    lockBodyScroll();
}

function closeOverlay() {
    overlayElement.classList.add("hidden");
    unlockBodyScroll();
}

function showPreviousPokemonInOverlay() {
    if (currentOverlayIndex > 0) {
        showPokemonInOverlayByIndex(currentOverlayIndex - 1, "left");
    }
}

function showNextPokemonInOverlay() {
    if (currentOverlayIndex < pokemonList.length - 1) {
        showPokemonInOverlayByIndex(currentOverlayIndex + 1, "right");
    }
}

function handleFavouriteClick(id) {
    toggleFavourite(id);
    const btn = document.querySelector(".overlay-fav-button");
    if (!btn) return;
    const active = isFavourite(id);
    btn.classList.toggle("overlay-fav-button--active", active);
    btn.textContent = active ? "❤" : "♡";
}

function handleOverlayClick(event) {
    if (event.target.id === "overlay") {
        closeOverlay();
    }
}

function showOverlayTab(tab) {
    overlayContentElement
        .querySelectorAll(".overlay-tab")
        .forEach(t => t.classList.toggle(
            "overlay-tab--active",
            t.dataset.tab === tab
        ));
    overlayContentElement
        .querySelectorAll(".overlay-section")
        .forEach(s => s.classList.toggle(
            "overlay-section--active",
            s.dataset.section === tab
        ));
}

// --- Filter & Favourites ---
function showAllPokemon() {
    currentFilterMode = "all";
    resetSearch();
    renderPokemonGrid(pokemonList);
}

function showFavouritePokemon() {
    currentFilterMode = "favourites";
    resetSearch();
    renderPokemonGrid(getBaseListForCurrentFilter());
}

// --- Load More ---
function handleLoadMoreClick() {
    if (isLoadingMore) return;
    isLoadingMore = true;
    loadMoreButtonElement.disabled = true;
    loadMoreLoaderElement.classList.remove("hidden");
    const startId = nextPokemonId;
    const endId = nextPokemonId + LOAD_MORE_COUNT - 1;
    loadPokemonRange(startId, endId, handlePokemonDataChanged);
    nextPokemonId = endId + 1;
    setTimeout(() => {
        isLoadingMore = false;
        loadMoreButtonElement.disabled = false;
        loadMoreLoaderElement.classList.add("hidden");
    }, 1000);
}

// --- Suche ---
function resetSearch() {
    if (!searchInputElement || !searchMessageElement) return;
    searchInputElement.value = "";
    searchMessageElement.textContent = "";
}

function filterPokemonListByName(list, term) {
    const lower = term.toLowerCase();
    return list.filter(p => p.name.toLowerCase().includes(lower));
}

function handleSearchInput(rawValue) {
    if (!searchInputElement || !searchMessageElement) return;
    const cleaned = rawValue.replace(/[^a-zA-Z]/g, "");
    searchInputElement.value = cleaned;
    const value = cleaned.trim();
    const length = value.length;
    const baseList = getBaseListForCurrentFilter();
    if (length === 0) {
        searchMessageElement.textContent = "";
        renderPokemonGrid(baseList);
        return;
    }
    if (length < 3) {
        searchMessageElement.textContent = "Please enter at least 3 letters.";
        renderPokemonGrid(baseList);
        return;
    }
    const filtered = filterPokemonListByName(baseList, value);
    searchMessageElement.textContent =
        filtered.length === 0 ? "No Pokémon found." : "";

    renderPokemonGrid(filtered);
}

// --- Initiales Laden ---
function loadInitialPokemon() {
    pokemonList.length = 0;
    pokemonGridElement.innerHTML = "";
    loadPokemonRange(1, INITIAL_POKEMON_COUNT, handlePokemonDataChanged);
}

loadFavouritesFromStorage();
loadInitialPokemon();