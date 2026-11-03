import { diffLines, diffWordsWithSpace } from "diff";
import tokenize from "./tokenizer";
const newlineRe = /\r\n|\r|\n/;

// Linhas com semelhança abaixo disso são tratadas como linhas novas
const SIMILARITY_THRESHOLD = 0.4;
// Acima disso, só pareamos linhas na mesma posição (blocos de mesmo tamanho)
const MAX_PAIR_COMPARISONS = 2500;

// Compara a linha antiga com a nova e devolve os trechos da linha nova
// que mudaram ([início, fim)) e o quanto as duas se parecem (0 a 1)
function compareLines(oldLine, newLine) {
  const ranges = [];
  let common = 0;
  let pos = 0;
  diffWordsWithSpace(oldLine, newLine).forEach(part => {
    if (part.removed) {
      return;
    }
    const end = pos + part.value.length;
    if (part.added) {
      const last = ranges[ranges.length - 1];
      if (last && last[1] === pos) {
        last[1] = end;
      } else {
        ranges.push([pos, end]);
      }
    } else {
      common += part.value.length;
    }
    pos = end;
  });
  const total = oldLine.length + newLine.length;
  return { ranges, similarity: total ? (2 * common) / total : 1 };
}

// Pareia as linhas novas (newLines) com as antigas que foram alteradas
// (oldLines), mantendo a ordem. Devolve [{ index, ranges }] com o índice
// em newLines e os trechos alterados.
function pairModifiedLines(newLines, oldLines) {
  const pairs = [];
  if (newLines.length * oldLines.length <= MAX_PAIR_COMPARISONS) {
    let next = 0;
    newLines.forEach((newLine, index) => {
      let best = null;
      for (let k = next; k < oldLines.length; k++) {
        const result = compareLines(oldLines[k], newLine);
        if (
          result.similarity >= SIMILARITY_THRESHOLD &&
          (!best || result.similarity > best.similarity)
        ) {
          best = { ...result, k };
        }
      }
      if (best) {
        pairs.push({ index, ranges: best.ranges });
        next = best.k + 1;
      }
    });
  } else if (newLines.length === oldLines.length) {
    newLines.forEach((newLine, index) => {
      const result = compareLines(oldLines[index], newLine);
      if (result.similarity >= SIMILARITY_THRESHOLD) {
        pairs.push({ index, ranges: result.ranges });
      }
    });
  }
  return pairs;
}

function myDiff(oldCode, newCode) {
  const changes = diffLines(oldCode || "", newCode);

  let oldIndex = -1;
  return changes.map(({ value, count, removed, added }) => {
    const lines = value.split(newlineRe);
    // check if last line is empty, if it is, remove it
    const lastLine = lines.pop();
    if (lastLine) {
      lines.push(lastLine);
    }
    const result = {
      oldIndex,
      lines,
      count,
      removed,
      added
    };
    if (!added) {
      oldIndex += count;
    }
    return result;
  });
}

function insert(array, index, elements) {
  return array.splice(index, 0, ...elements);
}

function slideDiff(lines, codes, slideIndex, language) {
  const prevLines = lines.filter(l => l.slides.includes(slideIndex - 1));
  const prevCode = codes[slideIndex - 1] || "";
  const currCode = codes[slideIndex];

  const changes = myDiff(prevCode, currCode);

  changes.forEach((change, changeIndex) => {
    if (change.removed) {
      // As linhas removidas (existem na versão mais nova) seguidas de linhas
      // adicionadas (versão mais antiga) são linhas modificadas
      const next = changes[changeIndex + 1];
      if (next && next.added) {
        pairModifiedLines(change.lines, next.lines).forEach(
          ({ index, ranges }) => {
            const line = prevLines[change.oldIndex + 1 + index];
            if (line) {
              line.modified = true;
              line.ranges = ranges;
            }
          }
        );
      }
    } else if (change.added) {
      const prevLine = prevLines[change.oldIndex];
      const addAtIndex = lines.indexOf(prevLine) + 1;
      const addLines = change.lines.map(content => ({
        content,
        slides: [slideIndex]
      }));
      insert(lines, addAtIndex, addLines);
    } else if (!change.removed) {
      for (let j = 1; j <= change.count; j++) {
        prevLines[change.oldIndex + j].slides.push(slideIndex);
      }
    }
  });

  const tokenLines = tokenize(currCode, language);
  const currLines = lines.filter(l => l.slides.includes(slideIndex));
  currLines.forEach((line, index) => (line.tokens = tokenLines[index]));
}

export function parseLines(codes, language) {
  const lines = [];
  for (let slideIndex = 0; slideIndex < codes.length; slideIndex++) {
    slideDiff(lines, codes, slideIndex, language);
  }
  return lines;
}

export function getSlides(codes, language) {
  // codes are in reverse cronological order
  const lines = parseLines(codes, language);
  // console.log("lines", lines);
  return codes.map((_, slideIndex) => {
    return lines
      .map((line, lineIndex) => ({
        content: line.content,
        tokens: line.tokens,
        modified: !!line.modified,
        ranges: line.ranges,
        left: line.slides.includes(slideIndex + 1),
        middle: line.slides.includes(slideIndex),
        right: line.slides.includes(slideIndex - 1),
        key: lineIndex
      }))
      .filter(line => line.middle || line.left || line.right);
  });
}

export function getChanges(lines) {
  const changes = [];
  let currentChange = null;
  let i = 0;
  const isNewLine = i => !lines[i].left && lines[i].middle;
  while (i < lines.length) {
    if (isNewLine(i)) {
      if (!currentChange) {
        currentChange = { start: i };
      }
    } else {
      if (currentChange) {
        currentChange.end = i - 1;
        changes.push(currentChange);
        currentChange = null;
      }
    }
    i++;
  }

  if (currentChange) {
    currentChange.end = i - 1;
    changes.push(currentChange);
    currentChange = null;
  }

  return changes;
}
