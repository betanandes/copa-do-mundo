const GIT_USER = "betanandes";

const API_GET_TIMES = "https://development-internship-api.geopostenergy.com/WorldCup/GetAllTeams";
const API_POST_FINAL = "https://development-internship-api.geopostenergy.com/WorldCup/FinalResult";

// --- Reinicia a página para nova simulação ---
function reiniciar() {
  location.reload();
}

// --- Função principal ---
async function iniciarCopa() {
  mostrarElemento("loading");
  esconderElemento("inicio");
  esconderElemento("erro");

  try {
    const times = await buscarTimes();
    esconderElemento("loading");
    mostrarElemento("btn-voltar-container");

    const grupos = sortearGrupos(times);
    exibirGrupos(grupos);

    const resultadosGrupos = simularFaseDeGrupos(grupos);
    exibirJogosGrupos(resultadosGrupos);

    const classificados = classificarGrupos(resultadosGrupos);
    exibirClassificacao(resultadosGrupos);

    await simularMataMata(classificados);

  } catch (error) {
    esconderElemento("loading");
    mostrarElemento("erro");
    console.error("Erro na simulação:", error);
  }
}

// --- Busca os 32 times da API ---
async function buscarTimes() {
  const resposta = await fetch(API_GET_TIMES, {
    method: "GET",
    headers: {
      "git-user": GIT_USER,
      "Content-Type": "application/json"
    }
  });

  if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

  const dados = await resposta.json();
  console.log("Times recebidos da API:", dados);
  return dados;
}

// --- Sorteia os 8 grupos de 4 times ---
function sortearGrupos(times) {
  const timesEmbaralhados = embaralhar([...times]);
  const nomesGrupos = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const grupos = {};

  nomesGrupos.forEach((letra, indice) => {
    grupos[letra] = timesEmbaralhados.slice(indice * 4, indice * 4 + 4);
  });

  return grupos;
}

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Exibe os grupos na tela ---
function exibirGrupos(grupos) {
  const container = document.getElementById("container-grupos");
  container.innerHTML = "";

  Object.entries(grupos).forEach(([letra, times]) => {
    const card = document.createElement("div");
    card.className = "card-grupo";
    card.innerHTML = `
      <h3>Grupo ${letra}</h3>
      <ul>
        ${times.map(t => `<li><i class="fa-solid fa-flag"></i> ${pegarNome(t)}</li>`).join("")}
      </ul>
    `;
    container.appendChild(card);
  });

  mostrarElemento("secao-grupos");
}

// --- Simula a fase de grupos (3 rodadas por grupo) ---
function simularFaseDeGrupos(grupos) {
  const resultados = {};

  Object.entries(grupos).forEach(([letra, times]) => {
    const rodadas = gerarRodadasGrupo(times);
    const tabela = {};

    times.forEach(t => {
      tabela[pegarId(t)] = {
        time: t, pontos: 0, jogos: 0,
        vitorias: 0, empates: 0, derrotas: 0,
        golsMarcados: 0, golsSofridos: 0, saldoGols: 0
      };
    });

    const rodadasComResultados = rodadas.map(rodada => {
      return rodada.map(jogo => {
        const { golsA, golsB } = simularJogo();

        tabela[pegarId(jogo.timeA)].jogos++;
        tabela[pegarId(jogo.timeA)].golsMarcados += golsA;
        tabela[pegarId(jogo.timeA)].golsSofridos += golsB;
        tabela[pegarId(jogo.timeA)].saldoGols += golsA - golsB;

        tabela[pegarId(jogo.timeB)].jogos++;
        tabela[pegarId(jogo.timeB)].golsMarcados += golsB;
        tabela[pegarId(jogo.timeB)].golsSofridos += golsA;
        tabela[pegarId(jogo.timeB)].saldoGols += golsB - golsA;

        if (golsA > golsB) {
          tabela[pegarId(jogo.timeA)].pontos += 3;
          tabela[pegarId(jogo.timeA)].vitorias++;
          tabela[pegarId(jogo.timeB)].derrotas++;
        } else if (golsB > golsA) {
          tabela[pegarId(jogo.timeB)].pontos += 3;
          tabela[pegarId(jogo.timeB)].vitorias++;
          tabela[pegarId(jogo.timeA)].derrotas++;
        } else {
          tabela[pegarId(jogo.timeA)].pontos += 1;
          tabela[pegarId(jogo.timeB)].pontos += 1;
          tabela[pegarId(jogo.timeA)].empates++;
          tabela[pegarId(jogo.timeB)].empates++;
        }

        return { ...jogo, golsA, golsB };
      });
    });

    resultados[letra] = { times, rodadas: rodadasComResultados, tabela };
  });

  return resultados;
}

function gerarRodadasGrupo(times) {
  const [t1, t2, t3, t4] = times;
  return [
    [{ timeA: t1, timeB: t2 }, { timeA: t3, timeB: t4 }],
    [{ timeA: t1, timeB: t3 }, { timeA: t2, timeB: t4 }],
    [{ timeA: t1, timeB: t4 }, { timeA: t2, timeB: t3 }]
  ];
}

function simularJogo() {
  return {
    golsA: Math.floor(Math.random() * 6),
    golsB: Math.floor(Math.random() * 6)
  };
}

// --- Exibe os jogos e resultados da fase de grupos ---
function exibirJogosGrupos(resultados) {
  const container = document.getElementById("container-jogos-grupos");
  container.innerHTML = "";

  Object.entries(resultados).forEach(([letra, dados]) => {
    const card = document.createElement("div");
    card.className = "card-rodadas";

    let html = "";
    dados.rodadas.forEach((rodada, i) => {
      html += `<h4>Grupo ${letra} — Rodada ${i + 1}</h4>`;
      rodada.forEach(jogo => {
        html += `
          <div class="jogo">
            <span class="time">${pegarNome(jogo.timeA)}</span>
            <span class="placar">${jogo.golsA} x ${jogo.golsB}</span>
            <span class="time direita">${pegarNome(jogo.timeB)}</span>
          </div>
        `;
      });
    });

    card.innerHTML = html;
    container.appendChild(card);
  });

  mostrarElemento("secao-jogos-grupos");
}

// --- Classifica os times de cada grupo ---
// Critérios: 1) Pontos → 2) Saldo de Gols → 3) Sorteio
function classificarGrupos(resultados) {
  const classificados = { "A": [], "B": [], "C": [], "D": [], "E": [], "F": [], "G": [], "H": [] };

  Object.entries(resultados).forEach(([letra, dados]) => {
    const timesOrdenados = Object.values(dados.tabela).sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
      return Math.random() - 0.5;
    });

    classificados[letra] = timesOrdenados;
  });

  return classificados;
}

// --- Exibe a classificação de cada grupo ---
function exibirClassificacao(resultados) {
  const container = document.getElementById("container-classificacao");
  container.innerHTML = "";

  const classificados = classificarGrupos(resultados);

  Object.entries(classificados).forEach(([letra, times]) => {
    const card = document.createElement("div");
    card.className = "card-classificacao";

    let linhas = "";
    times.forEach((entry, posicao) => {
      const classe = posicao < 2 ? "classificado" : "";
      const icone = posicao < 2
        ? `<i class="fa-solid fa-circle-check"></i>`
        : `<i class="fa-solid fa-circle-xmark"></i>`;

      linhas += `
        <tr class="${classe}">
          <td>${icone} ${pegarNome(entry.time)}</td>
          <td>${entry.jogos}</td>
          <td>${entry.vitorias}</td>
          <td>${entry.empates}</td>
          <td>${entry.derrotas}</td>
          <td>${entry.golsMarcados}:${entry.golsSofridos}</td>
          <td><strong>${entry.pontos}</strong></td>
        </tr>
      `;
    });

    card.innerHTML = `
      <h4>Grupo ${letra}</h4>
      <table>
        <thead>
          <tr>
            <th>Seleção</th>
            <th>J</th><th>V</th><th>E</th><th>D</th>
            <th>GF:GC</th><th>PTS</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;

    container.appendChild(card);
  });

  mostrarElemento("secao-classificacao");
}

// --- Simula o mata-mata completo ---
async function simularMataMata(classificados) {
  const containerMata = document.getElementById("container-mata-mata");
  containerMata.innerHTML = "";
  mostrarElemento("secao-mata-mata");

  const oitavas = [
    { timeA: classificados["A"][0].time, timeB: classificados["B"][1].time },
    { timeA: classificados["C"][0].time, timeB: classificados["D"][1].time },
    { timeA: classificados["E"][0].time, timeB: classificados["F"][1].time },
    { timeA: classificados["G"][0].time, timeB: classificados["H"][1].time },
    { timeA: classificados["B"][0].time, timeB: classificados["A"][1].time },
    { timeA: classificados["D"][0].time, timeB: classificados["C"][1].time },
    { timeA: classificados["F"][0].time, timeB: classificados["E"][1].time },
    { timeA: classificados["H"][0].time, timeB: classificados["G"][1].time },
  ];

  const vencedoresOitavas = simularFaseEliminatoria(oitavas, "Oitavas de Final", containerMata);
  const vencedoresQuartas = simularFaseEliminatoria(formarPares(vencedoresOitavas), "Quartas de Final", containerMata);
  const vencedoresSemi    = simularFaseEliminatoria(formarPares(vencedoresQuartas), "Semifinal", containerMata);
  const finalJogos        = simularFaseEliminatoria(formarPares(vencedoresSemi), "Final", containerMata);

  const campeao = finalJogos[0];
  await enviarResultadoFinal(campeao._dadosFinal);
  exibirCampeao(campeao);

  return campeao;
}

function simularFaseEliminatoria(confrontos, nomeFase, container) {
  const divFase = document.createElement("div");
  divFase.className = "fase";
  divFase.innerHTML = `<h3><i class="fa-solid fa-shield-halved"></i> ${nomeFase}</h3>`;

  const divJogos = document.createElement("div");
  divJogos.className = "container-jogos-fase";

  const vencedores = [];

  confrontos.forEach(jogo => {
    const resultado = simularJogoEliminatorio(jogo.timeA, jogo.timeB);
    const { golsA, golsB, penaltisA, penaltisB, foiPenaltis } = resultado;
    const vencedor = resultado.vencedor;

    vencedor._dadosFinal = {
      equipeA: pegarId(jogo.timeA),
      equipeB: pegarId(jogo.timeB),
      golsEquipeA: golsA,
      golsEquipeB: golsB,
      golsPenaltyTimeA: foiPenaltis ? penaltisA : 0,
      golsPenaltyTimeB: foiPenaltis ? penaltisB : 0
    };

    vencedores.push(vencedor);

    const nomeA = pegarNome(jogo.timeA);
    const nomeB = pegarNome(jogo.timeB);
    const nomeVencedor = pegarNome(vencedor);

    const infoPenaltis = foiPenaltis
      ? `<div class="info-penaltis"><i class="fa-solid fa-futbol"></i> Pênaltis: ${nomeA} ${penaltisA}x${penaltisB} ${nomeB}</div>`
      : "";

    const card = document.createElement("div");
    card.className = "card-jogo-mata";
    card.innerHTML = `
      <div class="confronto">
        <div class="linha-time ${nomeVencedor === nomeA ? "vencedor" : ""}">
          <span>${nomeA}</span>
          <span class="gols">${golsA}</span>
        </div>
        <div class="linha-time ${nomeVencedor === nomeB ? "vencedor" : ""}">
          <span>${nomeB}</span>
          <span class="gols">${golsB}</span>
        </div>
      </div>
      ${infoPenaltis}
    `;

    divJogos.appendChild(card);
  });

  divFase.appendChild(divJogos);
  container.appendChild(divFase);

  return vencedores;
}

function simularJogoEliminatorio(timeA, timeB) {
  const golsA = Math.floor(Math.random() * 5);
  const golsB = Math.floor(Math.random() * 5);

  if (golsA !== golsB) {
    return { golsA, golsB, penaltisA: 0, penaltisB: 0, foiPenaltis: false, vencedor: golsA > golsB ? timeA : timeB };
  }

  const penaltisA = Math.floor(Math.random() * 6) + 3;
  let penaltisB = Math.floor(Math.random() * 6) + 3;
  while (penaltisB === penaltisA) { penaltisB = Math.floor(Math.random() * 6) + 3; }

  return { golsA, golsB, penaltisA, penaltisB, foiPenaltis: true, vencedor: penaltisA > penaltisB ? timeA : timeB };
}

function formarPares(times) {
  const pares = [];
  for (let i = 0; i < times.length; i += 2) {
    pares.push({ timeA: times[i], timeB: times[i + 1] });
  }
  return pares;
}

// --- Envia o resultado da final para a API ---
async function enviarResultadoFinal(dados) {
  try {
    const corpo = {
      equipeA: dados.equipeA,
      equipeB: dados.equipeB,
      golsEquipeA: dados.golsEquipeA,
      golsEquipeB: dados.golsEquipeB,
      golsPenaltyTimeA: dados.golsPenaltyTimeA,
      golsPenaltyTimeB: dados.golsPenaltyTimeB
    };

    console.log("Enviando resultado final para API:", corpo);

    const resposta = await fetch(API_POST_FINAL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "git-user": GIT_USER },
      body: JSON.stringify(corpo)
    });

    if (resposta.ok) {
      console.log("Resultado enviado com sucesso!");
    } else {
      console.warn("API retornou status:", resposta.status);
    }
  } catch (error) {
    console.error("Erro ao enviar resultado final:", error);
  }
}

// --- Exibe o campeão ---
function exibirCampeao(time) {
  const container = document.getElementById("container-campeao");
  container.innerHTML = `
    <div class="trofeu"><i class="fa-solid fa-trophy"></i></div>
    <h2>Campeão Mundial</h2>
    <div class="nome-campeao">${pegarNome(time)}</div>
    <div class="status-api"><i class="fa-solid fa-circle-check"></i> Resultado registrado na API</div>
  `;
  mostrarElemento("secao-campeao");
}

// --- Utilitários ---
function mostrarElemento(id) {
  document.getElementById(id).classList.remove("hidden");
}

function esconderElemento(id) {
  document.getElementById(id).classList.add("hidden");
}

function pegarNome(time) {
  if (!time) return "Time desconhecido";
  return time.nome;
}

function pegarId(time) {
  if (!time) return "id-desconhecido";
  return time.token;
}