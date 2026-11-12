(() => {
  'use strict';
  const destination = new URL('https://vvl-code.github.io/catalog/');
  const incoming = new URLSearchParams(location.search);
  const game = incoming.get('game');
  if (game && /^[a-z0-9]{1,30}$/.test(game)) destination.searchParams.set('game', game);
  if (location.hash) destination.hash = location.hash;
  location.replace(destination.href);
})();
