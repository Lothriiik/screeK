import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Lock,
  ShieldCheck,
  Trash,
  ArrowLeft,
  FloppyDisk,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { StatusModal } from '../components/custom/status-modal';

export function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security'>('profile');

  // Form states
  const [name, setName] = useState(user?.username || 'Lothrik Junior');
  const [username, setUsername] = useState(user?.username || 'lothrik');
  const [bio, setBio] = useState('Direção arrojada, sci-fi maximalista e terror sensorial. Apaixonado pela experiência do cinema em tela gigante.');
  const [city, setSelectedCity] = useState('Arapiraca');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');

  // Notification toggles
  const [notifySessions, setNotifySessions] = useState(true);
  const [notifyReleases, setNotifyReleases] = useState(true);
  const [notifySocial, setNotifySocial] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);

  // Privacy toggles
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [showWatchedHistory, setShowWatchedHistory] = useState(true);
  const [allowComments, setAllowComments] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Modal State for Account Deactivation
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Alterações de perfil salvas com sucesso!');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Preferências de notificações atualizadas!');
  };

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Configurações de privacidade salvas!');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Informe sua senha atual para confirmar a alteração.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação de senha não confere.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Senha alterada com sucesso!');
  };

  const handleConfirmDeactivate = () => {
    setIsDeactivateModalOpen(false);
    logout();
    toast.success('Conta desativada. Seus ingressos e dados foram preservados com segurança.');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-display">
      
      {/* ─── 1. HEADER ─── */}
      <section className="bg-background border-b-2 border-foreground/20 px-4 sm:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-foreground/60 hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Voltar ao Perfil</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-black uppercase text-foreground tracking-tight">
            Configurações da Conta
          </h1>
          <p className="font-sans text-xs sm:text-sm text-foreground/70">
            Gerencie sua identidade cinéfila, preferências de notificação, privacidade e segurança.
          </p>
        </div>
      </section>

      {/* ─── 2. SETTINGS LAYOUT ─── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Tabs Nav */}
        <aside className="md:col-span-4 bg-background border-4 border-foreground/40 shadow-[4px_4px_0px_0px_var(--border)] p-2 space-y-1">
          {[
            { id: 'profile', label: 'Perfil & Dados', icon: User },
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'privacy', label: 'Privacidade', icon: ShieldCheck },
            { id: 'security', label: 'Senha & Segurança', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full p-3 text-left font-black text-xs uppercase flex items-center gap-2.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-2 border-primary shadow-[2px_2px_0px_0px_var(--border)]'
                    : 'bg-background hover:bg-muted text-foreground'
                }`}
              >
                <Icon size={18} weight={isActive ? 'bold' : 'regular'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Tab Content */}
        <div className="md:col-span-8 space-y-6">
          
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="bg-background border-4 border-foreground/40 p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_var(--border)]">
              <h2 className="text-base font-black uppercase border-b-2 border-foreground/10 pb-2">
                Informações do Perfil Cinéfilo
              </h2>

              {/* Avatar Preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-foreground overflow-hidden bg-muted relative group shrink-0">
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-black uppercase block">URL da Foto de Avatar</label>
                  <Input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">Nome de Exibição</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">Nome de Usuário (@)</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase block">Cidade Padrão</label>
                <select
                  value={city}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full h-10 px-3 bg-background border-2 border-foreground/30 font-sans text-xs focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="Arapiraca">Arapiraca - AL</option>
                  <option value="Maceió">Maceió - AL</option>
                  <option value="Recife">Recife - PE</option>
                  <option value="São Paulo">São Paulo - SP</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase block">Biografia Cinéfila</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 bg-background border-2 border-foreground/30 font-sans text-xs focus:outline-none focus:border-primary text-foreground resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-foreground/10 flex justify-end">
                <Button
                  type="submit"
                  variant="default"
                  className="flex items-center gap-1.5 uppercase font-display font-black text-xs"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>Salvar Alterações</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="bg-background border-4 border-foreground/40 p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_var(--border)]">
              <h2 className="text-base font-black uppercase border-b-2 border-foreground/10 pb-2">
                Preferências de Notificação
              </h2>

              <div className="space-y-4 font-sans text-xs">
                {[
                  {
                    title: 'Lembretes de Sessão Comprada',
                    desc: 'Aviso no app 2 horas antes da sessão começar com o QR Code pronto.',
                    state: notifySessions,
                    setState: setNotifySessions,
                  },
                  {
                    title: 'Estreias e Novos Lançamentos',
                    desc: 'Notificar quando filmes dos seus diretores e gêneros favoritos entrarem em cartaz.',
                    state: notifyReleases,
                    setState: setNotifyReleases,
                  },
                  {
                    title: 'Interações no Feed Social',
                    desc: 'Notificar quando outros cinéfilos curtirem suas reviews ou responderem seus posts.',
                    state: notifySocial,
                    setState: setNotifySocial,
                  },
                  {
                    title: 'Resumo Semanal por E-mail',
                    desc: 'Newsletter com a programação da semana e recomendações do screeK Intelligence.',
                    state: notifyEmail,
                    setState: setNotifyEmail,
                  },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 p-3 bg-muted/20 border border-foreground/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.setState(e.target.checked)}
                      className="w-4 h-4 accent-primary mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="font-display font-black uppercase text-foreground text-xs block">
                        {item.title}
                      </span>
                      <p className="text-foreground/70">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t border-foreground/10 flex justify-end">
                <Button
                  type="submit"
                  variant="default"
                  className="flex items-center gap-1.5 uppercase font-display font-black text-xs"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>Salvar Preferências</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: PRIVACY */}
          {activeTab === 'privacy' && (
            <form onSubmit={handleSavePrivacy} className="bg-background border-4 border-foreground/40 p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_var(--border)]">
              <h2 className="text-base font-black uppercase border-b-2 border-foreground/10 pb-2">
                Privacidade da Conta
              </h2>

              <div className="space-y-4 font-sans text-xs">
                <label className="flex items-start gap-3 p-3 bg-muted/20 border border-foreground/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivateAccount}
                    onChange={(e) => setIsPrivateAccount(e.target.checked)}
                    className="w-4 h-4 accent-primary mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-display font-black uppercase text-foreground text-xs block">
                      Perfil Privado
                    </span>
                    <p className="text-foreground/70">Apenas cinéfilos que você aprovar poderão ver seu diário e listas.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-muted/20 border border-foreground/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWatchedHistory}
                    onChange={(e) => setShowWatchedHistory(e.target.checked)}
                    className="w-4 h-4 accent-primary mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-display font-black uppercase text-foreground text-xs block">
                      Exibir Histórico de Sessões no Feed
                    </span>
                    <p className="text-foreground/70">Compartilhar automaticamente quando você marcar presença em uma sessão.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-muted/20 border border-foreground/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-4 h-4 accent-primary mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-display font-black uppercase text-foreground text-xs block">
                      Permitir Comentários em Minhas Reviews
                    </span>
                    <p className="text-foreground/70">Outros usuários podem comentar e debater em suas análises de filmes.</p>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-foreground/10 flex justify-end">
                <Button
                  type="submit"
                  variant="default"
                  className="flex items-center gap-1.5 uppercase font-display font-black text-xs"
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>Salvar Privacidade</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveSecurity} className="bg-background border-4 border-foreground/40 p-6 sm:p-8 space-y-6 shadow-[6px_6px_0px_0px_var(--border)]">
                <div className="flex items-center justify-between border-b-2 border-foreground/10 pb-2">
                  <h2 className="text-base font-black uppercase">
                    Alteração de Senha
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-bold text-foreground/60 hover:text-foreground flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    <span>{showPassword ? 'Ocultar' : 'Mostrar'} Senhas</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase block">Senha Atual</label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase block">Nova Senha</label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase block">Confirmar Nova Senha</label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                      />
                    </div>
                  </div>

                  {/* Requirements checklist */}
                  <div className="p-3 bg-muted/20 border border-foreground/20 text-xs font-sans space-y-1 text-foreground/70">
                    <span className="font-bold text-foreground block">Requisitos de Segurança:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={newPassword.length >= 8 ? 'text-primary font-bold' : 'text-foreground/40'}>
                        {newPassword.length >= 8 ? '✓' : '•'} Mínimo de 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={newPassword && newPassword === confirmPassword ? 'text-primary font-bold' : 'text-foreground/40'}>
                        {newPassword && newPassword === confirmPassword ? '✓' : '•'} As senhas digitadas são idênticas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-foreground/10 flex justify-end">
                  <Button
                    type="submit"
                    variant="default"
                    className="flex items-center gap-1.5 uppercase font-display font-black text-xs"
                  >
                    <Lock size={16} weight="bold" />
                    <span>Atualizar Senha</span>
                  </Button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="bg-background border-4 border-destructive/60 p-6 space-y-3 shadow-[6px_6px_0px_0px_rgba(239,68,68,0.4)]">
                <div className="flex items-center gap-2 text-destructive">
                  <Trash size={20} weight="bold" />
                  <h3 className="text-sm font-black uppercase">Zona de Risco</h3>
                </div>
                <p className="font-sans text-xs text-foreground/70 leading-relaxed">
                  Desativar sua conta ocultará seu perfil público e suspenderá a emissão de novos ingressos até você realizar um novo login.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeactivateModalOpen(true)}
                  className="uppercase font-display font-black text-xs"
                >
                  Desativar Minha Conta
                </Button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* ─── STANDARDIZED DEACTIVATE CONFIRMATION STATUS MODAL ─── */}
      <StatusModal
        isOpen={isDeactivateModalOpen}
        type="confirm"
        headerTitle="DESATIVAR CONTA"
        title="Deseja realmente desativar sua conta?"
        description="Ao desativar sua conta no screeK, seu perfil, listas e reviews ficarão temporariamente ocultos para outros cinéfilos. Seus dados e ingressos permanecerão seguros e você poderá reativar a qualquer momento fazendo login novamente."
        primaryActionLabel="CONFIRMAR DESATIVAÇÃO"
        secondaryActionLabel="CANCELAR"
        onPrimaryAction={handleConfirmDeactivate}
        onSecondaryAction={() => setIsDeactivateModalOpen(false)}
        onClose={() => setIsDeactivateModalOpen(false)}
      />

    </div>
  );
}
