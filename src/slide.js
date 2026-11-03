import React from "react";
import animation from "./animation";
import theme from "./darkPlus";
import Scroller from "./scroller";
import { HEADER_HEIGHT } from "./layout";

const ADDED_BG = "rgb(39, 56, 39)";
const ADDED_BAR = "#4ec36b";
const MODIFIED_BG = ADDED_BG;
const MODIFIED_BAR = ADDED_BAR;
const MODIFIED_SNIPPET_BG = "rgba(78, 195, 107, 0.4)";

// Divide os tokens nos limites dos trechos alterados ([início, fim) na linha)
function splitTokens(tokens, ranges) {
  if (!ranges || !ranges.length) {
    return tokens;
  }
  const result = [];
  let pos = 0;
  tokens.forEach(token => {
    const end = pos + token.content.length;
    let cursor = pos;
    const push = (from, to, changed) => {
      if (to > from) {
        result.push({
          type: token.type,
          content: token.content.slice(from - pos, to - pos),
          changed
        });
      }
    };
    ranges.forEach(([start, stop]) => {
      const from = Math.max(start, cursor);
      const to = Math.min(stop, end);
      if (to > from) {
        push(cursor, from, false);
        push(from, to, true);
        cursor = to;
      }
    });
    push(cursor, end, false);
    pos = end;
  });
  return result;
}

const themeStylesByType = Object.create(null);
theme.styles.forEach(({ types, style }) => {
  types.forEach(type => {
    themeStylesByType[type] = Object.assign(
      themeStylesByType[type] || {},
      style
    );
  });
});

function getLineHeight(line, i, { styles }) {
  return styles[i].height != null ? styles[i].height : 15;
}

function getLine(line, i, { styles, numbers }) {
  const style = styles[i];
  const clipped = style.height != null && style.height < 15;
  const isNew = line.middle && !line.left;
  const modified = isNew && line.modified;
  const added = isNew && !modified;
  const rowBg = modified ? MODIFIED_BG : added ? ADDED_BG : undefined;
  const barColor = modified ? MODIFIED_BAR : ADDED_BAR;
  return (
    <div
      style={Object.assign(
        {
          height: "15px",
          whiteSpace: "pre",
          overflow: clipped ? "hidden" : "visible",
          backgroundColor: rowBg
        },
        style
      )}
      key={line.key}
    >
      <span
        style={{
          position: "sticky",
          left: 0,
          display: "inline-block",
          boxSizing: "border-box",
          width: "56px",
          paddingRight: "16px",
          marginRight: "8px",
          textAlign: "right",
          userSelect: "none",
          backgroundColor: rowBg || theme.plain.backgroundColor,
          boxShadow: isNew ? `inset 3px 0 0 ${barColor}` : undefined,
          color: theme.lineNumber.color
        }}
      >
        {numbers[i]}
      </span>
      {splitTokens(line.tokens, modified ? line.ranges : null).map(
        (token, i) => {
          const style = themeStylesByType[token.type] || {};
          return (
            <span
              style={
                token.changed
                  ? { ...style, backgroundColor: MODIFIED_SNIPPET_BG }
                  : style
              }
              key={i}
            >
              {token.content}
            </span>
          );
        }
      )}
    </div>
  );
}

function Slide({ lines, styles, changes, numbers }) {
  return (
    <pre
      style={{
        backgroundColor: theme.plain.backgroundColor,
        color: theme.plain.color,
        paddingTop: `${HEADER_HEIGHT}px`,
        margin: 0,
        height: "100%",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      <Scroller
        items={lines}
        getRow={getLine}
        getRowHeight={getLineHeight}
        data={{ styles, numbers }}
        snapAreas={changes}
      />
    </pre>
  );
}

export default function SlideWrapper({ time, version }) {
  const { lines, changes } = version;
  const styles = animation((time + 1) / 2, lines);
  let count = 0;
  const numbers = lines.map(line => (line.middle ? ++count : ""));
  return (
    <Slide lines={lines} styles={styles} changes={changes} numbers={numbers} />
  );
}
