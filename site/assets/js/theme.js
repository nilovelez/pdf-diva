// Theme switch: follows the system by default; the user can force light or dark.
// The forced choice is stored in localStorage and applied before paint by the inline
// script in <head>.
(function () {
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var buttons = document.querySelectorAll('[data-set-theme]');

  function current() {
    return root.dataset.theme || (media.matches ? 'dark' : 'light');
  }

  function sync() {
    var theme = current();
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme));
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var theme = b.dataset.setTheme;
      var system = media.matches ? 'dark' : 'light';
      if (theme === system) {
        // Choosing the system theme goes back to "follow the system".
        delete root.dataset.theme;
        try { localStorage.removeItem('theme'); } catch (e) {}
      } else {
        root.dataset.theme = theme;
        try { localStorage.setItem('theme', theme); } catch (e) {}
      }
      sync();
    });
  });

  media.addEventListener('change', sync);
  sync();
})();
