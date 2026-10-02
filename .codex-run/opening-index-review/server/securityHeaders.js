export const CONTENT_SECURITY_POLICY_DIRECTIVES = Object.freeze({
  defaultSrc: Object.freeze(["'self'"]),
  scriptSrc: Object.freeze(["'self'"]),
  workerSrc: Object.freeze(["'self'", "blob:"]),
  styleSrc: Object.freeze(["'self'", "'unsafe-inline'"]),
  imgSrc: Object.freeze(["'self'", "data:", "blob:"]),
  mediaSrc: Object.freeze(["'self'", "data:", "blob:"]),
  connectSrc: Object.freeze(["'self'", "https:", "wss:", "ws:"]),
  fontSrc: Object.freeze(["'self'", "https:", "data:"]),
  objectSrc: Object.freeze(["'none'"]),
  baseUri: Object.freeze(["'self'"]),
  frameAncestors: Object.freeze(["'none'"]),
  formAction: Object.freeze(["'self'"]),
  scriptSrcAttr: Object.freeze(["'none'"]),
  upgradeInsecureRequests: Object.freeze([])
});

export const HELMET_OPTIONS = Object.freeze({
  contentSecurityPolicy: Object.freeze({
    directives: CONTENT_SECURITY_POLICY_DIRECTIVES
  })
});
