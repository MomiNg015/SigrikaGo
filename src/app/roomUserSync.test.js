import { describe, expect, test } from "vitest";
import { mergeCurrentUserFromRoom } from "./roomUserSync.js";

describe("mergeCurrentUserFromRoom", () => {
  test("updates the current user from the matching room player payload", () => {
    const currentUser = {
      id: "denia-user",
      username: "moming",
      coins: 100,
      selectedCharacter: "denia",
      itemEffects: { deniaRainbowGlow: true }
    };
    const room = {
      players: [
        {
          color: "black",
          user: {
            id: "denia-user",
            username: "moming",
            coins: 120,
            selectedCharacter: "denia",
            itemEffects: {}
          }
        },
        {
          color: "white",
          user: {
            id: "other-user",
            username: "other",
            itemEffects: { deniaRainbowGlow: true }
          }
        }
      ]
    };

    const nextUser = mergeCurrentUserFromRoom(currentUser, room);

    expect(nextUser).toEqual({
      id: "denia-user",
      username: "moming",
      coins: 120,
      selectedCharacter: "denia",
      itemEffects: {}
    });
    expect(nextUser).not.toBe(currentUser);
  });

  test("keeps the current user when the room has no matching player", () => {
    const currentUser = { id: "viewer", itemEffects: { deniaRainbowGlow: true } };

    expect(mergeCurrentUserFromRoom(currentUser, { players: [] })).toBe(currentUser);
  });

  test("keeps the current user reference when the matching room payload has no changes", () => {
    const currentUser = {
      id: "denia-user",
      username: "moming",
      coins: 120,
      itemEffects: {}
    };
    const room = {
      players: [
        {
          user: {
            id: "denia-user",
            username: "moming",
            coins: 120,
            itemEffects: {}
          }
        }
      ]
    };

    expect(mergeCurrentUserFromRoom(currentUser, room)).toBe(currentUser);
  });

  test("compares only room user payload fields instead of stringifying the whole user", () => {
    const currentUser = {
      id: "viewer",
      username: "moming",
      itemEffects: { deniaRainbowGlow: true }
    };
    currentUser.self = currentUser;

    const room = {
      players: [
        {
          user: {
            id: "viewer",
            username: "moming",
            itemEffects: { deniaRainbowGlow: true }
          }
        }
      ]
    };

    expect(mergeCurrentUserFromRoom(currentUser, room)).toBe(currentUser);
  });
});
