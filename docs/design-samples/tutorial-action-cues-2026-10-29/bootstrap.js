import { installHomeSampleApi } from "./homeSampleApi.js";

// Install before loading app modules: some catalogs request data on import.
installHomeSampleApi();
await import("./scene.jsx");
