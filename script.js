// ============================================================
// CONFIGURAÇÕES GERAIS
// Altere SEU_USUARIO_GIT para o seu nome de usuário real
// no GitHub/GitLab/Bitbucket ANTES de enviar o teste
// ============================================================
const GIT_USER = "betanandes";

const API_GET_TIMES = "https://development-internship-api.geopostenergy.com/WorldCup/GetAllTeams";
const API_POST_FINAL = "https://development-internship-api.geopostenergy.com/WorldCup/FinalResult";


// ============================================================
// FUNÇÃO PRINCIPAL — chamada ao clicar em "Iniciar Simulação"
// ============================================================
async function iniciarCopa() {
  // 1. Esconde o botão e mostra o loading
  mostrarElemento("loading");
  esconderElemento("inicio");
  esconderElemento("erro");

  try {
    // 2. Busca os times da API
    const times = await buscarTimes();

    // 3. Esconde o loading
    esconderElemento("loading");

    // 4. Sorteia os grupos e exibe na tela
    const grupos = sortearGrupos(times);
    exibirGrupos(grupos);

    // 5. Simula a fase de grupos (jogos + pontuação)
    const resultadosGrupos = simularFaseDeGrupos(grupos);
    exibirJogosGrupos(resultadosGrupos);

    // 6. Classifica as equipes de cada grupo
    const classificados = classificarGrupos(resultadosGrupos);
    exibirClassificacao(resultadosGrupos);

    // 7. Simula o mata-mata até a final
    const campeao = await simularMataMata(classificados);

  } catch (error) {
    // Se der qualquer erro, esconde loading e mostra mensagem de erro
    esconderElemento("loading");
    mostrarElemento("erro");
    console.error("Erro na simulação:", error);
  }
}


// ============================================================
// PASSO 1: BUSCAR TIMES DA API
// ============================================================
async function buscarTimes() {
  // fetch() é a forma nativa de fazer requisições HTTP no JavaScript
  const resposta = await fetch(API_GET_TIMES, {
    method: "GET",
    headers: {
      "git-user": GIT_USER,        // header obrigatório pedido no teste
      "Content-Type": "application/json"
    }
  });

  // Se a resposta não for OK (ex: 404, 500), lança um erro
  if (!resposta.ok) {
    throw new Error(`Erro HTTP: ${resposta.status}`);
  }

  // Converte a resposta para JSON
  const dados = await resposta.json();

  console.log("Times recebidos da API:", dados); // útil para debugar
  return dados;
}


// ============================================================
// PASSO 2: SORTEAR 8 GRUPOS DE 4 TIMES
// ============================================================
function sortearGrupos(times) {
  // Cria uma cópia do array para não modificar o original
  const timesEmbaralhados = embaralhar([...times]);

  // Nomes dos grupos de A a H
  const nomesGrupos = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // Objeto que vai guardar os grupos: { "A": [time1, time2, time3, time4], ... }
  const grupos = {};

  nomesGrupos.forEach((letra, indice) => {
    // slice pega uma fatia do array: grupo A = índices 0-3, grupo B = 4-7, etc.
    grupos[letra] = timesEmbaralhados.slice(indice * 4, indice * 4 + 4);
  });

  return grupos;
}

// Embaralha um array usando o algoritmo Fisher-Yates
// É mais justo do que usar .sort(() => Math.random() - 0.5)
function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // troca as posições
  }
  return array;
}


// ============================================================
// EXIBIR GRUPOS NA TELA
// ============================================================
function exibirGrupos(grupos) {
  const container = document.getElementById("container-grupos");
  container.innerHTML = ""; // limpa conteúdo anterior

  Object.entries(grupos).forEach(([letra, times]) => {
    const card = document.createElement("div");
    card.className = "card-grupo";

    // Template literal (crase) permite escrever HTML com variáveis
    card.innerHTML = `
      <h3>Grupo ${letra}</h3>
      <ul>
        ${times.map(t => `<li>🏴 ${pegarNome(t)}</li>`).join("")}
      </ul>
    `;

    container.appendChild(card);
  });

  mostrarElemento("secao-grupos");
}


// ============================================================
// PASSO 3: SIMULAR FASE DE GRUPOS
// Cada grupo tem 3 rodadas, 2 jogos por rodada
// Total: 6 jogos por grupo
// ============================================================
function simularFaseDeGrupos(grupos) {
  // Objeto que vai guardar TUDO sobre os grupos:
  // partidas, gols marcados/sofridos, pontos, etc.
  const resultados = {};

  Object.entries(grupos).forEach(([letra, times]) => {
    // Gera os confrontos: todas as combinações de pares (rodada-robin)
    const rodadas = gerarRodadasGrupo(times);

    // Registra estatísticas iniciais de cada time
    const tabela = {};
    times.forEach(t => {
      tabela[pegarId(t)] = {
        time: t,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsMarcados: 0,
        golsSofridos: 0,
        saldoGols: 0
      };
    });

    // Simula cada jogo e atualiza a tabela
    const rodadasComResultados = rodadas.map(rodada => {
      return rodada.map(jogo => {
        const resultado = simularJogo();
        const { golsA, golsB } = resultado;

        // Atualiza estatísticas do time A
        tabela[pegarId(jogo.timeA)].jogos++;
        tabela[pegarId(jogo.timeA)].golsMarcados += golsA;
        tabela[pegarId(jogo.timeA)].golsSofridos += golsB;
        tabela[pegarId(jogo.timeA)].saldoGols += golsA - golsB;

        // Atualiza estatísticas do time B
        tabela[pegarId(jogo.timeB)].jogos++;
        tabela[pegarId(jogo.timeB)].golsMarcados += golsB;
        tabela[pegarId(jogo.timeB)].golsSofridos += golsA;
        tabela[pegarId(jogo.timeB)].saldoGols += golsB - golsA;

        // Distribui os pontos
        if (golsA > golsB) {
          tabela[pegarId(jogo.timeA)].pontos += 3;
          tabela[pegarId(jogo.timeA)].vitorias++;
          tabela[pegarId(jogo.timeB)].derrotas++;
        } else if (golsB > golsA) {
          tabela[pegarId(jogo.timeB)].pontos += 3;
          tabela[pegarId(jogo.timeB)].vitorias++;
          tabela[pegarId(jogo.timeA)].derrotas++;
        } else {
          // Empate
          tabela[pegarId(jogo.timeA)].pontos += 1;
          tabela[pegarId(jogo.timeB)].pontos += 1;
          tabela[pegarId(jogo.timeA)].empates++;
          tabela[pegarId(jogo.timeB)].empates++;
        }

        return { ...jogo, golsA, golsB };
      });
    });

    resultados[letra] = {
      times,
      rodadas: rodadasComResultados,
      tabela
    };
  });

  return resultados;
}

// Gera as 3 rodadas de um grupo de 4 times
// Utiliza o algoritmo de Round Robin para que todos se enfrentem
function gerarRodadasGrupo(times) {
  const [t1, t2, t3, t4] = times;
  return [
    // Rodada 1
    [{ timeA: t1, timeB: t2 }, { timeA: t3, timeB: t4 }],
    // Rodada 2
    [{ timeA: t1, timeB: t3 }, { timeA: t2, timeB: t4 }],
    // Rodada 3
    [{ timeA: t1, timeB: t4 }, { timeA: t2, timeB: t3 }]
  ];
}

// Simula um jogo gerando gols aleatórios (0 a 5 para cada time)
function simularJogo() {
  return {
    golsA: Math.floor(Math.random() * 6), // 0 a 5
    golsB: Math.floor(Math.random() * 6)
  };
}


// ============================================================
// EXIBIR JOGOS DA FASE DE GRUPOS
// ============================================================
function exibirJogosGrupos(resultados) {
  const container = document.getElementById("container-jogos-grupos");
  container.innerHTML = "";

  Object.entries(resultados).forEach(([letra, dados]) => {
    const card = document.createElement("div");
    card.className = "card-rodadas";

    let htmlRodadas = "";
    dados.rodadas.forEach((rodada, i) => {
      htmlRodadas += `<h4>Grupo ${letra} — Rodada ${i + 1}</h4>`;
      rodada.forEach(jogo => {
        htmlRodadas += `
          <div class="jogo">
            <span class="time">${pegarNome(jogo.timeA)}</span>
            <span class="placar">${jogo.golsA} x ${jogo.golsB}</span>
            <span class="time direita">${pegarNome(jogo.timeB)}</span>
          </div>
        `;
      });
    });

    card.innerHTML = htmlRodadas;
    container.appendChild(card);
  });

  mostrarElemento("secao-jogos-grupos");
}


// ============================================================
// PASSO 5: CLASSIFICAR OS TIMES DE CADA GRUPO
// Critérios: 1) Pontos → 2) Saldo de Gols → 3) Sorteio
// ============================================================
function classificarGrupos(resultados) {
  // Array que vai guardar os 16 classificados na ordem correta
  // para o chaveamento das oitavas
  const classificados = {
    "A": [], "B": [], "C": [], "D": [],
    "E": [], "F": [], "G": [], "H": []
  };

  Object.entries(resultados).forEach(([letra, dados]) => {
    // Converte o objeto tabela em array para poder ordenar
    const timesOrdenados = Object.values(dados.tabela).sort((a, b) => {
      // 1° critério: pontos (maior primeiro)
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      // 2° critério: saldo de gols (maior primeiro)
      if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
      // 3° critério: sorteio (aleatório)
      return Math.random() - 0.5;
    });

    classificados[letra] = timesOrdenados;
  });

  return classificados;
}


// ============================================================
// EXIBIR CLASSIFICAÇÃO DOS GRUPOS
// ============================================================
function exibirClassificacao(resultados) {
  const container = document.getElementById("container-classificacao");
  container.innerHTML = "";

  // Primeiro classifica para pegar a ordem correta
  const classificados = classificarGrupos(resultados);

  Object.entries(classificados).forEach(([letra, times]) => {
    const card = document.createElement("div");
    card.className = "card-classificacao";

    let linhas = "";
    times.forEach((entry, posicao) => {
      const classeClassificado = posicao < 2 ? "classificado" : "";
      const bandeira = posicao < 2 ? "✅" : "❌";
      linhas += `
        <tr class="${classeClassificado}">
          <td>${bandeira} ${pegarNome(entry.time)}</td>
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
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>GF:GC</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;

    container.appendChild(card);
  });

  mostrarElemento("secao-classificacao");
}


// ============================================================
// PASSO 6: SIMULAR O MATA-MATA
// Oitavas → Quartas → Semi → Final
// ============================================================
async function simularMataMata(classificados) {
  const containerMata = document.getElementById("container-mata-mata");
  containerMata.innerHTML = "";
  mostrarElemento("secao-mata-mata");

  // CHAVEAMENTO das oitavas de final (conforme figura do PDF):
  // 1A x 2B, 1C x 2D, 1E x 2F, 1G x 2H (lado esquerdo do chaveamento)
  // 1B x 2A, 1D x 2C, 1F x 2E, 1H x 2G (lado direito)
  let oitavas = [
    // Lado esquerdo
    { timeA: classificados["A"][0].time, timeB: classificados["B"][1].time },
    { timeA: classificados["C"][0].time, timeB: classificados["D"][1].time },
    { timeA: classificados["E"][0].time, timeB: classificados["F"][1].time },
    { timeA: classificados["G"][0].time, timeB: classificados["H"][1].time },
    // Lado direito
    { timeA: classificados["B"][0].time, timeB: classificados["A"][1].time },
    { timeA: classificados["D"][0].time, timeB: classificados["C"][1].time },
    { timeA: classificados["F"][0].time, timeB: classificados["E"][1].time },
    { timeA: classificados["H"][0].time, timeB: classificados["G"][1].time },
  ];

  // Simula cada fase
  const vencedoresOitavas = simularFaseEliminatoria(oitavas, "Oitavas de Final", containerMata);
  const vencedoresQuartas = simularFaseEliminatoria(formarPares(vencedoresOitavas), "Quartas de Final", containerMata);
  const vencedoresSemi    = simularFaseEliminatoria(formarPares(vencedoresQuartas), "Semifinal", containerMata);
  const finalJogos        = simularFaseEliminatoria(formarPares(vencedoresSemi), "Final", containerMata);

  const campeao = finalJogos[0];

  // Recupera o resultado da final para enviar à API
  const dadosFinal = campeao._dadosFinal;
  await enviarResultadoFinal(dadosFinal);

  // Exibe o campeão
  exibirCampeao(campeao);

  return campeao;
}

// Recebe array de confrontos e simula todos, exibindo na tela
// Retorna array com os vencedores
function simularFaseEliminatoria(confrontos, nomeFase, container) {
  const divFase = document.createElement("div");
  divFase.className = "fase";
  divFase.innerHTML = `<h3>${nomeFase}</h3>`;

  const divJogos = document.createElement("div");
  divJogos.className = "container-jogos-fase";

  const vencedores = [];

  confrontos.forEach(jogo => {
    const resultado = simularJogoEliminatorio(jogo.timeA, jogo.timeB);
    const { golsA, golsB, penaltisA, penaltisB, foiPenaltis } = resultado;
    const vencedor = resultado.vencedor;

    // Guarda os dados da final para enviar à API (apenas na final)
    vencedor._dadosFinal = {
      equipeA: pegarId(jogo.timeA),
      equipeB: pegarId(jogo.timeB),
      golsEquipeA: golsA,
      golsEquipeB: golsB,
      golsPenaltyTimeA: foiPenaltis ? penaltisA : 0,
      golsPenaltyTimeB: foiPenaltis ? penaltisB : 0
    };

    vencedores.push(vencedor);

    // Cria o card visual do jogo
    const card = document.createElement("div");
    card.className = "card-jogo-mata";

    const infoPenaltis = foiPenaltis
      ? `<div class="info-penaltis">Pênaltis: ${pegarNome(jogo.timeA)} ${penaltisA}x${penaltisB} ${pegarNome(jogo.timeB)}</div>`
      : "";

    const nomeA = pegarNome(jogo.timeA);
    const nomeB = pegarNome(jogo.timeB);
    const nomeVencedor = pegarNome(vencedor);

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

// Simula jogo eliminatório (sem empate possível — usa pênaltis se empatar)
function simularJogoEliminatorio(timeA, timeB) {
  const golsA = Math.floor(Math.random() * 5); // 0 a 4
  const golsB = Math.floor(Math.random() * 5);

  if (golsA !== golsB) {
    // Jogo decidido no tempo normal
    return {
      golsA, golsB,
      penaltisA: 0, penaltisB: 0,
      foiPenaltis: false,
      vencedor: golsA > golsB ? timeA : timeB
    };
  }

  // Empatou → disputa de pênaltis
  const penaltisA = Math.floor(Math.random() * 6) + 3; // 3 a 8
  let penaltisB = Math.floor(Math.random() * 6) + 3;

  // Garante que não empata nos pênaltis
  while (penaltisB === penaltisA) {
    penaltisB = Math.floor(Math.random() * 6) + 3;
  }

  return {
    golsA, golsB,
    penaltisA, penaltisB,
    foiPenaltis: true,
    vencedor: penaltisA > penaltisB ? timeA : timeB
  };
}

// Agrupa times em pares para a próxima fase
function formarPares(times) {
  const pares = [];
  for (let i = 0; i < times.length; i += 2) {
    pares.push({ timeA: times[i], timeB: times[i + 1] });
  }
  return pares;
}


// ============================================================
// PASSO 7: ENVIAR RESULTADO DA FINAL PARA A API
// ============================================================
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
      headers: {
        "Content-Type": "application/json",
        "git-user": GIT_USER
      },
      body: JSON.stringify(corpo) // converte o objeto para string JSON
    });

    if (resposta.ok) {
      console.log("✅ Resultado enviado com sucesso!");
    } else {
      console.warn("⚠️ API retornou status:", resposta.status);
    }
  } catch (error) {
    // Não impede a exibição do campeão mesmo se o envio falhar
    console.error("Erro ao enviar resultado final:", error);
  }
}


// ============================================================
// EXIBIR O CAMPEÃO
// ============================================================
function exibirCampeao(time) {
  const container = document.getElementById("container-campeao");
  container.innerHTML = `
    <div class="trofeu">🏆</div>
    <h2>Campeão Mundial!</h2>
    <div class="nome-campeao">${pegarNome(time)}</div>
    <div class="status-api">✅ Resultado registrado na API</div>
  `;
  mostrarElemento("secao-campeao");
}


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

// Mostra um elemento (remove a classe "hidden")
function mostrarElemento(id) {
  document.getElementById(id).classList.remove("hidden");
}

// Esconde um elemento (adiciona a classe "hidden")
function esconderElemento(id) {
  document.getElementById(id).classList.add("hidden");
}

// Pega o nome de um time de forma segura
// A API pode retornar o nome em campos diferentes (name, teamName, etc.)
// Ajuste aqui conforme o formato real que a API retornar
function pegarNome(time) {
  if (!time) return "Time desconhecido";
  return time.nome;
}

// Pega o ID único de um time
// Também ajuste conforme o formato real da API
function pegarId(time) {
  if (!time) return "id-desconhecido";
  return time.token;
}