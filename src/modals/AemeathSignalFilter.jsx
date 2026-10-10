// The displacement map varies only vertically, so complete source rows tear
// sideways instead of melting faces. Neutral green prevents vertical warping.
export default function AemeathSignalFilter({ id, displacement, split, seed }) {
  return <filter id={id} x="-15%" y="-5%" width="130%" height="110%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0 .035" numOctaves="1" seed={seed} result="rows" />
    <feComponentTransfer in="rows" result="stepped">
      <feFuncR type="discrete" tableValues="0 .25 .5 .5 .75 1" />
      <feFuncG type="linear" slope="0" intercept=".5" />
    </feComponentTransfer>
    <feDisplacementMap in="SourceGraphic" in2="stepped" scale={displacement} xChannelSelector="R" yChannelSelector="G" result="torn" />
    <feColorMatrix in="torn" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
    <feOffset in="red" dx={split} result="r" />
    <feColorMatrix in="torn" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
    <feColorMatrix in="torn" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
    <feOffset in="blue" dx={-split} result="b" />
    <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
    <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
  </filter>;
}
