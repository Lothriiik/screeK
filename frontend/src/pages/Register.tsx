import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X as XIcon, Lock, MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react';
import { authService } from '../services/authService';

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TooltipError } from '../components/ui/tooltip-error';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Digite seu nome'),
    username: z.string().min(4, 'O nome de usuário deve ter no mínimo 4 caracteres'),
    email: z.string().email('Digite um e-mail válido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterProps {
  onClose?: () => void;
}

export const Register = ({ onClose }: RegisterProps = {}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'screeK | Cadastrar';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      await authService.register({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
        password_confirmation: data.confirmPassword,
      });
      toast.success('Conta criada com sucesso! Faça login para entrar.');
      if (onClose) onClose();
      else navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao criar conta. Tente novamente.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <div className="w-full max-w-[450px] bg-background text-foreground rounded-none border-4 border-secondary shadow-[10px_10px_0px_0px_var(--border)]">
      <div className="flex items-center border-b-4 bg-secondary/10 border-secondary p-3.5 sm:p-4 px-5 sm:px-6">
        <div>
          <h1 className="text-lg sm:text-xl text-secondary font-display font-extrabold uppercase tracking-wide">CADASTRAR</h1>
        </div>
        <button onClick={handleClose} className="border-4 hover:bg-foreground/30 border-secondary h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center ml-auto cursor-pointer" title="Fechar">
          <XIcon size={18} className="text-secondary" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5 sm:p-6">
        <div className="relative">
          <label className="block text-xs sm:text-sm text-foreground/40 font-bold font-display mb-1">Nome</label>
          <Input
            type="text"
            autoComplete="name"
            {...register('name')}
            placeholder="Seu nome"
          />
          <TooltipError message={errors.name?.message} />
        </div>
        <div className="relative">
          <label className="block text-xs sm:text-sm text-foreground/40 font-bold font-display mb-1">Nome de Usuario</label>
          <Input
            type="text"
            autoComplete="username"
            icon={<MagnifyingGlassIcon size={20} className="text-foreground/40" />}
            {...register('username')}
            placeholder="Seu Usuario"
          />
          <TooltipError message={errors.username?.message} />
        </div>

        <div className="relative">
          <label className="block text-xs sm:text-sm text-foreground/40 font-bold font-display mb-1">Endereço de e-mail</label>
          <Input
            type="text"
            autoComplete="email"
            icon={<MagnifyingGlassIcon size={20} className="text-foreground/40" />}
            {...register('email')}
            placeholder="Seu E-mail"
          />
          <TooltipError message={errors.email?.message} />
        </div>

        <div className="relative">
          <label className="block text-xs sm:text-sm text-foreground/40 font-bold font-display mb-1">Senha</label>
          <Input
            type="password"
            autoComplete="new-password"
            icon={<Lock size={20} className="text-foreground/40" />}
            {...register('password')}
            placeholder="••••••••"
          />
          <TooltipError message={errors.password?.message} />
        </div>

        <div className="relative">
          <label className="block text-xs sm:text-sm text-foreground/40 font-bold font-display mb-1">Confirmação de Senha</label>
          <Input
            type="password"
            autoComplete="new-password"
            icon={<Lock size={20} className="text-foreground/40" />}
            {...register('confirmPassword')}
            placeholder="••••••••"
          />
          <TooltipError message={errors.confirmPassword?.message} />
        </div>

        <div className="justify-between mt-3">
          <p className="font-black text-xs text-foreground/40 mb-3 leading-tight">
            Ao continuar, você concorda com os <Link to="/terms" onClick={onClose} className="hover:text-secondary-hover text-secondary font-black text-xs text-decoration-line: underline">Termos de Uso</Link> e a <Link to="/privacy" onClick={onClose} className="hover:text-secondary-hover text-secondary font-black text-xs text-decoration-line: underline">Política de Privacidade</Link>.
          </p>
          <Button
            type="submit"
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {loading ? 'Cadastrando...' : 'CADASTRE-SE'}
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
