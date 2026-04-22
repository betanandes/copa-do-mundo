# Simulador Copa do Mundo 2026

Projeto desenvolvido como parte do processo seletivo para a vaga de Estágio em Desenvolvimento 2026.

## Sobre o projeto

Aplicação web que simula a Copa do Mundo, desde o sorteio dos grupos até a definição do campeão, consumindo dados reais de uma API externa.

## Funcionalidades

- Busca as 32 seleções participantes via API
- Sorteia aleatoriamente 8 grupos de 4 times
- Simula os jogos da fase de grupos com pontuação (vitória, empate, derrota)
- Classifica os times por pontos, saldo de gols e sorteio em caso de empate
- Simula o mata-mata completo: Oitavas → Quartas → Semifinal → Final
- Disputa de pênaltis em caso de empate no mata-mata
- Envia o resultado da final para a API

## Tecnologias utilizadas

- HTML
- CSS
- JavaScript

## Como executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/betanandes/copa-do-mundo-2026.git
   ```
2. Abra o arquivo `index.html` diretamente no navegador.

> Não é necessário instalar nada ou rodar um servidor.

## Estrutura do projeto

```
copa-do-mundo-2026/
├── index.html    
├── style.css     
└── script.js     
```
