import base from "./interface-polish.config.js";
export default { ...base, testMatch: "disabled-feedback.spec.js", use: { ...base.use, channel: "msedge" } };
