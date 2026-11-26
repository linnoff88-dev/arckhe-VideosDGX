# Changelog

Todas as mudanças notáveis neste projeto serêo documentadas neste arquivo.

## [4.2] - 2026-02-18 — Interface Web: Fila de Jobs + Cancelamento

### ✨ Novidades

- **Fila de jobs ilimitada**: Múltiplos jobs podem ser submetidos sem bloqueio. O botêo "Gerar Vídeo" fica sempre habilitado.
- **Novo status `queued`**: Ciclo de vida completo: `queued → processing → completed/error`.
- **Thread worker sequencial**: Thread daemon única (`queue_worker`) processa jobs um a um via `queue.Queue`.
- **Cancelamento de jobs**: Endpoint `POST /api/cancel/{job_id}` cancela jobs na fila (imediato) ou em processamento (no próximo ciclo de polling, ≤5s).
- **Posiçêo na fila**: `/api/jobs` retorna `queue_position` para jobs em estado `queued`.
- **Botêo ✕ Cancelar**: Aparece nos cards de jobs com status `queued` ou `processing`.
- **Indicador visual**: Status `queued` exibido em roxo/índigo com posiçêo na fila.
- **Contador na sidebar**: Mostra quantos jobs estêo na fila e quantos estêo processando.

### 📁 Arquivos

| Arquivo | Descriçêo |
|---------|-----------|
| `web_interface_v4_2.py` | Interface principal v4.2 |
| `iniciar_interface_web_v4_2.sh` | Script de inicializaçêo |

### 🔧 Detalhes Técnicos

- **Porta**: 7862 (v4=7860, v4.1=7861, v4.2=7862)
- **Jobs file**: `/tmp/dgx_jobs_v4_2.json`
- **Logo**: `DGX ▶ v4.2`
- **Cancelamento em processamento**: via `cancelled_jobs: set()` — `run_job()` verifica a cada 5s no loop de polling
- **Thread**: `threading.Thread(target=queue_worker, daemon=True)` iniciada no `__main__`

### ⚠️ Mudança de Comportamento vs v4.1

- v4.1 retornava HTTP 429 se havia um job em processamento — **removido**
- Botêo "Gerar Vídeo" nêo é mais desabilitado automaticamente
- Jobs novos entram como `"queued"` em vez de `"processing"` diretamente

---

## [1.0.0] - 2026-02-15

### ✨ Implementaçêo Inicial Completa

#### 📦 Infraestrutura Docker
- **Adicionado** `common/base.Dockerfile` - Imagem base com CUDA 12.3 + PyTorch 2.2.0
- **Adicionado** `docker-compose.yml` - Orquestraçêo de 4 containers (LTX-2, Wan 2.1, MAGI-1, Waver)
- **Adicionado** `.dockerignore` - Otimizaçêo de build context
- **Adicionado** `docker-compose.override.yml.example` - Template para desenvolvimento

#### 🧩 Common Layer (Código Compartilhado)
- **Adicionado** `common/utils.py` - Utilidades para logging, métricas e monitoramento de sistema
- **Adicionado** `common/model_loader.py` - Gerenciador de carregamento sob demanda com:
  - Lazy loading (carrega apenas quando necessário)
  - Auto-unload configurável (libera memória após inatividade)
  - Thread-safe operations
  - Monitoramento de memória GPU/CPU
- **Adicionado** `common/api_base.py` - Framework FastAPI base com:
  - Sistema de fila de jobs assíncrona
  - Background worker para processamento
  - Endpoints REST padronizados
  - Health checks e métricas
  - File serving (download de vídeos)

#### 🎬 Modelos de Vídeo

##### LTX-2 (Full video + audio generation)
- **Adicionado** `ltx2/Dockerfile` - Container com quantizaçêo FP4
- **Adicionado** `ltx2/app.py` - Entry point da API
- **Adicionado** `ltx2/model_config.py` - Configuraçêo e geraçêo (FP4/NVFP4)
- **Adicionado** `ltx2/requirements.txt` - Dependências específicas (librosa, soundfile, etc.)

##### Wan 2.1 (Versatile 14B model)
- **Adicionado** `wan21/Dockerfile` - Container com quantizaçêo FP8
- **Adicionado** `wan21/app.py` - Entry point da API
- **Adicionado** `wan21/model_config.py` - Configuraçêo e geraçêo (FP8)
- **Adicionado** `wan21/requirements.txt` - Dependências específicas

##### MAGI-1 (Autoregressive long-form video)
- **Adicionado** `magi1/Dockerfile` - Container com quantizaçêo FP4
- **Adicionado** `magi1/app.py` - Entry point da API
- **Adicionado** `magi1/model_config.py` - Configuraçêo e geraçêo (FP4)
- **Adicionado** `magi1/requirements.txt` - Dependências específicas (flash-attn, etc.)

##### Waver 1.0 (Lightweight batch generation)
- **Adicionado** `waver/Dockerfile` - Container com quantizaçêo FP8
- **Adicionado** `waver/app.py` - Entry point da API
- **Adicionado** `waver/model_config.py` - Configuraçêo e geraçêo (FP8)
- **Adicionado** `waver/requirements.txt` - Dependências específicas

#### 🛠️ Scripts de Utilidade
- **Adicionado** `scripts/download_models.sh` - Script interativo para download de modelos
  - Menu de seleçêo de modelos
  - Download via HuggingFace Hub
  - Gerenciamento de volumes Docker
- **Adicionado** `scripts/health_check.py` - Verificaçêo de saúde dos containers
  - Status de cada modelo
  - Uso de memória GPU/CPU
  - Tamanho da fila de jobs
  - Output colorido e formatado
- **Adicionado** `scripts/benchmark.py` - Testes de performance
  - Múltiplos cenários de teste
  - Métricas de latência
  - Resultados em JSON
  - Suporte a testes individuais e completos
- **Adicionado** `scripts/validate_setup.sh` - Validaçêo de setup
  - Verifica todos os arquivos necessários
  - Checa dependências do sistema
  - Valida permissões de scripts

#### ⚙️ Configuraçêo
- **Adicionado** `.env` - Variáveis de ambiente
  - AUTO_UNLOAD_MINUTES
  - LOG_LEVEL
  - Paths de modelos e outputs
- **Adicionado** `.gitignore` - Arquivos ignorados pelo Git
- **Adicionado** `Makefile` - Comandos facilitados
  - `make base` - Build da base image
  - `make build` - Build de todos os containers
  - `make up/down` - Iniciar/parar serviços
  - `make health` - Health check
  - `make benchmark` - Testes de performance
  - `make logs` - Ver logs
  - `make clean` - Limpeza

#### 📚 Documentaçêo
- **Adicionado** `README.md` - Documentaçêo principal completa
  - Visêo geral do projeto
  - Guia de instalaçêo
  - Uso das APIs
  - Comandos úteis
  - Troubleshooting
- **Adicionado** `QUICKSTART.md` - Guia rápido em português
  - Passo-a-passo para iniciantes
  - Exemplos práticos
  - Problemas comuns
  - Instalaçêo de dependências
- **Adicionado** `ARCHITECTURE.md` - Documentaçêo técnica
  - Arquitetura detalhada
  - Fluxo de dados
  - Estratégias de quantizaçêo
  - Otimizações para DGX Spark
  - Considerações de segurança
- **Adicionado** `PROJECT_SUMMARY.md` - Sumário do projeto
  - Status da implementaçêo
  - Arquivos criados
  - Funcionalidades implementadas
  - Especificações técnicas
- **Adicionado** `CHANGELOG.md` - Este arquivo

### 🎯 Funcionalidades

#### APIs REST Completas
- ✅ Geraçêo de vídeos a partir de prompts de texto
- ✅ Sistema de fila de jobs assíncrona
- ✅ Download de vídeos gerados
- ✅ Health checks e métricas
- ✅ Validaçêo de input via Pydantic

#### Gerenciamento de Memória
- ✅ Lazy loading de modelos (carrega sob demanda)
- ✅ Auto-unload configurável (libera memória após inatividade)
- ✅ Monitoramento em tempo real de GPU/CPU
- ✅ Suporte a 3-4 modelos simultâneos (128GB RAM)

#### Quantizaçêo Otimizada
- ✅ FP4 (NF4) para LTX-2 e MAGI-1 (economia de ~50%)
- ✅ FP8 para Wan 2.1 e Waver (economia de ~25%)
- ✅ Otimizações específicas para Blackwell GB10

#### Monitoramento e Métricas
- ✅ Health checks automáticos (Docker)
- ✅ Script de verificaçêo completa
- ✅ Benchmark de performance
- ✅ Métricas de inferência (duraçêo, taxa de sucesso, etc.)

### 🔧 Detalhes Técnicos

#### Stack Tecnológico
- **Base**: Ubuntu 22.04, CUDA 12.3.0
- **ML**: PyTorch 2.2.0, Transformers 4.38+, Diffusers 0.25+
- **API**: FastAPI 0.109+, Uvicorn 0.27+
- **Quantizaçêo**: bitsandbytes 0.41+ (FP4), PyTorch native (FP8)
- **Video**: imageio, opencv-python, ffmpeg

#### Hardware Alvo
- **Plataforma**: DGX Spark 2026
- **Memória**: 128GB unified (CPU+GPU)
- **GPU**: Blackwell GB10
- **Performance**: ~1 PFLOP FP4

#### Endpoints Implementados
Todos os modelos (portas 8001-8004):
- `GET /` - Informações da API
- `GET /health` - Status do container
- `GET /ready` - Verifica se modelo está carregado
- `GET /info` - Detalhes completos (sistema + modelo + fila)
- `POST /generate` - Gera vídeo a partir de prompt
- `POST /unload` - Descarrega modelo da memória
- `GET /queue/status` - Status da fila de jobs
- `GET /jobs/{id}` - Status de um job específico
- `GET /jobs/{id}/download` - Download do vídeo gerado
- `GET /metrics` - Estatísticas de performance

### 📊 Estatísticas

- **Total de arquivos criados**: 33
- **Linhas de código**: ~2.500+
- **Documentaçêo**: ~1.500+ linhas
- **Modelos suportados**: 4
- **Endpoints por modelo**: 10
- **Scripts de utilidade**: 4
- **Tempo de implementaçêo**: ~2 horas

### 🎓 Padrões de Design Utilizados

1. **Template Method**: `api_base.py` define estrutura comum
2. **Factory**: `ModelLoader` cria modelos via funçêo injetada
3. **Singleton**: Um loader por container
4. **Observer**: Health checks monitoram estado
5. **Strategy**: Diferentes estratégias de quantizaçêo

### ⚠️ Limitações Conhecidas

- Containers rodam como root (TODO: non-root user)
- Sem autenticaçêo (TODO: implementar JWT)
- Fila in-memory (nêo persiste em restart)
- Single GPU por modelo (sem multi-GPU)
- IDs de modelos sêo hipotéticos (ajustar para produçêo)

### 📝 Notas de Desenvolvimento

#### Otimizações Implementadas
- Attention slicing para reduzir uso de memória
- VAE slicing onde aplicável
- Model CPU offload para aproveitar memória unificada
- Build cache compartilhado via base image
- Volume persistente para modelos (evita re-download)

#### Decisões de Design
1. **Um container por modelo**: Isolamento e controle granular
2. **Lazy loading**: Economia de memória no início
3. **Auto-unload opcional**: Flexibilidade vs. performance
4. **FastAPI + async**: Melhor performance para I/O bound
5. **Pydantic**: Validaçêo automática de tipos

### 🚀 Próximos Passos (Roadmap)

#### Versêo 1.1 (Curto Prazo)
- [ ] Testes automatizados (unit + integration)
- [ ] Autenticaçêo JWT
- [ ] Web UI simples para geraçêo
- [ ] Rate limiting

#### Versêo 1.2 (Médio Prazo)
- [ ] Prometheus + Grafana
- [ ] Cache de vídeos gerados
- [ ] Suporte a batch processing
- [ ] Persistência de fila (Redis)

#### Versêo 2.0 (Longo Prazo)
- [ ] Multi-GPU support
- [ ] Kubernetes deployment
- [ ] Fine-tuning pipeline
- [ ] Streaming de vídeos
- [ ] A/B testing de modelos

---

## Formato

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de Mudanças
- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Descontinuado** para funcionalidades que serêo removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para vulnerabilidades
