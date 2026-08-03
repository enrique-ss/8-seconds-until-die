const readline = require('readline');
const texts = require('./texts.js');
const phase1Actions = require('./phase_1.js');
const phase2Actions = require('./phase_2.js');

// ============================================
// CLASSES DO JOGO
// ============================================

// Classe base para entidades do jogo
class Entity {
  constructor(name, description) {
    this._name = name;
    this._description = description;
    this._id = this._generateId();
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get id() {
    return this._id;
  }

  _generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  describe() {
    throw new Error("Método describe() deve ser implementado pela subclass");
  }
}

// Item base
class Item extends Entity {
  constructor(name, description, weight = 0) {
    super(name, description);
    this._weight = weight;
    this._owner = null;
  }

  get weight() {
    return this._weight;
  }

  get owner() {
    return this._owner;
  }

  set owner(newOwner) {
    this._owner = newOwner;
  }

  describe() {
    return `${this._name} (peso: ${this._weight})`;
  }
}

// Arma (herda de Item)
class Weapon extends Item {
  constructor(name, description, weight, damage) {
    super(name, description, weight);
    this._damage = damage;
  }

  get damage() {
    return this._damage;
  }

  describe() {
    return `${super.describe()} - Dano: ${this._damage}`;
  }

  attack() {
    return this._damage;
  }
}

// Ferramenta (herda de Item)
class Tool extends Item {
  constructor(name, description, weight, utility) {
    super(name, description, weight);
    this._utility = utility;
  }

  get utility() {
    return this._utility;
  }

  describe() {
    return `${super.describe()} - Utilidade: ${this._utility}`;
  }

  use() {
    return this._utility;
  }
}

// Inventário
class Inventory {
  constructor(maxCapacity = 10) {
    this._items = [];
    this._maxCapacity = maxCapacity;
  }

  addItem(item) {
    if (this._items.length >= this._maxCapacity) {
      throw new Error("Inventário cheio");
    }
    if (!(item instanceof Item)) {
      throw new Error("Apenas itens podem ser adicionados");
    }
    this._items.push(item);
    item.owner = this;
  }

  removeItem(itemId) {
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) {
      throw new Error("Item não encontrado");
    }
    const item = this._items.splice(index, 1)[0];
    item.owner = null;
    return item;
  }

  get items() {
    return [...this._items];
  }

  hasItem(itemName) {
    return this._items.some(item => item.name === itemName);
  }

  get capacity() {
    return this._items.length;
  }

  get maxCapacity() {
    return this._maxCapacity;
  }
}

// Localização no jogo
class Location extends Entity {
  constructor(name, description, hidingSpot = false) {
    super(name, description);
    this._hidingSpot = hidingSpot;
    this._discovered = false;
  }

  get isHidingSpot() {
    return this._hidingSpot;
  }

  get discovered() {
    return this._discovered;
  }

  set discovered(value) {
    this._discovered = value;
  }

  describe() {
    return this._description;
  }
}

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
  wait: 0,
  goToDoor: 1,
  breakLamp: 3,
  breakWindow: 2,
  openWindow: 1,
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
  windowOpen: false,       // Se janela está aberta
  windowBroken: false,     // Se janela está quebrada
};

// Gerencia estado e itens do jogador
// HERANÇA: Player herda de Entity
// COMPOSIÇÃO: Player tem um Inventory
class Player extends Entity {
  constructor() {
    super(texts.entities.player.name, texts.entities.player.description);
    this._hiddenSpot = "chair";
    this._inventory = new Inventory(5);  // Composição: Player tem um Inventory
    this._coveredWithSheet = false;
    this.reset();
  }

  reset() {
    this._coveredWithSheet = false;
    this._inventory = new Inventory(5);  // Reinicia inventário
    // Não reseta posição escondida para manter estado entre ações
  }

  // ENCAPSULAMENTO: Getters e setters para controlar acesso
  get hiddenSpot() {
    return this._hiddenSpot;
  }

  set hiddenSpot(spot) {
    this._hiddenSpot = spot;
  }

  get coveredWithSheet() {
    return this._coveredWithSheet;
  }

  set coveredWithSheet(value) {
    this._coveredWithSheet = value;
  }

  get inventory() {
    return this._inventory;
  }

  // POLIMORFISMO: Sobrescrita do método describe()
  describe() {
    return `${this._name} está escondido em ${this._hiddenSpot}`;
  }

  // Método para se esconder
  hideAt(spot) {
    this._hiddenSpot = spot;
  }

  // Método para verificar se tem item específico
  hasItem(itemName) {
    return this._inventory.hasItem(itemName);
  }

  // Método para adicionar item ao inventário
  addItem(item) {
    this._inventory.addItem(item);
  }

  // Método para remover item do inventário
  removeItem(itemId) {
    return this._inventory.removeItem(itemId);
  }

  // Método para verificar se tem arma
  hasWeapon() {
    return this._inventory.items.some(item => item instanceof Weapon);
  }

  // Getter para arma (se tiver)
  get weapon() {
    return this._inventory.items.find(item => item instanceof Weapon);
  }

  // Compatibilidade com código antigo
  has(item) {
    if (item === "bat") return this.hasItem(texts.entities.items.bat.name);
    if (item === "sheet") return this.hasItem(texts.entities.items.sheet.name);
    return false;
  }

  // Getters para compatibilidade
  get hasBat() {
    return this.hasItem(texts.entities.items.bat.name);
  }

  get hasSheet() {
    return this.hasItem(texts.entities.items.sheet.name);
  }

  gain(item) {
    if (item === "hasBat") {
      const bat = new Weapon(
        texts.entities.items.bat.name,
        texts.entities.items.bat.description,
        2,
        5
      );
      this.addItem(bat);
    } else if (item === "hasSheet") {
      const sheet = new Tool(
        texts.entities.items.sheet.name,
        texts.entities.items.sheet.description,
        1,
        "camuflagem"
      );
      this.addItem(sheet);
    }
  }
}

// Gerencia estado do quarto e objetos descobertos
// HERANÇA: Room herda de Entity
// COMPOSIÇÃO: Room contém múltiplos Location
class Room extends Entity {
  constructor() {
    super(texts.entities.room.name, texts.entities.room.description);
    this._lampBroken = false;
    this._locations = new Map();    // Composição: Room contém Locations
    this._initializeLocations();
    this.resetRun();
  }

  // Inicializa os locais do quarto
  _initializeLocations() {
    this._locations.set("shelf", new Location(
      texts.entities.locations.shelf.name,
      texts.entities.locations.shelf.description,
      false
    ));
    this._locations.set("bed", new Location(
      texts.entities.locations.bed.name,
      texts.entities.locations.bed.description,
      true
    ));
    this._locations.set("closet", new Location(
      texts.entities.locations.closet.name,
      texts.entities.locations.closet.description,
      true
    ));
    this._locations.set("window", new Location(
      texts.entities.locations.window.name,
      texts.entities.locations.window.description,
      true
    ));
    this._locations.set("door", new Location(
      texts.entities.locations.door.name,
      texts.entities.locations.door.description,
      true
    ));
    this._locations.set("chair", new Location(
      texts.entities.locations.chair.name,
      texts.entities.locations.chair.description,
      false
    ));
  }

  // Reseta estado do quarto para nova partida
  resetRun() {
    this._lampBroken = false;
    this._locations.forEach(location => {
      location.discovered = false;  // Reset descoberta de cada local
    });
  }

  // ENCAPSULAMENTO: Getters e setters
  get lampBroken() {
    return this._lampBroken;
  }

  set lampBroken(value) {
    this._lampBroken = value;
  }

  // POLIMORFISMO: Sobrescrita do método describe()
  describe() {
    const discoveredLocations = Array.from(this._locations.values())
      .filter(loc => loc._discovered)
      .map(loc => loc.name)
      .join(", ");
    return `${this._description}. Locais conhecidos: ${discoveredLocations || texts.ui.none}`;
  }

  // Marca objeto como descoberto
  discover(feature) {
    const location = this._locations.get(feature);
    if (location) {
      location.discovered = true;
    }
  }

  // Verifica se objeto já foi descoberto
  knows(feature) {
    const location = this._locations.get(feature);
    return location ? location._discovered : false;
  }

  // Retorna um local específico
  getLocation(feature) {
    return this._locations.get(feature);
  }

  // Retorna todos os locais
  get locations() {
    return Array.from(this._locations.values());
  }

  // Verifica se um local é ponto de esconderijo
  isHidingSpot(feature) {
    const location = this._locations.get(feature);
    return location ? location.isHidingSpot : false;
  }
}

// Gerencia IA do intruso e comportamento de busca
// HERANÇA: Intruder herda de Entity
class Intruder extends Entity {
  constructor() {
    super(texts.entities.intruder.name, texts.entities.intruder.description);
    this.reset();
  }

  // Reseta estado do intruso para nova partida
  reset() {
    this._active = false;        // Se intruso está ativo no quarto
    this._stunned = false;       // Se intruso está atordoado
    this._plan = [];             // Plano de busca pelo quarto
    this._planIndex = 0;         // Posição atual no plano
    this._currentTarget = "door"; // Onde intruso está indo agora
    this._alert = false;         // Se intruso está em estado de alerta
    this._triedSwitch = false;   // Se já tentou interruptor de luz
    this._suspicion = 0;         // Nível de suspeita de ruído
  }

  // ENCAPSULAMENTO: Getters e setters
  get active() {
    return this._active;
  }

  get stunned() {
    return this._stunned;
  }

  set stunned(value) {
    this._stunned = value;
  }

  get currentTarget() {
    return this._currentTarget;
  }

  get alert() {
    return this._alert;
  }

  get suspicion() {
    return this._suspicion;
  }

  // POLIMORFISMO: Sobrescrita do método describe()
  describe() {
    const state = this._stunned ? "atordoado" : this._alert ? "alerta" : "buscando";
    return `${this._name} está ${state}, indo em direção a ${this._currentTarget}`;
  }

  // Compatibilidade com código antigo
  get plan() {
    return this._plan;
  }

  get planIndex() {
    return this._planIndex;
  }

  get targetName() {
    return this._currentTarget;
  }

  get previousTarget() {
    if (this._planIndex > 0) {
      return this._plan[this._planIndex - 1];
    }
    return null;
  }

// Faz intruso entrar no quarto
  enter(game) {
    this._active = true;
    this._stunned = false;

    // Se jogador não se escondeu, morre imediatamente
    if (game.player.hiddenSpot === "chair") {
      return {
        type: "death",
        lines: game.narrator.intruderKillsExposedPlayer(game),
      };
    }

    this._plan = this.buildPlan(game);
    this._planIndex = 0;
    this._currentTarget = this._plan[0];

    return {
      type: "arrival",
      lines: game.narrator.intruderArrival(game, this._currentTarget),
    };
  }

  buildPlan(game) {
    const hidden = game.player.hiddenSpot;
    const plan = [];

    // Se a lâmpada está quebrada, intruso vai ao interruptor primeiro
    if (game.room.lampBroken && !this._triedSwitch && hidden !== "chair") {
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
    if (this._stunned) {
      return this._currentTarget;
    }

    this._planIndex = Math.min(this._planIndex + 1, this._plan.length - 1);
    this._currentTarget = this._plan[this._planIndex];
    return this._currentTarget;
  }

  step(game) {
    // Trata estágio do interruptor de luz
    if (this._currentTarget === "lightSwitch") {
      this._triedSwitch = true;
      if (game.room.lampBroken) {
        this._alert = true;
        this._suspicion += 2;
      }
      this._plan = this.buildPlan(game);
      this._planIndex = 0;
      this._currentTarget = this._plan[0];
      return;
    }

    // Avança normalmente pelo plano de busca
    this.advance();
  }

// Registra ruído feito pelo jogador e aumenta suspeita
  registerNoise(game, actionKey) {
    const base = NOISE_COSTS[actionKey] ?? 1;
    const bonus = this._alert ? 1 : 0;
    this._suspicion += base + bonus;

    // Se suspeita passa do limite, intruso vai direto ao jogador
    const threshold = this._alert ? 3 : 5;
    if (this._suspicion >= threshold && !this._stunned) {
      this.honeInOnPlayer(game);
      this._suspicion = 0;
    }
  }

// Redireciona busca direto para posição do jogador
  honeInOnPlayer(game) {
    this._plan = [game.player.hiddenSpot];
    this._planIndex = 0;
    this._currentTarget = this._plan[0];
    game.logLine(texts.intruderActions.noise);
  }

// Executa turno do intruso após ação do jogador
  takeTurn(game, playerActionKey) {
    this.registerNoise(game, playerActionKey);

    if (this._stunned) {
      return;
    }

    const previousTarget = this._currentTarget;

    // Trata narração do interruptor de luz antes de avançar
    if (this._currentTarget === "lightSwitch") {
      if (game.room.lampBroken) {
        game.logLine(texts.intruderActions.switchNothing);
        game.logLine(texts.intruderActions.switchNotices);
      } else {
        game.logLine(texts.intruderActions.switchLights);
      }
    }

    this.step(game);

    // Loga avanço do intruso se mudou de alvo
    if (previousTarget !== this._currentTarget && this._currentTarget !== "lightSwitch") {
      game.logLines(game.narrator.intruderAdvance(game, this._currentTarget));
    }

    game.logLine(game.narrator.intruderPrompt(game));
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
    lines.push(texts.opening.firstTime);
    lines.push(texts.opening.prompt);
    return lines;
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
    let prompt;

    if (game.intruder.stunned) {
      prompt = texts.intruderPrompt.stunned;
    } else if (game.intruder.targetName === game.player.hiddenSpot) {
      prompt = texts.intruderPrompt.atHidingSpot.replace("{target}", this.describeTargetAfterPreposition(game.player.hiddenSpot));
    } else {
      prompt = texts.intruderPrompt.goingToTarget.replace("{target}", this.describeTargetAsObject(game.intruder.targetName));
    }

    return prompt + " " + texts.intruderPrompt.prompt;
  }

// Gera narrativa de avanço do intruso
  intruderAdvance(game, target) {
    return [
      texts.intruderAdvance.moves
        .replace("{previousTarget}", this.describeTargetAsObject(game.intruder.previousTarget))
        .replace("{target}", this.describeTargetAsObject(target)),
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
  constructor({ key, phases, cost, once, visible, label, run }) {
    this.key = key;         // Identificador único da ação
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
    this.knowledge = { ...DEFAULT_KNOWLEDGE };
    this.player = new Player();
    this.room = new Room();
    this.intruder = new Intruder();
    this.narrator = new Narrator();
    this._firstRun = true;  // Flag para controlar primeira execução
    this.actions = this.createActions();
    this.actionMap = new Map(this.actions.map((action) => [action.key, action]));
    this.phase = "exploration";  // Fase atual: exploration ou intruder
    this.timeLeft = MAX_TIME;   // Tempo restante na fase de exploração
    this.gameOver = false;      // Se jogo terminou
    this.currentAction = null;  // Ação sendo executada agora

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
    const visible = [];
    this.actions.forEach((action) => {
      if (action.phases.includes(this.phase) && action.isVisible(this)) {
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
    
    // Reseta estados de janela
    this.knowledge.windowOpen = false;
    this.knowledge.windowBroken = false;
    
    // Só mostra mensagem de abertura na primeira vez
    if (this._firstRun) {
      this.logLines(this.narrator.opening(this));
      this._firstRun = false;
    } else {
      this.logLine(texts.opening.repeat);
      this.logLine(texts.opening.prompt);
    }
    
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
        const next = this.intruder.advance();
        return;
      }

      this.endGame([
        `Ele chega exatamente à ${this.narrator.describeTarget(this.player.hiddenSpot)}.`,
        texts.errors.noTime,
      ]);
      return;
    }

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

    // Remove o lençol do inventário
    const sheetItem = this.player.inventory.items.find(item => item.name === texts.entities.items.sheet.name);
    if (sheetItem) {
      this.player.removeItem(sheetItem.id);
    }
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

// Só executa o jogo se este for o módulo principal
if (require.main === module) {
  const game = new Game();
}

// Exporta classes para reuso em testes ou outros contextos
module.exports = {
  Game,
  Player,
  Room,
  Intruder,
  Narrator,
  Entity,
  Item,
  Weapon,
  Tool,
  Inventory,
  Location,
};
