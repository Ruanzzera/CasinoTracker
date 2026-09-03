# Simulador de Aposte e Ganhe com modelo de RTP

Hoje o simulador só usa média histórica (`avgRolloverLoss`, multiplicador médio dos giros). Com promoções raras, quase sempre falta amostra. A ideia é somar um **modelo teórico baseado em RTP** ao histórico, e passar a mostrar probabilidade de lucro de verdade, não só médias.

## O que muda no Simulador

Novos campos de entrada:
- **RTP do jogo de rollover** (slider 86%–98%, padrão 92%)
- **RTP do jogo do prêmio** (mesmo range)
- **Volatilidade do jogo do prêmio** (baixa / média / alta) — define o quanto o resultado dos giros varia
- Giros e bet já existem; ao lado passa a aparecer o cálculo automático: `200 x 0,05 = R$ 10,00 = 10% do rollover`

Novos resultados exibidos:
- **Custo teórico do rollover** = rollover × (1 − RTP)
- **Retorno esperado dos giros** = giros × bet × RTP do prêmio
- **Retorno dos giros em % do rollover** com semáforo contra a sua régua ideal de 20% (verde ≥20%, amarelo 12–20%, vermelho <12%)
- **Probabilidade de lucro (%)** vinda de simulação de Monte Carlo (10.000 rodadas) usando RTP + volatilidade
- **Lucro esperado**, **melhor caso / pior caso** (percentis 90 e 10)
- **Bet mínima necessária** para os giros atingirem 20% do rollover

## Como a probabilidade é calculada

Monte Carlo em memória (rápido, sem backend):
1. Rollover: perda modelada em torno de `rollover × (1 − RTP)` com desvio proporcional à volatilidade do jogo de rollover.
2. Giros: cada giro sorteia de uma distribuição de slot (maioria zero/baixo, cauda longa de prêmios grandes), calibrada para dar exatamente o RTP informado e a volatilidade escolhida.
3. Lucro da promoção = prêmio dos giros − perda do rollover.
4. Probabilidade de lucro = % das 10.000 simulações com lucro > 0.

## Histórico entra como calibração, não como base única

- Se houver ≥3 registros da casa/jogo, o RTP observado no histórico aparece do lado do RTP informado e o modelo usa a média dos dois (blend), com aviso de quantas amostras.
- Com menos de 3 amostras, o modelo roda 100% teórico — sem mais "sem dados suficientes".

## Recomendador

Passa a rankear as combinações pela probabilidade de lucro do mesmo modelo (histórico quando existe, RTP teórico como fallback), e mostra o retorno dos giros em % do rollover em cada linha, para você comparar direto com a régua dos 20%.

## Detalhes técnicos

- Novo arquivo `src/lib/betAndWinModel.ts` com a distribuição de slot, o Monte Carlo e os tipos do resultado (puro, testável).
- `src/hooks/useBetAndWin.ts`: `simulatePromotion` e `recommendRolloverGames` passam a aceitar RTP/volatilidade e delegar ao novo módulo; tipos `SimulationResult` / `RolloverRecommendation` ganham os campos novos.
- `SimulatorDialog.tsx` e `RecommenderDialog.tsx`: novos controles e cards de resultado, mantendo o estilo atual dos badges de veredito.
- Testes Vitest para o modelo (RTP calibrado, monotonicidade da probabilidade em relação à bet).
- Nenhuma mudança de banco de dados.
