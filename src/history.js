import React, { useEffect, useState } from "react";
import useSpring from "react-use/lib/useSpring";
import Swipeable from "react-swipeable";
import Slide from "./slide";
import { formatDate, formatRelative } from "./utils";
import { BAR_HEIGHT, LIST_HEIGHT } from "./layout";
import "./comment-box.css";

function CommitInfo({ commit, move, onClick }) {
  const message = commit.message.split("\n")[0];
  const isActive = Math.abs(move) < 0.5;
  const dateText = `${formatDate(commit.date)} · ${formatRelative(
    commit.date
  )}`;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: `translateX(-50%) translateX(${250 * move}px)`,
        opacity: 1 / (1 + Math.min(0.8, Math.abs(move))),
        zIndex: !isActive && 2
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "5px 0 15px"
        }}
        onClick={onClick}
      >
        {commit.author.avatar && (
          <img
            src={commit.author.avatar}
            alt={commit.author.login}
            height={40}
            width={40}
            style={{ borderRadius: "4px" }}
          />
        )}
        <div style={{ paddingLeft: "6px" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "500" }}>
            {commit.author.login}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: "0.9" }}>
            {isActive && commit.commitUrl ? (
              <a
                href={commit.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {dateText}
              </a>
            ) : (
              dateText
            )}
            {isActive && commit.hash && (
              <span className="hash-chip">{commit.hash}</span>
            )}
          </div>
        </div>
      </div>
      {isActive && (
        <div
          className="comment-box"
          title={commit.message}
          style={{ opacity: 1 - 2 * Math.abs(move) }}
        >
          <span className="field-label">Título:</span> {message}
        </div>
      )}
    </div>
  );
}

function CommitList({ commits, currentIndex, selectCommit }) {
  const mouseWheelEvent = e => {
    e.preventDefault();
    selectCommit(currentIndex - (e.deltaX + e.deltaY) / 100);
  };
  return (
    <div
      onWheel={mouseWheelEvent}
      style={{
        overflow: "hidden",
        width: "100%",
        height: `${LIST_HEIGHT}px`,
        position: "fixed",
        top: `${BAR_HEIGHT}px`,
        background: "#1e1e1e",
        zIndex: 1
      }}
    >
      {commits.map((commit, commitIndex) => (
        <CommitInfo
          commit={commit}
          move={currentIndex - commitIndex}
          key={commitIndex}
          onClick={() => selectCommit(commitIndex)}
        />
      ))}
    </div>
  );
}

function TopBar({ commit, position, total, hasMore, fileName }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = e => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const branch = commit && commit.branch;
  return (
    <div className="top-bar">
      <div className="top-bar-row">
        {branch && <span className="field-label">Branch:</span>}
        {branch && (
          <span className="branch-badge" title="Branch atual do repositório">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" />
            </svg>
            {branch}
          </span>
        )}
        <span className="top-bar-muted">{fileName}</span>
        <span className="top-bar-right">
          <span className="top-bar-muted">
            Commit {position} de {total}
            {hasMore ? "+" : ""}
          </span>
          <button
            className="details-toggle"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "Ocultar detalhes" : "Ver detalhes"} {open ? "▴" : "▾"}
          </button>
        </span>
      </div>
      {open && commit && <CommitDetails commit={commit} />}
    </div>
  );
}

function CommitDetails({ commit }) {
  const hasStats = commit.added != null && commit.removed != null;
  return (
    <div className="details-panel">
      {commit.body ? (
        <div className="details-body">
          <div className="field-label">Descrição</div>
          {commit.body}
        </div>
      ) : (
        <div className="details-body details-empty">
          <div className="field-label">Descrição</div>
          Este commit não tem descrição além do título.
        </div>
      )}
      <div className="details-grid">
        <span>Autor</span>
        <span>
          {commit.author.login}
          {commit.author.email ? ` <${commit.author.email}>` : ""}
        </span>
        <span>Hash</span>
        <span className="details-mono">{commit.fullHash || commit.hash}</span>
        <span>Data</span>
        <span>{commit.date.toLocaleString("pt-BR")}</span>
        {hasStats && <span>Alterações</span>}
        {hasStats && (
          <span>
            <span className="stat-add">+{commit.added}</span>{" "}
            <span className="stat-del">−{commit.removed}</span> linhas
          </span>
        )}
      </div>
    </div>
  );
}

export default function History({ versions, loadMore, fileName, noMore }) {
  return (
    <Slides
      versions={versions}
      loadMore={loadMore}
      fileName={fileName}
      noMore={noMore}
    />
  );
}

function Slides({ versions, loadMore, fileName, noMore }) {
  const [current, target, setTarget] = useSliderSpring(0);
  const commits = versions.map(v => v.commit);
  const setClampedTarget = newTarget => {
    setTarget(Math.min(commits.length - 0.75, Math.max(-0.25, newTarget)));
    if (newTarget >= commits.length - 5) {
      loadMore();
    }
  };
  const index = Math.round(current);
  const nextSlide = () => setClampedTarget(Math.round(target - 0.51));
  const prevSlide = () => setClampedTarget(Math.round(target + 0.51));
  useEffect(() => {
    document.body.onkeydown = function(e) {
      if (e.keyCode === 39) {
        nextSlide();
      } else if (e.keyCode === 37) {
        prevSlide();
      } else if (e.keyCode === 32) {
        setClampedTarget(current);
      }
    };
  });

  return (
    <React.Fragment>
      <TopBar
        commit={commits[index]}
        position={index + 1}
        total={commits.length}
        hasMore={!noMore}
        fileName={fileName}
      />
      <CommitList
        commits={commits}
        currentIndex={current}
        selectCommit={index => setClampedTarget(index)}
      />
      <Swipeable
        onSwipedLeft={nextSlide}
        onSwipedRight={prevSlide}
        style={{ height: "100%" }}
      >
        <Slide time={index - current} version={versions[index]} />
      </Swipeable>
    </React.Fragment>
  );
}

// TODO use ./useSpring
function useSliderSpring(initial) {
  const [target, setTarget] = useState(initial);
  const tension = 0;
  const friction = 10;
  const value = useSpring(target, tension, friction);
  return [Math.round(value * 100) / 100, target, setTarget];
}
