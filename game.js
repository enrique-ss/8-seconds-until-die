const readline = require('readline');
const MAX_TIME = 8;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

const DEFAULT_KNOWLEDGE = {
  shelfExamined: false,
  batKnown: false,
  bedExamined: false,
  sheetKnown: false,
  bedHidingKnown: false,
  closetExamined: false,
  closetHidingKnown: false,
  windowSeen: false,
  windowHidingKnown: false,
  doorHeard: false,
  doorHidingKnown: false,
};

class KnowledgeStore {
  constructor(defaults) {
    this.defaults = defaults;
    this.data = { ...defaults };
  }

  load() {
    return { ...this.data };
  }

  save(value) {
    this.data = { ...value };
  }
}

class Player {
  constructor() {
    this.hiddenSpot = "chair";
    this.reset();
  }

  reset() {
    this.coveredWithSheet = false;
    this.hasBat = false;
    this.hasSheet = false;
    // Don't reset hiddenSpot - preserve hiding state across exploration actions
  }

  hideAt(spot) {
    this.hiddenSpot = spot;
  }

  has(item) {
    return Boolean(this[item]);
  }

  gain(item) {
    this[item] = true;
  }
}

class Room {
  constructor() {
    this.resetRun();
  }

  resetRun() {
    this.lampBroken = false;
    this.features = {
      shelf: false,
      bed: false,
      closet: false,
      window: false,
      door: false,
    };
  }

  discover(feature) {
    this.features[feature] = true;
  }

  knows(feature) {
    return Boolean(this.features[feature]);
  }
}

class Intruder {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.stunned = false;
    this.plan = [];
    this.planIndex = 0;
    this.currentTarget = "door";
  }

  enter(game) {
    this.active = true;
    this.stunned = false;

    if (game.player.hiddenSpot === "chair") {
      return {
        type: "death",
        lines: game.narrator.intruderKillsExposedPlayer(game),
      };
    }

    this.plan = this.buildPlan(game);
    this.planIndex = 0;
    this.currentTarget = this.plan[0];

    return {
      type: "arrival",
      lines: game.narrator.intruderArrival(game, this.currentTarget),
    };
  }

  buildPlan(game) {
    const hidden = game.player.hiddenSpot;
    const plan = [];

    // If lamp is broken and player is hidden, intruder goes to light switch first
    if (game.room.lampBroken && hidden !== "chair") {
      plan.push("lightSwitch");
    } else {
      if (hidden === "bed") {
        plan.push("closet");
      } else if (hidden === "closet") {
        plan.push("bed");
      } else if (hidden === "door") {
        plan.push("closet");
      } else {
        plan.push("closet");
      }

      if (game.room.knows("window")) {
        plan.push("window");
      }

      plan.push("door");
      plan.push(hidden);
    }

    return [...new Set(plan)];
  }

  advance() {
    if (this.stunned) {
      return this.currentTarget;
    }

    this.planIndex = Math.min(this.planIndex + 1, this.plan.length - 1);
    this.currentTarget = this.plan[this.planIndex];
    return this.currentTarget;
  }

  get targetName() {
    return this.currentTarget;
  }
}

class Narrator {
  describeSpot(spot) {
    if (spot === "bed") return "debaixo da cama";
    if (spot === "closet") return "dentro do armário";
    if (spot === "door") return "atrás da porta";
    return "na cadeira";
  }

  describeTarget(target) {
    if (target === "bed") return "cama";
    if (target === "closet") return "guarda-roupa";
    if (target === "window") return "janela";
    if (target === "door") return "porta";
    if (target === "lightSwitch") return "interruptor de luz";
    return "centro do quarto";
  }

  describeTargetAsObject(target) {
    if (target === "bed") return "a cama";
    if (target === "closet") return "o guarda-roupa";
    if (target === "window") return "a janela";
    if (target === "door") return "a porta";
    if (target === "lightSwitch") return "o interruptor de luz";
    return "o centro do quarto";
  }

  describeTargetAfterPreposition(target) {
    if (target === "bed") return "à cama";
    if (target === "closet") return "ao guarda-roupa";
    if (target === "window") return "à janela";
    if (target === "door") return "à porta";
    if (target === "lightSwitch") return "ao interruptor de luz";
    return "ao centro do quarto";
  }

  opening(game) {
    const lines = [];
    const knownCount = Object.values(game.knowledge).filter(Boolean).length;
    lines.push(
      knownCount > 0
        ? "Você acorda no mesmo quarto de sempre, mas ele já não parece totalmente desconhecido."
        : "Você acorda em um quarto fechado. Você tem apenas 8 segundos antes que alguém entre."
    );

    if (game.room.lampBroken) {
      lines.push("A escuridão já toma parte do espaço; as bordas das coisas parecem instáveis.");
    } else {
      lines.push("A luz ainda revela o contorno das coisas que você talvez não consiga tocar por muito tempo.");
    }

    lines.push(this.explorationPrompt(game));
    return lines;
  }

  explorationPrompt(game) {
    const fragments = [];
    if (!game.room.knows("shelf")) fragments.push("a estante");
    if (!game.room.knows("bed")) fragments.push("a cama");
    if (!game.room.knows("closet")) fragments.push("o guarda-roupa");
    if (!game.room.knows("window")) fragments.push("a janela");
    if (!game.room.knows("door")) fragments.push("a porta");

    if (fragments.length === 0) {
      return "Tudo ao redor já foi tocado pelo seu olhar. O que você faz agora?";
    }

    return `Ainda restam ${fragments.join(", ")} à sua volta. O que você faz?`;
  }

  discoveryLine(kind, game) {
    if (kind === "shelf") {
      return game.knowledge.shelfExamined
        ? "Você confere a estante e encontrou um taco. Talvez seja útil."
        : "Você confere a estante e encontrou um taco. Talvez seja útil.";
    }

    if (kind === "bed") {
      return game.player.hasSheet
        ? "A cama oferece espaço embaixo e o lençol que pode abafar seus movimentos."
        : "A cama mostra um vazio embaixo dela e um lençol dobrado ao alcance da mão.";
    }

    if (kind === "closet") {
      return "O guarda-roupa cabe um corpo, mas a madeira avisa que não vai guardar silêncio de graça.";
    }

    if (kind === "window") {
      return game.room.lampBroken
        ? "Na sombra, a janela parece mais frágil do que antes."
        : "A janela está ali, esperando alguém decidir se ela é saída ou armadilha.";
    }

    if (kind === "door") {
      return "A porta parece o tipo de saída que só funciona no segundo exato.";
    }

    return "";
  }

  takeLine(item) {
    if (item === "bat") {
      return "Você pega o taco de beisebol da estante.";
    }

    if (item === "sheet") {
      return "Você puxa o lençol da cama e o peso do tecido vira mais uma possibilidade.";
    }

    return "";
  }

  breakLampLine(game) {
    return game.room.lampBroken
      ? "O vidro já não segura a luz; o quarto inteiro fica com bordas duras e sombras curtas."
      : "O vidro estoura no teto e a luz se quebra junto com ele.";
  }

  intruderKillsExposedPlayer(game) {
    const lines = [];
    const action = game.currentAction;
    
    if (action) {
      if (action.key === "analyzeShelf") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você vasculhando a estante e dispara sem remorso.");
      } else if (action.key === "analyzeBed") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você examinando a cama e dispara sem hesitação.");
      } else if (action.key === "analyzeCloset") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você inspecionando o guarda-roupa e dispara friamente.");
      } else if (action.key === "analyzeDoor") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você estudando a porta e dispara sem piedade.");
      } else if (action.key === "analyzeWindow") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você olhando pela janela e dispara impiedosamente.");
      } else if (action.key === "takeBat") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você pegando o taco e dispara antes que você possa reagir.");
      } else if (action.key === "takeSheet") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você pegando o lençol e dispara sem compaixão.");
      } else if (action.key === "breakLamp") {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você com o taco erguido e dispara sem dar chance.");
      } else {
        lines.push("A maçaneta gira.");
        lines.push("Um homem entra no quarto, vê você sentado na cadeira e dispara em seu peito.");
      }
    } else {
      lines.push("A maçaneta gira.");
      lines.push("Um homem entra no quarto, vê você sentado na cadeira e dispara em seu peito.");
    }
    
    if (game.room.lampBroken) {
      lines.push("Na sombra, o disparo parece ainda mais seco.");
    }
    return lines;
  }

  intruderArrival(game, target) {
    const lines = [];
    const hiddenSpot = this.describeSpot(game.player.hiddenSpot);

    lines.push("Um homem entra no quarto, furioso.");
    lines.push(
      `Ele varre o espaço à sua volta e segue em direção ${this.describeTargetAfterPreposition(target)}, deixando ${hiddenSpot} fora do primeiro olhar.`
    );

    if (target === game.player.hiddenSpot) {
      lines.push(`O corpo dele para exatamente diante do seu esconderijo.`);
    }

    lines.push(this.intruderPrompt(game));
    return lines;
  }

  intruderPrompt(game) {
    if (game.intruder.stunned) {
      return "Ele cambaleia. Agora é a sua chance. O que você faz?";
    }

    if (game.intruder.targetName === game.player.hiddenSpot) {
      return `Ele está diante ${this.describeTargetAfterPreposition(game.player.hiddenSpot)}. O que você faz?`;
    }

    return `Ele vai até ${this.describeTargetAsObject(game.intruder.targetName)}. O que você faz?`;
  }

  intruderAdvance(game, target) {
    return [
      `Ele deixa ${this.describeTargetAsObject(game.intruder.previousTarget)} para trás e se move até ${this.describeTargetAsObject(target)}.`,
      this.intruderPrompt(game),
    ];
  }

  intruderMiss(game) {
    return [
      `Sua cobertura sustenta o primeiro olhar dele enquanto ele passa por ${this.describeTargetAsObject(game.intruder.previousTarget)}.`,
      this.intruderPrompt(game),
    ];
  }

  hideLine(spot, covered) {
    if (spot === "bed") {
      return covered
        ? "Você se afunda sob a cama e o lençol ajuda a dissolver sua silhueta."
        : "Você se arrasta para debaixo da cama, tentando ocupar o mínimo de espaço possível.";
    }

    if (spot === "closet") {
      return "Você se encolhe dentro do guarda-roupa. A madeira reclama, mas ainda aguenta.";
    }

    if (spot === "door") {
      return "Você se coloca atrás da porta, usando o vão como seu escudo.";
    }

    return "Você permanece parado, esperando a próxima brecha.";
  }

  sheetLine(spot) {
    if (spot === "bed") {
      return "O lençol cai sobre você e a cama deixa de parecer um lugar fácil de vasculhar.";
    }

    if (spot === "chair") {
      return "O lençol encobre seu corpo de um jeito improvisado, como se fosse uma cortina mal amarrada.";
    }

    if (spot === "door") {
      return "O lençol se estende atrás da porta, disfarçando sua silhueta contra a madeira.";
    }

    return "O lençol não resolve tudo, mas muda a textura da sua presença no quarto.";
  }

  stunSuccess(game) {
    const lines = [];
    lines.push("O taco encontra o homem antes que ele entenda de onde veio o golpe.");
    lines.push("Ele perde o eixo por um instante e o revólver desce com a mão vacilando.");
    if (game.room.lampBroken) {
      lines.push("Na penumbra, o corpo dele demora ainda mais para recuperar forma.");
    }
    lines.push("Agora ele está exposto o suficiente para você tentar sair.");
    return lines;
  }

  stunFailure(game) {
    return [
      "Seu golpe não encontra a abertura certa.",
      "Ele reage antes da sua intenção virar vantagem.",
      "O quarto encolhe ao redor do erro.",
    ];
  }

  escapeDoorSuccess(game) {
    const lines = [];
    lines.push("Você gira a maçaneta e o corredor se abre à sua frente.");
    if (game.intruder.stunned) {
      lines.push("Atrás de você, o homem ainda tenta recompor o corpo.");
    } else {
      lines.push(
        `Ele está ocupado demais em ${this.describeTarget(game.intruder.targetName)} para alcançar você a tempo.`
      );
    }
    lines.push("Você cruza a porta antes que o quarto consiga te prender de novo.");
    return lines;
  }

  escapeDoorFailure(game) {
    return [
      "Você tenta abrir a porta, mas ele já está perto demais.",
      "O corredor desaparece antes que você consiga atravessá-lo.",
    ];
  }

  escapeWindowSuccess(game) {
    const lines = [];
    lines.push("A janela cede sob sua mão.");
    lines.push("Você se joga para fora antes que o homem termine de chegar até você.");
    if (game.room.lampBroken) {
      lines.push("A queda parece mais curta na escuridão.");
    }
    return lines;
  }

  escapeWindowFailure() {
    return [
      "A janela não abre no segundo que você precisava.",
      "Quando o vidro enfim cede, já é tarde demais para transformar isso em fuga.",
    ];
  }
}

class Action {
  constructor({ key, slot, phases, cost, once, visible, label, run }) {
    this.key = key;
    this.slot = slot;
    this.phases = phases;
    this.cost = cost;
    this.once = once;
    this.visible = visible;
    this.label = label;
    this.run = run;
    this.used = false;
  }

  reset() {
    this.used = false;
  }

  isVisible(game) {
    return this.phases.includes(game.phase) && (!this.once || !this.used) && this.visible(game);
  }

  getLabel(game) {
    return `${this.slot}. ${this.label(game)}`;
  }
}

class Game {
  constructor() {
    this.knowledgeStore = new KnowledgeStore(DEFAULT_KNOWLEDGE);
    this.knowledge = this.knowledgeStore.load();
    this.player = new Player();
    this.room = new Room();
    this.intruder = new Intruder();
    this.narrator = new Narrator();
    this.actions = this.createActions();
    this.actionMap = new Map(this.actions.map((action) => [action.key, action]));
    this.phase = "exploration";
    this.timeLeft = MAX_TIME;
    this.gameOver = false;
    this.currentAction = null;

    this.slotMaps = {
      exploration: [
        "analyzeShelf",
        "analyzeBed",
        "analyzeCloset",
        "analyzeDoor",
        "analyzeWindow",
        "wait",
        "takeBat",
        "takeSheet",
        "breakLamp",
        "hideBed",
        "hideCloset",
        "hideDoor",
      ],
      intruder: [
        "hideBed",
        "hideCloset",
        "hideDoor",
        "openDoor",
        "attack",
        "switchHideout",
        "useSheet",
        "escapeWindow",
        "recoverBat",
        "goToDoor",
      ],
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.resetRun();
  }

  createActions() {
    return [
      new Action({
        key: "analyzeShelf",
        slot: 1,
        phases: ["exploration"],
        cost: 2.8,
        once: true,
        visible: (game) => !game.knowledge.shelfExamined,
        label: () => "Analisar: estante",
        run: (game) => {
          game.room.discover("shelf");
          game.knowledge.shelfExamined = true;
          game.knowledge.batKnown = true;
          game.knowledgeStore.save(game.knowledge);
          game.logLines(game.narrator.discoveryLine("shelf", game));
        },
      }),
      new Action({
        key: "analyzeBed",
        slot: 2,
        phases: ["exploration"],
        cost: 2.4,
        once: true,
        visible: (game) => !game.knowledge.bedExamined,
        label: () => "Analisar: cama",
        run: (game) => {
          game.room.discover("bed");
          game.knowledge.bedExamined = true;
          game.knowledge.sheetKnown = true;
          game.knowledge.bedHidingKnown = true;
          game.knowledgeStore.save(game.knowledge);
          game.logLines(game.narrator.discoveryLine("bed", game));
        },
      }),
      new Action({
        key: "analyzeCloset",
        slot: 3,
        phases: ["exploration"],
        cost: 2.6,
        once: true,
        visible: (game) => !game.knowledge.closetExamined,
        label: () => "Analisar: guarda-roupa",
        run: (game) => {
          game.room.discover("closet");
          game.knowledge.closetExamined = true;
          game.knowledge.closetHidingKnown = true;
          game.knowledgeStore.save(game.knowledge);
          game.logLines(game.narrator.discoveryLine("closet", game));
        },
      }),
      new Action({
        key: "analyzeDoor",
        slot: 4,
        phases: ["exploration"],
        cost: 2.0,
        once: true,
        visible: (game) => !game.knowledge.doorHeard,
        label: () => "Analisar: porta",
        run: (game) => {
          game.room.discover("door");
          game.knowledge.doorHeard = true;
          game.knowledge.doorHidingKnown = true;
          game.knowledgeStore.save(game.knowledge);
          game.logLines(game.narrator.discoveryLine("door", game));
        },
      }),
      new Action({
        key: "analyzeWindow",
        slot: 5,
        phases: ["exploration"],
        cost: 2.2,
        once: true,
        visible: (game) => !game.knowledge.windowSeen,
        label: () => "Analisar: janela",
        run: (game) => {
          game.room.discover("window");
          game.knowledge.windowSeen = true;
          game.knowledge.windowHidingKnown = true;
          game.knowledgeStore.save(game.knowledge);
          game.logLines(game.narrator.discoveryLine("window", game));
        },
      }),
      new Action({
        key: "wait",
        slot: 6,
        phases: ["exploration", "intruder"],
        cost: 0,
        once: true,
        visible: (game) => !game.actionMap?.get("wait")?.used,
        label: () => "Esperar",
        run: (game) => {
          if (game.phase === "exploration") {
            game.actionMap.get("wait").used = true;
            game.logLine("Você espera no lugar.");
            game.timeLeft = 0;
            game.enterIntruderPhase();
            return;
          }

          game.resolveIntruderAdvance("wait");
        },
      }),
      new Action({
        key: "takeBat",
        slot: 7,
        phases: ["exploration"],
        cost: 2.0,
        once: true,
        visible: (game) => game.knowledge.batKnown && !game.player.hasBat,
        label: () => "Pegar: taco",
        run: (game) => {
          game.player.gain("hasBat");
          game.knowledgeStore.save(game.knowledge);
          game.logLine(game.narrator.takeLine("bat"));
        },
      }),
      new Action({
        key: "takeSheet",
        slot: 8,
        phases: ["exploration"],
        cost: 2.0,
        once: true,
        visible: (game) => game.knowledge.sheetKnown && !game.player.hasSheet,
        label: () => "Pegar: lençol",
        run: (game) => {
          game.player.gain("hasSheet");
          game.knowledgeStore.save(game.knowledge);
          game.logLine(game.narrator.takeLine("sheet"));
        },
      }),
      new Action({
        key: "breakLamp",
        slot: 9,
        phases: ["exploration"],
        cost: 2.4,
        once: true,
        visible: (game) => game.player.hasBat && !game.room.lampBroken,
        label: () => "Bater: lâmpada",
        run: (game) => {
          game.room.lampBroken = true;
          game.logLine(game.narrator.breakLampLine(game));
        },
      }),
      new Action({
        key: "hideBed",
        slot: 1,
        phases: ["exploration", "intruder"],
        cost: 1.5,
        once: true,
        visible: (game) => game.knowledge.bedHidingKnown,
        label: () => "Esconder-se: debaixo da cama",
        run: (game) => {
          if (game.phase === "exploration") {
            game.player.hideAt("bed");
            game.logLine(game.narrator.hideLine("bed", game.player.coveredWithSheet));
          } else {
            game.resolveIntruderHide("bed");
          }
        },
      }),
      new Action({
        key: "hideCloset",
        slot: 2,
        phases: ["exploration", "intruder"],
        cost: 1.5,
        once: true,
        visible: (game) => game.knowledge.closetHidingKnown,
        label: () => "Esconder-se: armário",
        run: (game) => {
          if (game.phase === "exploration") {
            game.player.hideAt("closet");
            game.logLine(game.narrator.hideLine("closet", game.player.coveredWithSheet));
          } else {
            game.resolveIntruderHide("closet");
          }
        },
      }),
      new Action({
        key: "hideDoor",
        slot: 3,
        phases: ["exploration", "intruder"],
        cost: 1.0,
        once: true,
        visible: (game) => game.knowledge.doorHidingKnown,
        label: () => "Esconder-se: atrás da porta",
        run: (game) => {
          if (game.phase === "exploration") {
            game.player.hideAt("door");
            game.logLine(game.narrator.hideLine("door", game.player.coveredWithSheet));
          } else {
            game.resolveIntruderHide("door");
          }
        },
      }),
      new Action({
        key: "openDoor",
        slot: 4,
        phases: ["intruder"],
        cost: 0,
        once: false,
        visible: () => true,
        label: () => "Abrir a porta",
        run: (game) => {
          game.resolveIntruderOpenDoor();
        },
      }),
      new Action({
        key: "attack",
        slot: 5,
        phases: ["intruder"],
        cost: 0,
        once: false,
        visible: (game) => game.player.hasBat,
        label: () => "Bater: taco",
        run: (game) => {
          game.resolveIntruderAttack();
        },
      }),
      new Action({
        key: "useSheet",
        slot: 7,
        phases: ["intruder"],
        cost: 0,
        once: false,
        visible: (game) => game.player.hasSheet,
        label: () => "Jogar lençol",
        run: (game) => {
          game.resolveThrowSheet();
        },
      }),
      new Action({
        key: "switchHideout",
        slot: 6,
        phases: ["intruder"],
        cost: 0,
        once: false,
        visible: () => true,
        label: () => "Esconder-se: trocar de lugar",
        run: (game) => {
          const spots = ["bed", "closet", "door"];
          const currentIndex = spots.indexOf(game.player.hiddenSpot);
          const next = spots[(currentIndex + 1) % spots.length];
          game.resolveIntruderMove(next);
        },
      }),
      new Action({
        key: "escapeWindow",
        slot: 8,
        phases: ["intruder"],
        cost: 0,
        once: false,
        visible: (game) => game.knowledge.windowHidingKnown,
        label: () => "Fugir: janela",
        run: (game) => {
          game.resolveWindowEscape();
        },
      }),
      new Action({
        key: "recoverBat",
        slot: 9,
        phases: ["intruder"],
        cost: 0,
        once: false,
        visible: (game) => game.player.hasBat,
        label: () => "Permanecer pronto",
        run: (game) => {
          game.logLine("Você firma o taco com mais força e espera a próxima abertura.");
          game.resolveIntruderAdvance("hold");
        },
      }),
      new Action({
        key: "goToDoor",
        slot: 10,
        phases: ["intruder"],
        cost: 0,
        once: false,
        visible: () => true,
        label: () => "Ir para porta",
        run: (game) => {
          game.resolveGoToDoor();
        },
      }),
    ];
  }

  currentSlotKeys() {
    return this.slotMaps[this.phase];
  }

  getActionBySlot(slot) {
    const key = this.currentSlotKeys()[slot - 1];
    return key ? this.actionMap.get(key) : null;
  }

  getAction(key) {
    return this.actionMap.get(key);
  }

  logLine(text, kind = "entry") {
    if (kind === "danger") {
      console.log(colorize(text, colors.red));
    } else if (kind === "system") {
      console.log(colorize(text, colors.green));
    } else if (kind === "intruder") {
      console.log(colorize(text, colors.magenta));
    } else {
      console.log(text);
    }
  }

  logLines(lines, kind = "entry") {
    const queue = Array.isArray(lines) ? lines : [lines];
    queue.filter(Boolean).forEach((line) => this.logLine(line, kind));
  }

  renderClock() {
    if (this.phase === "intruder") {
      return;
    }
    const time = Math.max(0, this.timeLeft).toFixed(1);
    const timeColor = this.timeLeft <= 2 ? colors.red : colors.yellow;
    console.log(`\n${colorize('Tempo restante:', colors.cyan)} ${colorize(time + 's', timeColor)}\n`);
  }

  renderChoices() {
    if (this.gameOver) {
      return;
    }
    const visibleActions = this.getVisibleActions();
    console.log(colorize("\nOpções:", colors.bright));
    visibleActions.forEach((action, index) => {
      const optionNumber = colorize(`${index + 1}.`, colors.cyan);
      console.log(`${optionNumber} ${action.label(this)}`);
    });
    console.log();
  }

  getVisibleActions() {
    const keys = this.currentSlotKeys();
    const visible = [];
    keys.forEach((key) => {
      const action = this.getAction(key);
      if (action && action.isVisible(this)) {
        visible.push(action);
      }
    });
    return visible;
  }

  resetActionUsage() {
    this.actions.forEach((action) => action.reset());
  }

  resetRun() {
    this.phase = "exploration";
    this.timeLeft = MAX_TIME;
    this.gameOver = false;
    this.currentAction = null;
    this.player.reset();
    this.room.resetRun();
    this.intruder.reset();
    this.resetActionUsage();
    
    // Restore player's hidden spot from previous run if they were hidden
    // This allows exploration actions to not unhide the player
    this.logLines(this.narrator.opening(this));
    this.renderClock();
    this.renderChoices();
    this.promptInput();
  }

  consumeTime(amount) {
    if (amount <= 0 || this.gameOver) {
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - amount);
  }

  endGame(lines, kind = "danger") {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.logLines(lines, kind);
    this.renderClock();
    console.log(colorize("\n--- FIM DE JOGO ---\n", colors.bright));
    this.promptRestart();
  }

  enterIntruderPhase() {
    const outcome = this.intruder.enter(this);
    if (outcome.type === "death") {
      this.endGame(outcome.lines);
      return;
    }

    this.phase = "intruder";
    this.logLines(outcome.lines, "intruder");
  }

  advanceIntruderSearch() {
    if (this.intruder.stunned) {
      this.logLine(this.narrator.intruderPrompt(this));
      return;
    }

    const current = this.intruder.targetName;
    if (current === this.player.hiddenSpot) {
      if (this.player.coveredWithSheet) {
        this.player.coveredWithSheet = false;
        this.intruder.previousTarget = current;
        const next = this.intruder.advance();
        this.logLines(this.narrator.intruderMiss(this));
        this.logLine(this.narrator.intruderPrompt(this));
        return;
      }

      this.endGame([
        `Ele chega exatamente à ${this.narrator.describeTarget(this.player.hiddenSpot)}.`,
        "Você não tem tempo para outro movimento.",
      ]);
      return;
    }

    this.intruder.previousTarget = current;
    const next = this.intruder.advance();
    this.logLines(this.narrator.intruderAdvance(this, next));
  }

  resolveIntruderAdvance(reason) {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (reason === "wait" && this.intruder.stunned) {
      this.logLine("Ele ainda está cambaleando. Esperar agora só compra mais um instante.");
      this.logLine(this.narrator.intruderPrompt(this));
      return;
    }

    this.advanceIntruderSearch();
    if (!this.gameOver) {
      this.logLine(this.narrator.intruderPrompt(this));
    }
  }

  resolveIntruderHide(nextSpot) {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.room.knows(nextSpot)) {
      this.logLine("Você tenta se mover, mas ainda não conhece bem esse lugar.");
      return;
    }

    if (!this.intruder.stunned && this.intruder.targetName === nextSpot) {
      this.endGame([
        `Você se mexe para ${this.narrator.describeSpot(nextSpot)}, mas ele já está olhando exatamente para lá.`,
        "O movimento te denuncia.",
      ]);
      return;
    }

    this.player.hideAt(nextSpot);
    this.logLine(this.narrator.hideLine(nextSpot, this.player.coveredWithSheet));
    this.logLine(this.narrator.intruderPrompt(this));
  }

  resolveIntruderMove(nextSpot) {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.room.knows(nextSpot)) {
      this.logLine("Você tenta trocar de lugar, mas o caminho não está claro o bastante.");
      return;
    }

    if (!this.intruder.stunned && this.intruder.targetName === nextSpot) {
      this.endGame([
        `Ao mudar para ${this.narrator.describeSpot(nextSpot)}, você cai direto no olhar dele.`,
        "A troca de posição te entrega.",
      ]);
      return;
    }

    this.player.hideAt(nextSpot);
    this.logLine(this.narrator.hideLine(nextSpot, this.player.coveredWithSheet));
    this.logLine(this.narrator.intruderPrompt(this));
  }

  resolveIntruderAttack() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    const target = this.intruder.targetName;
    const spot = this.player.hiddenSpot;

    if (this.intruder.stunned) {
      this.logLine("Ele já está desequilibrado. Seu golpe só reforça a chance de fuga.");
      this.logLine(this.narrator.intruderPrompt(this));
      return;
    }

    if (target !== spot && !(spot === "chair" && target === "door")) {
      this.endGame(this.narrator.stunFailure(this));
      return;
    }

    this.intruder.stunned = true;
    this.logLines(this.narrator.stunSuccess(this));
    this.logLine(this.narrator.intruderPrompt(this));
  }

  resolveIntruderOpenDoor() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (this.intruder.stunned) {
      this.endGame(this.narrator.escapeDoorSuccess(this), "system");
      return;
    }

    // If intruder is not stunned, opening the door alerts them
    this.endGame([
      "Você gira a maçaneta, mas o rangido da porta denuncia sua posição.",
      "Mesmo no escuro, ele atira na direção do som.",
      "Os clarões das balas iluminam o quarto por um instante.",
      "Você cai antes de conseguir sair.",
    ]);
  }

  resolveUseSheet() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.player.hasSheet) {
      this.logLine("Você procura o lençol, mas ele não está com você.");
      return;
    }

    this.player.coveredWithSheet = true;
    this.logLine(this.narrator.sheetLine(this.player.hiddenSpot));
    this.logLine(this.narrator.intruderPrompt(this));
  }

  resolveThrowSheet() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.player.hasSheet) {
      this.logLine("Você procura o lençol, mas ele não está com você.");
      return;
    }

    this.player.hasSheet = false;
    this.logLine("Você joga o lençol em direção ao intruso.");
    
    if (this.intruder.stunned) {
      this.logLine("Ele já está desequilibrado. O lençol só confunde mais a situação.");
      this.logLine(this.narrator.intruderPrompt(this));
      return;
    }

    // Sheet throw distracts the intruder
    this.logLine("O lençol voa na direção dele e ele se distrai por um instante.");
    this.intruder.stunned = true;
    this.logLine(this.narrator.intruderPrompt(this));
  }

  resolveGoToDoor() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    this.player.hideAt("door");
    this.logLine("Você se move em direção à porta.");
    this.logLine(this.narrator.intruderPrompt(this));
  }

  resolveWindowEscape() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.room.knows("window")) {
      this.logLine("A janela ainda não está clara o bastante na sua mente.");
      return;
    }

    if (this.intruder.stunned || this.intruder.targetName !== "window") {
      this.endGame(this.narrator.escapeWindowSuccess(this), "system");
      return;
    }

    this.endGame(this.narrator.escapeWindowFailure());
  }

  handleSlot(slot) {
    if (this.gameOver) {
      return;
    }

    const visibleActions = this.getVisibleActions();
    const action = visibleActions[slot - 1];
    
    if (!action) {
      console.log("Opção inválida.");
      this.promptInput();
      return;
    }

    // Track current action for contextual death messages
    this.currentAction = action;

    if (action.once) {
      action.used = true;
    }

    this.consumeTime(action.cost);
    if (this.gameOver) {
      return;
    }

    action.run(this);

    if (!this.gameOver && this.phase === "exploration" && this.timeLeft <= 0) {
      this.enterIntruderPhase();
      return;
    }

    if (this.phase === "intruder") {
      this.renderChoices();
      this.promptInput();
      return;
    }

    this.renderClock();
    this.renderChoices();
    this.promptInput();
  }

  promptInput() {
    this.rl.question(colorize("Escolha uma opção (número): ", colors.gray), (answer) => {
      const slot = parseInt(answer);
      if (isNaN(slot)) {
        console.log(colorize("Por favor, digite um número válido.", colors.red));
        this.promptInput();
        return;
      }
      this.handleSlot(slot);
    });
  }

  promptRestart() {
    this.rl.question(colorize("\nDeseja jogar novamente? (s/n): ", colors.gray), (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
        this.resetRun();
      } else {
        console.log(colorize("Obrigado por jogar!", colors.green));
        this.rl.close();
        process.exit(0);
      }
    });
  }
}

const game = new Game();
