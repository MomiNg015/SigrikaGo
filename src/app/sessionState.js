export function initialSessionState() {
  return {
    token: "",
    view: "preloading"
  };
}

export function shouldFinishPreloadAsHome({ room, matchSuccess }) {
  return !room && !matchSuccess;
}
