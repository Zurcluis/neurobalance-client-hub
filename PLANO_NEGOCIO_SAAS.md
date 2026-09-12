# 🚀 Plano Estratégico de Negócio: Clínica SaaS (Software as a Service)
> **Documento de Planeamento e Execução para Transformação da Plataforma num Negócio Recorrente B2B**

---

## 1. Visão Geral e Proposta de Valor Única

### 🎯 O Nicho de Ouro
Em vez de competir com softwares generalistas antigos (Doctoralia, GesClínica, etc.), este produto posiciona-se no segmento mais rentável e mal servido do mercado:
> **"O sistema operativo tudo-em-um para Clínicas de Terapias Integrativas, Neurotecnologia, Psicologia e Centros de Bem-Estar."**

### 💡 Por que é que as clínicas vão comprar?
1. **Fluxos Clínicos Adaptados:** Suporte nativo para Neurofeedback, Biorressonância, Avaliações com mapeamento, Consultas de Psicologia, Constelações e Terapias Avançadas.
2. **Planta de Salas em Tempo Real:** Visualização interativa dos gabinetes e temporizadores de sessão (raríssimo no mercado).
3. **Agendamento Inteligente por Voz:** Marcação rápida em segundos com reconhecimento de fala em português.
4. **Portal do Paciente "Passwordless":** Acesso direto e seguro via token enviado por SMS/link (zero atrito para o paciente).
5. **Painel Financeiro Estratégico:** Controlo de tesouraria, comissões de terapeutas e métricas de rentabilidade.

---

## 2. Viabilidade Financeira e Rendimento Passivo

### 💰 Economia de um SaaS (A Máquina de Margem 85%+)
O software é o modelo de negócio com maior margem do mundo:
- **Custos de infraestrutura:** ~30€ a 60€/mês (Supabase Pro + Vercel Pro) suportam dezenas de clínicas.
- **Custo marginal por novo cliente:** Praticamente 0€.

### 📈 Tabela de Projeção de Faturação (MRR & ARR)

| N.º de Clínicas | Mensalidade Média | Faturação Mensal (MRR) | Faturação Anual (ARR) | Valor de Venda da Empresa (4x a 6x ARR) |
| :---: | :---: | :---: | :---: | :---: |
| **5 clínicas** (arranque) | 129€/mês | **645€ / mês** | **7.740€ / ano** | ~35.000€ |
| **20 clínicas** | 129€/mês | **2.580€ / mês** | **30.960€ / ano** | ~150.000€ |
| **50 clínicas** | 139€/mês | **6.950€ / mês** | **83.400€ / ano** | ~400.000€ |
| **100 clínicas** | 149€/mês | **14.900€ / mês** | **178.800€ / ano** | ~900.000€ a 1.2M€ |

### 🔄 É realmente "Rendimento Passivo"?
- **Fase Inicial (Mês 1 a 2):** Ativa — Configuração do projeto clonado, ajustes de multi-empresa e onboarding das primeiras 3 a 5 clínicas.
- **Fase de Cruzeiro (Mês 3 em diante):** **Fortemente Passiva** — As mensalidades caem por débito direto ou cartão todos os meses automaticamente. As clínicas têm uma taxa de retenção altíssima (*churn rate* < 2% ao ano) porque todo o histórico dos pacientes e agendas estão lá dentro. Mudar de software é doloroso, logo os clientes permanecem durante anos.

---

## 3. Planos de Preço Sugeridos

* **Plano Starter (1 a 2 Terapeutas):** **59€ / mês**
  - Calendário avançado, Fichas de Clientes, Confirmações SMS (pacote base), Gestão de Pagamentos.
* **Plano Profissional (3 a 6 Terapeutas) — *Mais Vendido*:** **129€ / mês**
  - Todas as funções + Planta de Salas em tempo real, Agendamento por voz, Relatórios de Fluxo de Caixa e Multi-utilizador.
* **Plano Enterprise / Clínicas Grandes (7+ Terapeutas):** **229€ a 299€ / mês**
  - Tudo ilimitado, Gestão de comissões avançada, Suporte prioritário e personalização de domínio (ex: `app.clinicaexemplo.pt`).

---

## 4. Roteiro Técnico de Execução (Passo a Passo)

Quando decidires avançar, a execução é feita nesta ordem exata:

### Passo 1: Isolamento e Novo Repositório
- [ ] Criar nova pasta local: `c:\Projetos\zenith-clinic-saas` (ou outro nome comercial).
- [ ] Inicializar Git e criar repositório privado no GitHub.
- [ ] Criar um projeto independente no Supabase (ex: `zenith-saas-prod`).
- [ ] Copiar a base de código do NeuroBalance Client Hub (90% do código fica pronto imediatamente).

### Passo 2: Transformação Multi-Empresa (*Multi-Tenancy*)
- [ ] Criar tabela `tenants` / `clinics`:
  ```sql
  CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- ex: "clinica-porto"
    logo_url TEXT,
    plano TEXT DEFAULT 'starter',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] Adicionar coluna `clinic_id` em todas as tabelas operacionais (`agendamentos`, `clientes`, `salas`, `despesas`, `pagamentos`).
- [ ] Configurar Row Level Security (RLS) no Supabase para blindar o isolamento absoluto de dados entre clínicas:
  ```sql
  CREATE POLICY "Isolamento por Clínica" ON agendamentos
    FOR ALL USING (clinic_id = (SELECT clinic_id FROM user_profiles WHERE id = auth.uid()));
  ```

### Passo 3: Parametrizar Serviços e Cores
- [ ] Em vez de serviços com regras fixas no código, criar a tabela `services`:
  - `id`, `clinic_id`, `nome` (ex: "Consulta de Psicologia"), `cor` (ex: `#F4511E`), `duracao_minutos`, `preco`.
- [ ] Cada clínica personaliza os seus próprios serviços e paleta no painel de administração.

### Passo 4: Faturação e Assinaturas
- [ ] Integrar **Stripe Billing** (para cartões de crédito internacionais) ou **Ifthenpay/easypay** (para Multibanco/MB Way em Portugal).
- [ ] Bloqueio/aviso automático caso a subscrição da clínica expire.

---

## 5. Estratégia de Captação dos Primeiros Clientes (Go-To-Market)

Para arrancar sem gastar dinheiro em publicidade:

1. **Apresentação Direta (Network & Parcerias):**
   - Abordar 5 diretores de clínicas conhecidas de psicologia, neurodesenvolvimento e terapias integrativas.
   - Proposta: *"Estamos a lançar um sistema de última geração testado numa clínica de referência. Oferecemos 2 meses gratuitos em troca de feedback."*
2. **Transformar em Clientes Pagantes:**
   - Ao fim de 60 dias com todas as consultas e pacientes no sistema, nenhuma clínica quer voltar atrás — convertem-se em assinantes fiéis.
3. **Boca a Boca e Demonstração:**
   - A planta de salas em tempo real e o agendamento por voz vendem o produto sozinhos numa demonstração de 10 minutos via Zoom.

---

## 6. Checklist para Quando Quiseres Começar
Quando estiveres pronto, basta dizeres:
> *"Quero criar o projeto do SaaS na pasta nova e configurar a base de dados multi-empresa."*

Tratamos de toda a implementação técnica aqui no Antigravity! 🚀
