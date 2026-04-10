<div align="center">
<img width="200" height="200" alt="Logo Defesa Civil Corupá" src="./public/logo-defesa-civil.svg" />

# Defesa Civil Corupá - Sistema de Gestão de Incidentes

**Aplicação web e mobile para gerenciamento e registro de incidentes da Defesa Civil**
</div>

---

## 📋 Sobre o Projeto

Sistema completo para a **Defesa Civil do município de Corupá** que permite o registro, monitoramento e gerenciamento de incidentes em tempo real. A aplicação oferece um painel de controle centralizado com mapa interativo, gerenciamento de usuários e autenticação segura.

### ✨ Recursos Principais

- 📍 **Mapa Interativo** - Visualize incidentes em tempo real no mapa com filtros por status
- 🚨 **Registro de Incidentes** - Registre novos incidentes com fotos, descrição e localização
- 👥 **Gerenciamento de Usuários** - Controle de acesso e permissões de usuários
- 🔐 **Autenticação Firebase** - Login seguro com integração Firebase
- 📊 **Dashboard** - Painel com estatísticas e resumo de incidentes
- 🔔 **Notificações** - Sistema de notificações em tempo real
- 📱 **Modo Offline** - Funcionalidade offline para registros sem conexão
- 🤖 **IA Integrada** - Análise assistida por IA (Gemini API)

---

## 🛠 Tecnologias Utilizadas

- **Frontend:** React 19 + TypeScript
- **Build:** Vite 6
- **Estilos:** Tailwind CSS 4
- **Autenticação:** Firebase
- **Banco de Dados:** Firestore
- **Mapa:** Leaflet + React Leaflet
- **UI Components:** Lucide React
- **Mobile:** Capacitor (Android)
- **IA:** Google Gemini API

---

## 📦 Pré-requisitos

- **Node.js** 16+ instalado
- **npm** ou **yarn**
- **Chave API do Gemini** (opcional, para recursos de IA)
- **Configuração Firebase** (para autenticação e banco de dados)

---

## 🚀 Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone <seu-repositorio>
cd DefesaCivilCorupa
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_FIREBASE_API_KEY=sua_chave_firebase
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_GEMINI_API_KEY=sua_chave_gemini
```

### 4. Rodar em desenvolvimento
```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`

---

## 📱 Build para Android

### 1. Sincronizar com Capacitor
```bash
npm run cap:sync
```

### 2. Fazer build
```bash
npm run cap:build
```

Ou abrir direto no Android Studio:
```bash
npx cap open android
```

---

## 📂 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── Dashboard.tsx
│   ├── IncidentForm.tsx
│   ├── IncidentList.tsx
│   ├── Login.tsx
│   ├── MapView.tsx
│   ├── NotificationManager.tsx
│   └── ...
├── lib/                  # Utilitários
│   ├── utils.ts
│   └── incidentIcons.ts
├── services/             # Serviços
│   ├── notificationService.ts
│   └── offlineService.ts
├── App.tsx              # Componente principal
├── firebase.ts          # Configuração Firebase
└── types.ts             # Tipos TypeScript
```

---

## 🔧 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run preview` | Visualiza build de produção |
| `npm run lint` | Verifica tipos TypeScript |
| `npm run cap:sync` | Sincroniza com Capacitor |
| `npm run cap:build` | Build para Android |

---

## 📝 Variáveis de Ambiente

As seguintes variáveis são necessárias no arquivo `.env.local`:

| Variável | Descrição |
|----------|-----------|
| `VITE_FIREBASE_*` | Credenciais do Firebase |
| `VITE_GEMINI_API_KEY` | Chave da API Gemini (opcional) |

---

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Faça um fork
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

## 📧 Contato

**Defesa Civil Corupá**

Para dúvidas ou sugestões sobre o projeto, entre em contato através do repositório.

---

**Desenvolvido com ❤️ para a Defesa Civil de Corupá**
