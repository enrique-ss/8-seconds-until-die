// Ações da fase do intruso (Phase 2 - Fuga)
const texts = require('./texts.js');

module.exports = [
  {
    key: "openDoor",
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
    phases: ["intruder"],
    cost: 0,
    once: false,
    visible: (game) => !game.intruder.distracted,
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
    key: "goToDoor",
    phases: ["intruder"],
    cost: 0,
    once: false,
    visible: (game) => !game.intruder.distracted,
    label: () => texts.actionLabels.goToDoor,
    run: (game) => {
      game.resolveGoToDoor();
    },
  },
  {
    key: "quickAttack",
    phases: ["intruder"],
    cost: 0,
    once: true,
    visible: (game) => game.intruder.distracted && game.player.hasBat,
    label: () => "Ataque rápido",
    run: (game) => {
      game.resolveQuickAttack();
    },
  },
  {
    key: "quickEscape",
    phases: ["intruder"],
    cost: 0,
    once: true,
    visible: (game) => game.intruder.distracted && game.knowledge.windowHidingKnown,
    label: () => "Fuga rápida",
    run: (game) => {
      game.resolveQuickEscape();
    },
  },
];
