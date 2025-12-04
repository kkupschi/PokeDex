const INITIAL_POKEMON_COUNT = 30;
const LOAD_MORE_COUNT = 30;
let nextPokemonId = INITIAL_POKEMON_COUNT + 1;
let isLoadingMore = false;
let currentFilterMode = "all";
let currentOverlayIndex = 0;
let lastScrollY = 0;
const pokemonGridElement = document.getElementById("pokemon-grid");
const overlayElement = document.getElementById("overlay");
const overlayContentElement = document.getElementById("overlay-content");
const loadMoreButtonElement = document.getElementById("load-more-button");
const loadMoreLoaderElement = document.getElementById("load-more-loader");
const searchInputElement = document.getElementById("search-input");
const searchMessageElement = document.getElementById("search-message");

// Scroll-Lock fürs Overlay
function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}

function applyBodyScrollLock(scrollbarWidth) {
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${lastScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.paddingRight = scrollbarWidth + "px";
}

function resetBodyScrollStyles() {
    const body = document.body;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.paddingRight = "";
}

function lockBodyScroll() {
    lastScrollY = window.scrollY;
    const scrollbar = getScrollbarWidth();
    applyBodyScrollLock(scrollbar);
}

function unlockBodyScroll() {
    resetBodyScrollStyles();
    window.scrollTo(0, lastScrollY);
}

// Rendering
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

// Overlay-Logik
function findPokemonIndexById(id) {
    return pokemonList.findIndex(p => p.id === id);
}

function updateOverlayContent(pokemon) {
    overlayContentElement.innerHTML = getPokemonOverlayHTML(pokemon);
}

function animateOverlayCard(direction) {
    if (!direction) return;
    const card = overlayContentElement.querySelector(".overlay-card");
    if (!card) return;
    const cls = direction === "left"
        ? "overlay-card--flip-left"
        : "overlay-card--flip-right";
    card.classList.add(cls);
}

function showPokemonInOverlayByIndex(index, direction) {
    const pokemon = pokemonList[index];
    if (!pokemon) return;
    updateOverlayContent(pokemon);
    currentOverlayIndex = index;
    animateOverlayCard(direction);
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

function toggleActiveClass(nodeList, className, predicate) {
    nodeList.forEach(el =>
        el.classList.toggle(className, predicate(el))
    );
}

function showOverlayTab(tab) {
    const tabs = overlayContentElement.querySelectorAll(".overlay-tab");
    const sections = overlayContentElement.querySelectorAll(".overlay-section");

    toggleActiveClass(
        tabs,
        "overlay-tab--active",
        el => el.dataset.tab === tab
    );
    toggleActiveClass(
        sections,
        "overlay-section--active",
        el => el.dataset.section === tab
    );
}

// Filter & Favourites
function showAllPokemon() {
    currentFilterMode = "all";
    hideEffectiveness();
    resetSearch();
    renderPokemonGrid(pokemonList);
}

function showFavouritePokemon() {
    currentFilterMode = "favourites";
    hideEffectiveness();
    resetSearch();
    renderPokemonGrid(getFavouritePokemonList());
}

function hideEffectivenessPanel() {
    document.getElementById("effectiveness-panel").classList.add("hidden");
}

// Load More
function startLoadMore() {
    isLoadingMore = true;
    loadMoreButtonElement.disabled = true;
    loadMoreLoaderElement.classList.remove("hidden");
}

function finishLoadMore() {
    isLoadingMore = false;
    loadMoreButtonElement.disabled = false;
    loadMoreLoaderElement.classList.add("hidden");
}

function finishLoadMoreAfterDelay() {
    setTimeout(finishLoadMore, 1000);
}

function handleLoadMoreClick() {
    if (isLoadingMore) return;
    startLoadMore();

    const startId = nextPokemonId;
    const endId = nextPokemonId + LOAD_MORE_COUNT - 1;

    loadPokemonRange(startId, endId, handlePokemonDataChanged);
    nextPokemonId = endId + 1;

    finishLoadMoreAfterDelay();
}

// Suche
function resetSearch() {
    if (!searchInputElement || !searchMessageElement) return;
    searchInputElement.value = "";
    searchMessageElement.textContent = "";
}

function filterPokemonListByName(list, term) {
    const lower = term.toLowerCase();
    return list.filter(p => p.name.toLowerCase().includes(lower));
}

function cleanSearchValue(raw) {
    return raw.replace(/[^a-zA-Z]/g, "").trim();
}

function handleEmptySearch(baseList) {
    searchMessageElement.textContent = "";
    renderPokemonGrid(baseList);
}

function handleTooShortSearch(baseList) {
    searchMessageElement.textContent = "Please enter at least 3 letters.";
    renderPokemonGrid(baseList);
}

function updateSearchResults(filtered) {
    searchMessageElement.textContent =
        filtered.length === 0 ? "No Pokémon found." : "";
    renderPokemonGrid(filtered);
}

function handleSearchInput(rawValue) {
    if (!searchInputElement || !searchMessageElement) return;
    const baseList = getBaseListForCurrentFilter();
    const value = cleanSearchValue(rawValue);
    searchInputElement.value = value;
    if (!value.length) {
        handleEmptySearch(baseList);
        return;
    }
    if (value.length < 3) {
        handleTooShortSearch(baseList);
        return;
    }
    const filtered = filterPokemonListByName(baseList, value);
    updateSearchResults(filtered);
}

function toggleEffectiveness() {
    const panel = document.getElementById("effectiveness-panel");
    const isHidden = panel.classList.contains("hidden");
    panel.classList.add("hidden"); // zuerst IMMER schließen
    if (isHidden) {
        panel.classList.remove("hidden");
    }
}

function showEffectiveness() {
    currentFilterMode = "effectiveness";
    document.getElementById("effectiveness-panel").classList.remove("hidden");
    pokemonGridElement.classList.add("hidden");
    document.querySelector(".load-more-wrapper").classList.add("hidden");
    resetSearch();
}

function hideEffectiveness() {
    document.getElementById("effectiveness-panel").classList.add("hidden");
    pokemonGridElement.classList.remove("hidden");
    document.querySelector(".load-more-wrapper").classList.remove("hidden");
}

// init
function loadInitialPokemon() {
    pokemonList.length = 0;
    pokemonGridElement.innerHTML = "";
    loadPokemonRange(1, INITIAL_POKEMON_COUNT, handlePokemonDataChanged);
}

loadFavouritesFromStorage();
loadInitialPokemon();