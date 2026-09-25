/* =========================================================
   BOLETIM DIGITAL — script.js
   ========================================================= */

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
   MONTAGEM DA TABELA
   --------------------------------------------------------- */
function montarTabela() {
  const corpo = document.getElementById("corpoTabela");

  disciplinas.forEach((d) => {
    // Normaliza as três notas
    const n1 = normalizarNota(d.tri1);
    const n2 = normalizarNota(d.tri2);
    const n3 = normalizarNota(d.tri3);

    // Calcula a média apenas com as notas disponíveis
    const media = calcularMedia([n1, n2, n3]);

    // Soma as faltas dos três trimestres
    const totalFaltas = somarFaltas(d.faltas);

    // Define a situação
    const situacao = definirSituacao(media);

    // Cria a linha da tabela
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${d.disciplina}</td>
      <td>${formatarNota(n1)}</td>
      <td>${formatarNota(n2)}</td>
      <td>${formatarNota(n3)}</td>
      <td>${formatarNota(media)}</td>
      <td>${totalFaltas}</td>
      <td><span class="${classeSituacao(situacao)}">${situacao}</span></td>
    `;

    corpo.appendChild(linha);
  });
}

/* ---------------------------------------------------------
   MONTAGEM DOS CARDS DE RESUMO
   --------------------------------------------------------- */
function montarCards() {
  let somaMedias = 0;
  let qtdMedias = 0;
  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;

  disciplinas.forEach((d) => {
    const n1 = normalizarNota(d.tri1);
    const n2 = normalizarNota(d.tri2);
    const n3 = normalizarNota(d.tri3);

    const media = calcularMedia([n1, n2, n3]);
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

  // Média geral (apenas das disciplinas com nota)
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
   INICIALIZAÇÃO
   Roda quando a página termina de carregar.
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  montarTabela();
  montarCards();
});