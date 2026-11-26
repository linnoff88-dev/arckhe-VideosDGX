#!/bin/bash
cd /home/nmaldaner/projetos/VideosDGX
echo "============================================================"
echo "🎬 Iniciando Interface Web LTX-2 v3 (Auto-Restart)"
echo "============================================================"
echo ""
echo "🌐 Acesse: http://localhost:7860"
echo ""
echo "✨ Versêo 3 - Soluçêo definitiva!"
echo "   - Reinicia ComfyUI automaticamente entre vídeos"
echo "   - Previne corrupçêo do Gemma encoder"
echo "   - Um vídeo por vez (sem travamentos)"
echo "   - Aguarda geraçêo completa (~2-5 min por vídeo)"
echo ""
echo "⌨️  Ctrl+C para parar"
echo "============================================================"
echo ""
python3 web_interface_v3.py
