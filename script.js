/* =========================================================
   BOLETIM DIGITAL — script.js
   ========================================================= */

/* ---------------------------------------------------------
   CONFIGURAÇÃO FIXA DO ALUNO
   Turma e chamada ficam fixas neste projeto.
   --------------------------------------------------------- */
const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 34,
  apiUrl: "https://boletim-api.profbt.com.br"
};

/* ---------------------------------------------------------
   DADOS FICTÍCIOS (array de objetos)
   Cada objeto é uma disciplina com notas e faltas.
   --------------------------------------------------------- */
const disciplinas = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

/* ---------------------------------------------------------
   ESTADO DA SESSÃO
   O PIN fica apenas em memória (variável), nunca em storage.
   --------------------------------------------------------- */
let pinSessao = null;
let dadosAtuais = null; // dados exibidos/salvos (formato da API)

/* ---------------------------------------------------------
   CONSTANTES DO PROJETO
   --------------------------------------------------------- */
const MEDIA_MINIMA = 6.0;

// Frequência FICTÍCIA apenas para demonstração.
// No futuro, esse valor será calculado de outra forma.
const FREQUENCIA_DEMONSTRATIVA = 92;

/* ---------------------------------------------------------
   normalizarNota(valor)
   Converte qualquer formato de nota para a escala 0–10.
   Retorna null quando a nota ainda não foi lançada.
   Usada para os DADOS ANTIGOS do projeto.
   --------------------------------------------------------- */
function normalizarNota(valor) {
  // Vazio, null ou undefined = ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Aceita ponto ou vírgula decimal (ex: "8,5" vira 8.5)
  const numero = typeof valor === "string"
    ? parseFloat(valor.replace(",", "."))
    : valor;

  // Se não for um número válido, considera inválido
  if (isNaN(numero)) {
    return null;
  }

  // Valores entre 0 e 10 permanecem iguais
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  // Valores entre 10 e 100 são divididos por 10
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Fora das regras = inválido
  return null;
}

/* ---------------------------------------------------------
   calcularMedia(notas)
   Recebe um array de notas já normalizadas (ou null).
   Ignora as ausentes e faz a média só das disponíveis.
   --------------------------------------------------------- */
function calcularMedia(notas) {
  const validas = notas.filter((n) => n !== null);
  if (validas.length === 0) return null;

  const soma = validas.reduce((total, n) => total + n, 0);
  return soma / validas.length;
}

/* ---------------------------------------------------------
   somarFaltas(faltas)
   Soma os valores de um array de faltas.
   --------------------------------------------------------- */
function somarFaltas(faltas) {
  return faltas.reduce((total, f) => total + f, 0);
}

/* ---------------------------------------------------------
   definirSituacao(media)
   Decide o texto da situação com base na média.
   --------------------------------------------------------- */
function definirSituacao(media) {
  if (media === null) return "Nota ainda não disponível";
  if (media >= MEDIA_MINIMA) return "Bom desempenho";
  return "Atenção";
}

/* ---------------------------------------------------------
   formatarNota(valor)
   Mostra a nota com uma casa decimal ou "—" se ausente.
   --------------------------------------------------------- */
function formatarNota(valor) {
  if (valor === null) return "—";
  return valor.toFixed(1).replace(".", ",");
}

/* ---------------------------------------------------------
   classeSituacao(texto)
   Retorna a classe CSS para colorir a etiqueta.
   --------------------------------------------------------- */
function classeSituacao(texto) {
  if (texto === "Bom desempenho") return "situacao bom";
  if (texto === "Atenção") return "situacao atencao";
  return "situacao indisponivel";
}

/* ---------------------------------------------------------
   CONVERSÃO ENTRE FORMATOS
   --------------------------------------------------------- */

// Converte um item de disciplina local (dados fictícios) para
// o formato usado internamente (notas já normalizadas).
function localParaInterno(d) {
  return {
    disciplina: d.disciplina,
    notas: [normalizarNota(d.tri1), normalizarNota(d.tri2), normalizarNota(d.tri3)],
    faltas: [Number(d.faltas[0]) || 0, Number(d.faltas[1]) || 0, Number(d.faltas[2]) || 0]
  };
}

// Converte dados da API (formato incerto) para o formato interno.
// Tenta ler notas como números 0–10 e faltas como inteiros.
function apiParaInterno(item) {
  const nome = item.disciplina || item.nome || "Disciplina";

  let notas = item.notas;
  if (!Array.isArray(notas)) {
    const n1 = item.tri1 !== undefined ? item.tri1 : item.nota1;
    const n2 = item.tri2 !== undefined ? item.tri2 : item.nota2;
    const n3 = item.tri3 !== undefined ? item.tri3 : item.nota3;
    notas = [normalizarNota(n1), normalizarNota(n2), normalizarNota(n3)];
  } else {
    notas = notas.map((n) => normalizarNota(n));
  }

  let faltas = item.faltas;
  if (!Array.isArray(faltas)) {
    faltas = [
      Number(item.faltas1) || 0,
      Number(item.faltas2) || 0,
      Number(item.faltas3) || 0
    ];
  } else {
    faltas = faltas.map((f) => Number(f) || 0);
  }

  return { disciplina: nome, notas: notas, faltas: faltas };
}

// Converte o formato interno de volta para o formato enviado na API.
function internoParaApi(item) {
  return {
    disciplina: item.disciplina,
    notas: item.notas.slice(),
    faltas: item.faltas.slice()
  };
}

/* ---------------------------------------------------------
   MONTAGEM DA TABELA
   Limpa antes de montar para permitir atualização.
   --------------------------------------------------------- */
function montarTabela(lista) {
  const corpo = document.getElementById("corpoTabela");
  corpo.innerHTML = "";

  lista.forEach((d) => {
    const n1 = d.notas[0];
    const n2 = d.notas[1];
    const n3 = d.notas[2];

    const media = calcularMedia([n1, n2, n3]);
    const totalFaltas = somarFaltas(d.faltas);
    const situacao = definirSituacao(media);

    const linha = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = d.disciplina;

    const tdN1 = document.createElement("td");
    tdN1.textContent = formatarNota(n1);

    const tdN2 = document.createElement("td");
    tdN2.textContent = formatarNota(n2);

    const tdN3 = document.createElement("td");
    tdN3.textContent = formatarNota(n3);

    const tdMedia = document.createElement("td");
    tdMedia.textContent = formatarNota(media);

    const tdFaltas = document.createElement("td");
    tdFaltas.textContent = totalFaltas;

    const tdSit = document.createElement("td");
    const spanSit = document.createElement("span");
    spanSit.className = classeSituacao(situacao);
    spanSit.textContent = situacao;
    tdSit.appendChild(spanSit);

    linha.appendChild(tdNome);
    linha.appendChild(tdN1);
    linha.appendChild(tdN2);
    linha.appendChild(tdN3);
    linha.appendChild(tdMedia);
    linha.appendChild(tdFaltas);
    linha.appendChild(tdSit);

    corpo.appendChild(linha);
  });
}

/* ---------------------------------------------------------
   MONTAGEM DOS CARDS DE RESUMO
   --------------------------------------------------------- */
function montarCards(lista) {
  let somaMedias = 0;
  let qtdMedias = 0;
  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;

  lista.forEach((d) => {
    const media = calcularMedia(d.notas);
    totalFaltas += somarFaltas(d.faltas);

    if (media !== null) {
      somaMedias += media;
      qtdMedias++;

      if (media >= MEDIA_MINIMA) {
        bomDesempenho++;
      } else {
        atencao++;
      }
    }
  });

  const mediaGeral = qtdMedias > 0 ? somaMedias / qtdMedias : null;

  document.getElementById("mediaGeral").textContent =
    mediaGeral !== null ? formatarNota(mediaGeral) : "—";

  document.getElementById("totalFaltas").textContent = totalFaltas;
  document.getElementById("bomDesempenho").textContent = bomDesempenho;
  document.getElementById("atencao").textContent = atencao;
  document.getElementById("frequencia").textContent =
    FREQUENCIA_DEMONSTRATIVA + "%";
}

/* ---------------------------------------------------------
   RENDERIZAÇÃO COMPLETA
   --------------------------------------------------------- */
function renderizarTudo() {
  if (!dadosAtuais) return;
  montarTabela(dadosAtuais);
  montarCards(dadosAtuais);
}

/* ---------------------------------------------------------
   TELA DE ACESSO — ENTRAR
   --------------------------------------------------------- */
async function entrar() {
  const campoPin = document.getElementById("campoPin");
  const botao = document.getElementById("botaoEntrar");
  const mensagem = document.getElementById("mensagemAcesso");

  const pinDigitado = campoPin.value.trim();
  if (pinDigitado === "") {
    mensagem.textContent = "Digite o PIN.";
    mensagem.className = "acesso-mensagem erro";
    return;
  }

  botao.disabled = true;
  mensagem.textContent = "Conectando...";
  mensagem.className = "acesso-mensagem";

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/abrir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      mensagem.textContent = "Turma, chamada ou PIN inválidos.";
      mensagem.className = "acesso-mensagem erro";
      botao.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      mensagem.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      mensagem.className = "acesso-mensagem erro";
      botao.disabled = false;
      return;
    }

    if (!resposta.ok) {
      mensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      mensagem.className = "acesso-mensagem erro";
      botao.disabled = false;
      return;
    }

    const dados = await resposta.json();

    // Guarda o PIN apenas em memória
    pinSessao = pinDigitado;

    // Limpa o campo do PIN
    campoPin.value = "";

    // Decide a fonte dos dados
    if (dados && dados.dados && Array.isArray(dados.dados.disciplinas) && dados.dados.disciplinas.length > 0) {
      dadosAtuais = dados.dados.disciplinas.map(apiParaInterno);
    } else {
      // Sem dados salvos: usa as disciplinas fictícias do projeto
      dadosAtuais = disciplinas.map(localParaInterno);
    }

    // Mostra o boletim e esconde a tela de acesso
    document.getElementById("telaAcesso").classList.add("oculto");
    document.getElementById("conteudoBoletim").classList.remove("oculto");

    renderizarTudo();

  } catch (erro) {
    mensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    mensagem.className = "acesso-mensagem erro";
    botao.disabled = false;
  }
}

/* ---------------------------------------------------------
   EDITOR DE NOTAS E FALTAS
   --------------------------------------------------------- */

// Cria o painel de edição a partir dos dados atuais.
function montarEditor() {
  const lista = document.getElementById("listaEditor");
  lista.innerHTML = "";

  dadosAtuais.forEach((d, index) => {
    const bloco = document.createElement("div");
    bloco.className = "editor-disciplina";

    const titulo = document.createElement("h3");
    titulo.textContent = d.disciplina;
    bloco.appendChild(titulo);

    const campos = document.createElement("div");
    campos.className = "editor-campos";

    // Notas
    for (let i = 0; i < 3; i++) {
      campos.appendChild(criarCampo("Nota " + (i + 1) + "º Tri", "nota", index, i, d.notas[i]));
    }

    // Faltas
    for (let i = 0; i < 3; i++) {
      campos.appendChild(criarCampo("Faltas " + (i + 1) + "º Tri", "falta", index, i, d.faltas[i]));
    }

    bloco.appendChild(campos);
    lista.appendChild(bloco);
  });
}

// Cria um campo do editor (input + label).
function criarCampo(labelTexto, tipo, indexDisciplina, indexTrimestre, valor) {
  const wrap = document.createElement("div");
  wrap.className = "editor-campo";

  const label = document.createElement("label");
  label.textContent = labelTexto;
  wrap.appendChild(label);

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = tipo === "nota" ? "decimal" : "numeric";
  input.dataset.tipo = tipo;
  input.dataset.disciplina = String(indexDisciplina);
  input.dataset.trimestre = String(indexTrimestre);

  if (valor === null) {
    input.value = "";
  } else if (tipo === "nota") {
    input.value = String(valor).replace(".", ",");
  } else {
    input.value = String(valor);
  }

  input.addEventListener("input", () => {
    input.classList.remove("invalido");
  });

  wrap.appendChild(input);
  return wrap;
}

// Valida a nota digitada no editor (regra diferente dos dados antigos).
function validarNotaEditor(texto) {
  const t = texto.trim();
  if (t === "") return { ok: true, valor: null };

  // Só aceita dígitos, ponto ou vírgula
  if (!/^\d+([.,]\d+)?$/.test(t)) {
    return { ok: false };
  }

  const numero = parseFloat(t.replace(",", "."));
  if (isNaN(numero) || numero < 0 || numero > 10) {
    return { ok: false };
  }

  return { ok: true, valor: numero };
}

// Valida as faltas digitadas no editor.
function validarFaltaEditor(texto) {
  const t = texto.trim();
  if (t === "") return { ok: false };

  if (!/^\d+$/.test(t)) {
    return { ok: false };
  }

  const numero = parseInt(t, 10);
  if (isNaN(numero) || numero < 0) {
    return { ok: false };
  }

  return { ok: true, valor: numero };
}

/* ---------------------------------------------------------
   SALVAR ALTERAÇÕES
   --------------------------------------------------------- */
async function salvarAlteracoes() {
  const mensagem = document.getElementById("mensagemEditor");
  const botaoSalvar = document.getElementById("botaoSalvar");

  const inputs = document.querySelectorAll("#listaEditor input");
  let invalido = false;

  // Monta uma cópia dos dados com os valores editados
  const novosDados = dadosAtuais.map((d) => ({
    disciplina: d.disciplina,
    notas: d.notas.slice(),
    faltas: d.faltas.slice()
  }));

  inputs.forEach((input) => {
    const idxD = parseInt(input.dataset.disciplina, 10);
    const idxT = parseInt(input.dataset.trimestre, 10);

    if (input.dataset.tipo === "nota") {
      const r = validarNotaEditor(input.value);
      if (!r.ok) {
        input.classList.add("invalido");
        invalido = true;
      } else {
        input.classList.remove("invalido");
        novosDados[idxD].notas[idxT] = r.valor;
      }
    } else {
      const r = validarFaltaEditor(input.value);
      if (!r.ok) {
        input.classList.add("invalido");
        invalido = true;
      } else {
        input.classList.remove("invalido");
        novosDados[idxD].faltas[idxT] = r.valor;
      }
    }
  });

  if (invalido) {
    mensagem.textContent = "Corrija os campos destacados antes de salvar.";
    mensagem.className = "editor-mensagem erro";
    return;
  }

  botaoSalvar.disabled = true;
  mensagem.textContent = "Salvando...";
  mensagem.className = "editor-mensagem";

  try {
    const resposta = await fetch(CONFIG_ALUNO.apiUrl + "/api/v1/boletins/salvar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novosDados.map(internoParaApi)
        }
      })
    });

    if (resposta.status === 401) {
      mensagem.textContent = "Sessão inválida. Entre novamente.";
      mensagem.className = "editor-mensagem erro";
      botaoSalvar.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      mensagem.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      mensagem.className = "editor-mensagem erro";
      botaoSalvar.disabled = false;
      return;
    }

    if (!resposta.ok) {
      mensagem.textContent = "Não foi possível salvar. Tente novamente.";
      mensagem.className = "editor-mensagem erro";
      botaoSalvar.disabled = false;
      return;
    }

    // Sucesso
    dadosAtuais = novosDados;
    renderizarTudo();

    mensagem.textContent = "Dados salvos com sucesso.";
    mensagem.className = "editor-mensagem sucesso";
    botaoSalvar.disabled = false;

    // Fecha o editor após sucesso
    document.getElementById("painelEditor").classList.add("oculto");

  } catch (erro) {
    mensagem.textContent = "Não foi possível salvar. Tente novamente.";
    mensagem.className = "editor-mensagem erro";
    botaoSalvar.disabled = false;
  }
}

/* ---------------------------------------------------------
   INICIALIZAÇÃO
   Roda quando a página termina de carregar.
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const botaoEntrar = document.getElementById("botaoEntrar");
  const botaoAlterar = document.getElementById("botaoAlterar");
  const botaoSalvar = document.getElementById("botaoSalvar");
  const botaoCancelar = document.getElementById("botaoCancelar");
  const campoPin = document.getElementById("campoPin");

  botaoEntrar.addEventListener("click", entrar);

  campoPin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") entrar();
  });

  botaoAlterar.addEventListener("click", () => {
    montarEditor();
    const painel = document.getElementById("painelEditor");
    painel.classList.remove("oculto");
    painel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  botaoCancelar.addEventListener("click", () => {
    document.getElementById("painelEditor").classList.add("oculto");
    document.getElementById("mensagemEditor").textContent = "";
  });

  botaoSalvar.addEventListener("click", salvarAlteracoes);
});