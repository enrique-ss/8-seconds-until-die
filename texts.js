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
    firstTime: "Você acorda em um quarto fechado. Tem 8 segundos antes que alguém entre.",
    repeat: "Você acorda no mesmo quarto.",
    lampBroken: "A escuridão toma o espaço.",
    lampWorking: "A luz revela os contornos do quarto.",
    allExplored: "Você já conhece tudo aqui.",
    remaining: "Você olha ao redor e vê {fragments} por explorar.",
    prompt: "O que você faz?",
  },

  // Textos de despertar após morte
  awaken: {
    door: "Você se lembra do homem correndo em sua direção e o tiro no peito. Acorda novamente.",
    found: "Você se lembra de ser encontrado sem esconderijo. Acorda novamente.",
    shot: "Você se lembra do disparo na escuridão. Acorda novamente.",
    caughtMoving: "Você se lembra de ser visto se movendo. Acorda novamente.",
    caughtSwitching: "Você se lembra de ser visto trocando de lugar. Acorda novamente.",
    stunFailed: "Você se lembra de errar o golpe com o taco. Acorda novamente.",
    doorAlert: "Você se lembra da porta rangeando e os tiros. Acorda novamente.",
    windowFailed: "Você se lembra de não conseguir escapar pela janela. Acorda novamente.",
    default: "Você acorda no mesmo quarto.",
  },

  // Textos de descoberta
  discovery: {
    shelf: "Você encontra um taco na estante.",
    bedWithSheet: "A cama tem espaço embaixo e um lençol.",
    bedWithoutSheet: "A cama tem espaço embaixo e um lençol dobrado.",
    closet: "O guarda-roupa cabe um corpo, mas a madeira pode ranger.",
    windowBroken: "A janela parece frágil na sombra.",
    windowWorking: "A janela está intacta.",
    door: "A porta parece uma saída possível.",
  },

  // Textos de abrir porta
  openDoor: {
    success: "Você abre a porta.",
    alreadyOpen: "A porta já está aberta.",
  },

  // Textos de abrir janela
  openWindow: {
    locked: "A janela está trancada.",
    alreadyOpen: "A janela já está aberta.",
    alreadyBroken: "A janela já está quebrada.",
  },

  // Textos de quebrar janela
  breakWindow: {
    success: "Você quebra a janela com o taco.",
    noBat: "Você não tem nada para quebrar a janela.",
    alreadyBroken: "A janela já está quebrada.",
  },

  // Textos de morte por abrir porta
  deathByDoor: {
    manRuns: "Um homem corre em sua direção.",
    shootsChest: "Ele te acerta com um tiro no peito.",
  },

  // Textos de pegar itens
  take: {
    bat: "Você pega o taco.",
    sheet: "Você pega o lençol.",
  },

  // Textos de quebrar lâmpada
  breakLamp: {
    alreadyBroken: "A lâmpada já está quebrada.",
    breaking: "Você quebra a lâmpada.",
  },

  // Textos de morte quando exposto
  deathExposed: {
    knobTurns: "A maçaneta gira.",
    manEnters: "Um homem entra no quarto",
    actions: {
      analyzeShelf: "e te vê. Ele atira.",
      analyzeBed: "e te vê. Ele atira.",
      analyzeCloset: "e te vê. Ele atira.",
      analyzeDoor: "e te vê. Ele atira.",
      analyzeWindow: "e te vê. Ele atira.",
      takeBat: "e te vê. Ele atira.",
      takeSheet: "e te vê. Ele atira.",
      breakLamp: "e te vê. Ele atira.",
      default: "e te vê. Ele atira.",
    },
    lampBroken: "Na escuridão, o disparo ecoa.",
  },

  // Textos de chegada do intruso
  intruderArrival: {
    enters: "Um homem entra no quarto.",
    movesTo: "Ele vai em direção {target}, ignorando {hiddenSpot}.",
    stopsAtHiding: "Ele para diante do seu esconderijo.",
  },

  // Textos de prompt do intruso
  intruderPrompt: {
    stunned: "Ele está atordoado.",
    atHidingSpot: "Ele está diante {target}.",
    goingToTarget: "Ele vai até {target}.",
    prompt: "O que você faz?",
  },

  // Textos de avanço do intruso
  intruderAdvance: {
    moves: "Ele se move de {previousTarget} para {target}.",
  },

  // Textos quando intruso erra jogador
  intruderMiss: {
    survives: "Ele passa por {previousTarget} sem te ver.",
  },

  // Textos de se esconder
  hide: {
    bedWithSheet: "Você se esconde sob a cama com o lençol.",
    bedWithoutSheet: "Você se esconde sob a cama.",
    closet: "Você se esconde no guarda-roupa.",
    door: "Você se esconde atrás da porta.",
    chair: "Você permanece na cadeira.",
  },

  // Textos de usar lençol
  sheet: {
    bed: "Você se cobre com o lençol.",
    chair: "Você se cobre com o lençol.",
    door: "Você se cobre com o lençol.",
    default: "Você se cobre com o lençol.",
  },

  // Textos de atordoamento bem-sucedido
  stunSuccess: {
    hit: "Você acerta o homem.",
    reaction: "Ele perde o equilíbrio.",
    lampBroken: "Na escuridão, ele demora a se recuperar.",
    exposed: "Ele está vulnerável.",
  },

  // Textos de falha no atordoamento
  stunFailure: {
    miss: "Você erra o golpe.",
    reaction: "Ele desvia.",
    consequence: "Ele reage.",
  },

  // Textos de fuga pela porta bem-sucedida
  escapeDoorSuccess: {
    opens: "Você abre a porta.",
    stunned: "O homem ainda está atordoado.",
    distracted: "Ele está ocupado com {target}.",
    escapes: "Você sai pelo corredor.",
  },

  // Textos de falha na fuga pela porta
  escapeDoorFailure: {
    tries: "Você tenta abrir a porta, mas ele está perto.",
    fails: "Não consegue escapar.",
  },

  // Textos de fuga pela janela bem-sucedida
  escapeWindowSuccess: {
    breaks: "Você quebra a janela.",
    jumps: "Você pula para fora.",
    lampBroken: "Você pula na escuridão.",
  },

  // Textos de falha na fuga pela janela
  escapeWindowFailure: {
    tooSlow: "A janela não abre a tempo.",
    tooLate: "É tarde demais para fugir.",
  },

  // Textos de ações do intruso
  intruderActions: {
    switchNothing: "Ele aciona o interruptor. Nada acontece.",
    switchNotices: "Ele nota os cacos no chão.",
    switchLights: "Ele aciona a luz.",
    noise: "Ele ouve um som e olha na sua direção.",
  },

  // Textos de ações do jogador
  playerActions: {
    wait: "Você espera.",
    goToDoor: "Você vai para a porta.",
    throwSheet: "Você joga o lençol nele.",
    sheetDistracts: "Ele se distrai com o lençol.",
    sheetAlreadyStunned: "Ele já está atordoado.",
    noSheet: "Você não tem o lençol.",
    stunnedAlready: "Ele já está atordoado.",
    stunnedWaiting: "Ele ainda está atordoado.",
  },

  // Textos de erro
  errors: {
    invalidOption: "Opção inválida.",
    invalidNumber: "Digite um número válido.",
    dontKnowSpot: "Você não conhece esse lugar.",
    dontKnowPath: "O caminho não está claro.",
    dontKnowWindow: "Você não conhece a janela.",
    caughtMoving: "Ele te vê se movendo para {spot}.",
    movementDenounces: "O movimento te expôs.",
    caughtSwitching: "Ele te vê mudando para {spot}.",
    switchDenounces: "A troca te expôs.",
    doorAlerts: "A porta range e ele te ouve.",
    shootsAtSound: "Ele atira na direção do som.",
    muzzleFlashes: "Os clarões iluminam o quarto.",
    fallsBeforeEscape: "Você cai antes de escapar.",
    noTime: "Você não tem tempo para outro movimento.",
  },

  // Textos de UI
  ui: {
    timeRemaining: "Tempo restante:",
    options: "Opções:",
    chooseOption: "Escolha uma opção (número): ",
    playAgain: "Deseja jogar novamente? (s/n): ",
    thanks: "Obrigado por jogar!",
    gameOver: "--- FIM DE JOGO ---",
    none: "Nenhum",
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
    openWindow: "Abrir a janela",
    breakWindow: "Quebrar janela",
    attack: "Bater: taco",
    useSheet: "Jogar lençol",
    switchHideout: "Esconder-se: trocar de lugar",
    escapeWindow: "Fugir: janela",
    goToDoor: "Ir para porta",
  },

  // Descrições de entidades para classes POO
  entities: {
    player: {
      name: "Jogador",
      description: "Você está tentando sobreviver",
    },
    intruder: {
      name: "Intruso",
      description: "Um homem armado e perigoso",
    },
    room: {
      name: "Quarto",
      description: "Um quarto fechado e escuro",
    },
    locations: {
      shelf: {
        name: "Estante",
        description: "Uma estante de madeira",
      },
      bed: {
        name: "Cama",
        description: "Uma cama com espaço embaixo",
      },
      closet: {
        name: "Guarda-roupa",
        description: "Um guarda-roupa grande",
      },
      window: {
        name: "Janela",
        description: "Uma janela quebrável",
      },
      door: {
        name: "Porta",
        description: "Uma porta de saída",
      },
      chair: {
        name: "Cadeira",
        description: "Uma cadeira no centro",
      },
    },
    items: {
      bat: {
        name: "Taco de beisebol",
        description: "Um taco de beisebol",
      },
      sheet: {
        name: "Lençol",
        description: "Um lençol para se cobrir",
      },
    },
  },
};
