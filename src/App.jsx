import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, FileText, Plus, Search, MapPin, Trash2, 
  ChevronDown, ChevronUp, Save, X, Edit, Clock, 
  CheckCircle, AlertCircle, FileSearch, Copy, AlertTriangle,
  Sun, Moon, Loader2, Download, Filter, Calendar,
  LogOut, Lock, Mail
} from 'lucide-react';

// --- IMPORTAÇÕES DO FIREBASE ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';

// ==========================================
// 1. INICIALIZAÇÃO DO BANCO DE DADOS
// ==========================================

// Substitua estas chaves pelas que o Firebase lhe forneceu
const firebaseConfig = {
  apiKey: "AIzaSyBqw7naj6ee3BlJlf7YdaSuYouqQGgLofE",
  authDomain: "sisproc-prefeitura.firebaseapp.com",
  projectId: "sisproc-prefeitura",
  storageBucket: "sisproc-prefeitura.firebasestorage.app",
  messagingSenderId: "759916667256",
  appId: "1:759916667256:web:18507875005f46714c288d"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 2. UTILITÁRIOS E ESTADO INICIAL
// ==========================================

const gerarId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

const maskCPF = (value) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskInscricao = (value) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{6})(\d)/, '$1-$2')
    .replace(/(-\d{1})\d+?$/, '$1');
};

const maskArea = (value) => {
  if (!value) return '';
  let v = value.replace(/\D/g, '');
  if (!v) return '';
  v = (parseInt(v, 10) / 100).toFixed(2);
  v = v.replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return v === '0,00' ? '' : v;
};

const imovelInicial = () => ({
  id: gerarId(),
  inscricao: '',
  endereco: '',
  areas: {
    terrenoDe: '', terrenoPara: '',
    fracaoDe: '', fracaoPara: '',
    construidaDe: '', construidaPara: '',
    acpDe: '', acpPara: '',
    acpdDe: '', acpdPara: '',
    acptDe: '', acptPara: '',
    acpsDe: '', acpsPara: '',
    acuDe: '', acuPara: '',
    artDe: '', artPara: '',
    aceDe: '', acePara: '',
    acucDe: '', acucPara: '',
  },
  iptu: {
    recalculoAnos: [],
    complementoAnos: []
  }
});

const processoInicial = () => ({
  id: gerarId(),
  numero: '',
  tipo: '',
  estado: 'Em Análise',
  tipoEnvolvidos: 'Compra e Venda',
  vendedorNome: '',
  vendedorCpf: '',
  compradorNome: '',
  compradorCpf: '',
  imoveis: [imovelInicial()],
  observacoes: '',
  pendencias: '',
  documentosFaltantes: '',
  setorDestino: '',
  dataAnalise: new Date().toISOString().split('T')[0],
  ultimaAtualizacao: new Date().toISOString().split('T')[0],
  prioridade: 'Normal',
  historico: []
});

const anosIPTU = ['2021', '2022', '2023', '2024', '2025', '2026'];
const statusOpcoes = ['Em Análise', 'Aguardando Retorno', 'Concluído', 'Arquivado'];

const tiposEnvolvidos = {
  'Compra e Venda': { p1: 'Vendedor', p2: 'Comprador' },
  'Outorga': { p1: 'Outorgante', p2: 'Outorgado' },
  'Posse': { p1: 'Proprietário Anterior', p2: 'Posseiro Atual' },
  'Doação': { p1: 'Doador', p2: 'Donatário' },
  'Herança / Inventário': { p1: 'De Cujus (Falecido)', p2: 'Herdeiro / Inventariante' },
  'Outros': { p1: 'Parte 1 (Origem)', p2: 'Parte 2 (Destino)' }
};

// Função para calcular dias de atraso
const calcularDiasAtraso = (data) => {
  if (!data) return 0;
  const dataRef = new Date(data);
  const hoje = new Date();
  const diffTime = hoje - dataRef;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// ==========================================
// 3. COMPONENTE DE LOGIN (PRODUÇÃO)
// ==========================================

function LoginView({ darkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErro('');
    setMensagem('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setErro('E-mail ou senha incorretos. Acesso negado.');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErro('Insira o seu e-mail no campo acima para recuperar a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setErro('');
      setMensagem('E-mail de recuperação enviado! Verifique a sua caixa de entrada.');
    } catch (err) {
      setErro('Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-200 p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <FileSearch size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">SisProc Login</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            Acesso Restrito - Controle de Processos
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p>{erro}</p>
          </div>
        )}

        {mensagem && (
          <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-start gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p>{mensagem}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@prefeitura.gov.br"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Acessar Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={handleResetPassword}
            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Esqueci a minha senha
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. COMPONENTE PRINCIPAL (APP)
// ==========================================

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [processos, setProcessos] = useState([]);
  const [view, setView] = useState('dashboard');
  const [processoAtual, setProcessoAtual] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modalExclusao, setModalExclusao] = useState({ isOpen: false, id: null });
  const [darkMode, setDarkMode] = useState(false);
  const [isCarregando, setIsCarregando] = useState(true);

  // Carregar Tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('@Prefeitura:theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  // Monitorar Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sincronizar com Banco de Dados na Nuvem (Apenas se logado)
  useEffect(() => {
    if (!user) {
      setProcessos([]);
      return;
    }

    setIsCarregando(true);
    const colRef = collection(db, 'processos_gerais');
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const dadosCarregados = [];
      snapshot.forEach(doc => {
        dadosCarregados.push({ id: doc.id, ...doc.data() });
      });
      
      dadosCarregados.sort((a, b) => new Date(b.ultimaAtualizacao) - new Date(a.ultimaAtualizacao));
      setProcessos(dadosCarregados);
      setIsCarregando(false);
    }, (error) => {
      console.error("Erro ao buscar dados:", error);
      showToast("Erro de permissão ou sincronização com o banco de dados.", "error");
      setIsCarregando(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('@Prefeitura:theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('dashboard');
    } catch (error) {
      showToast("Erro ao encerrar sessão.", "error");
    }
  };

  const showToast = (message, type = 'success') => {
    const id = gerarId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const salvarProcesso = async (processo) => {
    try {
      const docRef = doc(db, 'processos_gerais', processo.id);
      await setDoc(docRef, processo);
      
      showToast('Processo salvo com sucesso!', 'success');
      setView('dashboard');
      setProcessoAtual(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast('Erro ao salvar no banco de dados. Sem permissão.', 'error');
    }
  };

  const solicitarExclusao = (id) => {
    setModalExclusao({ isOpen: true, id });
  };

  const confirmarExclusao = async () => {
    if (!modalExclusao.id) return;
    try {
      const docRef = doc(db, 'processos_gerais', modalExclusao.id);
      await deleteDoc(docRef);
      
      showToast('Processo excluído permanentemente!', 'success');
      setView('dashboard');
    } catch (error) {
      console.error("Erro ao excluir:", error);
      showToast('Erro ao apagar no banco de dados. Sem permissão.', 'error');
    }
    setModalExclusao({ isOpen: false, id: null });
  };

  const abrirFormulario = (processo = null) => {
    setProcessoAtual(processo || processoInicial());
    setView('form');
  };

  const abrirDetalhes = (processo) => {
    setProcessoAtual(processo);
    setView('detalhes');
  };

  if (isAuthLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 ${darkMode ? 'dark' : ''}`}>
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  // BARREIRA DE SEGURANÇA
  if (!user) {
    return <LoginView darkMode={darkMode} />;
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
        
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all transform pointer-events-auto ${t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
              {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              {t.message}
            </div>
          ))}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {modalExclusao.isOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 border border-transparent dark:border-slate-700">
              <div className="flex items-center gap-4 text-red-600 dark:text-red-400 mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirmar Exclusão</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Tem a certeza que deseja excluir este processo? A exclusão no banco de dados é irreversível.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalExclusao({ isOpen: false, id: null })} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmarExclusao} className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                  Excluir Definitivamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 flex flex-col shadow-xl flex-shrink-0 border-r border-transparent dark:border-slate-800 transition-colors">
          <div className="p-6 bg-slate-950 dark:bg-slate-950/50 border-b border-transparent dark:border-slate-800">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSearch className="text-blue-500" />
              SisProc
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {user.email}
            </p>
          </div>
          <nav className="flex-1 p-4 space-y-2 flex flex-col">
            <button 
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 dark:hover:bg-slate-800/50 hover:text-white'}`}
            >
              <Home size={20} />
              Dashboard
            </button>
            <button 
              onClick={() => abrirFormulario()}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'form' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 dark:hover:bg-slate-800/50 hover:text-white'}`}
            >
              <Plus size={20} />
              Novo Processo
            </button>

            <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800/50 hover:text-white transition-colors text-sm"
              >
                {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                {darkMode ? 'Modo Claro' : 'Modo Escuro'}
              </button>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors text-sm"
              >
                <LogOut size={18} />
                Encerrar Sessão
              </button>
            </div>
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {isCarregando ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
            </div>
          ) : (
            <>
              {view === 'dashboard' && (
                <Dashboard 
                  processos={processos} 
                  abrirDetalhes={abrirDetalhes} 
                  abrirFormulario={abrirFormulario} 
                />
              )}
              
              {view === 'form' && (
                <ProcessoForm 
                  processoInicial={processoAtual} 
                  onSave={salvarProcesso} 
                  onCancel={() => setView('dashboard')} 
                  showToast={showToast}
                />
              )}

              {view === 'detalhes' && (
                <ProcessoDetalhes 
                  processo={processoAtual} 
                  onEdit={() => abrirFormulario(processoAtual)} 
                  onDelete={() => solicitarExclusao(processoAtual.id)}
                  onBack={() => setView('dashboard')}
                  showToast={showToast}
                  onUpdateHistory={async (processoAtualizado) => {
                    try {
                      const docRef = doc(db, 'processos_gerais', processoAtualizado.id);
                      await setDoc(docRef, processoAtualizado);
                      setProcessoAtual(processoAtualizado);
                    } catch (error) {
                      console.error("Erro ao atualizar histórico:", error);
                      showToast('Erro ao sincronizar histórico.', 'error');
                    }
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ==========================================
// 5. DASHBOARD E MÉTRICAS
// ==========================================

function Dashboard({ processos, abrirDetalhes, abrirFormulario }) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const metrics = useMemo(() => ({
    total: processos.length,
    emAnalise: processos.filter(p => p.estado === 'Em Análise').length,
    aguardando: processos.filter(p => p.estado === 'Aguardando Retorno').length,
    concluidos: processos.filter(p => p.estado === 'Concluído').length
  }), [processos]);

  // Aplicação de todos os filtros (Pesquisa, Status, Setor e Datas)
  const processosFiltrados = useMemo(() => {
    return processos.filter(p => {
      const matchBusca = 
        (p.numero || '').toLowerCase().includes(busca.toLowerCase()) ||
        (p.compradorNome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (p.vendedorNome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (p.imoveis || []).some(i => (i.inscricao || '').includes(busca));
        
      const matchStatus = filtroStatus === 'Todos' || p.estado === filtroStatus;
      const matchSetor = !filtroSetor || (p.setorDestino || '').toLowerCase().includes(filtroSetor.toLowerCase());
      
      let matchData = true;
      if (filtroDataInicio) {
        matchData = matchData && p.dataAnalise >= filtroDataInicio;
      }
      if (filtroDataFim) {
        matchData = matchData && p.dataAnalise <= filtroDataFim;
      }

      return matchBusca && matchStatus && matchSetor && matchData;
    });
  }, [processos, busca, filtroStatus, filtroSetor, filtroDataInicio, filtroDataFim]);

  // Função para exportar os dados visíveis para Excel (CSV compatível com pt-BR)
  const exportarParaCSV = () => {
    const separador = ';';
    const cabecalho = ['Número', 'Tipo', 'Estado', 'Relação', 'Parte 1', 'Parte 2', 'Inscrições Imobiliárias', 'Setor Destino', 'Data de Análise', 'Última Atualização'];
    
    const linhas = processosFiltrados.map(p => {
      const relacao = tiposEnvolvidos[p.tipoEnvolvidos || 'Compra e Venda'];
      const p1 = `${relacao.p1}: ${p.vendedorNome} (CPF: ${p.vendedorCpf})`;
      const p2 = `${relacao.p2}: ${p.compradorNome} (CPF: ${p.compradorCpf})`;
      const imoveis = p.imoveis.map(i => i.inscricao).filter(Boolean).join(' | ');

      return [
        p.numero || 'S/N',
        p.tipo || '-',
        p.estado,
        p.tipoEnvolvidos || 'Compra e Venda',
        p1,
        p2,
        imoveis,
        p.setorDestino || '-',
        p.dataAnalise || '-',
        p.ultimaAtualizacao || '-'
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(separador);
    });

    const csvContent = [cabecalho.join(separador), ...linhas].join('\n');
    
    // Adiciona o BOM para o Excel reconhecer os acentos e UTF-8
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Processos_Exportacao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h2>
          <p className="text-slate-500 dark:text-slate-400">Acompanhamento de processos administrativos</p>
        </div>
        <button 
          onClick={exportarParaCSV}
          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Download size={18} /> Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total" value={metrics.total} icon={<FileText />} color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <MetricCard title="Em Análise" value={metrics.emAnalise} icon={<Clock />} color="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <MetricCard title="Aguardando" value={metrics.aguardando} icon={<AlertCircle />} color="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
        <MetricCard title="Concluídos" value={metrics.concluidos} icon={<CheckCircle />} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por número, nome ou inscrição..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <button 
              onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm whitespace-nowrap border border-slate-300 dark:border-slate-600 ${mostrarFiltrosAvancados ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
            >
              <Filter size={18} /> Filtros Avançados
            </button>
            <select 
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer whitespace-nowrap"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="Todos">Todos os Status</option>
              {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
              onClick={() => abrirFormulario()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus size={18} /> Novo
            </button>
          </div>
        </div>

        {/* Painel de Filtros Avançados */}
        {mostrarFiltrosAvancados && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
             <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Setor de Destino</label>
                <input 
                  type="text" 
                  placeholder="Ex: Engenharia, Tributação..."
                  value={filtroSetor}
                  onChange={(e) => setFiltroSetor(e.target.value)}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
                />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><Calendar size={12}/> Data Inicial (Análise)</label>
                <input 
                  type="date" 
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
                />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><Calendar size={12}/> Data Final (Análise)</label>
                <input 
                  type="date" 
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
                />
             </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {processosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <FileSearch size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-lg font-medium">Nenhum processo encontrado</p>
            <p className="text-sm">Cadastre um novo ou ajuste os filtros de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-4 font-semibold">Processo / Setor</th>
                  <th className="p-4 font-semibold">Envolvidos</th>
                  <th className="p-4 font-semibold">Imóveis</th>
                  <th className="p-4 font-semibold">Status / Prazos</th>
                </tr>
              </thead>
              <tbody>
                {processosFiltrados.map(proc => {
                  const diasAtraso = proc.estado === 'Em Análise' ? calcularDiasAtraso(proc.dataAnalise) : 0;
                  const isAtrasoGrave = diasAtraso >= 30;
                  const isAtrasoMedio = diasAtraso >= 15 && diasAtraso < 30;

                  return (
                    <tr 
                      key={proc.id} 
                      onClick={() => abrirDetalhes(proc)}
                      className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${isAtrasoGrave ? 'border-l-4 border-l-red-500' : isAtrasoMedio ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-transparent'}`}
                    >
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{proc.numero || 'S/N'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">{proc.setorDestino || 'Sem setor'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <span className="text-slate-500 dark:text-slate-400 text-xs block">
                            {tiposEnvolvidos[proc.tipoEnvolvidos || 'Compra e Venda'].p2.charAt(0)}: {proc.compradorNome || '-'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs block">
                            {tiposEnvolvidos[proc.tipoEnvolvidos || 'Compra e Venda'].p1.charAt(0)}: {proc.vendedorNome || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium">
                          <MapPin size={12} /> {proc.imoveis?.length || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-2">
                          <StatusBadge status={proc.estado} />
                          {proc.estado === 'Em Análise' && diasAtraso >= 15 && (
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${isAtrasoGrave ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 animate-pulse' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                              <AlertTriangle size={12} />
                              {diasAtraso} dias em análise
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
      <div className={`p-4 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'Em Análise': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Aguardando Retorno': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Concluído': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Arquivado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors['Arquivado']}`}>
      {status}
    </span>
  );
}

// ==========================================
// 6. FORMULÁRIO DE CADASTRO/EDIÇÃO
// ==========================================

function ProcessoForm({ processoInicial, onSave, onCancel, showToast }) {
  const [formData, setFormData] = useState(processoInicial);
  const [erros, setErros] = useState({});

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'vendedorCpf' || name === 'compradorCpf') value = maskCPF(value);
    
    setFormData(prev => ({ ...prev, [name]: value, ultimaAtualizacao: new Date().toISOString().split('T')[0] }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: null }));
  };

  const handleImovelChange = (imovelAtualizado) => {
    setFormData(prev => ({
      ...prev,
      imoveis: prev.imoveis.map(i => i.id === imovelAtualizado.id ? imovelAtualizado : i),
      ultimaAtualizacao: new Date().toISOString().split('T')[0]
    }));
  };

  const adicionarImovel = () => {
    setFormData(prev => ({ ...prev, imoveis: [...prev.imoveis, imovelInicial()] }));
  };

  const removerImovel = (idRemover) => {
    if (formData.imoveis.length === 1) {
      showToast("O processo precisa ter pelo menos um imóvel vinculado.", "error");
      return;
    }
    setFormData(prev => ({ ...prev, imoveis: prev.imoveis.filter(i => i.id !== idRemover) }));
  };

  const validarFormulario = () => {
    const novosErros = {};
    if (!formData.numero?.trim()) novosErros.numero = "Campo obrigatório";
    if (!formData.vendedorNome?.trim()) novosErros.vendedorNome = "Campo obrigatório";
    if (!formData.compradorNome?.trim()) novosErros.compradorNome = "Campo obrigatório";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validarFormulario()) onSave(formData);
    else showToast("Preencha os campos obrigatórios assinalados a vermelho.", "error");
  };

  const tipoEnv = tiposEnvolvidos[formData.tipoEnvolvidos || 'Compra e Venda'];

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <X size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
            {formData.numero ? 'Editar Processo' : 'Novo Processo'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Registre informações essenciais para consulta futura.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
            <FileText size={16} /> Identificação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="NÚMERO DO PROCESSO" name="numero" value={formData.numero} onChange={handleChange} placeholder="SEI-000000" error={erros.numero} />
            <Input label="TIPO DO PROCESSO" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Ex: Transferência, Retificação" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Estado</label>
              <select name="estado" value={formData.estado} onChange={handleChange} className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-md p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors">
                {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4 gap-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase">Dados principais (Envolvidos)</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Natureza da Relação:</label>
              <select 
                name="tipoEnvolvidos" 
                value={formData.tipoEnvolvidos || 'Compra e Venda'} 
                onChange={handleChange} 
                className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-md p-1.5 text-sm focus:border-blue-500 outline-none transition-colors cursor-pointer"
              >
                {Object.keys(tiposEnvolvidos).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Input label={`NOME DO(A) ${tipoEnv.p1}`} name="vendedorNome" value={formData.vendedorNome} onChange={handleChange} error={erros.vendedorNome} />
            <Input label={`CPF DO(A) ${tipoEnv.p1}`} name="vendedorCpf" value={formData.vendedorCpf} onChange={handleChange} placeholder="000.000.000-00" />
            <Input label={`NOME DO(A) ${tipoEnv.p2}`} name="compradorNome" value={formData.compradorNome} onChange={handleChange} error={erros.compradorNome} />
            <Input label={`CPF DO(A) ${tipoEnv.p2}`} name="compradorCpf" value={formData.compradorCpf} onChange={handleChange} placeholder="000.000.000-00" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 pb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase">Imóveis Vinculados</h3>
            <button 
              type="button" 
              onClick={adicionarImovel}
              className="flex items-center gap-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              <Plus size={16} /> Adicionar Imóvel
            </button>
          </div>

          {formData.imoveis.map((imovel, index) => (
            <ImovelCard 
              key={imovel.id} 
              index={index} 
              imovel={imovel} 
              onChange={handleImovelChange} 
              onRemove={() => removerImovel(imovel.id)} 
            />
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Observações operacionais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <TextArea label="OBSERVAÇÕES GERAIS" name="observacoes" value={formData.observacoes} onChange={handleChange} placeholder="Notas importantes..." />
            <TextArea label="PENDÊNCIAS" name="pendencias" value={formData.pendencias} onChange={handleChange} placeholder="Motivos de bloqueio..." />
            <TextArea label="DOCUMENTOS FALTANTES" name="documentosFaltantes" value={formData.documentosFaltantes} onChange={handleChange} />
            <Input label="SETOR DE DESTINO" name="setorDestino" value={formData.setorDestino} onChange={handleChange} placeholder="Para qual setor o processo foi enviado?" />
          </div>

          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Controle interno</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Input label="DATA DA ANÁLISE" type="date" name="dataAnalise" value={formData.dataAnalise} onChange={handleChange} />
             <Input label="ÚLTIMA ATUALIZAÇÃO" type="date" name="ultimaAtualizacao" value={formData.ultimaAtualizacao} onChange={handleChange} />
             <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Prioridade</label>
              <select name="prioridade" value={formData.prioridade} onChange={handleChange} className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-md p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors">
                <option value="Baixa">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:left-64 flex justify-end gap-4 z-10 transition-colors">
          <button type="button" onClick={onCancel} className="px-6 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors">
            <Save size={18} /> Guardar na Nuvem
          </button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// 7. COMPONENTES MENORES DO FORMULÁRIO
// ==========================================

function ImovelCard({ index, imovel, onChange, onRemove }) {
  const [expandido, setExpandido] = useState(index === 0);

  const handleFieldChange = (field, value) => {
    let finalValue = value;
    if (field === 'inscricao') finalValue = maskInscricao(value);
    onChange({ ...imovel, [field]: finalValue });
  };

  const handleAreaChange = (field, value) => {
    onChange({ ...imovel, areas: { ...imovel.areas, [field]: maskArea(value) } });
  };

  const handleIptuToggle = (tipo, ano) => {
    const list = imovel.iptu[tipo];
    const newList = list.includes(ano) ? list.filter(a => a !== ano) : [...list, ano];
    onChange({ ...imovel, iptu: { ...imovel.iptu, [tipo]: newList } });
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition-all">
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${expandido ? 'bg-blue-50/50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-slate-500 dark:text-slate-400">
            <MapPin size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base">
              Imóvel {index + 1} {imovel.inscricao ? `- Inscrição: ${imovel.inscricao}` : ''}
            </h4>
            {imovel.endereco && <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] md:max-w-md">{imovel.endereco}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Remover este imóvel"
          >
            <Trash2 size={18} />
          </button>
          <div className="text-slate-400 dark:text-slate-500 p-2">
            {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {expandido && (
        <div className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="INSCRIÇÃO IMOBILIÁRIA" value={imovel.inscricao} onChange={(e) => handleFieldChange('inscricao', e.target.value)} placeholder="123456-7" />
            <Input label="ENDEREÇO COMPLETO" value={imovel.endereco} onChange={(e) => handleFieldChange('endereco', e.target.value)} placeholder="Rua, número, bairro..." />
          </div>

          <div>
            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-100 dark:border-slate-700 pb-1">Áreas (De / Para)</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AreaInputBox label="ÁREA DO TERRENO" 
                valDe={imovel.areas.terrenoDe} onChDe={(v) => handleAreaChange('terrenoDe', v)}
                valPara={imovel.areas.terrenoPara} onChPara={(v) => handleAreaChange('terrenoPara', v)} />
              
              <AreaInputBox label="FRAÇÃO IDEAL" 
                valDe={imovel.areas.fracaoDe} onChDe={(v) => handleAreaChange('fracaoDe', v)}
                valPara={imovel.areas.fracaoPara} onChPara={(v) => handleAreaChange('fracaoPara', v)} />
                
              <AreaInputBox label="ÁREA CONSTRUÍDA TOTAL" 
                valDe={imovel.areas.construidaDe} onChDe={(v) => handleAreaChange('construidaDe', v)}
                valPara={imovel.areas.construidaPara} onChPara={(v) => handleAreaChange('construidaPara', v)} />
            </div>

            <div className="mt-6">
              <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Residencial</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <AreaInputBox label="ACP" 
                  valDe={imovel.areas.acpDe} onChDe={(v) => handleAreaChange('acpDe', v)}
                  valPara={imovel.areas.acpPara} onChPara={(v) => handleAreaChange('acpPara', v)} />
                 <AreaInputBox label="ACPD" 
                  valDe={imovel.areas.acpdDe} onChDe={(v) => handleAreaChange('acpdDe', v)}
                  valPara={imovel.areas.acpdPara} onChPara={(v) => handleAreaChange('acpdPara', v)} />
              </div>
            </div>

            <div className="mt-6">
              <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Comercial</h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AreaInputBox label="ACPT" 
                  valDe={imovel.areas.acptDe} onChDe={(v) => handleAreaChange('acptDe', v)}
                  valPara={imovel.areas.acptPara} onChPara={(v) => handleAreaChange('acptPara', v)} />
                <AreaInputBox label="ACPS" 
                  valDe={imovel.areas.acpsDe} onChDe={(v) => handleAreaChange('acpsDe', v)}
                  valPara={imovel.areas.acpsPara} onChPara={(v) => handleAreaChange('acpsPara', v)} />
                <AreaInputBox label="ACU" 
                  valDe={imovel.areas.acuDe} onChDe={(v) => handleAreaChange('acuDe', v)}
                  valPara={imovel.areas.acuPara} onChPara={(v) => handleAreaChange('acuPara', v)} />
                <AreaInputBox label="ART" 
                  valDe={imovel.areas.artDe} onChDe={(v) => handleAreaChange('artDe', v)}
                  valPara={imovel.areas.artPara} onChPara={(v) => handleAreaChange('artPara', v)} />
                <AreaInputBox label="ACE" 
                  valDe={imovel.areas.aceDe} onChDe={(v) => handleAreaChange('aceDe', v)}
                  valPara={imovel.areas.acePara} onChPara={(v) => handleAreaChange('acePara', v)} />
                <AreaInputBox label="ACUC" 
                  valDe={imovel.areas.acucDe} onChDe={(v) => handleAreaChange('acucDe', v)}
                  valPara={imovel.areas.acucPara} onChPara={(v) => handleAreaChange('acucPara', v)} />
              </div>
            </div>
          </div>

          <div>
             <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-100 dark:border-slate-700 pb-1">Quanto ao lançamento do IPTU</h5>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-48">Emitir (E) / Recálculo (R)</span>
                  <div className="flex flex-wrap gap-4">
                    {anosIPTU.map(ano => (
                      <label key={`rec-${ano}`} className="flex items-center gap-1.5 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                        <input type="checkbox" checked={imovel.iptu.recalculoAnos.includes(ano)} onChange={() => handleIptuToggle('recalculoAnos', ano)} className="rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600" />
                        {ano}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-48">Emitir complemento</span>
                  <div className="flex flex-wrap gap-4">
                    {anosIPTU.map(ano => (
                      <label key={`comp-${ano}`} className="flex items-center gap-1.5 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                        <input type="checkbox" checked={imovel.iptu.complementoAnos.includes(ano)} onChange={() => handleIptuToggle('complementoAnos', ano)} className="rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600" />
                        {ano}
                      </label>
                    ))}
                  </div>
                </div>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}

function Input({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label} {error && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      <input 
        className={`border rounded-md p-2.5 text-sm outline-none transition-shadow focus:ring-1 
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500/50' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white'}`} 
        {...props} 
      />
      {error && <span className="text-xs text-red-500 dark:text-red-400 mt-0.5">{error}</span>}
    </div>
  );
}

function TextArea({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      <textarea 
        rows={3}
        className="border border-slate-300 dark:border-slate-600 rounded-md p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 dark:text-white resize-y transition-shadow" 
        {...props} 
      />
    </div>
  );
}

function AreaInputBox({ label, valDe, onChDe, valPara, onChPara }) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium">DE</span>
          <input type="text" value={valDe} onChange={(e) => onChDe(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white transition-colors" placeholder="0,00" />
        </div>
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium">PARA</span>
          <input type="text" value={valPara} onChange={(e) => onChPara(e.target.value)} className="w-full pl-12 pr-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:border-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white transition-colors" placeholder="0,00" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. DETALHES DO PROCESSO E HISTÓRICO
// ==========================================

function ProcessoDetalhes({ processo, onEdit, onDelete, onBack, onUpdateHistory, showToast }) {
  const [novoHistorico, setNovoHistorico] = useState('');

  const adicionarHistorico = (e) => {
    e.preventDefault();
    if (!novoHistorico.trim()) return;

    const registro = {
      id: gerarId(),
      data: new Date().toISOString(),
      texto: novoHistorico
    };

    const processoAtualizado = {
      ...processo,
      historico: [registro, ...(processo.historico || [])],
      ultimaAtualizacao: new Date().toISOString().split('T')[0]
    };

    onUpdateHistory(processoAtualizado);
    setNovoHistorico('');
    showToast('Movimentação registada com sucesso!');
  };

  const copiarResumo = () => {
    const tipoEnv = tiposEnvolvidos[processo.tipoEnvolvidos || 'Compra e Venda'];
    const texto = `Processo: ${processo.numero}\n${tipoEnv.p2}: ${processo.compradorNome}\n${tipoEnv.p1}: ${processo.vendedorNome}\nStatus: ${processo.estado}\nImóveis: ${processo.imoveis.map(i => i.inscricao).join(', ')}`;
    
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Resumo copiado para a área de transferência!');
    } catch (err) {
      showToast('Erro ao copiar resumo.', 'error');
    }
    document.body.removeChild(textArea);
  };

  if (!processo) return null;

  const tipoEnv = tiposEnvolvidos[processo.tipoEnvolvidos || 'Compra e Venda'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{processo.numero || 'Processo Sem Número'}</h2>
              <StatusBadge status={processo.estado} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{processo.tipo} • Atualizado em {new Date(processo.ultimaAtualizacao).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copiarResumo} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Copiar resumo">
            <Copy size={18} /> <span className="hidden md:inline">Copiar</span>
          </button>
          <button onClick={onEdit} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Edit size={18} /> Editar
          </button>
          <button onClick={onDelete} className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Trash2 size={18} /> Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Envolvidos ({processo.tipoEnvolvidos || 'Compra e Venda'})</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{tipoEnv.p2}</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{processo.compradorNome || '-'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{processo.compradorCpf}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{tipoEnv.p1}</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{processo.vendedorNome || '-'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{processo.vendedorCpf}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
             <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Imóveis Vinculados ({processo.imoveis?.length || 0})</h3>
             <div className="space-y-4">
                {processo.imoveis.map((imovel, idx) => (
                  <div key={imovel.id} className="p-4 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-lg transition-colors">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-slate-400 dark:text-slate-500 mt-1" size={18} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">Inscrição: {imovel.inscricao || 'N/A'}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{imovel.endereco || 'Sem endereço cadastrado'}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 text-sm">
                          {imovel.areas.terrenoDe && <div><span className="text-slate-400 dark:text-slate-500">Terreno:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.terrenoDe} → {imovel.areas.terrenoPara}</span></div>}
                          {imovel.areas.fracaoDe && <div><span className="text-slate-400 dark:text-slate-500">Fração:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.fracaoDe} → {imovel.areas.fracaoPara}</span></div>}
                          {imovel.areas.construidaDe && <div><span className="text-slate-400 dark:text-slate-500">A. Const:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.construidaDe} → {imovel.areas.construidaPara}</span></div>}
                          
                          {/* Residencial */}
                          {imovel.areas.acpDe && <div><span className="text-slate-400 dark:text-slate-500">ACP:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.acpDe} → {imovel.areas.acpPara}</span></div>}
                          {imovel.areas.acpdDe && <div><span className="text-slate-400 dark:text-slate-500">ACPD:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.acpdDe} → {imovel.areas.acpdPara}</span></div>}
                          
                          {/* Comercial */}
                          {imovel.areas.acptDe && <div><span className="text-slate-400 dark:text-slate-500">ACPT:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.acptDe} → {imovel.areas.acptPara}</span></div>}
                          {imovel.areas.acpsDe && <div><span className="text-slate-400 dark:text-slate-500">ACPS:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.acpsDe} → {imovel.areas.acpsPara}</span></div>}
                          {imovel.areas.acuDe && <div><span className="text-slate-400 dark:text-slate-500">ACU:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.acuDe} → {imovel.areas.acuPara}</span></div>}
                          {imovel.areas.artDe && <div><span className="text-slate-400 dark:text-slate-500">ART:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.artDe} → {imovel.areas.artPara}</span></div>}
                          {imovel.areas.aceDe && <div><span className="text-slate-400 dark:text-slate-500">ACE:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.aceDe} → {imovel.areas.acePara}</span></div>}
                          {imovel.areas.acucDe && <div><span className="text-slate-400 dark:text-slate-500">ACUC:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.areas.acucDe} → {imovel.areas.acucPara}</span></div>}
                        </div>
                        
                        {(imovel.iptu.recalculoAnos.length > 0 || imovel.iptu.complementoAnos.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-sm flex gap-4">
                            {imovel.iptu.recalculoAnos.length > 0 && <p><span className="text-slate-500 dark:text-slate-400">Recálculo:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.iptu.recalculoAnos.join(', ')}</span></p>}
                            {imovel.iptu.complementoAnos.length > 0 && <p><span className="text-slate-500 dark:text-slate-400">Complemento:</span> <span className="text-slate-700 dark:text-slate-300">{imovel.iptu.complementoAnos.join(', ')}</span></p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 transition-colors">
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Observações Gerais</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{processo.observacoes || '-'}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Pendências</h3>
              <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{processo.pendencias || '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[600px] transition-colors">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={16} /> Histórico de Movimentações
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
            {(!processo.historico || processo.historico.length === 0) ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center mt-10">Nenhuma movimentação registada.</p>
            ) : (
              processo.historico.map(hist => (
                <div key={hist.id} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 pb-2">
                  <div className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full -left-[5px] top-1.5 ring-4 ring-white dark:ring-slate-800"></div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {new Date(hist.data).toLocaleDateString('pt-BR')} às {new Date(hist.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{hist.texto}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={adicionarHistorico} className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto transition-colors">
            <textarea 
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none mb-2 bg-white dark:bg-slate-900 dark:text-white transition-colors"
              rows={3}
              placeholder="Adicionar nova movimentação ou observação..."
              value={novoHistorico}
              onChange={(e) => setNovoHistorico(e.target.value)}
            ></textarea>
            <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Registrar Movimentação
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}