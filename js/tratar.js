/* ============================================================
   TRATAR MINHA PISCINA — Hydra Piscinas
   Lógica de diagnóstico e tratamento — versão 2.0
   ============================================================ */

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
let state = {
  litros: 0,
  problema: '',
  problemaLabel: '',
  ph: null,
  cloro: null,
  alcalinidade: null,
};

/* ============================================================
   CONSTANTES DE DOSAGEM
   ============================================================ */
const DOSAGEM = {
  // Alcalinidade baixa — g por 1.000L conforme nível atual (ppm)
  ELEV_ALC: [
    { ate: 0,   g: 180 },
    { ate: 10,  g: 180 },
    { ate: 20,  g: 160 },
    { ate: 30,  g: 140 },
    { ate: 40,  g: 120 },
    { ate: 50,  g: 100 },
    { ate: 60,  g: 80  },
    { ate: 70,  g: 60  },
    { ate: 80, g: 40 },
    { ate: 90, g: 20 },
    { ate: 99, g: 20 },
],

  // Alcalinidade alta — ml por 1.000L conforme nível atual (ppm)
  RED_ALC: [
    { ate: 130, ml: 20  },
    { ate: 140, ml: 40  },
    { ate: 150, ml: 60  },
    { ate: 160, ml: 80  },
    { ate: 170, ml: 100 },
    { ate: 180, ml: 120 },
    { ate: 190, ml: 140 },
    { ate: Infinity, ml: 160 },
  ],

  // pH baixo — g por 1.000L conforme pH atual
ELEV_PH: [
  { phMin: 7.1, phMax: 7.19, g: 2  },
  { phMin: 6.9, phMax: 7.09, g: 5  },
  { phMin: 6.7, phMax: 6.89, g: 10 },
  { phMin: 6.5, phMax: 6.69, g: 15 },
  { phMin: -Infinity, phMax: 6.49, g: 20 },
],

  // pH alto — ml por 1.000L conforme pH atual
RED_PH: [
  { phMin: 7.7, phMax: 7.79, ml: 2 },
  { phMin: 7.8, phMax: 7.99, ml: 3 },
  { phMin: 8.0, phMax: 8.3, ml: 5 },
  { phMin: 8.4, phMax: Infinity, ml: 7.5 },
],

  ALGICIDA_CHOQUE_ML_POR_MIL:    10,
  ALGICIDA_MANUT_ML_POR_MIL:     10,
  CLARIFICANTE_ML_POR_MIL:       10,
  DECANTADOR_ML_POR_MIL:         10,
  SULFATO_AL_KG_POR_40KL:        2,   // 2kg tratam 40.000L
  REMOVEDOR_METAIS_ML_POR_MIL:   15,
  OXIDANTE_G_POR_MIL:            10,
  REMOVEDOR_OLEOSIDADE_ML_POR_MIL: 10,

  CLORO_PURO_MANUT_G_POR_MIL:    2,
  CLORO_3EM1_MANUT_G_POR_MIL:    4,
  CLORO_PURO_CHOQUE_G_POR_MIL:   4,   // dose dupla quando cloro zerado
  CLORO_3EM1_CHOQUE_G_POR_MIL:   8,
};

/* ============================================================
   REGRAS DE SEGURANÇA — sempre exibidas
   ============================================================ */
const REGRAS_SEGURANCA = [
  'Nunca misture produtos entre si antes de adicionar na água.',
  'Adicione um produto por vez.',
  'Aguarde o tempo recomendado entre aplicações.',
  'Não utilize a piscina por pelo menos 1 hora após aplicação dos produtos.',
];

/* ============================================================
   FORMATAÇÃO
   ============================================================ */
function arredondaGramas(valor) {

  if (valor < 500) {
    return Math.ceil(valor / 10) * 10;
  }

  return Math.ceil(valor / 100) * 100;

}

function arredondaMl(valor) {
  return Math.ceil(valor / 10) * 10;
}

function fmtLiq(mlTotal) {

  mlTotal = arredondaMl(mlTotal);

  if (mlTotal >= 1000) {

    return `${(mlTotal / 1000).toFixed(1).replace('.0', '')} L`;

  }

  return `${mlTotal} ml`;

}

function fmtSol(gTotal) {

  gTotal = arredondaGramas(gTotal);

  if (gTotal >= 1000) {

    if (gTotal % 1000 === 0) {
      return `${gTotal / 1000} kg`;
    }

    return `${(gTotal / 1000).toFixed(1)} kg`;
  }

  return `${gTotal} g`;

}

/* ============================================================
   MÓDULO: ALCALINIDADE
   ============================================================ */
function calcDoseElevAlc(alcAtual, vk) {

  for (const faixa of DOSAGEM.ELEV_ALC) {

    if (alcAtual <= faixa.ate) {

      return fmtSol(vk * faixa.g);

    }

  }

  return fmtSol(vk * 20);

}

function calcDoseRedAlc(alcAtual, vk) {
  const tabela = DOSAGEM.RED_ALC;
  for (const faixa of tabela) {
    if (alcAtual <= faixa.ate) {
      return fmtLiq(vk * faixa.ml);
    }
  }
  return fmtLiq(vk * 160);
}

function stepElevarAlc(alcAtual, vk) {
  const dose = calcDoseElevAlc(alcAtual, vk);
  const aviso = alcAtual === 0
    ? 'O teste mede apenas até zero. A alcalinidade real pode estar abaixo de zero e pode ser necessária nova correção após o reteste.'
    : null;
  return {
    titulo: '⚗️ Elevar a Alcalinidade',
    desc: `Adicione <strong>${dose} de Elevador de Alcalinidade</strong> (pacote 2 kg). Distribua próximo às saídas do filtro com a bomba ligada.`,
    tempo: 'Aguardar 12 horas antes de qualquer outro produto',
    dica: 'A alcalinidade deve estar correta antes de ajustar o pH',
    aviso,
  };
}

function stepReduzirAlc(alcAtual, vk) {
  const dose = calcDoseRedAlc(alcAtual, vk);
  return {
    titulo: '⚗️ Reduzir a Alcalinidade',
    desc: `Adicione <strong>${dose} de Redutor de Alcalinidade Líquido</strong> (galão 1 L). Aplique com a bomba ligada, distribuindo pela superfície da água.`,
    tempo: 'Aguardar 12 horas antes de qualquer outro ajuste',
    dica: 'Despeje devagar próximo aos retornos d\'água',
    aviso: null,
  };
}

/* ============================================================
   MÓDULO: pH
   ============================================================ */
function calcDoseElevPH(phAtual, vk) {

  for (const faixa of DOSAGEM.ELEV_PH) {

    if (
      phAtual >= faixa.phMin &&
      phAtual <= faixa.phMax
    ) {
      return fmtSol(vk * faixa.g);
    }

  }

  return fmtSol(vk * 2);

}

function calcDoseRedPH(phAtual, vk) {
  for (const faixa of DOSAGEM.RED_PH) {
    if (phAtual >= faixa.phMin && phAtual <= faixa.phMax) {
      return fmtLiq(vk * faixa.ml);
    }
  }
  return fmtLiq(vk * 7.5);
}

function stepElevarPH(phAtual, vk) {
  const dose = calcDoseElevPH(phAtual, vk);
  return {
    titulo: '🔵 Elevar o pH',
    desc: `pH atual está baixo (${phAtual}). Adicione <strong>${dose} de Barrilha Leve</strong> (pacote 2 kg). Dissolva em um balde com água antes de aplicar.`,
    tempo: 'Aguardar 30 minutos e refazer o teste',
    dica: 'Aplique com a bomba ligada para melhor distribuição',
    aviso: null,
  };
}

function stepReduzirPH(phAtual, vk) {
  const dose = calcDoseRedPH(phAtual, vk);
  return {
    titulo: '🔴 Reduzir o pH',
    desc: `pH atual está alto (${phAtual}). Adicione <strong>${dose} de Redutor de pH Líquido</strong> (galão 1 L). Despeje diretamente na água com a bomba ligada.`,
    tempo: 'Aguardar 30 minutos e refazer o teste',
    dica: 'Nunca aplique diretamente sobre superfícies pintadas',
    aviso: null,
  };
}

/* ============================================================
   MÓDULO: CLORO
   ============================================================ */
function stepCloracao(vk, cloroAtual, isChoque = false) {
  const cloroBaixo = cloroAtual !== null && cloroAtual < 0.5;
const aplicarChoque = isChoque || cloroBaixo;

  const dosePuro  = fmtSol(vk * (aplicarChoque ? DOSAGEM.CLORO_PURO_CHOQUE_G_POR_MIL  : DOSAGEM.CLORO_PURO_MANUT_G_POR_MIL));
  const dose3em1  = fmtSol(vk * (aplicarChoque ? DOSAGEM.CLORO_3EM1_CHOQUE_G_POR_MIL : DOSAGEM.CLORO_3EM1_MANUT_G_POR_MIL));

  const titulo = aplicarChoque ? '🧪 Cloração de Choque' : '🧪 Cloração de Manutenção';
  let desc = aplicarChoque
    ? `O cloro está abaixo da faixa ideal. É necessário aplicar uma dose reforçada para recuperar rapidamente o residual de cloro na água. Aplique <strong>${dosePuro} de Cloro Puro</strong> ou <strong>${dose3em1} de Cloro 3 em 1</strong>. Após estabilização, volte para a dosagem normal de manutenção.`
    : `Adicione <strong>${dosePuro} de Cloro Puro</strong> ou <strong>${dose3em1} de Cloro 3 em 1</strong> para manter o cloro livre entre 1,5 e 3 ppm.`;

  return {
    titulo,
    desc,
    tempo: 'Aplique ao anoitecer para maior eficiência',
    dica: 'Nunca aplique cloro sob sol forte — perde eficiência rapidamente',
    aviso: aplicarChoque ? 'A dose inicial maior serve para recuperar rapidamente o residual de cloro. Após estabilização, voltar para dosagem normal.' : null,
  };
}

/* ============================================================
   MÓDULO: DECANTADOR / CLARIFICANTE
   ============================================================ */
function stepDecantador(vk) {
  const dose = fmtLiq(vk * DOSAGEM.DECANTADOR_ML_POR_MIL);
  return {
    titulo: '🌀 Aplicar Decantador / Clarificante',
    desc: `Adicione <strong>${dose} de Decantador</strong>. Filtre por 2 horas para misturar, depois desligue completamente o sistema: bomba, timer, gerador de cloro e trocador de calor.`,
    tempo: '2h filtrando + 12h decantando com sistema desligado',
    dica: 'Escolha um período sem vento para não agitar a água durante a decantação',
    aviso: null,
  };
}

function stepAspiracao() {
  return {
    titulo: '🧹 Aspirar o Fundo',
    desc: 'Após a decantação, aspire cuidadosamente o fundo com o aspirador no modo <strong>descarte</strong>. Mova devagar para não levantar o material sedimentado.',
    tempo: 'Conforme necessário',
    dica: 'Use sempre o modo descarte para não contaminar o filtro',
    aviso: null,
  };
}

/* ============================================================
   MÓDULO: SEGURANÇA GERAL
   ============================================================ */
function stepSeguranca() {
  return {
    titulo: '⚠️ Regras de Segurança',
    desc: REGRAS_SEGURANCA.map(r => `• ${r}`).join('<br>'),
    tempo: null,
    dica: 'Siga essas regras em todos os tratamentos',
    aviso: null,
  };
}

/* ============================================================
   MÓDULO: AVISO DE PARÂMETROS ESTIMADOS
   ============================================================ */
function stepEstimado() {
  return {
    titulo: '📋 Tratamento Estimado',
    desc: 'Os parâmetros da água não foram informados. Este protocolo foi gerado com base nos <strong>valores ideais estimados</strong>. Para um tratamento preciso, recomendamos levar uma amostra de 500 ml até a <strong>Hydra Piscinas para análise gratuita</strong>.',
    tempo: null,
    dica: 'Colete a amostra a 30 cm de profundidade, longe dos retornos',
    aviso: null,
  };
}

/* ============================================================
   MÓDULO: CORREÇÃO DE PARÂMETROS (reutilizável)
   Retorna os steps de alcalinidade + pH conforme os valores
   ============================================================ */
function stepsParametros(vk, ph, alc) {
  const steps = [];
  const alcBaixo = alc !== null && alc < 100;
  const alcAlto  = alc !== null && alc > 120;
  const alcIdeal = alc !== null && alc >= 100 && alc <= 120;
  const phBaixo  = ph  !== null && ph  < 7.2;
  const phAlto   = ph  !== null && ph  > 7.6;

  // Alcalinidade sempre primeiro
  if (alcBaixo) steps.push(stepElevarAlc(alc, vk));
  if (alcAlto)  steps.push(stepReduzirAlc(alc, vk));
  if (alcIdeal) {
  steps.push({
    titulo: '✅ Alcalinidade Ideal',
    desc: 'Alcalinidade dentro da faixa ideal (100 a 120 ppm). Nenhuma correção necessária.',
    tempo: null,
    dica: 'A alcalinidade deve permanecer entre 100 e 120 ppm.',
    aviso: null,
  });
}

  // pH depois
  if (phBaixo) steps.push(stepElevarPH(ph, vk));
  if (phAlto)  steps.push(stepReduzirPH(ph, vk));

  return steps;
}

/* ============================================================
   PROTOCOLOS POR PROBLEMA
   ============================================================ */

function protocoloVerde(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;
  const phAlto = ph !== null && ph > 7.6;

  if (!paramInformados) steps.push(stepEstimado());

  // Parâmetros
  let sp = stepsParametros(vk, ph, alc);

if (phAlto) {
  sp = sp.filter(step => step.titulo !== '🔴 Reduzir o pH');
}

steps.push(...sp);

  // Água verde com pH alto → Sulfato de Alumínio (caso especial)
  if (phAlto) {
    const kgSulfato = ((vk * 1000) / 40000) * 2;
    const doseSulfato = fmtSol(kgSulfato * 1000);
    steps.push({
      titulo: '🧫 Aplicar Sulfato de Alumínio',
      desc: `pH alto com água verde: use <strong>${doseSulfato} de Sulfato de Alumínio</strong> (pacote 2 kg) em vez do redutor de pH líquido. Dissolva em um balde com água e aplique pela superfície.`,
      tempo: '12 horas de decantação',
      dica: null,
      aviso: 'Coloque o filtro em RECIRCULAR. Nunca deixe o sulfato passar pela areia do filtro — pode empedrar a areia.',
    });
  }

  // Algicida choque
  const doseAlg = fmtLiq(vk * DOSAGEM.ALGICIDA_CHOQUE_ML_POR_MIL);
  steps.push({
    titulo: '🌿 Algicida de Choque',
    desc: `Adicione <strong>${doseAlg} de Algicida de Choque</strong> com a bomba ligada, distribuindo pela superfície da água.`,
    tempo: 'Após pH ajustado',
    dica: 'Aplique antes do clarificante para melhores resultados',
    aviso: null,
  });

if (!phAlto) {
  steps.push(stepDecantador(vk));
}

steps.push(stepAspiracao());

  // Cloração
  steps.push(stepCloracao(vk, cloro, true));

  // Manutenção preventiva
  const doseAlgManut = fmtLiq(vk * DOSAGEM.ALGICIDA_MANUT_ML_POR_MIL);
  steps.push({
    titulo: '✅ Manutenção Preventiva',
    desc: `Retome a rotina diária de cloração:

• Cloro Puro: 2 g por 1000 litros por dia

ou

• Cloro 3 em 1: 4 g por 1000 litros por dia

Além disso, aplique <strong>${doseAlgManut} de Algicida de Manutenção</strong> a cada 7 dias.`,
    tempo: 'Rotina permanente',
    dica: 'Monitore pH e cloro semanalmente',
    aviso: null,
  });

  steps.push(stepSeguranca());
  return steps;
}

function protocoloTurva(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;

  if (!paramInformados) steps.push(stepEstimado());

  const sp = stepsParametros(vk, ph, alc);
  steps.push(...sp);

  const doseClarif = fmtLiq(vk * DOSAGEM.CLARIFICANTE_ML_POR_MIL);
  steps.push({
    titulo: '🌊 Clarificante',
    desc: `Adicione <strong>${doseClarif} de Clarificante</strong> com a bomba ligada. Mantenha a filtragem por pelo menos 8 horas.`,
    tempo: '8 horas de filtragem',
    dica: 'Realize retrolavagem do filtro antes de aplicar o clarificante',
    aviso: null,
  });

  if (cloro !== null && cloro < 1.5) {
    steps.push(stepCloracao(vk, cloro));
  }

  steps.push(stepSeguranca());
  return steps;
}

function protocoloBranca(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;

  if (!paramInformados) steps.push(stepEstimado());

  // Parâmetros primeiro
  const sp = stepsParametros(vk, ph, alc);
  steps.push(...sp);

  // Decantador como prioridade
  steps.push(stepDecantador(vk));
  steps.push(stepAspiracao());

  if (cloro !== null && cloro < 1.5) {
    steps.push(stepCloracao(vk, cloro));
  }

  steps.push(stepSeguranca());
  return steps;
}

function protocoloEspuma(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;

  if (!paramInformados) steps.push(stepEstimado());

  const sp = stepsParametros(vk, ph, alc);
  steps.push(...sp);

  const doseOxid = fmtSol(vk * DOSAGEM.OXIDANTE_G_POR_MIL);
  const doseOleo = fmtLiq(vk * DOSAGEM.REMOVEDOR_OLEOSIDADE_ML_POR_MIL);

  steps.push({
    titulo: '🫧 Tratar a Espuma',
    desc: `Escolha um dos tratamentos:<br>
      • <strong>Oxidante:</strong> ${doseOxid} — elimina matéria orgânica causadora de espuma.<br>
      • <strong>Removedor de Oleosidade:</strong> ${doseOleo} — indicado quando a espuma vem de protetor solar, óleos e cosméticos.`,
    tempo: '6 horas com bomba ligada',
    dica: 'Não use os dois produtos ao mesmo tempo',
    aviso: null,
  });

  if (cloro !== null && cloro < 1.5) {
    steps.push(stepCloracao(vk, cloro));
  }

  steps.push(stepSeguranca());
  return steps;
}

function protocoloMetais(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;

  if (!paramInformados) steps.push(stepEstimado());

  // Verificar cloro antes de remover metais
if (cloro !== null && cloro >= 0.5) {
    steps.push({
      titulo: '⚠️ Zerar o Cloro Antes de Prosseguir',
      desc: 'Antes de aplicar o removedor de metais, o cloro livre deve estar zerado (abaixo de 0,5 ppm). O cloro pode intensificar manchas causadas por metais. Aguarde o cloro decair naturalmente ou use um neutralizador.',
      tempo: 'Verificar com teste antes de continuar',
      dica: 'Não aplique produtos com metais enquanto houver cloro na água',
      aviso: 'O cloro pode intensificar manchas causadas por metais.',
    });
  }

  const doseMetais = fmtLiq(vk * DOSAGEM.REMOVEDOR_METAIS_ML_POR_MIL);
  steps.push({
    titulo: '🔴 Aplicar Removedor de Metais',
    desc: `Com o cloro zerado, adicione <strong>${doseMetais} de Removedor de Metais</strong>. Aplique diretamente nas manchas e também distribua na água. Mantenha a bomba ligada por 8 horas.`,
    tempo: '8 horas com bomba ligada',
    dica: 'Aplique diretamente nas manchas para melhor ação',
    aviso: null,
  });

  const sp = stepsParametros(vk, ph, alc);
  steps.push(...sp);

  steps.push(stepCloracao(vk, 0)); // cloro zerado, precisa de dose de recuperação

  steps.push(stepSeguranca());
  return steps;
}

function protocoloBrilho(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;

  if (!paramInformados) steps.push(stepEstimado());

  // Retrolavagem primeiro
  steps.push({
    titulo: '🔄 Retrolavagem do Filtro',
    desc: 'Água sem brilho quase sempre indica filtro saturado. Realize retrolavagem por 5 minutos e limpe o pré-filtro da bomba.',
    tempo: '5 minutos de retrolavagem',
    dica: 'Se a areia tiver mais de 3 anos, considere a troca',
    aviso: null,
  });

  const sp = stepsParametros(vk, ph, alc);
  steps.push(...sp);

  const doseClarif = fmtLiq(vk * DOSAGEM.CLARIFICANTE_ML_POR_MIL);
  steps.push({
    titulo: '✨ Clarificante',
    desc: `Adicione <strong>${doseClarif} de Clarificante</strong> com a bomba ligada para remover matéria orgânica dissolvida que opaca a água.`,
    tempo: '8 horas com bomba ligada',
    dica: 'pH correto torna a água visivelmente mais clara e brilhante',
    aviso: null,
  });

  if (cloro !== null && cloro < 1.5) {
    steps.push(stepCloracao(vk, cloro));
  }

  steps.push(stepSeguranca());
  return steps;
}

function protocoloSujeira(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;

  if (!paramInformados) steps.push(stepEstimado());

  const sp = stepsParametros(vk, ph, alc);
  steps.push(...sp);

  steps.push(stepDecantador(vk));
  steps.push(stepAspiracao());

  steps.push({
    titulo: '🔄 Retrolavagem e Retorno à Rotina',
    desc: 'Após a aspiração, realize retrolavagem do filtro por 5 minutos.',
    tempo: '5 minutos',
    dica: 'Limpe as bordas com Limpa Bordas',
    aviso: null,
  });

  if (cloro !== null && cloro < 1.5) {
    steps.push(stepCloracao(vk, cloro));
  }

  steps.push(stepSeguranca());
  return steps;
}

function protocoloManutencao(vk, ph, alc, cloro) {
  const steps = [];
  const paramInformados = ph !== null || alc !== null || cloro !== null;

  if (!paramInformados) steps.push(stepEstimado());

  steps.push({
    titulo: '🔄 Retrolavagem do Filtro',
    desc: 'Sempre comece pela retrolavagem do filtro. Garante boa circulação e filtragem da água.',
    tempo: '5 minutos',
    dica: 'Faça a retrolavagem sempre antes de adicionar produtos',
    aviso: null,
  });

  const sp = stepsParametros(vk, ph, alc);
  steps.push(...sp);

  if (cloro !== null && cloro < 1.5) {
    const dosePuro = fmtSol(vk * DOSAGEM.CLORO_PURO_MANUT_G_POR_MIL);
    const dose3em1 = fmtSol(vk * DOSAGEM.CLORO_3EM1_MANUT_G_POR_MIL);
    steps.push({
      titulo: '🧪 Cloração Semanal',
      desc: `Adicione <strong>${dosePuro} de Cloro Puro</strong> ou <strong>${dose3em1} de Cloro 3 em 1</strong> para manter o cloro livre entre 1,5 e 3 ppm.`,
      tempo: 'Semanal, sempre ao anoitecer',
      dica: 'Nunca aplique cloro sob sol forte',
      aviso: null,
    });
  }

else if (cloro !== null && cloro > 3) {

  steps.push({
    titulo: '⚠️ Cloro Acima da Faixa Ideal',
  desc: 'O cloro está acima da faixa recomendada. Suspenda temporariamente novas aplicações de cloro por aproximadamente 3 dias. Após esse período, realize uma nova medição e retome a manutenção normalmente caso o nível esteja dentro da faixa ideal.',
  tempo: 'Nova medição em aproximadamente 3 dias',
  dica: 'Não é necessário aguardar para aplicar outros produtos compatíveis. Apenas suspenda novas aplicações de cloro durante esse período.',
  aviso: null,
  });

}

  else if (cloro !== null) {

  steps.push({
    titulo: '✅ Cloro Dentro da Faixa',
    desc: 'O cloro está entre 1,5 e 3 ppm. Continue a manutenção diária normalmente.',
    tempo: null,
    dica: 'Monitore semanalmente.',
    aviso: null,
  });

}

else {

  steps.push({
    titulo: '🧪 Cloro Não Informado',
    desc: 'O nível de cloro não foi informado. Recomendamos realizar o teste antes de definir qualquer correção.',
    tempo: null,
    dica: 'O cloro ideal deve permanecer entre 1,5 e 3 ppm.',
    aviso: null,
  });

}

  const doseAlgManut = fmtLiq(vk * DOSAGEM.ALGICIDA_MANUT_ML_POR_MIL);
  steps.push({
    titulo: '🌿 Algicida Preventivo Semanal',
    desc: `A cada 7 dias, adicione <strong>${doseAlgManut} de Algicida de Manutenção</strong>. Esta dose baixa evita o surgimento de algas.`,
    tempo: 'Semanal',
    dica: 'Aplique após o cloro, nunca junto',
    aviso: null,
  });

  steps.push(stepSeguranca());
  return steps;
}

function protocoloEnchimento(vk, ph, alc, cloro) {
  const steps = [];

  // Para piscina nova assumimos sem parâmetros como base, mas usamos os informados se houver
if (alc === null || alc < 100) {

  const alcReal = alc !== null ? alc : 0;
  const doseAlc = calcDoseElevAlc(Math.min(alcReal, 90), vk);

  steps.push({
    titulo: '⚗️ Ajustar a Alcalinidade',
    desc: `Adicione <strong>${doseAlc} de Elevador de Alcalinidade</strong> (pacote 2 kg). Aguarde 12 horas antes de qualquer outro ajuste.`,
    tempo: '12 horas',
    dica: 'A alcalinidade deve ser o primeiro ajuste sempre',
    aviso: null,
  });

} else {

  steps.push({
    titulo: '✅ Alcalinidade Ideal',
    desc: 'A alcalinidade já está dentro da faixa ideal (100 a 120 ppm).',
    tempo: null,
    dica: 'Nenhuma correção necessária.',
    aviso: null,
  });

}

  const phReal = ph !== null ? ph : null;
  if (phReal !== null && phReal < 7.2) {
    steps.push(stepElevarPH(phReal, vk));
  } else if (phReal !== null && phReal > 7.6) {
    steps.push(stepReduzirPH(phReal, vk));
  } else {
    steps.push({
      titulo: '🔵 Ajustar o pH',
      desc: 'Após estabilizar a alcalinidade, teste e corrija o pH para a faixa 7,2–7,6.',
      tempo: '30 minutos após ajuste, refazer teste',
      dica: 'Só ajuste o pH após a alcalinidade estar correta',
      aviso: null,
    });
  }

  const doseAlgInicial =
fmtLiq(vk * DOSAGEM.ALGICIDA_MANUT_ML_POR_MIL);
  steps.push({
    titulo: '🌿 Algicida Preventivo Inicial',
    desc: `Adicione <strong>${doseAlgInicial} de Algicida Preventivo</strong> para proteger a piscina desde o início.`,
    tempo: 'Após pH ajustado',
    dica: 'Aplique antes do cloro para melhor ação',
    aviso: null,
  });

  const doseCloroInicial = fmtSol(vk * 20);
  steps.push({
    titulo: '🧪 Cloração Inicial',
    desc: `Adicione <strong>${doseCloroInicial} de Cloro Granulado</strong> para a cloração inicial da água nova. Mantenha a bomba ligada por 12 horas.`,
    tempo: '12 horas com bomba ligada',
    dica: 'Aplique ao anoitecer',
    aviso: 'Aguarde pelo menos 24h antes de usar a piscina',
  });

  steps.push({
    titulo: '✅ Iniciar Rotina Semanal',
    desc: 'Com a água estabilizada: retrolavagem semanal, teste de pH e cloro semanal, algicida quinzenal.',
    tempo: 'Rotina permanente',
    dica: 'Anote as datas de cada aplicação para manter o controle',
    aviso: null,
  });

  steps.push(stepSeguranca());
  return steps;
}

function protocoloRemovidoOuDesconhecido() {
  return [{
    titulo: '🏪 Avaliação Personalizada na Hydra',
    desc: 'Para um diagnóstico preciso, visite a Hydra Piscinas ou entre em contato pelo WhatsApp. Realizamos análise completa da água gratuitamente.',
    tempo: '—',
    dica: 'Traga uma amostra de 500 ml em frasco limpo',
    aviso: null,
  }];
}

/* ============================================================
   ROTEADOR PRINCIPAL
   ============================================================ */
function getProtocol(prob, vk, ph, cloro, alc) {
  // Problemas removidos — não gerar protocolo
  if (['marrom', 'algas', 'cloro'].includes(prob)) {
    return protocoloRemovidoOuDesconhecido();
  }

  switch (prob) {
    case 'verde':      return protocoloVerde(vk, ph, alc, cloro);
    case 'turva':      return protocoloTurva(vk, ph, alc, cloro);
    case 'branca':     return protocoloBranca(vk, ph, alc, cloro);
    case 'espuma':     return protocoloEspuma(vk, ph, alc, cloro);
    case 'metais':     return protocoloMetais(vk, ph, alc, cloro);
    case 'brilho':     return protocoloBrilho(vk, ph, alc, cloro);
    case 'sujeira':    return protocoloSujeira(vk, ph, alc, cloro);
    case 'manutencao': return protocoloManutencao(vk, ph, alc, cloro);
    case 'enchimento': return protocoloEnchimento(vk, ph, alc, cloro);
    default:           return protocoloRemovidoOuDesconhecido();
  }
}

/* ============================================================
   ETAPA 1 — LITRAGEM
   ============================================================ */
function calcLitragemAuto() {
  const l = parseFloat(document.getElementById('s1-larg').value);
  const c = parseFloat(document.getElementById('s1-comp').value);
  const p = parseFloat(document.getElementById('s1-prof').value);

  if (l > 0 && c > 0 && p > 0) {
    const litros = Math.round(l * c * p * 1000);
    document.getElementById('result-auto-val').textContent = litros.toLocaleString('pt-BR');
    document.getElementById('result-auto').classList.add('show');
    document.getElementById('s1-litros').value = '';
    state.litros = litros;
  } else {
    document.getElementById('result-auto').classList.remove('show');
  }
}

function onLitragemDirect() {
  const val = parseFloat(document.getElementById('s1-litros').value);
  if (val > 0) {
    state.litros = val;
    document.getElementById('result-auto').classList.remove('show');
    document.getElementById('s1-larg').value = '';
    document.getElementById('s1-comp').value = '';
    document.getElementById('s1-prof').value = '';
  }
}

function goStep2() {
  const litrosDirect = Number(
  document.getElementById('s1-litros').value
    .replace(/\./g, '')
    .replace(',', '.')
);
  if (litrosDirect > 0) state.litros = litrosDirect;

  if (!state.litros || state.litros <= 0) {
    alert('Por favor, informe as dimensões da piscina ou a litragem diretamente.');
    return;
  }
  showStep(2);
}

/* ============================================================
   ETAPA 2 — PROBLEMA
   ============================================================ */
function selectProblem(el, key, label, corSolida, gradiente) {
  document.querySelectorAll('.problem-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  state.problema = key;
  state.problemaLabel = label;
  document.getElementById('btn-step2').disabled = false;
  document.getElementById('pool-mini-2').style.background = gradiente;
}

function goStep3() {
  if (!state.problema) {
    alert('Por favor, selecione o problema da piscina.');
    return;
  }
  showStep(3);
}

/* ============================================================
   ETAPA 3 → DIAGNÓSTICO
   ============================================================ */
function gerarDiagnostico() {
  const ph  = parseFloat(document.getElementById('p-ph').value);
const cl  = parseFloat(document.getElementById('p-cloro').value);
let alc = parseFloat(document.getElementById('p-alc').value);

if (!isNaN(alc)) {

  // Se digitou apenas um dígito (1 a 9),
  // considerar como dezenas de ppm
  if (alc > 0 && alc < 10) {
    alc = alc * 10;
  }

  // Arredonda para múltiplos de 10
  alc = Math.round(alc / 10) * 10;

}

  state.ph          = !isNaN(ph)  ? ph  : null;
  state.cloro       = !isNaN(cl)  ? cl  : null;
  state.alcalinidade = !isNaN(alc) ? alc : null;

  const { litros, problema } = state;
  const vk = litros / 1000;

  const steps = getProtocol(problema, vk, state.ph, state.cloro, state.alcalinidade);

  const iconMap = {
    verde:'🟢', turva:'🌫️', branca:'🤍', marrom:'🟤', espuma:'🫧',
    metais:'🔴', cloro:'⚗️', brilho:'💧', algas:'🌿', sujeira:'🍂',
    manutencao:'✨', enchimento:'🆕'
  };

  document.getElementById('diag-icon').textContent = iconMap[problema] || '🔬';
  document.getElementById('diag-titulo').textContent = `Diagnóstico: ${state.problemaLabel}`;
  document.getElementById('diag-subtitulo').textContent =
    `Piscina de ${litros.toLocaleString('pt-BR')} litros · ${steps.length} etapas de tratamento`;

  const list = document.getElementById('steps-list');
  list.innerHTML = '';
  steps.forEach((s, i) => {
    list.innerHTML += `
      <div class="treat-step">
        <div class="treat-step-num">${i + 1}</div>
        <div class="treat-step-content">
          <div class="treat-step-title">${s.titulo}</div>
          <div class="treat-step-desc">${s.desc}</div>
          <div class="treat-step-meta">
            ${s.tempo ? `<span class="meta-badge time">⏱ ${s.tempo}</span>` : ''}
            ${s.dica  ? `<span class="meta-badge tip">💡 ${s.dica}</span>` : ''}
            ${s.aviso ? `<span class="meta-badge warn">⚠️ ${s.aviso}</span>` : ''}
          </div>
        </div>
      </div>`;
  });

  showStep(4);
  document.getElementById('diagnostico-card').classList.add('visible');
  document.getElementById('diagnostico-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   NAVEGAÇÃO
   ============================================================ */
function showStep(n) {
  [1, 2, 3].forEach(i => {
    const card = document.getElementById('step-' + i);
    if (card) card.classList.remove('visible');
  });

  if (n <= 3) {
    const card = document.getElementById('step-' + n);
    if (card) {
      card.classList.add('visible');
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateProgress(n);
}

function backStep(n) {
  document.getElementById('diagnostico-card').classList.remove('visible');
  showStep(n);
}

function updateProgress(n) {
  const dots = [
    document.getElementById('dot-1'),
    document.getElementById('dot-2'),
    document.getElementById('dot-3'),
    document.getElementById('dot-4'),
  ];

  const widths = { 1: '0%', 2: '33%', 3: '66%', 4: '100%' };
  document.getElementById('progress-line').style.width = widths[n] || '0%';

  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i + 1 < n) dot.classList.add('done');
    else if (i + 1 === n) dot.classList.add('active');
  });
}

function restart() {
  state = { litros: 0, problema: '', problemaLabel: '', ph: null, cloro: null, alcalinidade: null };
  document.getElementById('s1-larg').value = '';
  document.getElementById('s1-comp').value = '';
  document.getElementById('s1-prof').value = '';
  document.getElementById('s1-litros').value = '';
  document.getElementById('p-ph').value = '';
  document.getElementById('p-cloro').value = '';
  document.getElementById('p-alc').value = '';
  document.getElementById('result-auto').classList.remove('show');
  document.querySelectorAll('.problem-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('btn-step2').disabled = true;
  document.getElementById('diagnostico-card').classList.remove('visible');
  document.getElementById('pool-mini-2').style.background = 'linear-gradient(160deg, #0066cc, #00d4ff)';
  showStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   PARÂMETROS VIA URL (vindo da calculadora de produtos)
   ============================================================ */
const urlParams = new URLSearchParams(window.location.search);
const litrosParam = parseInt(urlParams.get('litros'));
if (litrosParam > 0) {
  document.getElementById('s1-litros').value = litrosParam;
  state.litros = litrosParam;
}