(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const catalog = $('catalog-view');
  const player = $('player-view');
  const gameFrame = $('game-frame');
  const backButton = $('back-to-games');
  const playerTitle = $('player-title');
  const games = Object.freeze({
    blocks: {
      title: 'БЛОКИ',
      description: 'Блоки — классическая игра',
      url: new URL('../', window.location.href).href
    },
    match3: {
      title: 'ТРИ В РЯД',
      description: 'Три в ряд — головоломка',
      url: new URL('../match3/', window.location.href).href
    },
    solitaire: {
      title: 'КОСЫНКА',
      description: 'Косынка — классический пасьянс',
      url: new URL('../solitaire/', window.location.href).href
    }
  });

  let telegram = null;
  try {
    telegram = window.Telegram?.WebApp || null;
    if (telegram) {
      telegram.ready();
      telegram.expand();
      telegram.BackButton?.onClick(goBack);
    }
  } catch (error) {
    console.warn('Telegram interface unavailable:', error);
    telegram = null;
  }

  function setTelegramBackButton(visible) {
    try {
      if (visible) telegram?.BackButton?.show();
      else telegram?.BackButton?.hide();
    } catch (error) {
      console.warn('Telegram BackButton unavailable:', error);
    }
  }

  function currentGame() {
    const id = new URLSearchParams(window.location.search).get('game');
    return Object.prototype.hasOwnProperty.call(games, id) ? id : null;
  }

  function formattedRecord(key) {
    try {
      const n = Number.parseInt(window.localStorage.getItem(key) || '0', 10);
      return Number.isSafeInteger(n) && n > 0 ? n.toLocaleString('ru-RU') : '—';
    } catch {
      return '—';
    }
  }

  function displayRecords() {
    $('record').textContent = 'РЕКОРД ' + formattedRecord('classic-blocks-best-v1');
    $('match3-record').textContent = 'РЕКОРД ' + formattedRecord('mygames-match3-best-v1');
    $('solitaire-record').textContent = 'ПОБЕДЫ ' + formattedRecord('mygames-solitaire-wins-v1');
  }

  function render() {
    const id = currentGame();
    const config = id && games[id];
    if (!config) {
      if (gameFrame.hasAttribute('src')) gameFrame.removeAttribute('src');
      delete gameFrame.dataset.game;
      player.hidden = true;
      catalog.hidden = false;
      setTelegramBackButton(false);
      document.title = 'My Games — каталог игр';
      displayRecords();
      // The child frame may finish persisting a just-closed game on pagehide.
      window.setTimeout(displayRecords, 100);
      return;
    }

    catalog.hidden = true;
    player.hidden = false;
    playerTitle.textContent = config.title + '.';
    gameFrame.title = config.description;
    if (gameFrame.dataset.game !== id) {
      gameFrame.dataset.game = id;
      gameFrame.src = config.url;
    }
    setTelegramBackButton(true);
    document.title = config.description + ' — My Games';
  }

  function startGame(id) {
    if (!Object.prototype.hasOwnProperty.call(games, id)) return;
    if (currentGame() === id) return;
    const url = new URL(window.location.href);
    url.searchParams.set('game', id);
    // Direct in-place navigation avoids iFrame/WebView history double-back.
    window.history.replaceState({myGamesView: id}, '', url.pathname + url.search + url.hash);
    render();
  }

  function goBack() {
    if (!currentGame()) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    window.history.replaceState({myGamesView: 'catalog'}, '', url.pathname + url.search + url.hash);
    render();
  }

  for (const button of document.querySelectorAll('[data-game]')) {
    button.addEventListener('click', () => startGame(button.dataset.game));
  }
  backButton.addEventListener('click', goBack);
  window.addEventListener('popstate', render);
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !currentGame()) displayRecords();
  });

  render();
})();
