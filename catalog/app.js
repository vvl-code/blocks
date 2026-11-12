(() => {
  'use strict';

  const catalog = document.getElementById('catalog-view');
  const player = document.getElementById('player-view');
  const gameFrame = document.getElementById('game-frame');
  const playButton = document.getElementById('play-blocks');
  const backButton = document.getElementById('back-to-games');
  const record = document.getElementById('record');
  const gameUrl = new URL('../', window.location.href).href;

  let telegram = null;
  try {
    telegram = window.Telegram && window.Telegram.WebApp;
    if (telegram) {
      telegram.ready();
      telegram.expand();
      if (telegram.BackButton) telegram.BackButton.onClick(goBack);
    }
  } catch (error) {
    console.warn('Telegram integration unavailable:', error);
    telegram = null;
  }

  function setTelegramBackButton(isVisible) {
    try {
      if (!telegram || !telegram.BackButton) return;
      if (isVisible) telegram.BackButton.show();
      else telegram.BackButton.hide();
    } catch (error) {
      console.warn('Telegram back button unavailable:', error);
    }
  }

  function displayRecord() {
    try {
      const raw = window.localStorage.getItem('classic-blocks-best-v1');
      const value = Number.parseInt(raw || '0', 10);
      record.textContent = 'РЕКОРД ' + (Number.isFinite(value) && value > 0 ? value.toLocaleString('ru-RU') : '—');
    } catch {
      record.textContent = 'РЕКОРД —';
    }
  }

  function inGame() {
    return new URLSearchParams(window.location.search).get('game') === 'blocks';
  }

  function render() {
    const active = inGame();
    if (!active) {
      gameFrame.removeAttribute('src');
      player.hidden = true;
      catalog.hidden = false;
      setTelegramBackButton(false);
      displayRecord();
      document.title = 'My Games — каталог игр';
      return;
    }

    catalog.hidden = true;
    player.hidden = false;
    if (!gameFrame.hasAttribute('src')) gameFrame.src = gameUrl;
    setTelegramBackButton(true);
    document.title = 'Блоки — My Games';
  }

  function startGame() {
    if (inGame()) return;
    const url = new URL(window.location.href);
    url.searchParams.set('game', 'blocks');
    window.history.pushState({myGamesView: 'blocks'}, '', url.pathname + url.search);
    render();
  }

  function goBack() {
    if (!inGame()) return;
    if (window.history.state && window.history.state.myGamesView === 'blocks') {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      window.history.replaceState({myGamesView: 'catalog'}, '', url.pathname + url.search);
      render();
    }
  }

  playButton.addEventListener('click', startGame);
  backButton.addEventListener('click', goBack);
  window.addEventListener('popstate', render);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !inGame()) displayRecord();
  });
  render();
})();
