// Ações da fase de exploração (Phase 1)
const texts = require('./texts.js');

module.exports = [
  {
    key: "analyzeShelf",
    slot: 1,
    phases: ["exploration"],
    cost: 2.8,
    once: true,
    visible: (game) => !game.knowledge.shelfExamined,
    label: () => texts.actionLabels.analyzeShelf,
    run: (game) => {
      game.room.discover("shelf");
      game.knowledge.shelfExamined = true;
      game.knowledge.batKnown = true;
      game.knowledgeStore.save(game.knowledge);
      game.logLines(game.narrator.discoveryLine("shelf", game));
    },
  },
  {
    key: "analyzeBed",
    slot: 2,
    phases: ["exploration"],
    cost: 2.4,
    once: true,
    visible: (game) => !game.knowledge.bedExamined,
    label: () => texts.actionLabels.analyzeBed,
    run: (game) => {
      game.room.discover("bed");
      game.knowledge.bedExamined = true;
      game.knowledge.sheetKnown = true;
      game.knowledge.bedHidingKnown = true;
      game.knowledgeStore.save(game.knowledge);
      game.logLines(game.narrator.discoveryLine("bed", game));
    },
  },
  {
    key: "analyzeCloset",
    slot: 3,
    phases: ["exploration"],
    cost: 2.6,
    once: true,
    visible: (game) => !game.knowledge.closetExamined,
    label: () => texts.actionLabels.analyzeCloset,
    run: (game) => {
      game.room.discover("closet");
      game.knowledge.closetExamined = true;
      game.knowledge.closetHidingKnown = true;
      game.knowledgeStore.save(game.knowledge);
      game.logLines(game.narrator.discoveryLine("closet", game));
    },
  },
  {
    key: "analyzeDoor",
    slot: 4,
    phases: ["exploration"],
    cost: 2.0,
    once: true,
    visible: (game) => !game.knowledge.doorHeard,
    label: () => texts.actionLabels.analyzeDoor,
    run: (game) => {
      game.room.discover("door");
      game.knowledge.doorHeard = true;
      game.knowledge.doorHidingKnown = true;
      game.knowledgeStore.save(game.knowledge);
      game.logLines(game.narrator.discoveryLine("door", game));
    },
  },
  {
    key: "analyzeWindow",
    slot: 5,
    phases: ["exploration"],
    cost: 2.2,
    once: true,
    visible: (game) => !game.knowledge.windowSeen,
    label: () => texts.actionLabels.analyzeWindow,
    run: (game) => {
      game.room.discover("window");
      game.knowledge.windowSeen = true;
      game.knowledge.windowHidingKnown = true;
      game.knowledgeStore.save(game.knowledge);
      game.logLines(game.narrator.discoveryLine("window", game));
    },
  },
  {
    key: "wait",
    slot: 6,
    phases: ["exploration", "intruder"],
    cost: 0,
    once: true,
    visible: (game) => !game.actionMap?.get("wait")?.used,
    label: () => texts.actionLabels.wait,
    run: (game) => {
      if (game.phase === "exploration") {
        game.actionMap.get("wait").used = true;
        game.logLine(texts.playerActions.wait);
        game.timeLeft = 0;
        game.enterIntruderPhase();
        return;
      }

      game.resolveIntruderAdvance("wait");
    },
  },
  {
    key: "takeBat",
    slot: 7,
    phases: ["exploration"],
    cost: 2.0,
    once: true,
    visible: (game) => game.knowledge.batKnown && !game.player.hasBat,
    label: () => texts.actionLabels.takeBat,
    run: (game) => {
      game.player.gain("hasBat");
      game.knowledgeStore.save(game.knowledge);
      game.logLine(game.narrator.takeLine("bat"));
    },
  },
  {
    key: "takeSheet",
    slot: 8,
    phases: ["exploration"],
    cost: 2.0,
    once: true,
    visible: (game) => game.knowledge.sheetKnown && !game.player.hasSheet,
    label: () => texts.actionLabels.takeSheet,
    run: (game) => {
      game.player.gain("hasSheet");
      game.knowledgeStore.save(game.knowledge);
      game.logLine(game.narrator.takeLine("sheet"));
    },
  },
  {
    key: "breakLamp",
    slot: 9,
    phases: ["exploration"],
    cost: 2.4,
    once: true,
    visible: (game) => game.player.hasBat && !game.room.lampBroken,
    label: () => texts.actionLabels.breakLamp,
    run: (game) => {
      game.room.lampBroken = true;
      game.logLine(game.narrator.breakLampLine(game));
    },
  },
  {
    key: "hideBed",
    slot: 1,
    phases: ["exploration", "intruder"],
    cost: 1.5,
    once: true,
    visible: (game) => game.knowledge.bedHidingKnown && game.player.hiddenSpot !== "bed",
    label: () => texts.actionLabels.hideBed,
    run: (game) => {
      if (game.phase === "exploration") {
        game.player.hideAt("bed");
        game.logLine(game.narrator.hideLine("bed", game.player.coveredWithSheet));
      } else {
        game.resolveIntruderHide("bed");
      }
    },
  },
  {
    key: "hideCloset",
    slot: 2,
    phases: ["exploration", "intruder"],
    cost: 1.5,
    once: true,
    visible: (game) => game.knowledge.closetHidingKnown && game.player.hiddenSpot !== "closet",
    label: () => texts.actionLabels.hideCloset,
    run: (game) => {
      if (game.phase === "exploration") {
        game.player.hideAt("closet");
        game.logLine(game.narrator.hideLine("closet", game.player.coveredWithSheet));
      } else {
        game.resolveIntruderHide("closet");
      }
    },
  },
  {
    key: "hideDoor",
    slot: 3,
    phases: ["exploration", "intruder"],
    cost: 1.0,
    once: true,
    visible: (game) => game.knowledge.doorHidingKnown && game.player.hiddenSpot !== "door",
    label: () => texts.actionLabels.hideDoor,
    run: (game) => {
      if (game.phase === "exploration") {
        game.player.hideAt("door");
        game.logLine(game.narrator.hideLine("door", game.player.coveredWithSheet));
      } else {
        game.resolveIntruderHide("door");
      }
    },
  },
];
