export function initialSessionState() {
  return {
    token: "",
    view: "login"
  };
}

export function shouldFinishPreloadAsHome({ view, room, matchSuccess }) {
  return view === "preloading" && !room && !matchSuccess;
}
