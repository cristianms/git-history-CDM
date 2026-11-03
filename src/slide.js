import React from "react";
import animation from "./animation";
import theme from "./darkPlus";
import Scroller from "./scroller";

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
  return (
    <div
      style={Object.assign(
        {
          height: "15px",
          whiteSpace: "pre",
          overflow: clipped ? "hidden" : "visible"
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
          backgroundColor: theme.plain.backgroundColor,
          color: theme.lineNumber.color
        }}
      >
        {numbers[i]}
      </span>
      {line.tokens.map((token, i) => {
        const style = themeStylesByType[token.type] || {};
        return (
          <span style={style} key={i}>
            {token.content}
          </span>
        );
      })}
    </div>
  );
}

function Slide({ lines, styles, changes, numbers }) {
  return (
    <pre
      style={{
        backgroundColor: theme.plain.backgroundColor,
        color: theme.plain.color,
        paddingTop: "100px",
        margin: 0,
        height: "100%",
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
