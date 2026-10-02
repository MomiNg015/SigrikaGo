const DAMAGE_BLOCKS = ["a", "b", "c", "d", "e", "f"];

export default function SigrikaCorruptionOverlay() {
  return (
    <div className="sigrika-corruption-field" aria-hidden="true">
      <span className="sigrika-corruption-field__scan" />
      <span className="sigrika-corruption-field__tear sigrika-corruption-field__tear--high" />
      <span className="sigrika-corruption-field__tear sigrika-corruption-field__tear--middle" />
      <span className="sigrika-corruption-field__tear sigrika-corruption-field__tear--low" />
      <span className="sigrika-corruption-field__fragment sigrika-corruption-field__fragment--archive">
        档案 08 // 读取失败
      </span>
      <span className="sigrika-corruption-field__fragment sigrika-corruption-field__fragment--subject">
        西格莉卡 // ???
      </span>
      <span className="sigrika-corruption-field__fragment sigrika-corruption-field__fragment--sync">
        [ 同步已中断 ]
      </span>
      {DAMAGE_BLOCKS.map((block) => (
        <span key={block} className={`sigrika-corruption-field__block sigrika-corruption-field__block--${block}`} />
      ))}
    </div>
  );
}
