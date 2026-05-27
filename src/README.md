# API de Atividades da Mergington High School

Uma aplicação FastAPI super simples que permite aos alunos visualizar e se inscrever em atividades extracurriculares.

## Funcionalidades

- Visualizar todas as atividades extracurriculares disponíveis
- Inscrever-se em atividades
- Visualizar anúncios institucionais carregados do banco de dados
- Administrar anúncios com login de professor

## Como começar

1. Instale as dependências:

   ```
   pip install fastapi uvicorn
   ```

2. Execute a aplicação:

   ```
   python app.py
   ```

3. Abra seu navegador e acesse:
   - Documentação da API: http://localhost:8000/docs
   - Documentação alternativa: http://localhost:8000/redoc

## Endpoints da API

| Método | Endpoint                                                          | Descrição                                                            |
| ------ | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Obtém todas as atividades com detalhes e número atual de participantes |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Inscreve-se em uma atividade                                         |
| GET    | `/announcements`                                                  | Lista todos os anúncios cadastrados                                  |
| POST   | `/announcements?teacher_username=professor`                       | Cria um anúncio autenticado                                          |
| PUT    | `/announcements/{announcement_id}?teacher_username=professor`     | Atualiza um anúncio autenticado                                      |
| DELETE | `/announcements/{announcement_id}?teacher_username=professor`     | Remove um anúncio autenticado                                        |

## Modelo de Dados

A aplicação usa um modelo de dados simples com identificadores significativos:

1. **Atividades** - Usa o nome da atividade como identificador:
   - Descrição
   - Horário
   - Número máximo de participantes permitidos
   - Lista de e-mails dos alunos inscritos

3. **Alunos** - Usa o e-mail como identificador:
   - Nome
   - Série

4. **Anúncios** - Usa o identificador gerado pelo MongoDB:
   - Título
   - Mensagem
   - Data de início opcional
   - Data de expiração obrigatória

Os dados são persistidos no MongoDB e recebem um anúncio de exemplo na inicialização quando a coleção está vazia.
