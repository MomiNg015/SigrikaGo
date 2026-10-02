import { writeFile } from 'node:fs/promises';
import { ADMIN_DEFAULT_CONFIG } from '../../../server/adminDefaultSnapshot.js';
import { applyAuthoredGuideExpressions } from '../../../src/shared/authoredGuideExpressions.js';
import { HOME_ONBOARDING_STEPS } from '../../../src/home/onboarding/homeOnboardingScript.js';
import { createTutorialGameState, applyTutorialNodeAction, applyTutorialSkillAction } from '../../../src/tutorial/tutorialGameState.js';

const script = ADMIN_DEFAULT_CONFIG.storyScripts.find(row => row.key === 'onboarding.default');
if (!script) throw new Error('Missing onboarding.default');
const nodes = applyAuthoredGuideExpressions(JSON.parse(script.publishedNodesJson), script.key);
const nodeById = new Map(nodes.map(node => [node.id, node]));
function snapshot(setupId, actionIds) {
  let game = createTutorialGameState({ initialBoard: nodeById.get(setupId).boardSetup });
  for (const id of actionIds) {
    const node = nodeById.get(id);
    const result = node.type.endsWith('skill')
      ? applyTutorialSkillAction(game, node, { pointId: node.pointId, pendingSkillId: `sample-${id}` })
      : applyTutorialNodeAction(game, node, { pointId: node.pointId });
    if (!result.ok) throw new Error(`Invalid guide sample action ${id}: ${result.message}`);
    game = result.resolvedState || result.state;
  }
  return {
    stones: game.points.filter(point => point.valid && point.stone).map(point => ({ pointId: point.id, color: point.stone })),
    invalidPoints: game.points.filter(point => !point.valid).map(point => point.id),
    lastMovePointId: game.history.findLast(entry => entry.type === 'move')?.id || game.tutorialLastMovePointId,
    captures: game.captures,
    ko: game.ko
  };
}
const fields = ['id', 'type', 'characterId', 'speakerName', 'text', 'prompt', 'expressionId', 'appearanceId', 'nextNodeId', 'options', 'boardSetup', 'pointId', 'targetHighlightEnabled', 'color', 'npcCharacterId', 'npcName', 'playerColor', 'playerCharacterId', 'skillCharacterId', 'skillId', 'manualContinueEnabled', 'autoContinueEnabled', 'autoContinueDelaySeconds'];
const data = {
  source: 'server/adminDefaultSnapshot.js / onboarding.default',
  startNodeId: script.publishedStartNodeId,
  nodes: nodes.map(node => Object.fromEntries(fields.filter(key => Object.hasOwn(node, key)).map(key => [key, node[key]]))),
  home: HOME_ONBOARDING_STEPS,
  boardSnapshots: {
    'story-18': snapshot('story-16', ['story-17']),
    'story-24': snapshot('story-16', ['story-17', 'story-18']),
    'doc-ko-user': snapshot('doc-setup-2', ['doc-capture-move', 'doc-forbidden-move']),
    'doc-capture-correct': snapshot('doc-setup-2', ['doc-capture-move']),
    'doc-forbidden-result': snapshot('doc-setup-2', ['doc-capture-move', 'doc-forbidden-move']),
    'doc-skill-g4': snapshot('doc-skill-setup', ['doc-skill-f3']),
    'doc-skill-user-165': snapshot('doc-skill-setup', ['doc-skill-f3', 'doc-skill-g4']),
    'doc-skill-174': snapshot('doc-skill-setup', ['doc-skill-f3', 'doc-skill-g4']),
    'doc-skill-user-178': snapshot('doc-skill-setup', ['doc-skill-f3', 'doc-skill-g4', 'doc-skill-f5'])
  }
};
await writeFile(new URL('./guide-data.js', import.meta.url), `// Generated offline copy. Run node docs/prototypes/character-sprites/sync-guide.mjs.\nwindow.GuideSampleData = ${JSON.stringify(data, null, 2)};\n`, 'utf8');
