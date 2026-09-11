// Apply the saved preference before styles load to avoid a dark flash.
(function () {
  var theme = 'dark';
  try {
    var saved = localStorage.getItem('supercampus-landing-theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch (_) { /* Theme switching still works when storage is unavailable. */ }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#ffffff' : '#020204';
})();
