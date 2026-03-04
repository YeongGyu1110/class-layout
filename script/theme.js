(function () {
    const savedTheme = localStorage.getItem('classLayoutTheme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    document.body.setAttribute('data-theme', theme);
})();