import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X as XIcon, Lock, MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react';
import { authService } from '../services/authService';
import { IS_MOCK_MODE } from '../services/api';
import { useAuthStore, type UserRole } from '../stores/authStore';
import { MOCK_ADMIN_USER } from '../mocks/users';

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TooltipError } from '../components/ui/tooltip-error';

const loginSchema = z.object({
  username: z.string().min(1, 'Digite seu nome de usuário'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function roleFromToken(token: string): UserRole {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const decoded = decodeURIComponent(Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
    const claims = JSON.parse(decoded);
    return ['USER', 'MANAGER', 'ADMIN'].includes(claims.role) ? claims.role : 'USER';
  } catch {
    return 'USER';
  }
}

interface LoginProps {
  onClose?: () => void;
}

export const Login = ({ onClose }: LoginProps = {}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setTokens = useAuthStore((state) => state.setTokens);
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'screeK | Login';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      const redirect = searchParams.get('redirect');
      navigate(redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/');
    }
  };

  const loginAsAdmin = (customUsername?: string) => {
    const adminToken = 'mock-admin-token-screek';
    const refreshToken = 'mock-admin-refresh-screek';
    const userToSet = {
      ...MOCK_ADMIN_USER,
      username: customUsername?.trim() || MOCK_ADMIN_USER.username,
      name: customUsername?.trim() ? customUsername.trim() : MOCK_ADMIN_USER.name,
    };
    setTokens(adminToken, refreshToken);
    setAuth(userToSet, adminToken, refreshToken);
    toast.success('Login realizado com sucesso! Bem-vindo(a).');
    handleClose();
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);

      if (IS_MOCK_MODE) {
        loginAsAdmin(data.username);
        return;
      }

      const tokens = await authService.login(data);
      setTokens(tokens.access_token, tokens.refresh_token);
      try {
        const profile = await authService.getMe(tokens.access_token);
        setAuth({ ...profile, role: roleFromToken(tokens.access_token) }, tokens.access_token, tokens.refresh_token);
      } catch (error) {
        logout();
        throw error;
      }
      toast.success('Login realizado com sucesso! Bem-vindo(a).');
      handleClose();
    } catch (err: any) {
      // Se não há conexão com o backend local (offline / Vercel sem API), faz login como Admin automaticamente
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        loginAsAdmin(data.username);
        return;
      }

      const message = err.response?.data?.error || 'Erro ao realizar login. Tente novamente.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className="w-full max-w-[450px] bg-background text-foreground rounded-none border-4 border-primary shadow-[10px_10px_0px_0px_var(--border)]">
      <div className="flex items-center border-b-4 bg-primary/10 border-primary p-3.5 sm:p-4 px-5 sm:px-6">
        <div>
          <h1 className="text-lg sm:text-xl text-primary font-display font-extrabold uppercase tracking-wide">Login</h1>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            className="border-4 hover:bg-foreground/30 border-primary h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center ml-auto cursor-pointer"
            title="Fechar"
          >
            <XIcon size={18} className="text-primary" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5 sm:p-6">
        <div className="relative">
          <label className="block text-xs sm:text-sm text-foreground/40 font-bold font-display mb-1">Nome de usuário</label>
          <Input
            type="text"
            icon={<MagnifyingGlassIcon size={20} className="text-foreground/40" />}
            autoComplete="username"
            {...register('username')}
            placeholder="Seu usuário"
          />
          <TooltipError message={errors.username?.message} />
        </div>

        <div className="relative">
          <label className="block text-xs sm:text-sm text-foreground/40 font-bold font-display mb-1">Senha</label>
          <Input
            type="password"
            icon={<Lock size={20} className="text-foreground/40" />}
            autoComplete="current-password"
            {...register('password')}
            placeholder="••••••••"
          />
          <TooltipError message={errors.password?.message} />
        </div>

        <div className="justify-between mt-3">
          <Link
            to="/forgot-password"
            onClick={onClose}
            className="transition-colors text-primary font-black text-xs sm:text-sm text-decoration-line: underline hover:text-primary-hover transition-all"
          >
            Esqueceu sua senha ?
          </Link>
          <Button
            type="submit"
            disabled={loading}
            variant="default"
            className="w-full mt-3"
          >
            {loading ? 'Entrando...' : 'FAZER LOGIN'}
          </Button>
        </div>
      </form>
    </div>
  );

  if (onClose) {
    return cardContent;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      {cardContent}
    </div>
  );
};
