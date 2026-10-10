import { expect, it } from "vitest";
import { enteredTeamCharacterIds } from "./teamProfileRecords.js";

it("counts a character once per match even if a legacy lineup contains duplicates", () => {
  expect(enteredTeamCharacterIds({ snapshot: { team: { round: 3 }, players: [{ color: "white", teamLineup: ["sigrika", "sigrika", "aemeath"].map(characterId => ({ characterId })) }] } }, "white")).toEqual(["sigrika", "aemeath"]);
});
it.each([undefined, "broken", "{}"])("falls back to the known active character for a legacy snapshot: %s", (snapshot) => {
  expect(enteredTeamCharacterIds({ snapshot, blackCharacter: "sigrika", whiteCharacter: "aemeath" }, "white")).toEqual(["aemeath"]);
});
