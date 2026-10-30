/* ═══════════════════════════════════════════════════════════════
   Démarrage de Terminal OS
   ═══════════════════════════════════════════════════════════════ */

(function boot() {
  TOS.load();

  const burger = document.getElementById('burger');
  if (burger) burger.innerHTML = TOS.icon('menu');
  const footSettings = document.getElementById('footSettings');
  if (footSettings) footSettings.innerHTML = TOS.icon('settings');

  document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('drawer'));
  document.getElementById('sheet').addEventListener('click', (e) => {
    if (e.target.dataset.close === '1') TOS.closeSheet();
  });
  if (footSettings) footSettings.addEventListener('click', () => TOS.go('settings'));

  const hash = (location.hash || '').replace('#', '');
  TOS.route = TOS.screens[hash] ? hash : 'cockpit';

  // haptique globale (Android uniquement)
  document.addEventListener('pointerdown', () => {
    if (TOS.state.settings.haptics && navigator.vibrate) {
      try { navigator.vibrate(6); } catch (e) {}
    }
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const id = (location.hash || '').replace('#', '');
    if (id && TOS.screens[id] && id !== TOS.route) TOS.go(id, { replace: true });
  });

  // premier rendu
  TOS.paintNav();
  TOS.render();

  const shell = document.getElementById('shell');
  const bootEl = document.getElementById('boot');
  shell.hidden = false;
  bootEl.style.opacity = '0';
  setTimeout(() => { bootEl.style.display = 'none'; }, 380);

  // sélection automatique d'un modèle si le moteur local répond
  (async () => {
    const p = TOS.provider();
    if (!p || p.model || !p.enabled) return;
    try {
      const models = await TOS.listModels(p);
      if (models.length) {
        p.model = models[0].id;
        TOS.save();
        if (TOS.route === 'chat' || TOS.route === 'cockpit') TOS.render();
      }
    } catch (e) {
      // silencieux : le moteur local n'est pas lancé, la chaîne de failover prendra le relais
    }
  })();
})();
