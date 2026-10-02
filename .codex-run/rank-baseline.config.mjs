import { execFileSync } from "node:child_process";
import base from "../vite.config.js";
export default { ...base, plugins: [{name:"baseline-social",enforce:"pre",load(id){if(id.replaceAll("\\","/").endsWith("/server/social.js")) return execFileSync("git",["show","HEAD:server/social.js"],{encoding:"utf8"});}},...base.plugins] };
