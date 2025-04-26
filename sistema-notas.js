// Configurações do sistema
class Config {
    static ARQUIVO_DADOS = 'notas_escolares';
    static MATERIAS = [
        "Alemão", "Biologia", "Física", "Geografia", "História",
        "Matemática", "Português", "Química", "Sociologia", "Inglês"
    ];
    static TIPOS_PROVA = {
        "Atividade Contínua": 2,
        "Prova Parcial": 2,
        "Prova Unificada": 4,
        "Prova Objetiva": 2,
        "Bônus": 0
    };
}

// Gerenciador de dados (localStorage)
class GerenciadorDados {
    static criarEstruturaInicial() {
        const estrutura = [];
        for (const materia of Config.MATERIAS) {
            for (const [prova, peso] of Object.entries(Config.TIPOS_PROVA)) {
                estrutura.push({
                    materia: materia,
                    prova: prova,
                    nota: 0.0,
                    peso: peso,
                    nota_ponderada: 0.0
                });
            }
        }
        return estrutura;
    }

    static carregarDados() {
        const dadosSalvos = localStorage.getItem(Config.ARQUIVO_DADOS);
        if (dadosSalvos) {
            try {
                const dados = JSON.parse(dadosSalvos);
                if (dados.length !== Config.MATERIAS.length * Object.keys(Config.TIPOS_PROVA).length) {
                    const novaEstrutura = GerenciadorDados.criarEstruturaInicial();
                    GerenciadorDados.salvarDados(novaEstrutura);
                    return novaEstrutura;
                }
                return dados;
            } catch (e) {
                console.error(`Erro ao carregar dados: ${e}`);
                return GerenciadorDados.criarEstruturaInicial();
            }
        } else {
            const estrutura = GerenciadorDados.criarEstruturaInicial();
            GerenciadorDados.salvarDados(estrutura);
            return estrutura;
        }
    }

    static salvarDados(dados) {
        try {
            localStorage.setItem(Config.ARQUIVO_DADOS, JSON.stringify(dados));
        } catch (e) {
            console.error(`Erro ao salvar dados: ${e}`);
        }
    }
}

// Sistema principal
class SistemaNotas {
    constructor() {
        this.registrosNotas = GerenciadorDados.carregarDados();
        this.initUI();
    }

    initUI() {
        // Verifica em qual página estamos para inicializar os eventos corretos
        const path = window.location.pathname.split('/').pop() || 'index.html';
        
        if (path === 'cadastro.html') {
            // Eventos para página de cadastro
            document.getElementById('btn-confirmar')?.addEventListener('click', () => this.cadastrarNota());
            document.getElementById('btn-confirmar-bonus')?.addEventListener('click', () => this.definirBonus());
        } 
        else if (path === 'consultas.html') {
            // Eventos para página de consultas
            document.getElementById('btn-mostrar-notas')?.addEventListener('click', () => this.consultarNotas());
            document.getElementById('btn-calcular-media')?.addEventListener('click', () => {
                const materia = document.getElementById('select-materia-media').value;
                this.calcularMediaMateria(materia);
            });
        } 
        else if (path === 'situacao.html') {
            // Eventos para página de situação
            document.getElementById('btn-gerar-situacao')?.addEventListener('click', () => this.consultarEstado());
        }
    }

    mostrarTitulo(texto, elementoId) {
        const resultado = document.getElementById(elementoId);
        if (resultado) {
            resultado.innerHTML = `
                <div class="text-center titulo">
                    <h4>${texto}</h4>
                    <hr>
                </div>
            `;
        }
    }

    cadastrarNota() {
        const materia = document.getElementById('select-materia').value;
        const prova = document.getElementById('select-prova').value;
        const nota = parseFloat(document.getElementById('input-nota').value);
        
        if (isNaN(nota) || nota < 0 || nota > 10) {
            this.mostrarResultado("Por favor, insira uma nota válida entre 0 e 10.", "erro", "resultado-cadastro");
            return;
        }
        
        if (prova === "Bônus") {
            this.mostrarResultado("Use o formulário de bônus para definir notas de bônus.", "erro", "resultado-cadastro");
            return;
        }
        
        const registro = this.encontrarRegistro(materia, prova);
        if (registro) {
            registro.nota = nota;
            registro.nota_ponderada = nota * registro.peso;
            GerenciadorDados.salvarDados(this.registrosNotas);
            
            let mensagem = `
                <p class="sucesso">Nota cadastrada com sucesso!</p>
                <p><span class="destaque">Matéria:</span> ${materia}</p>
                <p><span class="destaque">Tipo de Prova:</span> ${prova}</p>
                <p><span class="destaque">Nota:</span> ${nota.toFixed(1)}</p>
                <p><span class="destaque">Peso:</span> ${registro.peso}</p>
                <p><span class="destaque">Nota Ponderada:</span> ${registro.nota_ponderada.toFixed(2)}</p>
            `;
            
            if (nota < 6) {
                mensagem += `<p class="aviso">Aviso: Nota abaixo da média.</p>`;
            } else if (nota === 10) {
                mensagem += `<p class="sucesso">Excelente: Nota máxima!</p>`;
            } else if (nota === 0) {
                mensagem += `<p class="erro">Atenção: Nota mínima.</p>`;
            }
            
            this.mostrarResultado(mensagem, null, "resultado-cadastro");
        } else {
            this.mostrarResultado("Erro: Registro não encontrado.", "erro", "resultado-cadastro");
        }
    }

    definirBonus() {
        const nota = parseFloat(document.getElementById('input-bonus').value);
        
        if (isNaN(nota) || nota < 0 || nota > 10) {
            this.mostrarResultado("Por favor, insira uma nota válida entre 0 e 10.", "erro", "resultado-bonus");
            return;
        }
        
        this.atualizarBonus(nota);
    }

    atualizarBonus(valor) {
        for (const registro of this.registrosNotas) {
            if (registro.prova === "Bônus") {
                registro.nota = valor;
                registro.nota_ponderada = valor * registro.peso;
            }
        }
        GerenciadorDados.salvarDados(this.registrosNotas);
        this.mostrarResultado(`<p class="sucesso">Nota de bônus atualizada para ${valor} em todas as matérias!</p>`, null, "resultado-bonus");
    }

    consultarNotas() {
        this.mostrarTitulo("NOTAS CADASTRADAS", "resultado-notas");
        
        if (this.registrosNotas.length === 0) {
            this.mostrarResultado(`<p class="aviso">Nenhuma nota cadastrada ainda.</p>`, null, "resultado-notas");
            return;
        }
        
        let html = '';
        for (const materia of Config.MATERIAS) {
            html += `<div class="mb-4"><h4 class="destaque">${materia}</h4><ul class="list-group">`;
            
            const registrosMateria = this.registrosNotas.filter(r => r.materia === materia);
            for (const registro of registrosMateria) {
                let status = registro.nota > 0 ? 
                    `<span class="sucesso">✓</span> Nota=${registro.nota.toFixed(1)}` : 
                    `<span class="erro">✗</span> <span class="aviso">Nota não cadastrada (max ${registro.peso} pts)</span>`;
                
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            ${status} - ${registro.prova}
                        </div>
                        <span class="badge bg-primary rounded-pill">Peso: ${registro.peso}</span>
                    </li>
                `;
            }
            
            html += `</ul></div>`;
        }
        
        this.mostrarResultado(html, null, "resultado-notas");
    }

    calcularMediaMateria(materia) {
        const provasObrigatorias = Object.fromEntries(
            Object.entries(Config.TIPOS_PROVA).filter(([k, v]) => k !== "Bônus")
        );
        
        const notasMateria = this.registrosNotas.filter(
            r => r.materia === materia && r.prova !== "Bônus"
        );
        
        const totalPesos = Object.values(provasObrigatorias).reduce((a, b) => a + b, 0);
        const somaNotasPonderadas = notasMateria.reduce((sum, r) => sum + r.nota_ponderada, 0);
        
        const pontosPossiveis = notasMateria
            .filter(r => r.nota === 0)
            .reduce((sum, r) => sum + r.peso, 0);
        
        const mediaBase = totalPesos > 0 ? somaNotasPonderadas / totalPesos : 0;
        const bonus = this.registrosNotas.find(
            r => r.materia === materia && r.prova === "Bônus"
        )?.nota || 0;
        
        const mediaFinal = Math.min(10, mediaBase + bonus);
        
        let html = `
            <div class="destaque">
                <h4>Resumo para ${materia}:</h4>
            </div>
            <ul class="list-group mb-3">
                <li class="list-group-item">Média Base (sem bônus): ${mediaBase.toFixed(2)}</li>
                <li class="list-group-item">Bônus Adicional: +${bonus.toFixed(2)}</li>
                <li class="list-group-item">Média Final: ${mediaFinal.toFixed(2)}</li>
            </ul>
        `;
        
        if (mediaFinal >= 6) {
            html += `<p class="sucesso">Situação: APROVADO</p>`;
        } else {
            const pontosFaltantes = 6 - mediaFinal;
            const situacaoClass = pontosFaltantes < 1 ? "menu" : "erro";
            
            html += `
                <p class="${situacaoClass}">Situação: RETIDO (Faltam ${pontosFaltantes.toFixed(2)} pontos)</p>
            `;
            
            if (pontosPossiveis > 0) {
                html += `
                    <p class="aviso">[ ${pontosPossiveis} pontos possíveis em provas não cadastradas ]</p>
                `;
            }
        }
        
        this.mostrarResultado(html, null, "resultado-media");
    }

    consultarEstado() {
        this.mostrarTitulo("SITUAÇÃO ACADÊMICA", "resultado-situacao");
        
        let html = '';
        for (const materia of Config.MATERIAS) {
            const provasObrigatorias = Object.fromEntries(
                Object.entries(Config.TIPOS_PROVA).filter(([k, v]) => k !== "Bônus")
            );
            
            const notasMateria = this.registrosNotas.filter(
                r => r.materia === materia && r.prova !== "Bônus"
            );
            
            const totalPesos = Object.values(provasObrigatorias).reduce((a, b) => a + b, 0);
            const somaNotasPonderadas = notasMateria.reduce((sum, r) => sum + r.nota_ponderada, 0);
            
            const mediaBase = totalPesos > 0 ? somaNotasPonderadas / totalPesos : 0;
            const bonus = this.registrosNotas.find(
                r => r.materia === materia && r.prova === "Bônus"
            )?.nota || 0;
            
            const mediaFinal = Math.min(10, mediaBase + bonus);
            
            html += `
                <div class="card mb-3">
                    <div class="card-header destaque">
                        ${materia}
                    </div>
                    <div class="card-body">
                        <p>Média: ${mediaFinal.toFixed(2)}</p>
            `;
            
            if (mediaFinal >= 6) {
                html += `<p class="sucesso">APROVADO</p>`;
            } else {
                const pontosFaltantes = 6 - mediaFinal;
                const situacaoClass = pontosFaltantes < 1 ? "menu" : "erro";
                html += `<p class="${situacaoClass}">RETIDO (Faltam ${pontosFaltantes.toFixed(2)} pontos)</p>`;
            }
            
            html += `</div></div>`;
        }
        
        this.mostrarResultado(html, null, "resultado-situacao");
    }

    encontrarRegistro(materia, prova) {
        return this.registrosNotas.find(
            r => r.materia === materia && r.prova === prova
        );
    }

    mostrarResultado(mensagem, classe = null, elementoId = 'resultado') {
        const resultado = document.getElementById(elementoId);
        if (resultado) {
            const divResultado = document.createElement('div');
            divResultado.innerHTML = mensagem;
            if (classe) {
                divResultado.className = classe;
            }
            
            // Adiciona o novo resultado mantendo o título se existir
            const titulo = resultado.querySelector('div.text-center');
            resultado.innerHTML = '';
            if (titulo) resultado.appendChild(titulo);
            resultado.appendChild(divResultado);
        }
    }
}

// Inicializa o sistema quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new SistemaNotas();
});