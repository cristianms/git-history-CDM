import { getSlides } from "./differ";

// os códigos vêm do mais novo para o mais antigo
function newLines(codes) {
  return getSlides(codes, "javascript")[0].filter(l => l.middle && !l.left);
}

describe("linhas modificadas", () => {
  test("linha alterada vira modified com o trecho novo", () => {
    const lines = newLines(["a\nfoo(100, x)\nb", "a\nfoo(1, x)\nb"]);
    expect(lines).toHaveLength(1);
    expect(lines[0].modified).toBe(true);
    const [[start, end]] = lines[0].ranges;
    expect(lines[0].content.slice(start, end)).toBe("100");
  });

  test("linha totalmente nova não é modified", () => {
    const lines = newLines(["a\nnova linha\nb", "a\nb"]);
    expect(lines).toHaveLength(1);
    expect(lines[0].modified).toBe(false);
  });

  test("linha reescrita por completo é tratada como nova", () => {
    const lines = newLines(["a\nreturn resultado;\nb", "a\nconsole.log(1)\nb"]);
    expect(lines).toHaveLength(1);
    expect(lines[0].modified).toBe(false);
  });

  test("mistura de alteradas e novas no mesmo bloco", () => {
    const lines = newLines([
      "a\nint total = soma(a, b);\nlinha inédita aqui\nb",
      "a\nint total = soma(a);\nb"
    ]);
    expect(lines.map(l => l.modified)).toEqual([true, false]);
  });
});
