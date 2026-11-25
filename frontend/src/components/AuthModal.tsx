import * as Dialog from '@radix-ui/react-dialog';
import { useAuthModalStore } from '../stores/authModalStore';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

export const AuthModal = () => {
  const { isOpen, activeTab, closeModal } = useAuthModalStore();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 animate-fade-in" />
        
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] sm:w-[450px] bg-transparent z-50 focus:outline-none p-3 sm:p-4 max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Dialog.Title className="sr-only">{activeTab === 'login' ? 'Entrar na conta screeK' : 'Criar conta screeK'}</Dialog.Title>
          {activeTab === 'login' && <Login onClose={closeModal} />}
          {activeTab === 'register' && <Register onClose={closeModal} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
