(function () {
  const BASE_URL = 'http://localhost:8080';
  const SESSION_KEY = 'noxAccountSession';

  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  };

  const setSession = (session) => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const formatPrice = (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  const formatarCPF = (valor) =>
    String(valor || '')
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  const formatarTelefone = (valor) => {
    const numeros = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const resolveImageUrl = (url) => {
    if (!url) {
      return 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=88';
    }
    return url.startsWith('http') ? url : `${BASE_URL}${url}`;
  };

  const mapQuartoToSuite = (q) => {
    const listaCaracteristicas = q.caracteristicas
      ? q.caracteristicas
          .split(/[,;./·_\n]+|\s+-\s+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [
          'Cama king size',
          'Ar-condicionado',
          'Smart TV',
          'Garagem privativa',
          'Atendimento 24h'
        ];

    const resumoCurto = listaCaracteristicas.slice(0, 3).join(' · ');

    return {
      id: String(q.id),
      dbId: q.id,
      number: q.numero,
      name: q.nome,
      summary: resumoCurto,
      description: resumoCurto,
      headline: q.tituloDescricao || 'Seu momento, sem pressa.',
      longDescription:
        q.descricaoDetalhada ||
        'Ambiente climatizado, privacidade total e atendimento 24 horas para você aproveitar cada minuto.',
      priceValue: Number(q.precoDiaria),
      price: formatPrice(q.precoDiaria),
      image: resolveImageUrl(q.imagemUrl),
      status: q.status,
      amenities: listaCaracteristicas
    };
  };

  const buildPeriodoISO = (criteria = {}) => {
    const agora = new Date();
    let inicio;

    if (criteria.date) {
      const hora = criteria.arrivalTime || '21:00';
      inicio = new Date(`${criteria.date}T${hora}:00`);

      if (isNaN(inicio.getTime())) {
        throw new Error('Data ou horário inválido.');
      }

      if (inicio.getTime() < agora.getTime() - 2 * 60000) {
        throw new Error('Não é possível agendar em uma data ou horário que já passou.');
      }
    } else {
      inicio = new Date(agora.getTime() + 5 * 60000);
    }

    const horasMap = {
      '3-hours': 3,
      '6-hours': 6,
      overnight: 12
    };
    const horas = horasMap[criteria.duration] || 3;
    const fim = new Date(inicio.getTime() + horas * 3600000);

    const toLocalISO = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    return {
      dataCheckIn: toLocalISO(inicio),
      dataCheckOut: toLocalISO(fim)
    };
  };

  async function request(path, options = {}) {
    const session = getSession();
    const headers = { ...(options.headers || {}) };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      if (path !== '/api/auth/login') {
        throw new Error('Sessão expirada ou sem permissão. Faça login novamente.');
      }
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const msg =
        data?.message ||
        data?.erro ||
        (data?.campos ? Object.values(data.campos).join(' · ') : null) ||
        'Erro ao processar requisição no servidor.';
      throw new Error(msg);
    }

    return data;
  }

  window.NoxApi = {
    BASE_URL,
    getSession,
    setSession,
    formatPrice,
    formatarCPF,
    formatarTelefone,
    buildPeriodoISO,

    isLoggedIn() {
      return Boolean(getSession()?.token);
    },

    // --- AUTENTICAÇÃO ---
    async login(email, senha) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      const session = {
        token: res.token,
        user: res.usuario
      };
      setSession(session);
      return session;
    },

    async register(dados) {
      return request('/api/auth/cadastro', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    },

    logout() {
      setSession(null);
    },

    // --- QUARTOS (PÚBLICO) ---
    async listSuites() {
      const quartos = await request('/api/quartos');
      return quartos.map(mapQuartoToSuite);
    },

    async getSuite(id) {
      const quarto = await request(`/api/quartos/${id}`);
      return mapQuartoToSuite(quarto);
    },

    async checkAvailability(criteria) {
      const { dataCheckIn, dataCheckOut } = buildPeriodoISO(criteria);
      const query = new URLSearchParams({
        checkIn: dataCheckIn,
        checkOut: dataCheckOut
      });
      const disponiveis = await request(`/api/quartos/disponiveis?${query}`);
      const suites = disponiveis.map(mapQuartoToSuite);

      return {
        available: suites.length > 0,
        suites,
        criteria
      };
    },

    // --- RESERVAS E PAGAMENTO MERCADO PAGO (CLIENTE) ---
    async createReservationAndCheckout(quartoId, criteria) {
      const { dataCheckIn, dataCheckOut } = buildPeriodoISO(criteria);

      const reserva = await request('/api/reservas', {
        method: 'POST',
        body: JSON.stringify({
          quartoId: Number(quartoId),
          dataCheckIn,
          dataCheckOut
        })
      });

      const checkout = await request('/api/pagamentos/checkout', {
        method: 'POST',
        body: JSON.stringify({ reservaId: reserva.id })
      });

      return { reserva, checkout };
    },

    async iniciarPagamentoReserva(reservaId) {
      return request('/api/pagamentos/checkout', {
        method: 'POST',
        body: JSON.stringify({ reservaId: Number(reservaId) })
      });
    },

    async getMinhasReservas() {
      return request('/api/reservas/minhas');
    },

    async cancelarReserva(reservaId) {
      return request(`/api/reservas/${reservaId}/cancelar`, {
        method: 'PATCH'
      });
    },

    // --- OPERAÇÃO / RECEPÇÃO (FUNC e ADMIN) ---
    async getTodasReservas() {
      return request('/api/operacao/reservas');
    },

    async realizarCheckIn(reservaId) {
      return request(`/api/operacao/reservas/${reservaId}/checkin`, {
        method: 'PATCH'
      });
    },

    async realizarCheckOut(reservaId) {
      return request(`/api/operacao/reservas/${reservaId}/checkout`, {
        method: 'PATCH'
      });
    },

    // --- ADMIN ---
    async uploadFotoQuarto(arquivo) {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      return request('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
    },

    async listarTodosQuartosAdmin() {
      const quartos = await request('/api/admin/quartos');
      return quartos.map(mapQuartoToSuite);
    },

    async cadastrarQuarto(dados) {
      return request('/api/admin/quartos', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    },

    async atualizarQuarto(id, dados) {
      return request(`/api/admin/quartos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });
    },

    async alterarStatusQuarto(id, status) {
      return request(`/api/admin/quartos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async listarFuncionarios() {
      return request('/api/admin/funcionarios');
    },

    async cadastrarFuncionario(dados) {
      return request('/api/admin/funcionarios', {
        method: 'POST',
        body: JSON.stringify(dados)
      });
    },

    async removerFuncionario(id) {
      return request(`/api/admin/funcionarios/${id}`, {
        method: 'DELETE'
      });
    }
  };
})();
