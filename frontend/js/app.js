// Configuraçêo dos modelos
const MODELS = {
    ltx2: { name: 'LTX-2', apiPath: '/api/ltx2', desc: 'Vídeo + Áudio' },
    wan21: { name: 'Wan 2.1', apiPath: '/api/wan21', desc: 'Versátil 14B' },
    magi1: { name: 'MAGI-1', apiPath: '/api/magi1', desc: 'Vídeos Longos' },
    waver: { name: 'Waver 1.0', apiPath: '/api/waver', desc: 'Batch Rápido' }
};

// Estado global
let jobs = [];
let completedJobs = [];
let statusInterval = null;
let jobsInterval = null;

// Inicializaçêo
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Event listeners
    document.getElementById('generateForm').addEventListener('submit', handleGenerate);
    document.getElementById('guidance_scale').addEventListener('input', (e) => {
        document.getElementById('guidanceValue').textContent = e.target.value;
    });

    // Verificar status dos modelos
    checkModelsStatus();
    statusInterval = setInterval(checkModelsStatus, 10000); // A cada 10s

    // Verificar jobs
    jobsInterval = setInterval(updateJobs, 3000); // A cada 3s

    // Carregar jobs salvos do localStorage
    loadSavedJobs();
}

// Verificar status dos modelos
async function checkModelsStatus() {
    const statusGrid = document.getElementById('statusGrid');
    const cards = statusGrid.querySelectorAll('.status-card');

    for (let i = 0; i < Object.keys(MODELS).length; i++) {
        const modelKey = Object.keys(MODELS)[i];
        const model = MODELS[modelKey];
        const card = cards[i];

        try {
            const response = await fetch(`${model.apiPath}/info`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                updateStatusCard(card, modelKey, data, 'online');
            } else {
                updateStatusCard(card, modelKey, null, 'offline');
            }
        } catch (error) {
            updateStatusCard(card, modelKey, null, 'offline');
        }
    }
}

function updateStatusCard(card, modelKey, data, status) {
    const model = MODELS[modelKey];

    card.className = `status-card ${status}`;

    const statusText = card.querySelector('.model-status');
    const memoryText = card.querySelector('.model-memory');

    if (status === 'online' && data) {
        const modelLoaded = data.model?.loaded || false;
        const gpuMem = data.system?.gpu_memory;

        statusText.textContent = modelLoaded ? '✓ Modelo carregado' : '○ Modelo nêo carregado';
        statusText.style.color = modelLoaded ? 'var(--success)' : 'var(--warning)';

        if (gpuMem && gpuMem.available) {
            memoryText.textContent = `GPU: ${gpuMem.allocated_gb || 0}GB / ${gpuMem.total_gb || 0}GB`;
        } else {
            memoryText.textContent = 'GPU: N/A';
        }
    } else {
        statusText.textContent = '✗ Offline';
        statusText.style.color = 'var(--danger)';
        memoryText.textContent = '-';
    }
}

// Gerar vídeo
async function handleGenerate(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        prompt: formData.get('prompt'),
        duration: parseInt(formData.get('duration')),
        fps: parseInt(formData.get('fps')),
        resolution: formData.get('resolution'),
        guidance_scale: parseFloat(formData.get('guidance_scale'))
    };

    const seed = formData.get('seed');
    if (seed) {
        data.seed = parseInt(seed);
    }

    const modelKey = formData.get('model');
    if (!modelKey) {
        alert('Selecione um modelo!');
        return;
    }

    const model = MODELS[modelKey];
    const btn = document.getElementById('generateBtn');

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const response = await fetch(`${model.apiPath}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        // Adicionar job à lista
        const job = {
            ...result,
            model: modelKey,
            modelName: model.name,
            prompt: data.prompt,
            duration: data.duration,
            resolution: data.resolution,
            created_at: new Date().toISOString()
        };

        jobs.push(job);
        saveJobs();
        renderJobs();

        // Limpar formulário
        e.target.reset();
        document.getElementById('guidanceValue').textContent = '7.5';

        alert(`Vídeo adicionado à fila!\nJob ID: ${result.job_id}`);
    } catch (error) {
        console.error('Erro ao gerar vídeo:', error);
        alert(`Erro ao gerar vídeo: ${error.message}\n\nVerifique se o modelo está online.`);
    } finally {
        btn.disabled = false;
        btn.textContent = '🎬 Gerar Vídeo';
    }
}

// Atualizar status dos jobs
async function updateJobs() {
    const updatedJobs = [];

    for (const job of jobs) {
        const model = MODELS[job.model];

        try {
            const response = await fetch(`${model.apiPath}/jobs/${job.job_id}`);

            if (response.ok) {
                const data = await response.json();
                // Preservar informações originais do modelo
                const updatedJob = {
                    ...data,
                    model: job.model,
                    modelName: job.modelName
                };

                if (data.status === 'completed') {
                    // Mover para concluídos
                    if (!completedJobs.find(j => j.job_id === job.job_id)) {
                        completedJobs.unshift(updatedJob);
                    }
                } else {
                    updatedJobs.push(updatedJob);
                }
            } else {
                updatedJobs.push(job);
            }
        } catch (error) {
            console.error(`Erro ao verificar job ${job.job_id}:`, error);
            updatedJobs.push(job);
        }
    }

    jobs = updatedJobs;
    saveJobs();
    renderJobs();
    renderCompletedJobs();
}

// Renderizar jobs em processamento
function renderJobs() {
    const jobsList = document.getElementById('jobsList');

    if (jobs.length === 0) {
        jobsList.innerHTML = '<p class="empty-message">Nenhum vídeo em processamento</p>';
        return;
    }

    jobsList.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-header">
                <span class="job-id">${job.job_id}</span>
                <span class="job-status ${job.status || 'queued'}">${getStatusText(job.status)}</span>
            </div>
            <div class="job-prompt">"${job.prompt}"</div>
            <div class="job-details">
                <span>🎬 ${job.modelName}</span>
                <span>⏱️ ${job.duration}s</span>
                <span>📐 ${job.resolution}</span>
            </div>
            ${job.progress ? `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${job.progress}%"></div>
                </div>
                <small style="color: var(--text-muted);">Progresso: ${job.progress}%</small>
            ` : ''}
            ${job.error ? `
                <div style="color: var(--danger); margin-top: 0.5rem; font-size: 0.9rem;">
                    ⚠️ Erro: ${job.error}
                </div>
            ` : ''}
            <div class="job-actions">
                <button class="btn-small btn-danger" onclick="removeJob('${job.job_id}')">
                    Remover
                </button>
            </div>
        </div>
    `).join('');
}

// Renderizar jobs concluídos
function renderCompletedJobs() {
    const completedList = document.getElementById('completedList');

    if (completedJobs.length === 0) {
        completedList.innerHTML = '<p class="empty-message">Nenhum vídeo concluído ainda</p>';
        return;
    }

    completedList.innerHTML = completedJobs.map(job => {
        const model = MODELS[job.model];
        const downloadUrl = `${model.apiPath}/jobs/${job.job_id}/download`;

        return `
            <div class="job-card">
                <div class="job-header">
                    <span class="job-id">${job.job_id}</span>
                    <span class="job-status completed">✓ Concluído</span>
                </div>
                <div class="job-prompt">"${job.prompt}"</div>
                <div class="job-details">
                    <span>🎬 ${job.modelName}</span>
                    <span>⏱️ ${job.duration}s</span>
                    <span>📐 ${job.resolution}</span>
                </div>
                <div class="video-container">
                    <video controls>
                        <source src="${downloadUrl}" type="video/mp4">
                        Seu navegador nêo suporta vídeo.
                    </video>
                </div>
                <div class="job-actions">
                    <a href="${downloadUrl}" download class="btn-small" style="text-decoration: none;">
                        ⬇️ Download
                    </a>
                    <button class="btn-small btn-danger" onclick="removeCompleted('${job.job_id}')">
                        Remover
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Helpers
function getStatusText(status) {
    const statusMap = {
        'queued': '⏳ Na fila',
        'processing': '⚙️ Processando',
        'completed': '✓ Concluído',
        'failed': '✗ Falhou'
    };
    return statusMap[status] || status;
}

function removeJob(jobId) {
    if (confirm('Remover este job da lista?')) {
        jobs = jobs.filter(j => j.job_id !== jobId);
        saveJobs();
        renderJobs();
    }
}

function removeCompleted(jobId) {
    if (confirm('Remover este vídeo da lista?')) {
        completedJobs = completedJobs.filter(j => j.job_id !== jobId);
        saveJobs();
        renderCompletedJobs();
    }
}

// LocalStorage
function saveJobs() {
    localStorage.setItem('videosdgx_jobs', JSON.stringify(jobs));
    localStorage.setItem('videosdgx_completed', JSON.stringify(completedJobs));
}

function loadSavedJobs() {
    try {
        const savedJobs = localStorage.getItem('videosdgx_jobs');
        const savedCompleted = localStorage.getItem('videosdgx_completed');

        if (savedJobs) {
            jobs = JSON.parse(savedJobs);
            renderJobs();
        }

        if (savedCompleted) {
            completedJobs = JSON.parse(savedCompleted);
            renderCompletedJobs();
        }
    } catch (error) {
        console.error('Erro ao carregar jobs salvos:', error);
    }
}

// Cleanup ao sair
window.addEventListener('beforeunload', () => {
    if (statusInterval) clearInterval(statusInterval);
    if (jobsInterval) clearInterval(jobsInterval);
});

// =============================================================================
// SISTEMA DE AJUDA E MODAIS INFORMATIVOS
// =============================================================================

const HELP_CONTENT = {
    model: {
        title: "Escolha do Modelo",
        content: `
            <p>Cada modelo tem características específicas para diferentes tipos de vídeos:</p>
            
            <h3>🎬 LTX-2 (Vídeo + Áudio)</h3>
            <ul>
                <li><strong>Melhor para:</strong> Vídeos que precisam de áudio sincronizado</li>
                <li><strong>Quantizaçêo:</strong> FP4 (NVFP4)</li>
                <li><strong>Memória:</strong> ~25-30GB</li>
                <li><strong>Velocidade:</strong> Média</li>
            </ul>

            <h3>🎨 Wan 2.1 (Versátil 14B)</h3>
            <ul>
                <li><strong>Melhor para:</strong> Vídeos de propósito geral, alta qualidade</li>
                <li><strong>Quantizaçêo:</strong> FP8</li>
                <li><strong>Memória:</strong> ~28-32GB</li>
                <li><strong>Velocidade:</strong> Média-Lenta</li>
            </ul>

            <h3>⏱️ MAGI-1 (Vídeos Longos)</h3>
            <ul>
                <li><strong>Melhor para:</strong> Vídeos mais longos (10-60s) com contexto temporal</li>
                <li><strong>Quantizaçêo:</strong> FP4</li>
                <li><strong>Memória:</strong> ~20-25GB</li>
                <li><strong>Velocidade:</strong> Lenta (mas gera vídeos mais longos)</li>
            </ul>

            <h3>⚡ Waver 1.0 (Rápido)</h3>
            <ul>
                <li><strong>Melhor para:</strong> Prototipagem rápida, batch processing</li>
                <li><strong>Quantizaçêo:</strong> FP8</li>
                <li><strong>Memória:</strong> ~15-18GB</li>
                <li><strong>Velocidade:</strong> Rápida</li>
            </ul>

            <div class="tip">
                <strong>💡 Dica:</strong> Para começar, use o <strong>Waver 1.0</strong> (mais rápido). 
                Para qualidade máxima, use <strong>Wan 2.1</strong>.
            </div>
        `
    },

    prompt: {
        title: "Como Escrever um Bom Prompt",
        content: `
            <p>O prompt é a descriçêo do vídeo que você quer gerar. Quanto mais detalhado, melhor!</p>

            <h3>✅ Boas Práticas</h3>
            <ul>
                <li>Seja específico e descritivo</li>
                <li>Descreva a cena, açêo, iluminaçêo, estilo</li>
                <li>Use vírgulas para separar conceitos</li>
                <li>Mencione câmera/ângulo se relevante</li>
            </ul>

            <h3>✨ Exemplos Bons</h3>
            <ul>
                <li>"A cat walking on a beach at sunset, golden hour lighting, cinematic shot"</li>
                <li>"Time-lapse of clouds moving over mountains, dramatic lighting, 4K quality"</li>
                <li>"Close-up of a flower blooming, soft focus background, spring morning"</li>
            </ul>

            <h3>❌ Evite</h3>
            <ul>
                <li>Prompts muito curtos: "cat" (muito genérico)</li>
                <li>Conceitos conflitantes: "dia e noite ao mesmo tempo"</li>
                <li>Muitos objetos diferentes (foque em 1-3 elementos)</li>
            </ul>

            <div class="tip">
                <strong>💡 Dica:</strong> Pense como se estivesse descrevendo a cena para um diretor de cinema.
            </div>
        `
    },

    duration: {
        title: "Duraçêo do Vídeo",
        content: `
            <p>Define quanto tempo terá o vídeo gerado (em segundos).</p>

            <h3>⏱️ Recomendações</h3>
            <ul>
                <li><strong>3-5 segundos:</strong> Ideal para testes rápidos e loops</li>
                <li><strong>5-10 segundos:</strong> Bom para a maioria dos casos</li>
                <li><strong>10-30 segundos:</strong> Cenas mais complexas (use MAGI-1)</li>
                <li><strong>30-60 segundos:</strong> Vídeos longos (requer muito processamento)</li>
            </ul>

            <div class="warning">
                <strong>⚠️ Atençêo:</strong> Vídeos mais longos demoram exponencialmente mais para gerar 
                e consomem mais memória.
            </div>

            <div class="tip">
                <strong>💡 Dica:</strong> Comece com <strong>3-5 segundos</strong> para testar, 
                depois aumente se necessário.
            </div>
        `
    },

    fps: {
        title: "FPS (Frames Por Segundo)",
        content: `
            <p>Define quantos frames (imagens) por segundo terá o vídeo.</p>

            <h3>🎬 Quando Usar Cada FPS</h3>
            <ul>
                <li><strong>24 FPS:</strong> Padrêo cinema, aspecto cinematográfico</li>
                <li><strong>30 FPS:</strong> Vídeos web, YouTube, mais suave</li>
                <li><strong>60 FPS:</strong> Açêo rápida, movimentos muito suaves</li>
            </ul>

            <h3>⚖️ Trade-offs</h3>
            <ul>
                <li><strong>FPS maior = Mais suave</strong> mas demora mais para gerar</li>
                <li><strong>FPS menor = Mais rápido</strong> mas menos fluido</li>
                <li>24 FPS: ~24 frames/segundo</li>
                <li>60 FPS: ~60 frames/segundo (2.5x mais processamento!)</li>
            </ul>

            <div class="tip">
                <strong>💡 Dica:</strong> Use <strong>24 FPS</strong> para estilo cinema,
                <strong>30 FPS</strong> para web (recomendado).
            </div>
        `
    },

    resolution: {
        title: "Resoluçêo do Vídeo",
        content: `
            <p>Define o tamanho (largura x altura) do vídeo em pixels.</p>

            <h3>📐 Opções Disponíveis</h3>
            <ul>
                <li><strong>512x512:</strong> Baixa (Rápido, testes)
                    <ul>
                        <li>Tempo: ~30-60s</li>
                        <li>Qualidade: Básica</li>
                        <li>Uso: Protótipos rápidos</li>
                    </ul>
                </li>
                <li><strong>1024x576 (HD):</strong> Média (Recomendado)
                    <ul>
                        <li>Tempo: ~60-120s</li>
                        <li>Qualidade: Boa</li>
                        <li>Uso: Maioria dos casos</li>
                    </ul>
                </li>
                <li><strong>1920x1080 (Full HD):</strong> Alta (Lento)
                    <ul>
                        <li>Tempo: ~120-300s</li>
                        <li>Qualidade: Excelente</li>
                        <li>Uso: Produçêo final</li>
                    </ul>
                </li>
            </ul>

            <div class="warning">
                <strong>⚠️ Atençêo:</strong> Resoluções maiores requerem muito mais memória 
                e tempo de processamento (até 4-5x mais lento).
            </div>

            <div class="tip">
                <strong>💡 Dica:</strong> Use <strong>512x512</strong> para testar o prompt,
                depois <strong>1024x576</strong> para resultado final.
            </div>
        `
    },

    seed: {
        title: "Seed (Semente Aleatória)",
        content: `
            <p>Um número que controla a aleatoriedade da geraçêo, permitindo resultados reproduzíveis.</p>

            <h3>🎲 Como Funciona</h3>
            <ul>
                <li><strong>Mesma seed + mesmo prompt = mesmo vídeo</strong></li>
                <li><strong>Seeds diferentes = vídeos diferentes</strong></li>
                <li>Qualquer número entre 0 e 999999999</li>
                <li>Vazio (padrêo) = seed aleatória a cada geraçêo</li>
            </ul>

            <h3>💡 Quando Usar</h3>
            <ul>
                <li><strong>Experimentaçêo:</strong> Testar variações de parâmetros mantendo o visual base</li>
                <li><strong>Reproduçêo:</strong> Recriar exatamente o mesmo vídeo</li>
                <li><strong>Comparaçêo:</strong> Comparar diferentes modelos com mesma seed</li>
            </ul>

            <h3>✨ Exemplo de Uso</h3>
            <code>Seed: 42</code>
            <ul>
                <li>Primeiro teste com seed 42, FPS 24</li>
                <li>Segundo teste com seed 42, FPS 30</li>
                <li>Resultado: Mesmo visual, diferentes fluidezes</li>
            </ul>

            <div class="tip">
                <strong>💡 Dica:</strong> Use seeds comuns como <strong>42</strong>, <strong>123</strong>,
                <strong>777</strong> para facilitar lembrar.
            </div>
        `
    },

    guidance: {
        title: "Guidance Scale (Escala de Orientaçêo)",
        content: `
            <p>Controla o quanto o modelo deve seguir o prompt vs. criar livremente.</p>

            <h3>⚖️ Como Funciona</h3>
            <ul>
                <li><strong>Valores baixos (1-5):</strong> Mais criativo, menos fiel ao prompt</li>
                <li><strong>Valores médios (6-10):</strong> Balanceado (recomendado)</li>
                <li><strong>Valores altos (11-20):</strong> Muito fiel ao prompt, menos criativo</li>
            </ul>

            <h3>🎨 Efeitos Práticos</h3>
            <ul>
                <li><strong>Guidance 3:</strong> 
                    <ul>
                        <li>Resultado mais artístico e variado</li>
                        <li>Pode ignorar detalhes do prompt</li>
                        <li>Bom para exploraçêo criativa</li>
                    </ul>
                </li>
                <li><strong>Guidance 7.5 (padrêo):</strong>
                    <ul>
                        <li>Equilíbrio ideal</li>
                        <li>Segue bem o prompt</li>
                        <li>Mantém criatividade</li>
                    </ul>
                </li>
                <li><strong>Guidance 15:</strong>
                    <ul>
                        <li>Muito literal ao prompt</li>
                        <li>Pode parecer "forçado"</li>
                        <li>Menos variaçêo natural</li>
                    </ul>
                </li>
            </ul>

            <div class="warning">
                <strong>⚠️ Atençêo:</strong> Valores muito altos (>15) podem gerar artefatos 
                ou resultados de baixa qualidade.
            </div>

            <div class="tip">
                <strong>💡 Dica:</strong> Mantenha em <strong>7.5</strong> para começar.
                Aumente para 10-12 se o modelo ignorar detalhes importantes.
            </div>
        `
    }
};

const MODEL_INFO = {
    ltx2: {
        title: "🎬 LTX-2 - Vídeo + Áudio",
        content: `
            <p>Modelo completo de geraçêo de vídeo com áudio sincronizado.</p>

            <h3>✨ Características</h3>
            <ul>
                <li>Gera vídeo E áudio simultaneamente</li>
                <li>Quantizaçêo FP4 (NVFP4) otimizada</li>
                <li>14B parâmetros</li>
                <li>Memória: ~25-30GB quando carregado</li>
            </ul>

            <h3>🎯 Melhor Para</h3>
            <ul>
                <li>Vídeos que precisam de trilha sonora</li>
                <li>Cenas com eventos sonoros (passos, água, vento)</li>
                <li>Conteúdo musical ou rítmico</li>
                <li>Apresentações e demos</li>
            </ul>

            <h3>⚙️ Especificações Técnicas</h3>
            <ul>
                <li><strong>Arquitetura:</strong> Diffusion Transformer</li>
                <li><strong>Quantizaçêo:</strong> FP4 (NF4)</li>
                <li><strong>Contexto máximo:</strong> 5-15 segundos ideal</li>
                <li><strong>Tempo de inferência:</strong> ~60-180s (5s @ 1024x576)</li>
            </ul>

            <div class="tip">
                <strong>💡 Quando usar:</strong> Sempre que o áudio for importante para a cena.
            </div>

            <div class="warning">
                <strong>⚠️ Limitaçêo:</strong> Mais lento que modelos só-vídeo devido ao processamento de áudio.
            </div>
        `
    },

    wan21: {
        title: "🎨 Wan 2.1 - Modelo Versátil (14B)",
        content: `
            <p>Modelo de propósito geral com alta qualidade e versatilidade.</p>

            <h3>✨ Características</h3>
            <ul>
                <li>14 bilhões de parâmetros</li>
                <li>Quantizaçêo FP8 para máxima qualidade</li>
                <li>Melhor balanço qualidade/desempenho</li>
                <li>Memória: ~28-32GB quando carregado</li>
            </ul>

            <h3>🎯 Melhor Para</h3>
            <ul>
                <li>Vídeos de alta qualidade</li>
                <li>Cenas complexas com múltiplos elementos</li>
                <li>Casos de uso profissionais</li>
                <li>Quando qualidade > velocidade</li>
            </ul>

            <h3>⚙️ Especificações Técnicas</h3>
            <ul>
                <li><strong>Arquitetura:</strong> Diffusion Transformer (14B)</li>
                <li><strong>Quantizaçêo:</strong> FP8</li>
                <li><strong>Contexto máximo:</strong> Até 30 segundos</li>
                <li><strong>Tempo de inferência:</strong> ~90-240s (5s @ 1024x576)</li>
            </ul>

            <div class="tip">
                <strong>💡 Quando usar:</strong> Para produçêo final e quando qualidade visual 
                é prioridade sobre velocidade.
            </div>

            <div class="warning">
                <strong>⚠️ Limitaçêo:</strong> Requer mais memória e tempo que modelos menores.
            </div>
        `
    },

    magi1: {
        title: "⏱️ MAGI-1 - Vídeos Longos",
        content: `
            <p>Modelo autoregressive especializado em vídeos mais longos com contexto temporal.</p>

            <h3>✨ Características</h3>
            <ul>
                <li>Arquitetura autoregressive (gera frame por frame)</li>
                <li>Mantém contexto temporal entre frames</li>
                <li>Quantizaçêo FP4 para eficiência</li>
                <li>Memória: ~20-25GB quando carregado</li>
            </ul>

            <h3>🎯 Melhor Para</h3>
            <ul>
                <li>Vídeos de 10-60 segundos</li>
                <li>Narrativas com continuidade temporal</li>
                <li>Cenas com evoluçêo gradual</li>
                <li>Time-lapses e sequências</li>
            </ul>

            <h3>⚙️ Especificações Técnicas</h3>
            <ul>
                <li><strong>Arquitetura:</strong> Autoregressive Transformer</li>
                <li><strong>Quantizaçêo:</strong> FP4 (NF4)</li>
                <li><strong>Contexto máximo:</strong> Até 60 segundos</li>
                <li><strong>Tempo de inferência:</strong> ~120-600s (variável com duraçêo)</li>
            </ul>

            <h3>🔬 Como Funciona</h3>
            <ul>
                <li>Gera frames sequencialmente mantendo contexto</li>
                <li>Cada frame "conhece" os frames anteriores</li>
                <li>Melhor coerência temporal em vídeos longos</li>
            </ul>

            <div class="tip">
                <strong>💡 Quando usar:</strong> Quando precisar de vídeos >10 segundos com 
                boa continuidade temporal.
            </div>

            <div class="warning">
                <strong>⚠️ Limitaçêo:</strong> MUITO mais lento para vídeos longos (geraçêo incremental).
            </div>
        `
    },

    waver: {
        title: "⚡ Waver 1.0 - Rápido e Eficiente",
        content: `
            <p>Modelo lightweight otimizado para velocidade e batch processing.</p>

            <h3>✨ Características</h3>
            <ul>
                <li>Modelo compacto e rápido</li>
                <li>Quantizaçêo FP8 balanceada</li>
                <li>Ideal para prototipagem</li>
                <li>Memória: ~15-18GB quando carregado</li>
            </ul>

            <h3>🎯 Melhor Para</h3>
            <ul>
                <li>Testes rápidos de prompts</li>
                <li>Prototipagem e experimentaçêo</li>
                <li>Processar múltiplos vídeos em sequência</li>
                <li>Quando velocidade > qualidade máxima</li>
            </ul>

            <h3>⚙️ Especificações Técnicas</h3>
            <ul>
                <li><strong>Arquitetura:</strong> Lightweight Diffusion</li>
                <li><strong>Quantizaçêo:</strong> FP8</li>
                <li><strong>Contexto máximo:</strong> Até 15 segundos</li>
                <li><strong>Tempo de inferência:</strong> ~30-90s (5s @ 1024x576)</li>
            </ul>

            <h3>⚡ Vantagens</h3>
            <ul>
                <li>2-3x mais rápido que modelos grandes</li>
                <li>Usa menos memória (permite outros processos)</li>
                <li>Excelente para batch processing</li>
                <li>Bom custo-benefício</li>
            </ul>

            <div class="tip">
                <strong>💡 Quando usar:</strong> Para iterar rapidamente em prompts antes de 
                gerar versões finais em modelos maiores.
            </div>

            <div class="warning">
                <strong>⚠️ Limitaçêo:</strong> Qualidade inferior a Wan 2.1, menos detalhes em cenas complexas.
            </div>
        `
    }
};

function showHelp(topic) {
    const modal = document.getElementById('helpModal');
    const title = document.getElementById('helpTitle');
    const content = document.getElementById('helpContent');

    const helpData = HELP_CONTENT[topic];
    if (!helpData) return;

    title.textContent = helpData.title;
    content.innerHTML = helpData.content;
    modal.classList.add('show');
}

function showModelInfo(model) {
    const modal = document.getElementById('helpModal');
    const title = document.getElementById('helpTitle');
    const content = document.getElementById('helpContent');

    const modelData = MODEL_INFO[model];
    if (!modelData) return;

    title.textContent = modelData.title;
    content.innerHTML = modelData.content;
    modal.classList.add('show');
}

function closeHelp() {
    const modal = document.getElementById('helpModal');
    modal.classList.remove('show');
}

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    const modal = document.getElementById('helpModal');
    if (e.target === modal) {
        closeHelp();
    }
});

// Fechar modal com tecla ESC
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeHelp();
    }
});
