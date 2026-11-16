# 🏋️ GymLog — Diário de Treinos com Sensores

> Projeto da disciplina **CCP150 – Desenvolvimento de Aplicativos Móveis** (FEI) · Prof. Vinicius
> Autor: **_<SEU NOME COMPLETO>_** · RA: **_<SEU RA>_**

Aplicativo móvel feito com **React Native (Expo)** para registrar treinos de musculação, contar repetições usando o **acelerômetro** do celular, acompanhar a evolução corporal e visualizar estatísticas.

---

## 1. Visão Geral e Requisitos

**Motivação:** muita gente anota treino em papel ou planilha e perde o histórico. Quis criar um app simples que guie o treino em tempo real (séries, descanso, cronômetro) e guarde tudo localmente.

**Objetivo:** permitir montar treinos, executá-los com ajuda de sensores/vibração e acompanhar o progresso.

### Requisitos do projeto × onde foram atendidos

| Requisito | Como foi atendido |
|---|---|
| Mínimo de 6 telas distintas | **9 telas**: Início, Exercícios, Formulário de Exercício, Montar Treino, Treino Ativo, Histórico, Detalhe do Treino, Progresso, Configurações |
| Navegação com React Navigation | **Bottom Tabs** (5 abas) + **Native Stack** (telas de formulário, treino e detalhes) |
| Imagens | Banner e ilustrações locais (`assets/`), fotos dos exercícios e fotos de progresso (câmera/galeria) |
| Interface e UX | Tema escuro consistente, layout organizado, alinhamento e espaçamento padronizados (`src/theme.js`), componentes reutilizáveis (`src/components/UI.js`) |
| Feedback ao usuário | Toasts animados, alertas de confirmação, validação com mensagens de erro nos campos, vibração, estados vazios ilustrados |
| Banco de dados + CRUD completo | **SQLite** (`expo-sqlite`): salvar, recuperar, atualizar e remover em exercícios, treinos e registros corporais |
| Sensor / atuador | **Acelerômetro** (chacoalhar = +1 repetição) e **vibração/haptics** (confirmações e fim do descanso) |

> Telas de login/cadastro não foram implementadas, conforme as considerações do projeto.

---

## 2. Tecnologias Utilizadas

- **React Native** + **Expo** (JavaScript)
- **React Navigation** (`native-stack`, `bottom-tabs`)
- **expo-sqlite** — banco de dados local
- **expo-sensors** — acelerômetro
- **expo-haptics** e `Vibration` — atuador (vibração)
- **expo-image-picker** — câmera e galeria
- **expo-keep-awake** — mantém a tela ligada durante o treino
- **@expo/vector-icons** (Ionicons)
- **react-native-safe-area-context**, **react-native-screens**

### Estrutura de pastas

```
App.js
assets/               imagens locais
src/
  components/UI.js    botões, cards, campos, chips, steppers...
  context/AppContext.js  configurações globais, toast e feedback tátil
  db/database.js      criação das tabelas e todas as operações CRUD
  navigation/index.js tabs + stack
  screens/            as 9 telas
  utils/              formatação e seleção de imagens
  theme.js            cores, espaçamentos, grupos musculares
```

### Modelo do banco de dados

- `exercises` — id, nome, grupo muscular, séries, repetições, carga, observações, foto
- `workouts` — id, data/hora de início, duração, anotações
- `workout_sets` — séries realizadas (FK → `workouts`, exclusão em cascata)
- `body_logs` — peso, anotação e foto de progresso
- `settings` — chave/valor (nome, meta semanal, descanso, sensor, vibração)

---

## 3. Funcionalidades

- **Início:** saudação, meta semanal com barra de progresso, resumo geral (treinos, repetições, minutos), gráfico dos últimos 7 dias e atalho para o último treino.
- **Exercícios (CRUD):** lista com busca e filtro por grupo muscular; criar, editar e excluir exercícios, com foto (câmera ou galeria) e validação dos campos.
- **Montar treino:** escolha dos exercícios na ordem desejada, com contagem total de séries.
- **Treino ativo:**
  - cronômetro do treino e barra de progresso entre exercícios;
  - **chacoalhar o celular conta +1 repetição** (acelerômetro com tempo mínimo entre detecções para evitar contagens duplas); também há botões `−` / `+`;
  - ajuste de carga por série;
  - **timer de descanso** automático entre séries, com `+15s` e `Pular`; ao terminar, o celular **vibra**;
  - pular exercício, finalizar antes da hora e confirmação ao tentar sair;
  - tela sempre acesa.
- **Histórico:** todos os treinos com volume (kg), repetições e duração; excluir treino.
- **Detalhe do treino:** séries agrupadas por exercício, **anotações editáveis** (Update) e exclusão.
- **Progresso (CRUD):** registro de peso com foto, gráfico de evolução, variação total; editar e excluir registros.
- **Configurações:** nome, meta semanal, tempo de descanso, ligar/desligar sensor, sensibilidade, **teste ao vivo do acelerômetro**, vibração e apagar dados.

### Complexidade técnica

- Consultas SQL agregadas (`SUM`, `COUNT DISTINCT`, subconsultas) para volume e estatísticas.
- Transação (`withTransactionAsync`) ao salvar um treino com várias séries.
- Detecção de movimento pela magnitude do vetor de aceleração `√(x²+y²+z²)` com limiar configurável e debounce.
- Máquina de estados do treino (exercício → série → descanso) com cronômetro baseado em timestamps (não acumula erro).
- Interceptação do botão voltar (`beforeRemove`) para não perder um treino em andamento.
- Gráficos de barras desenhados à mão com `View` (sem biblioteca extra).
- Imagens salvas em base64 dentro do próprio SQLite (não dependem de arquivos temporários).

---

## 4. Demonstração

> 📹 **Inclua aqui um GIF ou vídeo do app funcionando** (ex.: `docs/demo.gif`).

```md
![Demonstração](docs/demo.gif)
```

### Telas

| Início | Exercícios | Treino ativo |
|---|---|---|
| ![](docs/home.png) | ![](docs/exercicios.png) | ![](docs/treino.png) |

| Histórico | Progresso | Configurações |
|---|---|---|
| ![](docs/historico.png) | ![](docs/progresso.png) | ![](docs/config.png) |

---

## 5. Instalação e Execução

**Pré-requisitos:** [Node.js LTS](https://nodejs.org), Git e o app **Expo Go** instalado no celular (Android/iOS).

```bash
# 1) clonar o repositório
git clone <URL-DO-SEU-REPOSITORIO>
cd GymLog

# 2) instalar dependências
npm install

# 3) iniciar o projeto
npx expo start
```

Escaneie o QR Code com o **Expo Go** (Android) ou com a câmera (iOS). Celular e computador devem estar na **mesma rede Wi-Fi**.

> ⚠️ O acelerômetro e a vibração **não funcionam em emulador de computador/web** — teste em um celular real.

---

## 6. Aprendizados e Próximos Passos

> ✍️ **Escreva aqui, com suas palavras,** o que você aprendeu (ex.: uso de SQLite no Expo, leitura de sensores, React Navigation, organização em componentes) e as dificuldades enfrentadas (ex.: calibrar o limiar do acelerômetro, controlar o ciclo de vida de listeners).

**Próximos passos possíveis:**
- Sincronizar os dados na nuvem (Firebase) e adicionar login.
- Gráficos por exercício (evolução de carga).
- Notificações locais para lembrar dos treinos.
- Exportar histórico em CSV.
- Treinos pré-montados (templates) e timer em segundo plano.
