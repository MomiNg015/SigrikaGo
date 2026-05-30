export function initialSessionState() {
  return {
    token: "",
    view: "preloading"
  };
}

export function shouldFinishPreloadAsHome({ view, room, matchSuccess }) {
  return view === "preloading" && !room && !matchSuccess;
}
