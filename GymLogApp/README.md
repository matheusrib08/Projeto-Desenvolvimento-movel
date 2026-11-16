#  GymLog – Aplicativo de Registro de Treinos com Sensores

Aplicativo móvel desenvolvido com **React Native e Expo**, com o objetivo de auxiliar praticantes de musculação no planejamento, execução e acompanhamento de seus treinos.

O GymLog permite cadastrar exercícios, registrar séries, acompanhar o histórico de atividades e monitorar a evolução corporal. Além disso, utiliza o acelerômetro do próprio celular para realizar a contagem automática de repetições.

---

##  Funcionalidades

- **Início:** painel com resumo dos treinos, meta semanal e gráfico dos últimos sete dias.
- **Cadastro de exercícios:** criação, edição e exclusão de exercícios, com grupos musculares, séries, repetições, carga e fotos.
- **Montagem de treinos:** seleção e organização dos exercícios para cada sessão.
- **Treino ativo:** cronômetro, controle de séries, ajuste de carga e temporizador de descanso.
- **Contagem automática:** utilização do acelerômetro para detectar movimentos e contabilizar repetições.
- **Contagem manual:** possibilidade de registrar repetições por meio de botões.
- **Histórico:** consulta dos treinos realizados, duração, séries e volume total.
- **Progresso corporal:** registro do peso, fotos e acompanhamento da evolução.
- **Configurações:** personalização de metas, tempo de descanso e sensibilidade do acelerômetro.

---

##  Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| React Native | Desenvolvimento mobile |
| Expo | Ambiente de desenvolvimento |
| JavaScript | Linguagem de programação |
| React Navigation | Navegação entre telas |
| Expo SQLite | Banco de dados local |
| Expo Sensors | Leitura do acelerômetro |
| Expo Haptics | Feedback tátil |
| Expo Image Picker | Captura e seleção de imagens |
| Expo Keep Awake | Manter a tela ligada |
| React Native Safe Area Context | Gerenciamento de áreas seguras |
| Git e GitHub | Controle de versão |

---

##  Arquitetura do projeto

O projeto foi organizado em camadas, facilitando a manutenção e a organização do código.

```text
GymLogApp/
│
├── src/
│   ├── screens/       # Telas do aplicativo
│   ├── components/    # Componentes reutilizáveis
│   ├── context/       # Gerenciamento de estado global
│   ├── db/            # Banco de dados SQLite
│   ├── navigation/    # Configuração de navegação
│   ├── utils/         # Funções utilitárias
│   └── theme.js       # Tema visual
│
├── App.js
├── package.json
└── README.md
```

---

##  Banco de dados

O aplicativo utiliza **SQLite** para armazenar os dados localmente, permitindo seu funcionamento sem conexão com a internet.

O banco possui cinco tabelas principais:

- `exercises`: cadastro dos exercícios.
- `workouts`: registro dos treinos realizados.
- `workout_sets`: armazenamento das séries e repetições.
- `body_logs`: histórico de peso e fotos corporais.
- `settings`: configurações personalizadas do aplicativo.

São implementadas operações CRUD (Create, Read, Update e Delete) para gerenciamento dos dados.

---

##  Utilização do acelerômetro

Um dos principais diferenciais do GymLog é a utilização do acelerômetro do smartphone para contar repetições.

O aplicativo realiza a leitura dos eixos X, Y e Z e calcula a magnitude do vetor de aceleração:

```javascript
magnitude = Math.sqrt(x * x + y * y + z * z);
```

Quando a magnitude ultrapassa o limite de sensibilidade configurado, uma repetição é contabilizada.

O sistema também utiliza um intervalo mínimo de 700 ms entre detecções para evitar contagens duplicadas.

---

##  Instalação e execução

### Pré-requisitos

- Node.js (versão LTS)
- Git
- Expo Go instalado no smartphone
- Computador e celular conectados à mesma rede Wi-Fi

### 1. Clone o repositório

```bash
git clone URL_DO_SEU_REPOSITORIO
```

### 2. Acesse a pasta do projeto

```bash
cd GymLogApp
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o Expo

```bash
npx expo start
```

### 5. Execute no smartphone

Escaneie o QR Code exibido no terminal utilizando o aplicativo Expo Go (Android) ou a câmera do iPhone (iOS).

Caso existam problemas de conexão na rede local, utilize:

```bash
npx expo start --tunnel
```

**Observação:** para utilizar o acelerômetro, a vibração e a câmera, é necessário executar o aplicativo em um dispositivo físico.

---

##  Objetivo do projeto

O GymLog foi desenvolvido como projeto acadêmico da disciplina **CCP150 – Desenvolvimento de Aplicativos Móveis**, do Centro Universitário FEI.

O projeto teve como objetivo aplicar conceitos de desenvolvimento mobile, navegação entre telas, componentização, gerenciamento de estado, banco de dados relacional e integração com sensores e recursos nativos do smartphone.

---

##  Desenvolvedores

**Matheus Ribeiro Tintino**

**Eduardo Ruiz**

Centro Universitário FEI – 2026

---

 Se gostou do projeto, deixe uma estrela no repositório!
