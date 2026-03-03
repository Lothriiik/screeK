# CinePass UI Kit v3.0 - Referência

Este diretório contém o **CinePass UI Kit v3.0**, um design system completo e reutilizável para projetos futuros.

## 📦 Componentes Incluídos

### Design Tokens
- **Cores**: Primary, Secondary, Tertiary, Success, Warning, Danger, Info
- **Tipografia**: Inter font family com pesos 400, 500, 700, 900
- **Espaçamento**: Escala de 0px a 128px
- **Bordas**: Estilo brutalist com bordas de 2px, 4px e 8px

### Componentes UI

#### Buttons (`/components/ui/Button.tsx`)
- Variantes: Primary, Secondary, Ghost
- Tamanhos: Small, Medium, Large, Icon
- Estados: Default, Hover, Active, Disabled
- Suporte a ícones

#### Alerts (`/components/ui/Alert.tsx`) ⭐ **NOVO**
- Variantes: Success, Warning, Danger, Info
- Suporte a título opcional
- Botão de fechar (closable)
- Ícones automáticos por variante

#### Textfields (`/components/ui/Input.tsx`, `/components/ui/Select.tsx`)
- Input com label, placeholder, ícone
- Estados: Default, Success, Warning, Error
- Select e Textarea
- Helper text

#### Selectors
- **Checkbox** (`/components/ui/Checkbox.tsx`)
- **Radio** (`/components/ui/Checkbox.tsx`)
- **Breadcrumbs** (`/components/ui/Breadcrumbs.tsx`)
- **DatePicker** (`/components/ui/DatePicker.tsx`)
- **Pagination** (`/components/ui/Pagination.tsx`)

#### Small Elements
- **Badge** (`/components/ui/Badge.tsx`)
- **Progress** (`/components/ui/Progress.tsx`): Linear, Circular, Step
- **Tag** (`/components/ui/Tag.tsx`)
- **CircularProgress** (`/components/ui/CircularProgress.tsx`)

#### Big Elements
- **Card** (`/components/ui/Card.tsx`)
- **Modal** (`/components/ui/Modal.tsx`)
- **Gallery** (`/components/ui/Gallery.tsx`)

## 🚀 Como Usar

### Visualizar o UIKit Reference

1. Execute o projeto:
   ```bash
   npm run dev
   ```

2. Clique no botão **"UIKit Reference"** no canto inferior direito da tela

3. Navegue pelos componentes e copie o código que precisar

### Copiar para Outro Projeto

#### Opção 1: Copiar Componentes Individuais

1. Abra `/screens/UIKitReference.tsx`
2. Copie o componente desejado de `/components/ui/`
3. Cole no seu novo projeto
4. Ajuste os imports conforme necessário

#### Opção 2: Copiar Todo o UIKit

1. Copie a pasta `/components/ui/` completa
2. Copie o arquivo `/index.css` (contém os design tokens)
3. Instale as dependências necessárias:
   ```bash
   npm install lucide-react
   ```

### Exemplo de Uso - Alert

```tsx
import { Alert } from './components/ui/Alert'

function MyComponent() {
  return (
    <div>
      <Alert variant="success" title="Sucesso!">
        Sua operação foi concluída com sucesso.
      </Alert>

      <Alert 
        variant="warning" 
        title="Atenção"
        onClose={() => console.log('Fechado')}
      >
        Esta ação não pode ser desfeita.
      </Alert>
    </div>
  )
}
```

### Exemplo de Uso - Button

```tsx
import { Button } from './components/ui/Button'
import { Plus } from 'lucide-react'

function MyComponent() {
  const [isDark, setIsDark] = useState(true)

  return (
    <div>
      <Button 
        size="md" 
        variant="primary" 
        isDark={isDark}
        icon={<Plus size={16} />}
      >
        Adicionar Item
      </Button>
    </div>
  )
}
```

## 🎨 Design System

### Cores Principais

```css
--color-primary: #7E2553    /* Vinho */
--color-secondary: #FF5C80  /* Rosa */
--color-tertiary: #85A3B2   /* Azul acinzentado */
```

### Cores Semânticas

```css
--color-success: #22c55e    /* Verde */
--color-warning: #f59e0b    /* Amarelo */
--color-danger: #ef4444     /* Vermelho */
--color-info: #3b82f6       /* Azul */
```

### Temas Disponíveis

O projeto inclui 9 temas pré-configurados em `index.css`:
- Fence Green (padrão)
- Cool December
- Baby Blossom
- Gradient Purple
- Aquamarine Fushia
- Dr White
- Siesta Tan
- Space Opera
- Snowflake

Para aplicar um tema, adicione a classe correspondente:
```tsx
<div className="theme-cool-december">
  {/* Seu conteúdo */}
</div>
```

## 📝 Estrutura de Arquivos

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Alert.tsx          ⭐ NOVO
│   │       ├── Badge.tsx
│   │       ├── Breadcrumbs.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Checkbox.tsx
│   │       ├── CircularProgress.tsx
│   │       ├── DatePicker.tsx
│   │       ├── Gallery.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Pagination.tsx
│   │       ├── Progress.tsx
│   │       ├── Select.tsx
│   │       └── Tag.tsx
│   ├── screens/
│   │   └── UIKitReference.tsx     ⭐ Página de referência
│   ├── index.css                  (Design tokens e temas)
│   └── App.tsx
```

## 🔧 Customização

Todos os componentes aceitam a prop `isDark` para alternar entre modo claro e escuro:

```tsx
<Button isDark={true} variant="primary">
  Modo Escuro
</Button>

<Alert isDark={false} variant="success">
  Modo Claro
</Alert>
```

## 📚 Documentação Adicional

Para ver todos os componentes em ação com exemplos de código, acesse a página **UIKit Reference** através do botão no canto inferior direito da aplicação.

---

**Versão**: 3.0  
**Última Atualização**: Janeiro 2026  
**Estilo**: Brutalist Design System
