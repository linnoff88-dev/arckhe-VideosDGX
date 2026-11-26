# Guia de Início Rápido - VideosDGX

Guia passo-a-passo para começar a usar os modelos de geraçêo de vídeo.

## 🎯 Objetivo

Ter os 4 modelos rodando e gerando vídeos em menos de 30 minutos.

## 📋 Pré-requisitos

Antes de começar, verifique:

```bash
# Docker instalado (versêo 24.0+)
docker --version

# Docker Compose instalado (versêo 2.20+)
docker-compose --version

# NVIDIA Docker Runtime
docker run --rm --gpus all nvidia/cuda:12.3.0-base-ubuntu22.04 nvidia-smi

# Espaço em disco (pelo menos 100GB livre)
df -h
```

Se algum comando falhar, consulte a seçêo **Instalaçêo de Dependências** no final.

## 🚀 Passo 1: Build da Imagem Base

A imagem base contém CUDA, PyTorch e todas as dependências comuns.

```bash
cd /caminho/para/VideosDGX

# Build (leva ~10-15 minutos)
docker build -t videosdgx-base:latest -f common/base.Dockerfile .
```

Ou use o Makefile:

```bash
make base
```

**Verificaçêo**:
```bash
docker images | grep videosdgx-base
# Deve mostrar: videosdgx-base  latest  ...  ~15GB
```

## 🚀 Passo 2: Download dos Modelos

⚠️ **IMPORTANTE**: Esta é uma simulaçêo. Os IDs de modelos usados sêo hipotéticos. Em produçêo, substitua pelos IDs reais do HuggingFace.

### Opçêo A: Script Interativo (Recomendado)

```bash
./scripts/download_models.sh
```

Escolha a opçêo 5 para baixar todos os modelos.

### Opçêo B: Manual

```bash
# Criar volumes
docker volume create videosdgx_models
docker volume create videosdgx_outputs

# Para cada modelo, baixar do HuggingFace
# Exemplo para LTX-2:
huggingface-cli download Lightricks/LTX-Video \
  --local-dir /var/lib/docker/volumes/videosdgx_models/_data/ltx2
```

**Verificaçêo**:
```bash
docker volume ls | grep videosdgx
# Deve mostrar:
# videosdgx_models
# videosdgx_outputs
```

## 🚀 Passo 3: Build dos Containers

Agora construa os containers específicos de cada modelo:

```bash
docker-compose build
```

Ou com Makefile:

```bash
make build
```

Isso levará ~20-30 minutos dependendo da conexêo. As imagens finais terêo ~20-25GB cada.

**Verificaçêo**:
```bash
docker images | grep videosdgx
# Deve mostrar:
# videosdgx-base
# videosdgx-ltx2
# videosdgx-wan21
# videosdgx-magi1
# videosdgx-waver
```

## 🚀 Passo 4: Iniciar os Serviços

```bash
docker-compose up -d
```

Ou:

```bash
make up
```

Os containers vêo iniciar em background. Aguarde ~30 segundos para as APIs estarem prontas.

**Verificaçêo**:
```bash
docker-compose ps
# Todos devem estar "Up" e "healthy"

# Ou use o health check script
./scripts/health_check.py
```

Saída esperada:
```
=========================================
VideosDGX - Health Check
=========================================

● LTX-2
   Status:      Online
   Endpoint:    http://localhost:8001
   Modelo:      Nêo carregado
   ...

✓ Todos os serviços estêo saudáveis
```

## 🎬 Passo 5: Gerar Seu Primeiro Vídeo

Agora vamos testar gerando um vídeo simples com o Waver (modelo mais rápido):

```bash
# Gerar vídeo
curl -X POST http://localhost:8004/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cat walking on a beach at sunset",
    "duration": 3,
    "resolution": "512x512",
    "fps": 24
  }'
```

Resposta (exemplo):
```json
{
  "job_id": "waver-abc12345",
  "status": "queued",
  "queue_position": 1,
  "estimated_time_seconds": 60,
  "model_loaded": false
}
```

**Importante**: Na primeira execuçêo, o modelo será carregado automaticamente, o que pode levar 40-60 segundos adicionais.

### Verificar Status

```bash
# Substitua pelo seu job_id
curl http://localhost:8004/jobs/waver-abc12345
```

Aguarde até `"status": "completed"`.

### Download do Vídeo

```bash
# Via curl
curl -O http://localhost:8004/jobs/waver-abc12345/download

# Ou abra no navegador
# http://localhost:8004/jobs/waver-abc12345/download
```

O vídeo será salvo como `download` (renomeie para `.mp4`).

## 🎨 Testando Outros Modelos

Agora que tudo está funcionando, teste os outros modelos:

### LTX-2 (Full video + audio) - Porta 8001

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cARCKHÉtic shot of a city at night with rain",
    "duration": 5,
    "resolution": "1024x576",
    "fps": 24,
    "guidance_scale": 7.5
  }'
```

### Wan 2.1 (Versatile) - Porta 8002

```bash
curl -X POST http://localhost:8002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Timelapse of clouds moving over mountains",
    "duration": 4,
    "resolution": "1024x576",
    "fps": 30
  }'
```

### MAGI-1 (Long-form) - Porta 8003

```bash
curl -X POST http://localhost:8003/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A story of a day in the life of a bird",
    "duration": 10,
    "resolution": "1024x576",
    "fps": 24
  }'
```

## 📊 Monitoramento

### Health Check Completo

```bash
./scripts/health_check.py
```

### Benchmark de Performance

```bash
# Teste completo
./scripts/benchmark.py

# Teste rápido
./scripts/benchmark.py --quick

# Apenas um modelo
./scripts/benchmark.py --model waver
```

### Ver Logs

```bash
# Todos os containers
docker-compose logs -f

# Container específico
docker-compose logs -f ltx2

# Últimas 50 linhas
docker-compose logs --tail=50 wan21
```

### Uso de GPU

```bash
nvidia-smi

# Ou com watch (atualiza a cada 1s)
watch -n 1 nvidia-smi
```

## 🔧 Comandos Úteis

### Parar Todos os Serviços

```bash
docker-compose down
# ou
make down
```

### Reiniciar um Container

```bash
docker-compose restart ltx2
```

### Ver Status dos Containers

```bash
docker-compose ps
```

### Ver Uso de Recursos

```bash
docker stats
```

### Descarregar Modelo da Memória

```bash
# Libera ~25-30GB de memória
curl -X POST http://localhost:8001/unload
```

### Ver Informações Completas

```bash
curl http://localhost:8001/info | jq
```

## 🐛 Problemas Comuns

### Container nêo inicia

```bash
# Ver logs de erro
docker-compose logs ltx2

# Verificar GPU
nvidia-smi

# Reiniciar container
docker-compose restart ltx2
```

### "Connection refused" ao chamar API

```bash
# Aguardar um pouco mais (API pode estar iniciando)
sleep 10

# Verificar se container está rodando
docker-compose ps

# Verificar health
curl http://localhost:8001/health
```

### Out of Memory

```bash
# Descarregar modelos nêo usados
curl -X POST http://localhost:8001/unload
curl -X POST http://localhost:8002/unload
curl -X POST http://localhost:8003/unload

# Verificar memória GPU
nvidia-smi
```

### Vídeo nêo é gerado

```bash
# Verificar status do job
curl http://localhost:8001/jobs/SEU-JOB-ID

# Se status = "failed", verificar erro
curl http://localhost:8001/jobs/SEU-JOB-ID | jq '.error'

# Ver logs
docker-compose logs ltx2 | grep -i error
```

## 📚 Próximos Passos

Agora que está tudo funcionando:

1. **Explore parâmetros**: Teste diferentes resoluções, FPS, guidance_scale
2. **Compare modelos**: Use o mesmo prompt em diferentes modelos
3. **Benchmark**: Execute `./scripts/benchmark.py` para ver performance
4. **Customize**: Edite `.env` para configurar auto-unload, log level, etc.
5. **Leia a documentaçêo**: `README.md` e `ARCHITECTURE.md` para detalhes

## 🔒 Auto-Unload de Modelos

Por padrêo, modelos ficam em memória permanentemente. Para liberar memória automaticamente após inatividade:

```bash
# Editar .env
nano .env

# Alterar para 30 minutos
AUTO_UNLOAD_MINUTES=30

# Reiniciar containers
docker-compose restart
```

## 📞 Precisa de Ajuda?

- Verifique os logs: `docker-compose logs -f`
- Execute health check: `./scripts/health_check.py`
- Consulte `README.md` para documentaçêo completa
- Consulte `ARCHITECTURE.md` para detalhes técnicos

---

## Anexo: Instalaçêo de Dependências

### Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Docker Compose

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verificar
docker compose version
```

### NVIDIA Docker Runtime

```bash
# Adicionar repositório
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Instalar
sudo apt-get update
sudo apt-get install -y nvidia-docker2

# Reiniciar Docker
sudo systemctl restart docker

# Testar
docker run --rm --gpus all nvidia/cuda:12.3.0-base-ubuntu22.04 nvidia-smi
```

### HuggingFace CLI (Opcional)

```bash
pip install huggingface-hub[cli]

# Login (se necessário para modelos privados)
huggingface-cli login
```

---

**Pronto!** Você está rodando 4 modelos de geraçêo de vídeo no DGX Spark! 🎉
