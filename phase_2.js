// Ações da fase do intruso (Phase 2 - Fuga)
const texts = require('./texts.js');

module.exports = [
  {
    key: "openDoor",
    slot: 4,
    phases: ["intruder"],
    cost: 0,
    once: true,
    visible: (game) => game.player.hiddenSpot === "door",
    label: () => texts.actionLabels.openDoor,
    run: (game) => {
      game.resolveIntruderOpenDoor();
    },
  },
  {
    key: "attack",
    slot: 5,
    phases: ["intruder"],
    cost: 0,
    once: true,
    visible: (game) => game.player.hasBat && !game.intruder.stunned,
    label: () => texts.actionLabels.attack,
    run: (game) => {
      game.resolveIntruderAttack();
    },
  },
  {
    key: "switchHideout",
    slot: 6,
    phases: ["intruder"],
    cost: 0,
    once: false,
    visible: () => true,
    label: () => texts.actionLabels.switchHideout,
    run: (game) => {
      const spots = ["bed", "closet", "door"];
      const currentIndex = spots.indexOf(game.player.hiddenSpot);
      const next = spots[(currentIndex + 1) % spots.length];
      game.resolveIntruderMove(next);
    },
  },
  {
    key: "useSheet",
    slot: 7,
    phases: ["intruder"],
    cost: 0,
    once: true,
    visible: (game) => game.player.hasSheet,
    label: () => texts.actionLabels.useSheet,
    run: (game) => {
      game.resolveThrowSheet();
    },
  },
  {
    key: "escapeWindow",
    slot: 8,
    phases: ["intruder"],
    cost: 0,
    once: true,
    visible: (game) => game.knowledge.windowHidingKnown,
    label: () => texts.actionLabels.escapeWindow,
    run: (game) => {
      game.resolveWindowEscape();
    },
  },
  {
    key: "recoverBat",
    slot: 9,
    phases: ["intruder"],
    cost: 0,
    once: true,
    visible: (game) => game.player.hasBat,
    label: () => texts.actionLabels.recoverBat,
    run: (game) => {
      game.logLine(texts.playerActions.recoverBat);
      game.resolveIntruderAdvance("hold");
    },
  },
  {
    key: "goToDoor",
    slot: 10,
    phases: ["intruder"],
    cost: 0,
    once: false,
    visible: () => true,
    label: () => texts.actionLabels.goToDoor,
    run: (game) => {
      game.resolveGoToDoor();
    },
  },
];
