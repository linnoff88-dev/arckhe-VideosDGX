ï»¿# VideosDGX - Docker Multi-Container para Video LLMs

Infraestrutura containerizada para rodar modelos de geraêÂ§êÂ£o de vêÂ­deo no DGX Spark 2026.

## ê°Å¸ââ¹ VisêÂ£o Geral

Este projeto fornece uma arquitetura Docker multi-container para executar 4 modelos de geraêÂ§êÂ£o de vêÂ­deo:

- **LTX-2**: GeraêÂ§êÂ£o completa de vêÂ­deo + êÂ¡udio (FP4, ~25-30GB)
- **Wan 2.1**: Modelo versêÂ¡til de 14B parêÂ¢metros (FP8, ~28-32GB)
- **MAGI-1**: Modelo autoregressive para vêÂ­deos longos (FP4, ~20-25GB)
- **Waver 1.0**: Modelo leve para batch generation (FP8, ~15-18GB)

## ê°Å¸Å½Â¯ Status Atual (2026-02-16)

### ê¢Åâ¦ Funcionando

- ê¢Åâ¦ **Docker Containers**: Todos os 4 containers (ltx2, wan21, magi1, waver) estêÂ£o UP e respondendo
- ê¢Åâ¦ **APIs REST**: Endpoints /health retornando status saudêÂ¡vel em todas as portas (8001-8004)
- ê¢Åâ¦ **Job Submission**: Jobs de geraêÂ§êÂ£o de vêÂ­deo aceitos com sucesso por todos os modelos
- ê¢Åâ¦ **Modelos Baixados**:
  - LTX-2: 293GB completo (checkpoint 41GB + Gemma FP8 6GB + projections 2.7GB + audio VAE 208MB)
  - Wan 2.1: 65GB completo (modelo montado de 6 shards)
  - MAGI-1: Download em andamento
  - Waver: DisponêÂ­vel no Docker volume

### ê¢Å¡Â ê¯Â¸Â Issues Conhecidos

1. **LTX-2**: Carregamento iniciou mas travou em 50% (4/8 shards) - possêÂ­vel timeout ou OOM
2. **Wan 2.1 & Waver**: Erro `torch.xpu` AttributeError durante inicializaêÂ§êÂ£o (relacionado a ARM64 + CUDA)
3. **MAGI-1**: Erro de configuraêÂ§êÂ£o - falta `model_type` no config.json
4. **CUDA Memory**: Sistema host com 117GB/120GB VRAM jêÂ¡ alocados, impedindo testes locais

### ê°Å¸âÂ Scripts de Teste DisponêÂ­veis

- `generate_all_videos.py`: Submete jobs de geraêÂ§êÂ£o para todos os 4 modelos simultaneamente
- `check_jobs_status.py`: Monitora status dos jobs em loop (10s de intervalo, 10min timeout)
- `test_ltx2_direct.py`: Testa LTX-2 via API Python direta (ltx_pipelines)
- `test_ltx2_cpu.py`: Teste de fallback em CPU (extremamente lento)

### CaracterêÂ­sticas

- ê¢Åâ¦ Isolamento por container (controle granular)
- ê¢Åâ¦ APIs REST completas para cada modelo
- ê¢Åâ¦ Carregamento sob demanda (lazy loading)
- ê¢Åâ¦ QuantizaêÂ§êÂ£o otimizada (FP4/FP8)
- ê¢Åâ¦ Gerenciamento de fila de jobs
- ê¢Åâ¦ Health checks e mêÂ©tricas
- ê¢Åâ¦ Volumes persistentes para modelos e outputs

## ê°Å¸Ââê¯Â¸Â Arquitetura

```
ê¢âÅê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ
ê¢ââ                    DGX Spark 2026                       ê¢ââ
ê¢ââ              128GB Unified Memory + Blackwell           ê¢ââ
ê¢âÅê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ¤
ê¢ââ  LTX-2      ê¢ââ  Wan 2.1    ê¢ââ  MAGI-1     ê¢ââ  Waver 1.0   ê¢ââ
ê¢ââ  :8001      ê¢ââ  :8002      ê¢ââ  :8003      ê¢ââ  :8004       ê¢ââ
ê¢ââ  FP4        ê¢ââ  FP8        ê¢ââ  FP4        ê¢ââ  FP8         ê¢ââ
ê¢ââê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ´ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ´ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ´ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âË
         ê¢ââ              ê¢ââ              ê¢ââ              ê¢ââ
         ê¢ââê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ´ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ´ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âË
                          ê¢ââ
                   ê¢âÅê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ´ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ
                   ê¢ââ   Volumes   ê¢ââ
                   ê¢âÅê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âÂ¤
                   ê¢ââ   models/   ê¢ââ
                   ê¢ââ   outputs/  ê¢ââ
                   ê¢ââê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢ââ¬ê¢âË
```

## ê°Å¸Å¡â¬ Quick Start

### PrêÂ©-requisitos

- Docker Engine 24.0+
- Docker Compose 2.20+
- NVIDIA Docker Runtime
- GPU com suporte CUDA 12.3+
- ~100GB de espaêÂ§o em disco (para modelos)

### 1. Build da Base Image

Primeiro, construa a imagem base compartilhada:

```bash
docker build -t videosdgx-base:latest -f common/base.Dockerfile .
```

### 2. Download dos Modelos

Execute o script de download (interativo):

```bash
./scripts/download_models.sh
```

Ou baixe manualmente usando HuggingFace CLI:

```bash
# Criar volume
docker volume create videosdgx_models

# Exemplo: baixar LTX-2
huggingface-cli download Lightricks/LTX-Video --local-dir /var/lib/docker/volumes/videosdgx_models/_data/ltx2
```

### 3. Build dos Containers

```bash
docker-compose build
```

### 4. Iniciar os ServiêÂ§os

```bash
docker-compose up -d
```

### 5. Verificar Status

```bash
./scripts/health_check.py
```

SaêÂ­da esperada:

```
=========================================
VideosDGX - Health Check
=========================================

ê¢âÂ LTX-2
   Status:      Online
   Endpoint:    http://localhost:8001
   Modelo:      NêÂ£o carregado
   GPU Memory:  0.5GB / 128GB
   CPU Memory:  0.8GB / 128GB
   Queue:       0 jobs

...
```

## ê°Å¸âÂ¡ Uso das APIs

Todas as APIs seguem o mesmo padrêÂ£o REST.

### Endpoints DisponêÂ­veis

| Endpoint | MêÂ©todo | DescriêÂ§êÂ£o |
|----------|--------|-----------|
| `/` | GET | InformaêÂ§êÂµes gerais da API |
| `/health` | GET | Health check bêÂ¡sico |
| `/ready` | GET | Verifica se modelo estêÂ¡ carregado |
| `/info` | GET | InformaêÂ§êÂµes detalhadas (sistema + modelo) |
| `/generate` | POST | Gera vêÂ­deo a partir de prompt |
| `/unload` | POST | Descarrega modelo da memêÂ³ria |
| `/queue/status` | GET | Status da fila de jobs |
| `/jobs/{job_id}` | GET | Status de um job especêÂ­fico |
| `/jobs/{job_id}/download` | GET | Download do vêÂ­deo gerado |
| `/metrics` | GET | MêÂ©tricas de performance |

### Exemplo: Gerar VêÂ­deo

```bash
# LTX-2 (porta 8001)
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cat walking on a beach at sunset",
    "duration": 5,
    "resolution": "1024x576",
    "fps": 24,
    "seed": 42,
    "guidance_scale": 7.5
  }'
```

Resposta:

```json
{
  "job_id": "ltx2-abc12345",
  "status": "queued",
  "queue_position": 1,
  "estimated_time_seconds": 60,
  "model_loaded": false
}
```

### Verificar Status do Job

```bash
curl http://localhost:8001/jobs/ltx2-abc12345
```

Resposta (em processamento):

```json
{
  "job_id": "ltx2-abc12345",
  "model_name": "ltx2",
  "status": "processing",
  "prompt": "A cat walking on a beach at sunset",
  "duration": 5,
  "created_at": "2026-02-15T10:30:00",
  "started_at": "2026-02-15T10:30:05",
  "completed_at": null,
  "output_path": null,
  "error": null,
  "progress": 45
}
```

### Download do VêÂ­deo

```bash
# Quando status = "completed"
curl -O http://localhost:8001/jobs/ltx2-abc12345/download
```

Ou acesse diretamente no navegador: `http://localhost:8001/jobs/ltx2-abc12345/download`

## ê°Å¸âÂ§ ConfiguraêÂ§êÂ£o

### VariêÂ¡veis de Ambiente (.env)

```bash
# Auto-unload: minutos de inatividade antes de descarregar modelo
# 0 = nunca descarregar
AUTO_UNLOAD_MINUTES=30

# Logging
LOG_LEVEL=INFO
```

### Portas dos ServiêÂ§os

| Modelo | Porta | Endpoint |
|--------|-------|----------|
| LTX-2 | 8001 | http://localhost:8001 |
| Wan 2.1 | 8002 | http://localhost:8002 |
| MAGI-1 | 8003 | http://localhost:8003 |
| Waver 1.0 | 8004 | http://localhost:8004 |

## ê°Å¸âÅ  Monitoramento

### Health Check

```bash
./scripts/health_check.py
```

### Benchmark

Testar performance de todos os modelos:

```bash
./scripts/benchmark.py
```

Testar apenas um modelo:

```bash
./scripts/benchmark.py --model ltx2
```

Teste rêÂ¡pido:

```bash
./scripts/benchmark.py --quick
```

### Logs dos Containers

```bash
# Todos os containers
docker-compose logs -f

# Container especêÂ­fico
docker-compose logs -f ltx2

# êÅ¡ltimas 100 linhas
docker-compose logs --tail=100 wan21
```

### Uso de Recursos

```bash
# GPU
nvidia-smi

# Containers
docker stats

# Volumes
docker volume inspect videosdgx_models
docker volume inspect videosdgx_outputs
```

## ê°Å¸Å½Â¯ Gerenciamento de MemêÂ³ria

### EstratêÂ©gia de Carregamento

1. **Container inicia**: API pronta, modelo NêÆO carregado (~500MB RAM)
2. **Primeira requisiêÂ§êÂ£o**: Modelo carregado automaticamente
3. **RequisiêÂ§êÂµes subsequentes**: Modelo jêÂ¡ em memêÂ³ria (rêÂ¡pido)
4. **Auto-unload**: ApêÂ³s X minutos de inatividade (configurêÂ¡vel)

### Estimativa de MemêÂ³ria

Com 128GB de memêÂ³ria unificada:

| Modelo | QuantizaêÂ§êÂ£o | MemêÂ³ria | Tempo de Carga |
|--------|-------------|---------|----------------|
| LTX-2 | FP4 | ~25-30GB | ~60-90s |
| Wan 2.1 | FP8 | ~28-32GB | ~70-100s |
| MAGI-1 | FP4 | ~20-25GB | ~50-80s |
| Waver 1.0 | FP8 | ~15-18GB | ~40-60s |

**Capacidade**: 3-4 modelos carregados simultaneamente

### Descarregar Modelo Manualmente

```bash
curl -X POST http://localhost:8001/unload
```

Resposta:

```json
{
  "status": "unloaded",
  "model_name": "ltx2",
  "memory_freed_gb": 28.5,
  "memory_after": {
    "allocated_gb": 0.5,
    "free_gb": 127.5
  }
}
```

## ê°Å¸ââ Abordagens Alternativas

AlêÂ©m da arquitetura Docker, este projeto inclui duas abordagens alternativas configuradas:

### ComfyUI (Recomendado pela NVIDIA)

ComfyUI estêÂ¡ instalado e configurado com custom nodes para LTX-2:

```bash
# Ativar ambiente
source comfyui-env/bin/activate

# Iniciar servidor (requer resolver issue de memêÂ³ria)
cd ComfyUI
python main.py --port 8188

# Acessar: http://localhost:8188
```

**LocalizaêÂ§êÂ£o dos modelos ComfyUI**:
- Checkpoint: `ComfyUI/models/checkpoints/ltx-2-19b-distilled.safetensors` (41GB)
- Text Encoder: `ComfyUI/models/clip/gemma_3_12B_it_fp8_e4m3fn.safetensors` (6GB)
- Projections: `ComfyUI/models/clip/ltx-2-19b-dev-fp4_projections_only.safetensors` (2.7GB)
- Audio VAE: `ComfyUI/models/vae/LTX2_audio_vae_bf16.safetensors` (208MB)

**Custom Nodes**:
- ComfyUI-LTXVideo (oficial Lightricks)
- MAGI-1 (SandAI-org)

### Python API Direta (LTX-2)

API oficial da Lightricks instalada via pip:

```bash
# Ativar ambiente
source comfyui-env/bin/activate

# Gerar vêÂ­deo via linha de comando
python -m ltx_pipelines.distilled \
  --checkpoint-path ComfyUI/models/checkpoints/ltx-2-19b-distilled.safetensors \
  --gemma-root ComfyUI/models/clip/ \
  --prompt "A cat walking on a beach at sunset" \
  --output-path output.mp4 \
  --num-frames 65 \
  --height 512 \
  --width 768 \
  --num-inference-steps 8 \
  --guidance-scale 3.0
```

**Pacotes instalados**:
- `ltx-core`
- `ltx-pipelines`

## ê°Å¸Â§Âª Testes Realizados

### GeraêÂ§êÂ£o de VêÂ­deos (16/02/2026)

Executado `generate_all_videos.py` com prompt: *"A cat walking on a beach at sunset, cinematic camera movement, golden hour lighting, 4k quality"*

**Resultados**:

| Modelo | Status | Job ID | Detalhes |
|--------|--------|--------|----------|
| LTX-2 | ê¢ÂÂ¸ê¯Â¸Â Travado | ltx2-26252c62 | Carregamento iniciou (50%), depois timeout |
| Wan 2.1 | ê¢ÂÅ Falhou | wan21-66eb1181 | torch.xpu AttributeError |
| MAGI-1 | ê¢ÂÅ Falhou | magi1-5d8c2647 | Config.json sem model_type |
| Waver | ê¢ÂÅ Falhou | waver-cf98097a | torch.xpu AttributeError |

**Log completo**: `generation_results.log`

## ê°Å¸âºÂ ê¯Â¸Â Comandos êÅ¡teis

### Docker Compose

```bash
# Iniciar todos os serviêÂ§os
docker-compose up -d

# Parar todos os serviêÂ§os
docker-compose down

# Rebuild de um serviêÂ§o especêÂ­fico
docker-compose build ltx2

# Restart de um serviêÂ§o
docker-compose restart wan21

# Ver logs
docker-compose logs -f

# Escalar serviêÂ§o (nêÂ£o recomendado para GPUs)
docker-compose up -d --scale waver=2
```

### Volumes

```bash
# Listar volumes
docker volume ls

# Inspecionar volume
docker volume inspect videosdgx_models

# Backup de modelos
docker run --rm -v videosdgx_models:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/models_backup.tar.gz /data

# Restore de modelos
docker run --rm -v videosdgx_models:/data -v $(pwd):/backup \
  ubuntu tar xzf /backup/models_backup.tar.gz -C /data
```

### Limpeza

```bash
# Parar e remover containers
docker-compose down

# Remover volumes (CUIDADO: apaga modelos!)
docker-compose down -v

# Limpar imagens nêÂ£o utilizadas
docker image prune -a

# Limpar tudo (CUIDADO!)
docker system prune -a --volumes
```

## ê°Å¸Ââº Troubleshooting

### Container nêÂ£o inicia

```bash
# Verificar logs
docker-compose logs ltx2

# Verificar GPU
nvidia-smi

# Verificar NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:12.3.0-base-ubuntu22.04 nvidia-smi
```

### Modelo nêÂ£o carrega

```bash
# Verificar se modelo existe
docker volume inspect videosdgx_models

# Verificar permissêÂµes
docker exec videosdgx-ltx2 ls -la /models/ltx2

# Verificar logs de carregamento
docker-compose logs ltx2 | grep "Carregando"
```

### Out of Memory

```bash
# Verificar memêÂ³ria GPU
nvidia-smi

# Descarregar modelos nêÂ£o usados
curl -X POST http://localhost:8001/unload
curl -X POST http://localhost:8002/unload

# Reiniciar container
docker-compose restart ltx2
```

### Performance lenta

1. Verificar se modelo estêÂ¡ carregado: `curl http://localhost:8001/ready`
2. Verificar fila: `curl http://localhost:8001/queue/status`
3. Verificar mêÂ©tricas: `curl http://localhost:8001/metrics`
4. Ajustar nêÂºmero de inference steps nas configs

### ê¢Å¡Â ê¯Â¸Â Erros Conhecidos e SoluêÂ§êÂµes

#### 1. torch.xpu AttributeError (Wan 2.1, Waver)

**Erro**:
```
AttributeError: module 'torch' has no attribute 'xpu'
```

**Causa**: Bibliotecas tentando detectar Intel XPU em ambiente ARM64 + CUDA

**SoluêÂ§êÂµes tentadas**:
- ê¢ÂÅ Environment variables (`ACCELERATE_USE_XPU=0`)
- ê¢ÂÅ Monkey-patching `torch.xpu`
- ê¢ÂÂ³ **SoluêÂ§êÂ£o necessêÂ¡ria**: Patch no cêÂ³digo de inicializaêÂ§êÂ£o dos containers

**Workaround temporêÂ¡rio**:
```python
# Adicionar antes de imports de diffusers/accelerate
import torch
if not hasattr(torch, 'xpu'):
    class DummyXPU:
        @staticmethod
        def is_available(): return False
    torch.xpu = DummyXPU()
```

#### 2. CUDA Out of Memory (Sistema Host)

**Erro**:
```
RuntimeError: CUDA out of memory. Tried to allocate X GB
(GPU 0; 120.00 GiB total capacity; 117.00 GiB already allocated)
```

**Causa**: Processo root (PID 2351379) consumindo 117GB/120GB VRAM

**SoluêÂ§êÂ£o**:
```bash
# Requer sudo
sudo kill -9 2351379
sudo sh -c 'sync; echo 3 > /proc/sys/vm/drop_caches'
nvidia-smi
```

**VerificaêÂ§êÂ£o**:
```bash
# Mostrar processos usando GPU
fuser -v /dev/nvidia*
ps aux | grep 2351379
```

#### 3. MAGI-1 Config Missing

**Erro**:
```
Unrecognized model in /models/magi1. Should have a `model_type` key in its config.json
```

**Causa**: Download incompleto ou configuraêÂ§êÂ£o ausente

**SoluêÂ§êÂ£o**:
```bash
# Verificar integridade do download
docker exec videosdgx-magi1 ls -lah /models/magi1/
docker exec videosdgx-magi1 cat /models/magi1/config.json

# Re-download se necessêÂ¡rio
docker exec videosdgx-magi1 huggingface-cli download SandAI-org/MAGI-1 --local-dir /models/magi1
```

#### 4. LTX-2 Loading Timeout

**Sintoma**: Carregamento trava em 50% (4/8 checkpoint shards)

**DiagnêÂ³stico**:
```bash
# Verificar logs detalhados
docker logs videosdgx-ltx2 --tail 200

# Verificar uso de memêÂ³ria durante carregamento
docker stats videosdgx-ltx2

# Verificar se processo estêÂ¡ travado ou apenas lento
docker exec videosdgx-ltx2 ps aux
```

**PossêÂ­veis causas**:
- OOM durante carregamento de shards grandes
- Deadlock em carregamento multi-threaded
- Timeout muito curto nas requisiêÂ§êÂµes

**SoluêÂ§êÂ£o**:
```bash
# Aumentar timeout no check_jobs_status.py
max_iterations = 120  # 20 minutos ao invêÂ©s de 10

# Ou restart do container
docker-compose restart ltx2
```

#### 5. Gemma Model Gated (resolvido)

**Erro**: `403 Client Error: Forbidden for url: google/gemma-3-12b-it`

**SoluêÂ§êÂ£o aplicada**: Usar modelo alternativo nêÂ£o-gated
```bash
# Baixado: GitMylo/LTX-2-comfy_gemma_fp8_e4m3fn
# LocalizaêÂ§êÂ£o: ComfyUI/models/clip/gemma_3_12B_it_fp8_e4m3fn.safetensors
```

## ê°Å¸âÅ¡ Estrutura de Arquivos

```
VideosDGX/
ê¢âÅê¢ââ¬ê¢ââ¬ common/                    # CêÂ³digo compartilhado (Docker)
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ base.Dockerfile        # Base image com CUDA + PyTorch
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ api_base.py            # Framework FastAPI
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ model_loader.py        # Gerenciador de modelos
ê¢ââ   ê¢ââê¢ââ¬ê¢ââ¬ utils.py               # Utilidades (logging, metrics)
ê¢âÅê¢ââ¬ê¢ââ¬ ltx2/                      # LTX-2 container especêÂ­fico
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ Dockerfile
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ app.py
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ model_config.py
ê¢ââ   ê¢ââê¢ââ¬ê¢ââ¬ requirements.txt
ê¢âÅê¢ââ¬ê¢ââ¬ wan21/                     # Wan 2.1 container
ê¢âÅê¢ââ¬ê¢ââ¬ magi1/                     # MAGI-1 container
ê¢âÅê¢ââ¬ê¢ââ¬ waver/                     # Waver container
ê¢âÅê¢ââ¬ê¢ââ¬ scripts/                   # Scripts de utilidade
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ download_models.sh
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ health_check.py
ê¢ââ   ê¢ââê¢ââ¬ê¢ââ¬ benchmark.py
ê¢âÅê¢ââ¬ê¢ââ¬ ComfyUI/                   # ComfyUI installation
ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ models/
ê¢ââ   ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ checkpoints/       # LTX-2 checkpoint (41GB)
ê¢ââ   ê¢ââ   ê¢âÅê¢ââ¬ê¢ââ¬ clip/              # Gemma FP8 encoder (6GB) + projections (2.7GB)
ê¢ââ   ê¢ââ   ê¢ââê¢ââ¬ê¢ââ¬ vae/               # Audio VAE (208MB)
ê¢ââ   ê¢ââê¢ââ¬ê¢ââ¬ custom_nodes/
ê¢ââ       ê¢âÅê¢ââ¬ê¢ââ¬ ComfyUI-LTXVideo/  # LTX-2 custom node
ê¢ââ       ê¢ââê¢ââ¬ê¢ââ¬ MAGI-1/            # MAGI-1 custom node
ê¢âÅê¢ââ¬ê¢ââ¬ LTX-2/                     # RepositêÂ³rio oficial Lightricks
ê¢ââ   ê¢ââê¢ââ¬ê¢ââ¬ src/ltx_pipelines/     # API Python direta
ê¢âÅê¢ââ¬ê¢ââ¬ comfyui-env/               # Python venv (PyTorch 2.10.0+cu130)
ê¢âÅê¢ââ¬ê¢ââ¬ docker-compose.yml         # OrquestraêÂ§êÂ£o dos 4 containers
ê¢âÅê¢ââ¬ê¢ââ¬ .env                       # ConfiguraêÂ§êÂµes de ambiente
ê¢âÅê¢ââ¬ê¢ââ¬ generate_all_videos.py    # Script de teste - submete jobs para todos os modelos
ê¢âÅê¢ââ¬ê¢ââ¬ check_jobs_status.py      # Script de monitoramento de jobs
ê¢âÅê¢ââ¬ê¢ââ¬ test_ltx2_direct.py        # Teste LTX-2 via Python API
ê¢âÅê¢ââ¬ê¢ââ¬ test_ltx2_cpu.py           # Teste LTX-2 em CPU (fallback)
ê¢âÅê¢ââ¬ê¢ââ¬ generation_results.log     # Log dos testes executados
ê¢âÅê¢ââ¬ê¢ââ¬ CLAUDE.md                  # InstruêÂ§êÂµes para Claude Code
ê¢âÅê¢ââ¬ê¢ââ¬ ARCHITECTURE.md            # DocumentaêÂ§êÂ£o da arquitetura
ê¢âÅê¢ââ¬ê¢ââ¬ QUICKSTART.md              # Guia rêÂ¡pido de inêÂ­cio
ê¢âÅê¢ââ¬ê¢ââ¬ PROJECT_SUMMARY.md         # Resumo do projeto
ê¢âÅê¢ââ¬ê¢ââ¬ CHANGELOG.md               # HistêÂ³rico de mudanêÂ§as
ê¢ââê¢ââ¬ê¢ââ¬ README.md                  # Este arquivo
```

**Volumes Docker**:
```
videosdgx_models/
ê¢âÅê¢ââ¬ê¢ââ¬ ltx2/           # 293GB - RepositêÂ³rio completo HuggingFace
ê¢âÅê¢ââ¬ê¢ââ¬ wan21/          # 65GB  - Modelo Wan 2.1 completo
ê¢âÅê¢ââ¬ê¢ââ¬ magi1/          # Em download
ê¢ââê¢ââ¬ê¢ââ¬ waver/          # Modelo Waver 1.0

videosdgx_outputs/  # VêÂ­deos gerados pelos containers
```

## ê°Å¸âÂ SeguranêÂ§a

- **Sem exposiêÂ§êÂ£o externa**: Por padrêÂ£o, APIs sêÂ³ acessêÂ­veis via localhost
- **Volumes isolados**: Cada container tem acesso controlado
- **Sem root**: Containers rodam com usuêÂ¡rio nêÂ£o-privilegiado (TODO)
- **Secrets**: Use Docker secrets para credenciais HuggingFace

## ê°Å¸âË PrêÂ³ximos Passos

- [ ] Adicionar frontend web
- [ ] Implementar autenticaêÂ§êÂ£o JWT
- [ ] Sistema de cache de vêÂ­deos
- [ ] Auto-scaling baseado em demanda
- [ ] Prometheus + Grafana para monitoramento
- [ ] CI/CD pipeline
- [ ] Fine-tuning de modelos
- [ ] Suporte a mêÂºltiplas GPUs

## ê°Å¸ââ LicenêÂ§a

Este projeto êÂ© fornecido como estêÂ¡, para uso no DGX Spark 2026.

## ê°Å¸Â¤Â Contribuindo

ContribuiêÂ§êÂµes sêÂ£o bem-vindas! Por favor, abra uma issue primeiro para discutir mudanêÂ§as maiores.

## ê°Å¸âÅ¾ Suporte

Para problemas, abra uma issue neste repositêÂ³rio.

---

**DGX Spark 2026** | 128GB Unified Memory | ~1 PFLOP FP4 Performance

---

Projeto  - ARCKHÉe