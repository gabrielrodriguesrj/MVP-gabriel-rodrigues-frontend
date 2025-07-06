# Sistema de Gestão de Assinaturas e Gastos Recorrentes - Frontend

## Descrição

Este é o frontend do MVP do Sistema de Gestão de Assinaturas e Gastos Recorrentes, desenvolvido como projeto de final de período da pós-graduação. O sistema oferece uma interface web moderna e responsiva para gerenciamento de usuários, assinaturas e gastos recorrentes, com funcionalidade de persistência híbrida.

## Tecnologias Utilizadas

- **HTML5** - Estrutura semântica da aplicação
- **CSS3** - Estilização moderna com gradientes, animações e responsividade
- **JavaScript (ES6+)** - Lógica da aplicação e interação com APIs
- **Font Awesome** - Ícones vetoriais
- **Fetch API** - Comunicação com o backend
- **SessionStorage** - Armazenamento local temporário

## Características Principais

### Interface Moderna
- Design responsivo que funciona em desktop e mobile
- Gradientes e efeitos visuais modernos
- Animações suaves e micro-interações
- Cards interativos com hover effects
- Modal dialogs para formulários

### Funcionalidade Híbrida
- **Modo Online**: Quando o backend está disponível, todos os dados são persistidos no banco SQLite
- **Modo Offline**: Quando o backend não está disponível, os dados são armazenados em memória (sessionStorage)
- Detecção automática do status do backend
- Indicador visual do status de conexão

### Dashboard Interativo
- Estatísticas em tempo real
- Contadores de usuários, assinaturas e gastos
- Cálculo automático do total mensal
- Indicadores visuais de status

## Estrutura do Projeto

```
frontend/
├── index.html          # Página principal da aplicação
├── styles.css          # Estilos CSS da aplicação
├── script.js           # Lógica JavaScript da aplicação
└── README.md          # Este arquivo
```

## Funcionalidades

### Gestão de Usuários
- Cadastro de novos usuários
- Listagem de usuários em cards
- Exclusão de usuários
- Validação de email

### Gestão de Assinaturas
- Cadastro de assinaturas com informações completas
- Diferentes ciclos de cobrança (mensal, anual, semanal)
- Categorização de assinaturas
- Cálculo automático de valores mensais
- Associação com usuários

### Gestão de Gastos Recorrentes
- Cadastro de gastos com diferentes frequências
- Frequências suportadas: diário, semanal, mensal, anual
- Categorização de gastos
- Controle de vencimentos
- Associação com usuários

### Dashboard
- Visão geral dos dados
- Estatísticas consolidadas
- Status de conexão com backend
- Cálculo de totais mensais

## Instalação e Uso

### Opção 1: Uso Standalone (Modo Offline)

1. **Abra o arquivo index.html diretamente no navegador:**
   ```bash
   # No diretório frontend
   open index.html
   # ou
   firefox index.html
   # ou
   chrome index.html
   ```

2. **A aplicação funcionará em modo offline**, salvando dados na memória do navegador.

### Opção 2: Uso com Backend (Modo Online)

1. **Certifique-se de que o backend está rodando:**
   ```bash
   # No diretório backend/subscription-manager
   source venv/bin/activate
   python src/main.py
   ```

2. **Sirva o frontend via servidor web local:**
   ```bash
   # No diretório frontend
   python -m http.server 8000
   # ou
   npx serve .
   ```

3. **Acesse a aplicação:**
   - Frontend: `http://localhost:8000`
   - Backend API: `http://localhost:5000`

### Opção 3: Uso Integrado

O frontend também está disponível através do backend Flask em `http://localhost:5000` quando o backend estiver rodando.

## Comandos Úteis

### Desenvolvimento
```bash
# Servir arquivos estáticos com Python
python -m http.server 8000

# Servir arquivos estáticos com Node.js
npx serve .

# Abrir diretamente no navegador
open index.html
```

### Debugging
```bash
# Verificar console do navegador para logs
# Pressione F12 e vá para a aba Console

# Verificar Network tab para requisições HTTP
# Pressione F12 e vá para a aba Network
```

## Arquitetura da Aplicação

### Gerenciamento de Estado
A aplicação utiliza um objeto global `AppState` para gerenciar o estado:

```javascript
const AppState = {
    users: [],
    subscriptions: [],
    expenses: [],
    isBackendOnline: false,
    currentUser: null
};
```

### Persistência Híbrida
O sistema implementa uma estratégia de persistência híbrida:

1. **Verificação de Conectividade**: A aplicação verifica se o backend está disponível
2. **Modo Online**: Se o backend estiver disponível, todas as operações são feitas via API
3. **Modo Offline**: Se o backend não estiver disponível, os dados são salvos no sessionStorage
4. **Sincronização**: Quando o backend volta a ficar disponível, é possível implementar sincronização

### Estrutura de Dados

**Usuário:**
```javascript
{
    id: number,
    username: string,
    email: string,
    created_at: string
}
```

**Assinatura:**
```javascript
{
    id: number,
    name: string,
    description: string,
    price: number,
    billing_cycle: "monthly" | "yearly" | "weekly",
    next_billing_date: string,
    category: string,
    is_active: boolean,
    user_id: number,
    created_at: string,
    updated_at: string
}
```

**Gasto Recorrente:**
```javascript
{
    id: number,
    name: string,
    description: string,
    amount: number,
    frequency: "daily" | "weekly" | "monthly" | "yearly",
    next_due_date: string,
    category: string,
    is_active: boolean,
    user_id: number,
    created_at: string,
    updated_at: string
}
```

## Interface do Usuário

### Navegação
- **Dashboard**: Visão geral e estatísticas
- **Assinaturas**: Gestão de assinaturas
- **Gastos Recorrentes**: Gestão de gastos recorrentes
- **Usuários**: Gestão de usuários

### Componentes Principais

#### Header
- Logo da aplicação
- Navegação por abas
- Indicador de status do backend

#### Cards
- Exibição de dados em formato de cards
- Hover effects e animações
- Ações de edição e exclusão

#### Modais
- Formulários para criação/edição
- Validação de dados
- Feedback visual

#### Dashboard
- Estatísticas em tempo real
- Cards com métricas importantes
- Cálculos automáticos

## Responsividade

A aplicação é totalmente responsiva e funciona em:

- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (até 767px)

### Breakpoints CSS:
```css
/* Mobile */
@media (max-width: 768px) {
    /* Estilos para mobile */
}
```

## Validação de Dados

### Validação no Frontend:
- Campos obrigatórios
- Formato de email
- Tipos de dados (números, datas)
- Valores mínimos e máximos

### Validação no Backend:
- Schemas Pydantic para validação rigorosa
- Sanitização de dados
- Verificação de integridade referencial

## Tratamento de Erros

### Estratégias Implementadas:
- Try-catch para requisições HTTP
- Fallback para modo offline
- Notificações visuais de erro
- Logs detalhados no console

### Tipos de Erro:
- **Erro de Conectividade**: Fallback para modo offline
- **Erro de Validação**: Exibição de mensagem específica
- **Erro de Servidor**: Notificação genérica com log detalhado

## Notificações

Sistema de notificações toast implementado:
- **Sucesso**: Verde com ícone de check
- **Erro**: Vermelho com ícone de exclamação
- **Info**: Azul com ícone de informação
- Animações de entrada e saída
- Auto-dismiss após 3 segundos

## Performance

### Otimizações Implementadas:
- Carregamento assíncrono de dados
- Debounce em formulários
- Lazy loading de componentes
- Minimização de reflows/repaints

### Métricas de Performance:
- Tempo de carregamento inicial < 2s
- Transições suaves (60fps)
- Responsividade em dispositivos móveis

## Acessibilidade

### Recursos de Acessibilidade:
- Estrutura semântica HTML5
- Labels apropriados em formulários
- Contraste adequado de cores
- Navegação por teclado
- ARIA labels onde necessário