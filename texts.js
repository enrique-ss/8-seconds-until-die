// Arquivo de textos do jogo - separados para facilitar edição

module.exports = {
  // Descrições de locais
  locations: {
    bed: "debaixo da cama",
    closet: "dentro do armário",
    door: "atrás da porta",
    chair: "na cadeira",
  },

  // Descrições de alvos do intruso
  targets: {
    bed: "cama",
    closet: "guarda-roupa",
    window: "janela",
    door: "porta",
    lightSwitch: "interruptor de luz",
    center: "centro do quarto",
  },

  // Descrições de alvos como objeto gramatical
  targetsAsObject: {
    bed: "a cama",
    closet: "o guarda-roupa",
    window: "a janela",
    door: "a porta",
    lightSwitch: "o interruptor de luz",
    center: "o centro do quarto",
  },

  // Descrições de alvos após preposição
  targetsAfterPreposition: {
    bed: "à cama",
    closet: "ao guarda-roupa",
    window: "à janela",
    door: "à porta",
    lightSwitch: "ao interruptor de luz",
    center: "ao centro do quarto",
  },

  // Textos de abertura
  opening: {
    firstTime: "Você acorda em um quarto fechado. Você tem apenas 8 segundos antes que alguém entre.",
    repeat: "Você acorda no mesmo quarto de sempre, mas ele já não parece totalmente desconhecido.",
    lampBroken: "A escuridão já toma parte do espaço; as bordas das coisas parecem instáveis.",
    lampWorking: "A luz ainda revela o contorno das coisas que você talvez não consiga tocar por muito tempo.",
    allExplored: "Tudo ao redor já foi tocado pelo seu olhar. O que você faz agora?",
    remaining: "Ainda restam {fragments} à sua volta. O que você faz?",
  },

  // Textos de descoberta
  discovery: {
    shelf: "Você confere a estante e encontrou um taco. Talvez seja útil.",
    bedWithSheet: "A cama oferece espaço embaixo e o lençol que pode abafar seus movimentos.",
    bedWithoutSheet: "A cama mostra um vazio embaixo dela e um lençol dobrado ao alcance da mão.",
    closet: "O guarda-roupa cabe um corpo, mas a madeira avisa que não vai guardar silêncio de graça.",
    windowBroken: "Na sombra, a janela parece mais frágil do que antes.",
    windowWorking: "A janela está ali, esperando alguém decidir se ela é saída ou armadilha.",
    door: "A porta parece o tipo de saída que só funciona no segundo exato.",
  },

  // Textos de pegar itens
  take: {
    bat: "Você pega o taco de beisebol da estante.",
    sheet: "Você puxa o lençol da cama e o peso do tecido vira mais uma possibilidade.",
  },

  // Textos de quebrar lâmpada
  breakLamp: {
    alreadyBroken: "O vidro já não segura a luz; o quarto inteiro fica com bordas duras e sombras curtas.",
    breaking: "O vidro estoura no teto e a luz se quebra junto com ele.",
  },

  // Textos de morte quando exposto
  deathExposed: {
    knobTurns: "A maçaneta gira.",
    manEnters: "Um homem entra no quarto",
    actions: {
      analyzeShelf: "vê você vasculhando a estante e dispara sem remorso.",
      analyzeBed: "vê você examinando a cama e dispara sem hesitação.",
      analyzeCloset: "vê você inspecionando o guarda-roupa e dispara friamente.",
      analyzeDoor: "vê você estudando a porta e dispara sem piedade.",
      analyzeWindow: "vê você olhando pela janela e dispara impiedosamente.",
      takeBat: "vê você pegando o taco e dispara antes que você possa reagir.",
      takeSheet: "vê você pegando o lençol e dispara sem compaixão.",
      breakLamp: "vê você com o taco erguido e dispara sem dar chance.",
      default: "vê você sentado na cadeira e dispara em seu peito.",
    },
    lampBroken: "Na sombra, o disparo parece ainda mais seco.",
  },

  // Textos de chegada do intruso
  intruderArrival: {
    enters: "Um homem entra no quarto, furioso.",
    movesTo: "Ele varre o espaço à sua volta e segue em direção {target}, deixando {hiddenSpot} fora do primeiro olhar.",
    stopsAtHiding: "O corpo dele para exatamente diante do seu esconderijo.",
  },

  // Textos de prompt do intruso
  intruderPrompt: {
    stunned: "Ele cambaleia. Agora é a sua chance. O que você faz?",
    atHidingSpot: "Ele está diante {target}. O que você faz?",
    goingToTarget: "Ele vai até {target}. O que você faz?",
  },

  // Textos de avanço do intruso
  intruderAdvance: {
    moves: "Ele deixa {previousTarget} para trás e se move até {target}.",
  },

  // Textos quando intruso erra jogador
  intruderMiss: {
    survives: "Sua cobertura sustenta o primeiro olhar dele enquanto ele passa por {previousTarget}.",
  },

  // Textos de se esconder
  hide: {
    bedWithSheet: "Você se afunda sob a cama e o lençol ajuda a dissolver sua silhueta.",
    bedWithoutSheet: "Você se arrasta para debaixo da cama, tentando ocupar o mínimo de espaço possível.",
    closet: "Você se encolhe dentro do guarda-roupa. A madeira reclama, mas ainda aguenta.",
    door: "Você se coloca atrás da porta, usando o vão como seu escudo.",
    chair: "Você permanece parado, esperando a próxima brecha.",
  },

  // Textos de usar lençol
  sheet: {
    bed: "O lençol cai sobre você e a cama deixa de parecer um lugar fácil de vasculhar.",
    chair: "O lençol encobre seu corpo de um jeito improvisado, como se fosse uma cortina mal amarrada.",
    door: "O lençol se estende atrás da porta, disfarçando sua silhueta contra a madeira.",
    default: "O lençol não resolve tudo, mas muda a textura da sua presença no quarto.",
  },

  // Textos de atordoamento bem-sucedido
  stunSuccess: {
    hit: "O taco encontra o homem antes que ele entenda de onde veio o golpe.",
    reaction: "Ele perde o eixo por um instante e o revólver desce com a mão vacilando.",
    lampBroken: "Na penumbra, o corpo dele demora ainda mais para recuperar forma.",
    exposed: "Agora ele está exposto o suficiente para você tentar sair.",
  },

  // Textos de falha no atordoamento
  stunFailure: {
    miss: "Seu golpe não encontra a abertura certa.",
    reaction: "Ele reage antes da sua intenção virar vantagem.",
    consequence: "O quarto encolhe ao redor do erro.",
  },

  // Textos de fuga pela porta bem-sucedida
  escapeDoorSuccess: {
    opens: "Você gira a maçaneta e o corredor se abre à sua frente.",
    stunned: "Atrás de você, o homem ainda tenta recompor o corpo.",
    distracted: "Ele está ocupado demais em {target} para alcançar você a tempo.",
    escapes: "Você cruza a porta antes que o quarto consiga te prender de novo.",
  },

  // Textos de falha na fuga pela porta
  escapeDoorFailure: {
    tries: "Você tenta abrir a porta, mas ele já está perto demais.",
    fails: "O corredor desaparece antes que você consiga atravessá-lo.",
  },

  // Textos de fuga pela janela bem-sucedida
  escapeWindowSuccess: {
    breaks: "A janela cede sob sua mão.",
    jumps: "Você se joga para fora antes que o homem termine de chegar até você.",
    lampBroken: "A queda parece mais curta na escuridão.",
  },

  // Textos de falha na fuga pela janela
  escapeWindowFailure: {
    tooSlow: "A janela não abre no segundo que você precisava.",
    tooLate: "Quando o vidro enfim cede, já é tarde demais para transformar isso em fuga.",
  },

  // Textos de ações do intruso
  intruderActions: {
    switchNothing: "Ele aciona o interruptor. Nada acontece.",
    switchNotices: "Ele nota os cacos no chão e o corpo se enrijece.",
    switchLights: "Ele aciona o interruptor e o quarto se ilumina.",
    noise: "Um barulho o faz virar a cabeça na sua direção.",
  },

  // Textos de ações do jogador
  playerActions: {
    wait: "Você espera no lugar.",
    recoverBat: "Você firma o taco com mais força e espera a próxima abertura.",
    goToDoor: "Você se move em direção à porta.",
    throwSheet: "Você joga o lençol em direção ao intruso.",
    sheetDistracts: "O lençol voa na direção dele e ele se distrai por um instante.",
    sheetAlreadyStunned: "Ele já está desequilibrado. O lençol só confunde mais a situação.",
    noSheet: "Você procura o lençol, mas ele não está com você.",
    stunnedAlready: "Ele já está desequilibrado. Seu golpe só reforça a chance de fuga.",
    stunnedWaiting: "Ele ainda está cambaleando. Esperar agora só compra mais um instante.",
  },

  // Textos de erro
  errors: {
    invalidOption: "Opção inválida.",
    invalidNumber: "Por favor, digite um número válido.",
    dontKnowSpot: "Você tenta se mover, mas ainda não conhece bem esse lugar.",
    dontKnowPath: "Você tenta trocar de lugar, mas o caminho não está claro o bastante.",
    dontKnowWindow: "A janela ainda não está clara o bastante na sua mente.",
    caughtMoving: "Você se mexe para {spot}, mas ele já está olhando exatamente para lá.",
    movementDenounces: "O movimento te denuncia.",
    caughtSwitching: "Ao mudar para {spot}, você cai direto no olhar dele.",
    switchDenounces: "A troca de posição te entrega.",
    doorAlerts: "Você gira a maçaneta, mas o rangido da porta denuncia sua posição.",
    shootsAtSound: "Mesmo no escuro, ele atira na direção do som.",
    muzzleFlashes: "Os clarões das balas iluminam o quarto por um instante.",
    fallsBeforeEscape: "Você cai antes de conseguir sair.",
  },

  // Textos de UI
  ui: {
    timeRemaining: "Tempo restante:",
    options: "Opções:",
    chooseOption: "Escolha uma opção (número): ",
    playAgain: "Deseja jogar novamente? (s/n): ",
    thanks: "Obrigado por jogar!",
    gameOver: "--- FIM DE JOGO ---",
  },

  // Labels de ações
  actionLabels: {
    analyzeShelf: "Analisar: estante",
    analyzeBed: "Analisar: cama",
    analyzeCloset: "Analisar: guarda-roupa",
    analyzeDoor: "Analisar: porta",
    analyzeWindow: "Analisar: janela",
    wait: "Esperar",
    takeBat: "Pegar: taco",
    takeSheet: "Pegar: lençol",
    breakLamp: "Bater: lâmpada",
    hideBed: "Esconder-se: debaixo da cama",
    hideCloset: "Esconder-se: armário",
    hideDoor: "Esconder-se: atrás da porta",
    openDoor: "Abrir a porta",
    attack: "Bater: taco",
    useSheet: "Jogar lençol",
    switchHideout: "Esconder-se: trocar de lugar",
    escapeWindow: "Fugir: janela",
    recoverBat: "Permanecer pronto",
    goToDoor: "Ir para porta",
  },
};
