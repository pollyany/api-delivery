# API Delivery

API REST para gerenciamento de entregas de encomendas, usuários, autenticação e histórico de status.

## Funcionalidades

- Cadastro de usuários com validação de dados.
- Criação de sessão e emissão de token JWT.
- Criptografia de senhas com `bcrypt`.
- Cadastro e listagem de entregas.
- Atualização do status de uma entrega.
- Registro de eventos e alterações no histórico da entrega.
- Controle de acesso por função (`customer` e `sale`).
- Validação de payloads e parâmetros com `Zod`.
- Tratamento centralizado de erros da API.

## Stack

- **Node.js**: runtime da aplicação.
- **TypeScript**: tipagem estática e compilação do código.
- **Express 4**: servidor HTTP e roteamento.
- **Prisma 5**: ORM, schema e migrations.
- **PostgreSQL**: banco de dados relacional.
- **JWT (`jsonwebtoken`)**: autenticação baseada em token, com validade de 1 dia.
- **Bcrypt**: hash e comparação de senhas.
- **Zod**: validação de entradas.
- **Jest + Supertest**: testes automatizados da API.
- **Docker Compose**: execução local do PostgreSQL.
- **tsx**: execução do servidor TypeScript em desenvolvimento com watch mode.

## Pré-requisitos

- Node.js 20 ou superior recomendado.
- npm.
- Docker e Docker Compose, caso o PostgreSQL seja executado localmente pelo compose.

## Instalação

```bash
npm install
```

Suba o banco de dados:

```bash
docker compose up -d postgres
```

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/api-delivery?schema=public"
JWT_SECRET="uma-chave-secreta-de-desenvolvimento"
```

Aplique as migrations do Prisma:

```bash
npx prisma migrate dev
```

Gere o cliente Prisma, se necessário:

```bash
npx prisma generate
```

## Execução

Servidor de desenvolvimento:

```bash
npm run dev
```

A API estará disponível em `http://localhost:3333`.

## Testes

Execute a suíte em modo watch:

```bash
npm run test:dev
```

Os testes usam Jest, Supertest e o banco configurado em `DATABASE_URL`. Portanto, o banco precisa estar disponível e as migrations devem ter sido aplicadas antes da execução.

## Autenticação e autorização

O cadastro não exige autenticação. Para os demais recursos protegidos, envie o token no header:

```http
Authorization: Bearer <token>
```

Novos usuários recebem a função `customer` por padrão. A função `sale` deve ser atribuída no banco quando for necessário testar ou operar os endpoints exclusivos de vendas.

| Função     | Permissões                                                       |
| ---------- | ---------------------------------------------------------------- |
| `customer` | Consultar o histórico de uma entrega própria                     |
| `sale`     | Criar, listar e atualizar entregas; criar e consultar históricos |

## Endpoints

### Usuários

#### `POST /users`

Cria um usuário. O campo `name` precisa ter pelo menos 3 caracteres e `password` pelo menos 6.

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "password123"
}
```

Retorna `201` com os dados do usuário, sem a senha. E-mail duplicado retorna `400`.

### Sessões

#### `POST /sessions`

Autentica um usuário e retorna um JWT válido por 1 dia.

```json
{
  "email": "maria@example.com",
  "password": "password123"
}
```

Resposta `200`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "email": "maria@example.com",
    "role": "customer",
    "createdAt": "2026-08-28T12:00:00.000Z",
    "updatedAt": null
  }
}
```

Credenciais inválidas retornam `401`.

### Entregas

Todos os endpoints desta seção exigem autenticação e a função `sale`.

#### `POST /deliveries`

Cria uma entrega para um usuário existente.

```json
{
  "user_id": "uuid-do-usuario",
  "description": "Caixa com documentos"
}
```

Retorna `201`:

```json
{
  "message": "Delivery created successfully"
}
```

#### `GET /deliveries`

Lista as entregas, incluindo `name` e `email` do usuário associado.

#### `PATCH /deliveries/:id/status`

Atualiza o status da entrega e cria automaticamente um registro no histórico.

```json
{
  "status": "shipped"
}
```

Status aceitos: `processing`, `shipped` e `delivered`.

### Histórico de entregas

#### `POST /delivery-logs`

Cria um evento manual no histórico. Exige a função `sale`.

```json
{
  "delivery_id": "uuid-da-entrega",
  "description": "Encomenda encaminhada para a unidade local"
}
```

Não é permitido criar evento para entrega inexistente. Também não é permitido adicionar eventos quando a entrega está `processing` ou já está `delivered`.

#### `GET /delivery-logs/:delivery_id/show`

Exige autenticação. Usuários `customer` só podem consultar entregas vinculadas ao próprio usuário; usuários `sale` podem consultar qualquer entrega.

> Observação: atualmente o controlador valida a entrega e a autorização, mas não envia o objeto consultado na resposta. Caso seja necessário retornar os logs, esse endpoint ainda precisa ser concluído.

## Modelo de dados

O banco possui três entidades principais:

- **User**: `id`, `name`, `email`, `password` com hash e `role`.
- **Delivery**: usuário responsável, descrição, status e timestamps.
- **DeliveryLog**: descrição do evento, entrega relacionada e timestamps.

Relacionamentos:

- Um usuário possui várias entregas.
- Uma entrega pertence a um usuário.
- Uma entrega possui vários registros de histórico.

## Estrutura do projeto

```text
src/
├── app.ts                         # Configuração do Express
├── server.ts                      # Inicialização na porta 3333
├── env.ts                         # Validação das variáveis de ambiente
├── configs/                       # Configurações de autenticação
├── controllers/                   # Regras dos endpoints
├── database/                      # Cliente Prisma
├── middleware/                    # Autenticação, autorização e erros
├── routes/                        # Rotas da API
├── tests/                         # Testes de integração
├── types/                         # Extensões de tipos do Express
└── utils/                         # Utilitários e erros da aplicação

prisma/
├── schema.prisma                  # Modelo do banco
└── migrations/                    # Histórico de alterações do schema
```

## Tratamento de erros

Erros de validação retornam `400`. Falhas de autenticação retornam `401` e falhas de autorização retornam `403`. Recursos não encontrados retornam `404`. A resposta de erro contém uma mensagem, por exemplo:

```json
{
  "message": "Invalid JWT token"
}
```

## Comandos úteis

```bash
# Iniciar o servidor
npm run dev

# Abrir o Prisma Studio
npx prisma studio

# Verificar o estado das migrations
npx prisma migrate status
```
