(function () {
  const params = new URLSearchParams(window.location.search);

  const getParam = (key, fallback = '') => {
    const value = params.get(key);
    return value && value !== 'null' ? value : fallback;
  };

  window.NoxFlow = {
    criteria: {
      unit: getParam('unit', 'moema'),
      date: getParam('date', new Date().toISOString().slice(0, 10)),
      arrivalTime: getParam('arrivalTime', '21:00'),
      duration: getParam('duration', '3-hours')
    },

    suiteId: getParam('suite', ''),

    formatDate(value) {
      if (!value) return 'Hoje';

      return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    },

    formatDateTime(isoString) {
      if (!isoString) return '-';
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    go(path, extra = {}) {
      const values = {
        ...this.criteria,
        suite: this.suiteId,
        ...extra
      };

      Object.keys(values).forEach((key) => {
        if (
          values[key] === null ||
          values[key] === undefined ||
          values[key] === ''
        ) {
          delete values[key];
        }
      });

      const query = new URLSearchParams(values);
      window.location.href = `${path}?${query}`;
    }
  };

  document.querySelectorAll('[data-flow-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      window.NoxFlow.go(link.dataset.flowLink);
    });
  });
})();
