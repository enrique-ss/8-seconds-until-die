const readline = require('readline');
const texts = require('./texts.js');
const phase1Actions = require('./phase_1.js');
const phase2Actions = require('./phase_2.js');
// Tempo máximo em segundos antes do intruso entrar
const MAX_TIME = 8;

// Custo de ruído de cada ação para o intruso
const NOISE_COSTS = {
  hideBed: 1,
  hideCloset: 2,
  hideDoor: 1,
  switchHideout: 2,
  openDoor: 3,
  attack: 2,
  useSheet: 0,
  throwSheet: 2,
  escapeWindow: 3,
  recoverBat: 0,
  wait: 0,
  goToDoor: 1,
  breakLamp: 3,
};

// Códigos de cores ANSI para o terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  white: '\x1b[37m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Códigos de estilo ANSI
const styles = {
  bold: '\x1b[1m',
  italic: '\x1b[3m',
  reset: '\x1b[0m',
};

// Aplica cor ao texto
function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

// Aplica estilo ao texto
function stylize(text, style) {
  return `${style}${text}${styles.reset}`;
}

// Aplica cor e estilo ao texto
function colorizeAndStylize(text, color, style) {
  return `${color}${style}${text}${styles.reset}${colors.reset}`;
}

// Estado inicial de conhecimento do jogador sobre o quarto
const DEFAULT_KNOWLEDGE = {
  shelfExamined: false,    // Se estante já foi analisada
  batKnown: false,         // Se jogador sabe do taco na estante
  bedExamined: false,      // Se cama já foi analisada
  sheetKnown: false,       // Se jogador sabe do lençol na cama
  bedHidingKnown: false,   // Se jogador sabe que pode se esconder na cama
  closetExamined: false,   // Se guarda-roupa já foi analisado
  closetHidingKnown: false,// Se jogador sabe que pode se esconder no armário
  windowSeen: false,       // Se janela já foi vista
  windowHidingKnown: false,// Se jogador sabe que pode se esconder na janela
  doorHeard: false,        // Se porta já foi ouvida
  doorHidingKnown: false,  // Se jogador sabe que pode se esconder atrás da porta
};

// Armazena conhecimento do jogador entre partidas
class KnowledgeStore {
  constructor(defaults) {
    this.defaults = defaults;
    this.data = { ...defaults };
  }

// Carrega conhecimento salvo
  load() {
    return { ...this.data };
  }

// Salva conhecimento atual
  save(value) {
    this.data = { ...value };
  }
}

// Gerencia estado e itens do jogador
class Player {
  constructor() {
    this.hiddenSpot = "chair";
    this.reset();
  }

  reset() {
    this.coveredWithSheet = false;
    this.hasBat = false;
    this.hasSheet = false;
    // Não reseta posição escondida para manter estado entre ações
  }

// Define onde jogador está escondido
  hideAt(spot) {
    this.hiddenSpot = spot;
  }

// Verifica se jogador possui item
  has(item) {
    return Boolean(this[item]);
  }

// Adiciona item ao inventário
  gain(item) {
    this[item] = true;
  }
}

// Gerencia estado do quarto e objetos descobertos
class Room {
  constructor() {
    this.resetRun();
  }

// Reseta estado do quarto para nova partida
  resetRun() {
    this.lampBroken = false;
    this.features = {
      shelf: false,    // Se estante foi descoberta
      bed: false,      // Se cama foi descoberta
      closet: false,   // Se armário foi descoberto
      window: false,   // Se janela foi descoberta
      door: false,     // Se porta foi descoberta
    };
  }

// Marca objeto como descoberto
  discover(feature) {
    this.features[feature] = true;
  }

// Verifica se objeto já foi descoberto
  knows(feature) {
    return Boolean(this.features[feature]);
  }
}

// Gerencia IA do intruso e comportamento de busca
class Intruder {
  constructor() {
    this.reset();
  }

// Reseta estado do intruso para nova partida
  reset() {
    this.active = false;      // Se intruso está ativo no quarto
    this.stunned = false;     // Se intruso está atordoado
    this.plan = [];           // Plano de busca pelo quarto
    this.planIndex = 0;       // Posição atual no plano
    this.currentTarget = "door"; // Onde intruso está indo agora
    this.alert = false;       // Se intruso está em estado de alerta
    this.triedSwitch = false; // Se já tentou interruptor de luz
    this.suspicion = 0;       // Nível de suspeita de ruído
  }

// Faz intruso entrar no quarto
  enter(game) {
    this.active = true;
    this.stunned = false;

    // Se jogador não se escondeu, morre imediatamente
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

    // Se a lâmpada está quebrada, intruso vai ao interruptor primeiro
    if (game.room.lampBroken && !this.triedSwitch && hidden !== "chair") {
      plan.push("lightSwitch");
    }

    // Define ordem de busca baseada na posição do jogador
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

    return [...new Set(plan)];
  }

// Avança para próximo alvo no plano de busca
  advance() {
    if (this.stunned) {
      return this.currentTarget;
    }

    this.planIndex = Math.min(this.planIndex + 1, this.plan.length - 1);
    this.currentTarget = this.plan[this.planIndex];
    return this.currentTarget;
  }

  step(game) {
    // Trata estágio do interruptor de luz
    if (this.currentTarget === "lightSwitch") {
      this.triedSwitch = true;
      if (game.room.lampBroken) {
        this.alert = true;
        this.suspicion += 2;
      }
      this.plan = this.buildPlan(game);
      this.planIndex = 0;
      this.currentTarget = this.plan[0];
      return;
    }

    // Avança normalmente pelo plano de busca
    this.advance();
  }

// Registra ruído feito pelo jogador e aumenta suspeita
  registerNoise(game, actionKey) {
    const base = NOISE_COSTS[actionKey] ?? 1;
    const bonus = this.alert ? 1 : 0;
    this.suspicion += base + bonus;

    // Se suspeita passa do limite, intruso vai direto ao jogador
    const threshold = this.alert ? 3 : 5;
    if (this.suspicion >= threshold && !this.stunned) {
      this.honeInOnPlayer(game);
      this.suspicion = 0;
    }
  }

// Redireciona busca direto para posição do jogador
  honeInOnPlayer(game) {
    this.plan = [game.player.hiddenSpot];
    this.planIndex = 0;
    this.currentTarget = this.plan[0];
    game.logLine(texts.intruderActions.noise);
  }

// Executa turno do intruso após ação do jogador
  takeTurn(game, playerActionKey) {
    this.registerNoise(game, playerActionKey);

    if (this.stunned) {
      return;
    }

    const previousTarget = this.targetName;

    // Trata narração do interruptor de luz antes de avançar
    if (this.currentTarget === "lightSwitch") {
      if (game.room.lampBroken) {
        game.logLine(texts.intruderActions.switchNothing);
        game.logLine(texts.intruderActions.switchNotices);
      } else {
        game.logLine(texts.intruderActions.switchLights);
      }
    }

    this.step(game);

    // Loga avanço do intruso se mudou de alvo
    if (previousTarget !== this.targetName && this.targetName !== "lightSwitch") {
      game.logLines(game.narrator.intruderAdvance(game, this.targetName));
    }

    game.logLine(game.narrator.intruderPrompt(game));
  }

// Retorna nome do alvo atual do intruso
  get targetName() {
    return this.currentTarget;
  }
}

// Gera narrativas e descrições do jogo
class Narrator {
// Descreve local onde jogador está escondido
  describeSpot(spot) {
    return texts.locations[spot] || texts.locations.chair;
  }

// Descreve alvo do intruso
  describeTarget(target) {
    return texts.targets[target] || texts.targets.center;
  }

// Descreve alvo como objeto gramatical
  describeTargetAsObject(target) {
    return texts.targetsAsObject[target] || texts.targetsAsObject.center;
  }

// Descreve alvo após preposição
  describeTargetAfterPreposition(target) {
    return texts.targetsAfterPreposition[target] || texts.targetsAfterPreposition.center;
  }

// Gera texto de abertura do jogo
  opening(game) {
    const lines = [];
    const knownCount = Object.values(game.knowledge).filter(Boolean).length;
    lines.push(
      knownCount > 0
        ? texts.opening.repeat
        : texts.opening.firstTime
    );

    if (game.room.lampBroken) {
      lines.push(texts.opening.lampBroken);
    } else {
      lines.push(texts.opening.lampWorking);
    }

    lines.push(this.explorationPrompt(game));
    return lines;
  }

// Gera prompt de exploração
  explorationPrompt(game) {
    const fragments = [];
    if (!game.room.knows("shelf")) fragments.push("a estante");
    if (!game.room.knows("bed")) fragments.push("a cama");
    if (!game.room.knows("closet")) fragments.push("o guarda-roupa");
    if (!game.room.knows("window")) fragments.push("a janela");
    if (!game.room.knows("door")) fragments.push("a porta");

    if (fragments.length === 0) {
      return texts.opening.allExplored;
    }

    return texts.opening.remaining.replace("{fragments}", fragments.join(", "));
  }

// Gera texto de descoberta de objeto
  discoveryLine(kind, game) {
    if (kind === "shelf") {
      return texts.discovery.shelf;
    }

    if (kind === "bed") {
      return game.player.hasSheet
        ? texts.discovery.bedWithSheet
        : texts.discovery.bedWithoutSheet;
    }

    if (kind === "closet") {
      return texts.discovery.closet;
    }

    if (kind === "window") {
      return game.room.lampBroken
        ? texts.discovery.windowBroken
        : texts.discovery.windowWorking;
    }

    if (kind === "door") {
      return texts.discovery.door;
    }

    return "";
  }

// Gera texto de pegar item
  takeLine(item) {
    if (item === "bat") {
      return texts.take.bat;
    }

    if (item === "sheet") {
      return texts.take.sheet;
    }

    return "";
  }

// Gera texto de quebrar lâmpada
  breakLampLine(game) {
    return game.room.lampBroken
      ? texts.breakLamp.alreadyBroken
      : texts.breakLamp.breaking;
  }

// Gera narrativa de morte quando exposto
  intruderKillsExposedPlayer(game) {
    const lines = [];
    const action = game.currentAction;
    
    lines.push(texts.deathExposed.knobTurns);
    lines.push(texts.deathExposed.manEnters + " " + (action ? texts.deathExposed.actions[action.key] || texts.deathExposed.actions.default : texts.deathExposed.actions.default));
    
    if (game.room.lampBroken) {
      lines.push(texts.deathExposed.lampBroken);
    }
    return lines;
  }

// Gera narrativa de chegada do intruso
  intruderArrival(game, target) {
    const lines = [];
    const hiddenSpot = this.describeSpot(game.player.hiddenSpot);

    lines.push(texts.intruderArrival.enters);
    lines.push(
      texts.intruderArrival.movesTo
        .replace("{target}", this.describeTargetAfterPreposition(target))
        .replace("{hiddenSpot}", hiddenSpot)
    );

    if (target === game.player.hiddenSpot) {
      lines.push(texts.intruderArrival.stopsAtHiding);
    }

    return lines;
  }

// Gera prompt de ação do intruso
  intruderPrompt(game) {
    if (game.intruder.stunned) {
      return texts.intruderPrompt.stunned;
    }

    if (game.intruder.targetName === game.player.hiddenSpot) {
      return texts.intruderPrompt.atHidingSpot.replace("{target}", this.describeTargetAfterPreposition(game.player.hiddenSpot));
    }

    return texts.intruderPrompt.goingToTarget.replace("{target}", this.describeTargetAsObject(game.intruder.targetName));
  }

// Gera narrativa de avanço do intruso
  intruderAdvance(game, target) {
    return [
      texts.intruderAdvance.moves
        .replace("{previousTarget}", this.describeTargetAsObject(game.intruder.previousTarget))
        .replace("{target}", this.describeTargetAsObject(target)),
    ];
  }

// Gera narrativa quando intruso erra jogador
  intruderMiss(game) {
    return [
      texts.intruderMiss.survives.replace("{previousTarget}", this.describeTargetAsObject(game.intruder.previousTarget)),
    ];
  }

// Gera texto de se esconder
  hideLine(spot, covered) {
    if (spot === "bed") {
      return covered
        ? texts.hide.bedWithSheet
        : texts.hide.bedWithoutSheet;
    }

    if (spot === "closet") {
      return texts.hide.closet;
    }

    if (spot === "door") {
      return texts.hide.door;
    }

    return texts.hide.chair;
  }

// Gera texto de usar lençol
  sheetLine(spot) {
    if (spot === "bed") {
      return texts.sheet.bed;
    }

    if (spot === "chair") {
      return texts.sheet.chair;
    }

    if (spot === "door") {
      return texts.sheet.door;
    }

    return texts.sheet.default;
  }

// Gera narrativa de atordoamento bem-sucedido
  stunSuccess(game) {
    const lines = [];
    lines.push(texts.stunSuccess.hit);
    lines.push(texts.stunSuccess.reaction);
    if (game.room.lampBroken) {
      lines.push(texts.stunSuccess.lampBroken);
    }
    lines.push(texts.stunSuccess.exposed);
    return lines;
  }

// Gera narrativa de falha no atordoamento
  stunFailure(game) {
    return [
      texts.stunFailure.miss,
      texts.stunFailure.reaction,
      texts.stunFailure.consequence,
    ];
  }

// Gera narrativa de fuga pela porta bem-sucedida
  escapeDoorSuccess(game) {
    const lines = [];
    lines.push(texts.escapeDoorSuccess.opens);
    if (game.intruder.stunned) {
      lines.push(texts.escapeDoorSuccess.stunned);
    } else {
      lines.push(
        texts.escapeDoorSuccess.distracted.replace("{target}", this.describeTarget(game.intruder.targetName))
      );
    }
    lines.push(texts.escapeDoorSuccess.escapes);
    return lines;
  }

// Gera narrativa de falha na fuga pela porta
  escapeDoorFailure(game) {
    return [
      texts.escapeDoorFailure.tries,
      texts.escapeDoorFailure.fails,
    ];
  }

// Gera narrativa de fuga pela janela bem-sucedida
  escapeWindowSuccess(game) {
    const lines = [];
    lines.push(texts.escapeWindowSuccess.breaks);
    lines.push(texts.escapeWindowSuccess.jumps);
    if (game.room.lampBroken) {
      lines.push(texts.escapeWindowSuccess.lampBroken);
    }
    return lines;
  }

// Gera narrativa de falha na fuga pela janela
  escapeWindowFailure() {
    return [
      texts.escapeWindowFailure.tooSlow,
      texts.escapeWindowFailure.tooLate,
    ];
  }
}

// Define uma ação disponível no jogo
class Action {
  constructor({ key, slot, phases, cost, once, visible, label, run }) {
    this.key = key;         // Identificador único da ação
    this.slot = slot;       // Número da opção no menu
    this.phases = phases;   // Fases onde ação é disponível
    this.cost = cost;       // Tempo que consome
    this.once = once;       // Se só pode ser usada uma vez
    this.visible = visible; // Função que determina visibilidade
    this.label = label;     // Função que retorna texto da opção
    this.run = run;         // Função que executa a ação
    this.used = false;      // Se ação já foi usada
  }

// Marca ação como não usada
  reset() {
    this.used = false;
  }

// Verifica se ação deve ser mostrada ao jogador
  isVisible(game) {
    return this.phases.includes(game.phase) && (!this.once || !this.used) && this.visible(game);
  }

// Retorna texto completo da opção com número
  getLabel(game) {
    return `${this.slot}. ${this.label(game)}`;
  }
}

// Controla fluxo principal do jogo
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
    this.phase = "exploration";  // Fase atual: exploration ou intruder
    this.timeLeft = MAX_TIME;   // Tempo restante na fase de exploração
    this.gameOver = false;      // Se jogo terminou
    this.currentAction = null;  // Ação sendo executada agora

    this.slotMaps = {
      exploration: [  // Ações disponíveis na fase de exploração
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
      intruder: [  // Ações disponíveis na fase do intruso
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

    this.rl = readline.createInterface({  // Interface para entrada do jogador
      input: process.stdin,
      output: process.stdout
    });

    this.resetRun();
  }

// Cria todas as ações disponíveis no jogo
  createActions() {
    // Combina ações das duas fases e converte para objetos Action
    const allActionData = [...phase1Actions, ...phase2Actions];
    return allActionData.map(actionData => new Action(actionData));
  }

// Retorna as chaves de ações da fase atual
  currentSlotKeys() {
    return this.slotMaps[this.phase];
  }

// Retorna ação pelo número da opção
  getActionBySlot(slot) {
    const key = this.currentSlotKeys()[slot - 1];
    return key ? this.actionMap.get(key) : null;
  }

// Retorna ação pelo identificador
  getAction(key) {
    return this.actionMap.get(key);
  }

// Exibe linha de texto com cor
  logLine(text, kind = "entry") {
    if (kind === "entry") {
      console.log(colorizeAndStylize(text, colors.white, styles.bold));
    } else if (kind === "system") {
      console.log(colorize(text, colors.green));
    } else if (kind === "danger") {
      console.log(colorize(text, colors.red));
    } else if (kind === "intruder") {
      console.log(colorizeAndStylize(text, colors.blue, styles.italic));
    } else {
      console.log(text);
    }
  }

// Exibe múltiplas linhas de texto
  logLines(lines, kind = "entry") {
    const queue = Array.isArray(lines) ? lines : [lines];
    queue.filter(Boolean).forEach((line) => this.logLine(line, kind));
  }

// Mostra relógio com tempo restante
  renderClock() {
    if (this.phase === "intruder") {
      return;
    }
    const time = Math.max(0, this.timeLeft).toFixed(1);
    const timeColor = this.timeLeft <= 2 ? colors.red : colors.white;
    console.log(`\n${colorizeAndStylize(texts.ui.timeRemaining, colors.blue, styles.bold)} ${colorize(time + 's', timeColor)}\n`);
  }

// Mostra opções disponíveis para o jogador
  renderChoices() {
    if (this.gameOver) {
      return;
    }
    const visibleActions = this.getVisibleActions();
    console.log(colorizeAndStylize("\n" + texts.ui.options, colors.white, styles.bold));
    visibleActions.forEach((action, index) => {
      const optionNumber = colorizeAndStylize(`${index + 1}.`, colors.blue, styles.bold);
      console.log(`${optionNumber} ${action.label(this)}`);
    });
    console.log();
  }

// Filtra ações visíveis na fase atual
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

// Reseta uso de ações para nova partida
  resetActionUsage() {
    this.actions.forEach((action) => action.reset());
  }

  // Reinicia o jogo para nova tentativa
  resetRun() {
    this.phase = "exploration";
    this.timeLeft = MAX_TIME;
    this.gameOver = false;
    this.currentAction = null;
    this.player.reset();
    this.room.resetRun();
    this.intruder.reset();
    this.resetActionUsage();
    
    // Mantém posição escondida entre partidas para continuidade
    this.logLines(this.narrator.opening(this));
    this.renderClock();
    this.renderChoices();
    this.promptInput();
  }

// Consome tempo do relógio
  consumeTime(amount) {
    if (amount <= 0 || this.gameOver) {
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - amount);
  }

// Finaliza o jogo com mensagem de resultado
  endGame(lines, kind = "danger") {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.logLines(lines, kind);
    this.renderClock();
    console.log(colorizeAndStylize("\n" + texts.ui.gameOver + "\n", colors.white, styles.bold));
    this.promptRestart();
  }

// Transiciona para fase do intruso
  enterIntruderPhase() {
    const outcome = this.intruder.enter(this);
    if (outcome.type === "death") {
      this.endGame(outcome.lines);
      return;
    }

    this.phase = "intruder";
    this.logLines(outcome.lines, "intruder");
  }

// Avança busca do intruso pelo quarto
  advanceIntruderSearch() {
    if (this.intruder.stunned) {
      return;
    }

    const current = this.intruder.targetName;
    if (current === this.player.hiddenSpot) {
      if (this.player.coveredWithSheet) {
        this.player.coveredWithSheet = false;
        this.intruder.previousTarget = current;
        const next = this.intruder.advance();
        return;
      }

      this.endGame([
        `Ele chega exatamente à ${this.narrator.describeTarget(this.player.hiddenSpot)}.`,
        "Você não tem tempo para outro movimento.",
      ]);
      return;
    }

    this.intruder.previousTarget = current;
    this.intruder.advance();
  }

// Processa avanço do intruso após ação do jogador
  resolveIntruderAdvance(reason) {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (reason === "wait" && this.intruder.stunned) {
      this.logLine(texts.playerActions.stunnedWaiting);
      return;
    }

    this.advanceIntruderSearch();
  }

// Resolve tentativa de se esconder na fase do intruso
  resolveIntruderHide(nextSpot) {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.room.knows(nextSpot)) {
      this.logLine(texts.errors.dontKnowSpot);
      return;
    }

    if (!this.intruder.stunned && this.intruder.targetName === nextSpot) {
      this.endGame([
        texts.errors.caughtMoving.replace("{spot}", this.narrator.describeSpot(nextSpot)),
        texts.errors.movementDenounces,
      ]);
      return;
    }

    this.player.hideAt(nextSpot);
    this.logLine(this.narrator.hideLine(nextSpot, this.player.coveredWithSheet));
  }

// Resolve troca de esconderijo
  resolveIntruderMove(nextSpot) {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.room.knows(nextSpot)) {
      this.logLine(texts.errors.dontKnowPath);
      return;
    }

    if (!this.intruder.stunned && this.intruder.targetName === nextSpot) {
      this.endGame([
        texts.errors.caughtSwitching.replace("{spot}", this.narrator.describeSpot(nextSpot)),
        texts.errors.switchDenounces,
      ]);
      return;
    }

    this.player.hideAt(nextSpot);
    this.logLine(this.narrator.hideLine(nextSpot, this.player.coveredWithSheet));
  }

// Resolve ataque com taco no intruso
  resolveIntruderAttack() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    const target = this.intruder.targetName;
    const spot = this.player.hiddenSpot;

    if (this.intruder.stunned) {
      this.logLine(texts.playerActions.stunnedAlready);
      return;
    }

    if (target !== spot && !(spot === "chair" && target === "door")) {
      this.endGame(this.narrator.stunFailure(this));
      return;
    }

    this.intruder.stunned = true;
    this.logLines(this.narrator.stunSuccess(this));
  }

// Resolve tentativa de fugir pela porta
  resolveIntruderOpenDoor() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (this.intruder.stunned) {
      this.endGame(this.narrator.escapeDoorSuccess(this), "system");
      return;
    }

    // Se intruso não está atordoado, abrir porta o alerta
    this.endGame([
      texts.errors.doorAlerts,
      texts.errors.shootsAtSound,
      texts.errors.muzzleFlashes,
      texts.errors.fallsBeforeEscape,
    ]);
  }

// Resolve uso do lençol para cobertura
  resolveUseSheet() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.player.hasSheet) {
      this.logLine(texts.playerActions.noSheet);
      return;
    }

    this.player.coveredWithSheet = true;
    this.logLine(this.narrator.sheetLine(this.player.hiddenSpot));
  }

// Resolve arremesso do lençol no intruso
  resolveThrowSheet() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.player.hasSheet) {
      this.logLine(texts.playerActions.noSheet);
      return;
    }

    this.player.hasSheet = false;
    this.logLine(texts.playerActions.throwSheet);
    
    if (this.intruder.stunned) {
      this.logLine(texts.playerActions.sheetAlreadyStunned);
      return;
    }

    this.logLine(texts.playerActions.sheetDistracts);
    this.intruder.stunned = true;
  }

// Resolve movimento até a porta
  resolveGoToDoor() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    this.player.hideAt("door");
    this.logLine(texts.playerActions.goToDoor);
  }

// Resolve tentativa de fuga pela janela
  resolveWindowEscape() {
    if (this.gameOver || this.phase !== "intruder") {
      return;
    }

    if (!this.room.knows("window")) {
      this.logLine(texts.errors.dontKnowWindow);
      return;
    }

    if (this.intruder.stunned || this.intruder.targetName !== "window") {
      this.endGame(this.narrator.escapeWindowSuccess(this), "system");
      return;
    }

    this.endGame(this.narrator.escapeWindowFailure());
  }

// Processa escolha de ação do jogador
  handleSlot(slot) {
    if (this.gameOver) {
      return;
    }

    console.clear();

    const visibleActions = this.getVisibleActions();
    const action = visibleActions[slot - 1];
    
    if (!action) {
      console.log(texts.errors.invalidOption);
      this.promptInput();
      return;
    }

    // Rastreia ação atual para mensagens de morte contextuais
    this.currentAction = action;

    // Verifica se ação vai esgotar o tempo antes de executar
    if (this.phase === "exploration" && this.timeLeft - action.cost <= 0) {
      if (action.once) {
        action.used = true;
      }
      this.timeLeft = 0;
      this.enterIntruderPhase();
      if (!this.gameOver) {
        this.renderChoices();
        this.promptInput();
      }
      return;
    }

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
      if (!this.gameOver) {
        this.renderChoices();
        this.promptInput();
      }
      return;
    }

    if (this.phase === "intruder") {
      this.intruder.takeTurn(this, action.key);
      if (!this.gameOver) {
        this.renderChoices();
        this.promptInput();
      }
      return;
    }

    this.renderClock();
    this.renderChoices();
    this.promptInput();
  }

// Solicita entrada do jogador
  promptInput() {
    this.rl.question(colorize(texts.ui.chooseOption, colors.gray), (answer) => {
      const slot = parseInt(answer);
      if (isNaN(slot)) {
        console.log(colorize(texts.errors.invalidNumber, colors.red));
        this.promptInput();
        return;
      }
      this.handleSlot(slot);
    });
  }

// Pergunta se jogador quer tentar novamente
  promptRestart() {
    this.rl.question(colorize("\n" + texts.ui.playAgain, colors.gray), (answer) => {
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
        this.resetRun();
      } else {
        console.log(colorize(texts.ui.thanks, colors.green));
        this.rl.close();
        process.exit(0);
      }
    });
  }
}

const game = new Game();
