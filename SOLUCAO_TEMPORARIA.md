# 🔧 SOLUÇêO TEMPORÁRIA - Usar CLI Diretamente

## 🐛 O Problema

O Gemma encoder fica em estado corrompido após gerar 1-2 vídeos, causando erro CUDA.
Este é um bug conhecido do ComfyUI-LTXVideo com modelos multi-shard.

## ✅ SOLUÇêO QUE FUNCIONA: Usar CLI

### Método 1: Script CLI (100% Confiável)

```bash
cd /home/nmaldaner/projetos/VideosDGX

# Gerar vídeo
./gerar_video_ltx2.py "seu prompt aqui" --frames 49

# Aguardar 2-3 minutos
# Vídeo estará em:
ls -lht ComfyUI/output/ | head -3
```

### Método 2: Reiniciar ComfyUI Entre Vídeos

```bash
# Gerar primeiro vídeo
./gerar_video_ltx2.py "vídeo 1"

# Aguardar completar (~2 min)

# REINICIAR ComfyUI
./reiniciar_comfyui.sh

# Aguardar 10 segundos

# Gerar segundo vídeo  
./gerar_video_ltx2.py "vídeo 2"
```

## 🎬 FLUXO DE TRABALHO RECOMENDADO

### Para Gerar 1 Vídeo
```bash
./gerar_video_ltx2.py "um cachorro correndo"
```

### Para Gerar Múltiplos (com reinicializaçêo)
```bash
#!/bin/bash
prompts=(
    "um cachorro correndo"
    "um gato pulando"
    "um pássaro voando"
)

for prompt in "${prompts[@]}"; do
    echo "🎬 Gerando: $prompt"
    
    # Gerar
    ./gerar_video_ltx2.py "$prompt"
    
    # Aguardar (ajuste o tempo conforme necessário)
    sleep 120
    
    # Reiniciar ComfyUI
    ./reiniciar_comfyui.sh
    sleep 15
done
```

## 📋 EXEMPLOS PRÁTICOS

### Vídeo Rápido (2s)
```bash
./gerar_video_ltx2.py "um cachorro" --frames 49
```

### Vídeo HD (1024x576)
```bash
./gerar_video_ltx2.py "paisagem montanhosa" --width 1024 --height 576 --frames 49
```

### Vídeo Longo (5s)
```bash
./gerar_video_ltx2.py "ondas na praia" --frames 121
```

### Com Alta Fidelidade
```bash
./gerar_video_ltx2.py "robot futurista" --cfg 5.0 --frames 49
```

## 🔍 VERIFICAR RESULTADO

```bash
# Listar vídeos gerados (mais recentes primeiro)
ls -lht ComfyUI/output/*.mp4 | head -10

# Ver último vídeo gerado
ls -t ComfyUI/output/*.mp4 | head -1

# Assistir no VLC (se disponível)
vlc $(ls -t ComfyUI/output/*.mp4 | head -1)
```

## ⚡ GUIA RÁPIDO

```bash
# 1. Gerar vídeo
./gerar_video_ltx2.py "seu prompt"

# 2. Aguardar ~2 minutos

# 3. Ver resultado
ls -lht ComfyUI/output/ | head -3

# 4. Para gerar outro, PRIMEIRO reiniciar:
./reiniciar_comfyui.sh
sleep 15

# 5. Repetir
```

## 🎯 POR QUE FUNCIONA

- ✅ CLI submete e termina (nêo trava)
- ✅ ComfyUI processa normalmente
- ✅ Reiniciar limpa o estado do Gemma
- ✅ Cada vídeo em estado limpo = sem erros

## 🔮 SOLUÇêO PERMANENTE (Futura)

Possíveis soluções para o bug:
1. Atualizar ComfyUI-LTXVideo para versêo mais nova
2. Usar modelo Gemma single-file em vez de multi-shard
3. Modificar código do encoder para recarregar entre usos
4. Usar FP8 em vez de QAT (se disponível)

---

**USE O CLI POR ENQUANTO - É RÁPIDO E CONFIÁVEL! 🚀**
