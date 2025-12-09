const INITIAL_POKEMON_COUNT = 30;
const LOAD_MORE_COUNT = 30;
let nextPokemonId = INITIAL_POKEMON_COUNT + 1;
let isLoadingMore = false;
let currentFilterMode = "all";
let currentOverlayIndex = 0;
let lastScrollY = 0;
let currentOverlayList = pokemonList;
const pokemonGridElement = document.getElementById("pokemon-grid");
const overlayElement = document.getElementById("overlay");
const overlayContentElement = document.getElementById("overlay-content");
const loadMoreButtonElement = document.getElementById("load-more-button");
const loadMoreLoaderElement = document.getElementById("load-more-loader");
const searchInputElement = document.getElementById("search-input");
const searchMessageElement = document.getElementById("search-message");
const loadMoreWrapperElement = document.querySelector(".load-more-wrapper");
const loadMoreWrapper = document.querySelector(".load-more-wrapper");

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

function renderPokemonGrid(list) {
    pokemonGridElement.innerHTML = list.map(getPokemonCardHTML).join("");
    currentOverlayList = list;
}

function getFavouritePokemonList() {
    return pokemonList.filter(p => isFavourite(p.id));
}

function updateLoadMoreVisibility() {
    const show = currentFilterMode === "all";
    if (!loadMoreWrapperElement) return;
    loadMoreWrapperElement.classList.toggle("hidden", !show);
}

function hideEffectivenessPanel() {
    const panel = document.getElementById("effectiveness-panel");
    if (panel) {
        panel.classList.add("hidden");
    }
}

function updateLoadMoreVisibility() {
    const wrapper = document.querySelector(".load-more-wrapper");
    if (!wrapper) return;
    if (currentFilterMode === "all") {
        wrapper.classList.remove("hidden");
    } else {
        wrapper.classList.add("hidden");
    }
}

function getBaseListForCurrentFilter() {
    return currentFilterMode === "favourites"
        ? getFavouritePokemonList()
        : pokemonList;
}

function handlePokemonDataChanged() {
    renderPokemonGrid(getBaseListForCurrentFilter());
}

function findPokemonIndexById(id) {
    return currentOverlayList.findIndex(p => p.id === id);
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
    const pokemon = currentOverlayList[index];
    if (!pokemon) return;
    overlayContentElement.innerHTML = getPokemonOverlayHTML(pokemon);
    currentOverlayIndex = index;
    const card = overlayContentElement.querySelector(".overlay-card");
    if (!card) return;
    if (direction === "left") card.classList.add("overlay-card--flip-left");
    else if (direction === "right") card.classList.add("overlay-card--flip-right");
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
    if (currentOverlayIndex < currentOverlayList.length - 1) {
        showPokemonInOverlayByIndex(currentOverlayIndex + 1, "right");
    }
}

function handleFavouriteClick(id) {
    toggleFavourite(id);
    const btn = overlayContentElement.querySelector(".overlay-fav-button");
    if (!btn) return;
    const active = isFavourite(id);
    btn.classList.toggle("overlay-fav-button--active", active);
    btn.innerText = active ? "❤" : "♡";
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

function showAllPokemon() {
    currentFilterMode = "all";
    hideEffectivenessPanel();
    resetSearch();
    renderPokemonGrid(pokemonList);
    updateLoadMoreVisibility();
}

function showFavouritePokemon() {
    currentFilterMode = "favourites";
    hideEffectivenessPanel();
    resetSearch();
    renderPokemonGrid(getBaseListForCurrentFilter());
    updateLoadMoreVisibility();
}

function hideEffectivenessPanel() {
    document.getElementById("effectiveness-panel").classList.add("hidden");
}

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

function resetSearch() {
    if (!searchInputElement || !searchMessageElement) return;
    searchInputElement.value = "";
    searchMessageElement.textContent = "";
    loadMoreWrapper.classList.remove("hidden");
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
    const cleaned = rawValue.replace(/[^a-zA-Z]/g, "");
    searchInputElement.value = cleaned;
    const value = cleaned.trim();
    const length = value.length;
    const baseList = getBaseListForCurrentFilter();
    if (length === 0) {
        loadMoreWrapper.classList.remove("hidden");
    } else {
        loadMoreWrapper.classList.add("hidden");
    }
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
    panel.classList.add("hidden");
    if (isHidden) {
        panel.classList.remove("hidden");
    }
}

function showEffectiveness() {
    currentFilterMode = "effectiveness";
    resetSearch();
    const panel = document.getElementById("effectiveness-panel");
    if (panel) {
        panel.classList.remove("hidden");
    }
    pokemonGridElement.innerHTML = "";
    updateLoadMoreVisibility();
}

function hideEffectiveness() {
    document.getElementById("effectiveness-panel").classList.add("hidden");
    pokemonGridElement.classList.remove("hidden");
    document.querySelector(".load-more-wrapper").classList.remove("hidden");
}

function loadInitialPokemon() {
    pokemonList.length = 0;
    pokemonGridElement.innerHTML = "";
    loadPokemonRange(1, INITIAL_POKEMON_COUNT, handlePokemonDataChanged);
}

loadFavouritesFromStorage();
loadInitialPokemon();
updateLoadMoreVisibility();