import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X as XIcon } from '@phosphor-icons/react';
import { api } from '../services/api';

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const forgotPasswordSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'screeK | Esqueci a Senha';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });


  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', data);
      toast.success('E-mail de recuperação enviado com sucesso!');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao enviar e-mail de recuperação.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-background text-foreground rounded-none border-4 border-tertiary shadow-[10px_10px_0px_0px_var(--border)]">

      <div className="flex items-center justify-between border-b-4 bg-tertiary/10 border-tertiary p-4 px-5 sm:p-5 sm:px-8">
        <h1 className="text-lg sm:text-xl text-tertiary font-display font-extrabold uppercase tracking-wide">
          ESQUECI A SENHA
        </h1>
        <button 
          onClick={() => navigate('/')}
          className="border-2 sm:border-4 hover:bg-foreground/30 border-tertiary h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center transition-all cursor-pointer"
          title="Fechar"
        >
          <XIcon size={18} className="text-tertiary" weight="bold" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-8 space-y-4">
        <p className="text-foreground/60 text-xs sm:text-sm mb-3 sm:mb-4 font-bold leading-relaxed">
          Insira seu e-mail abaixo e enviaremos uma mensagem com seu nome de usuário e um link para redefinir sua senha.
        </p>

        <div>
          <label className="block text-xs sm:text-base text-foreground/60 font-bold font-display mb-1.5">
            Endereço de e-mail
          </label>
          <Input
            type="email"
            {...register('email')}
            placeholder="Seu E-mail"
          />
          {errors.email && (
            <span className="text-xs text-destructive mt-1 block font-bold">{errors.email.message}</span>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            variant="tertiary"
            className="w-full"
          >
            {loading ? 'ENVIANDO...' : 'ENVIAR'}
          </Button>
        </div>
      </form>
    </div>
  );
};


