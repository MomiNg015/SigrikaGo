import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import TutorialSessionModal from "./TutorialSessionModal.jsx";

describe("TutorialSessionModal", () => {
  it("routes board setup handoff through a pre-paint layout effect", () => {
    const source = readFileSync(new URL("./TutorialSessionModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("useLayoutEffect");
    expect(source).toContain("onEnterBattle({ script, startNodeId: node.id })");
  });

  it("renders story nodes through the story player surface", () => {
    const html = renderToStaticMarkup(createElement(TutorialSessionModal, {
      script: {
        startNodeId: "intro",
        nodes: [
          { id: "intro", type: "story", text: "Welcome.", nextNodeId: "move-1" },
          { id: "move-1", type: "player-move", pointId: "5,5", color: "black", nextNodeId: "" }
        ]
      },
      typewriterDisabled: true,
      onClose: () => {}
    }));

    expect(html).toContain("onboarding-story-modal");
    expect(html).toContain("Welcome.");
    expect(html).not.toContain("tutorial-battle-session");
  });

  it("renders battle tutorial nodes in the local tutorial surface", () => {
    const html = renderToStaticMarkup(createElement(TutorialSessionModal, {
      script: {
        startNodeId: "move-1",
        initialBoard: {
          mode: "spark",
          stones: [
            { pointId: "3,3", color: "black" }
          ]
        },
        nodes: [
          { id: "move-1", type: "player-move", pointId: "5,5", color: "black", prompt: "Place here.", nextNodeId: "" }
        ]
      },
      onClose: () => {}
    }));

    expect(html).toContain("tutorial-battle-session");
    expect(html).toContain('data-tutorial-node-type="player-move"');
    expect(html).toContain("Place here.");
    expect(html).toContain("5,5");
    expect(html).toContain("board-wrap");
    expect(html).toContain('data-point-id="3,3"');
    expect(html).toContain("--stone-offset-x:0px");
    expect(html).toContain("--stone-offset-y:0px");
    expect(html).toContain("tutorial-battle-actions");
  });

  it("renders resign nodes as a guided tutorial action instead of an exit", () => {
    const html = renderToStaticMarkup(createElement(TutorialSessionModal, {
      script: {
        startNodeId: "resign-1",
        nodes: [
          { id: "resign-1", type: "resign", color: "black", prompt: "Now resign.", nextNodeId: "" }
        ]
      },
      onClose: () => {}
    }));

    expect(html).toContain('data-tutorial-node-type="resign"');
    expect(html).toContain("tutorial-resign-action");
    expect(html).toContain("Now resign.");
  });

  it("renders board setup nodes as an automatic tutorial transition", () => {
    const html = renderToStaticMarkup(createElement(TutorialSessionModal, {
      script: {
        startNodeId: "setup-beginner",
        nodes: [
          {
            id: "setup-beginner",
            type: "board-setup",
            prompt: "Prepare beginner board.",
            boardSetup: {
              mode: "spark",
              stones: [{ pointId: "5,5", color: "black" }]
            },
            nextNodeId: "move-1"
          },
          { id: "move-1", type: "player-move", pointId: "6,6", color: "white", nextNodeId: "" }
        ]
      },
      onClose: () => {}
    }));

    expect(html).toContain('data-tutorial-node-type="board-setup"');
    expect(html).toContain("Prepare beginner board.");
    expect(html).not.toContain("tutorial-battle-actions");
  });

  it("renders skill tutorial nodes with a guided skill action area", () => {
    const html = renderToStaticMarkup(createElement(TutorialSessionModal, {
      script: {
        startNodeId: "skill-1",
        initialBoard: {
          mode: "spark",
          stones: [
            { pointId: "4,4", color: "white" }
          ]
        },
        nodes: [
          {
            id: "skill-1",
            type: "player-skill",
            characterId: "denia",
            color: "black",
            pointId: "4,4",
            prompt: "Use Denia skill.",
            nextNodeId: ""
          }
        ]
      },
      onClose: () => {}
    }));

    expect(html).toContain('data-tutorial-node-type="player-skill"');
    expect(html).toContain("Use Denia skill.");
    expect(html).toContain("tutorial-skill-action");
    expect(html).toContain("4,4");
    expect(html).toContain("board-wrap");
  });
});
