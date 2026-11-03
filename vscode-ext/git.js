const execa = require("execa");
const pather = require("path");

const FIELD_SEP = "\x1f";
const RECORD_SEP = "\x1e";

async function getCommits(path, last, before) {
  const format =
    ["%h", "%H", "%aN", "%aE", "%ad", "%s", "%b"].join("%x1f") + "%x1e";
  const { stdout } = await execa(
    "git",
    [
      "log",
      `--max-count=${before ? last + 1 : last}`,
      `--pretty=format:${format}`,
      "--date=iso",
      `${before || "HEAD"}`,
      "--",
      pather.basename(path)
    ],
    { cwd: pather.dirname(path) }
  );

  const result = stdout
    .split(RECORD_SEP)
    .map(record => record.replace(/^\r?\n/, ""))
    .filter(record => record.trim() !== "")
    .map(record => {
      const [hash, fullHash, name, email, date, subject, body] = record.split(
        FIELD_SEP
      );
      return {
        hash,
        fullHash,
        author: { login: name, email },
        date: new Date(date),
        message: subject,
        body: (body || "").trim()
      };
    });

  return before ? result.slice(1) : result;
}

async function getContent(commit, path) {
  const { stdout } = await execa(
    "git",
    ["show", `${commit.hash}:./${pather.basename(path)}`],
    { cwd: pather.dirname(path) }
  );
  return stdout;
}

// Soma de linhas adicionadas/removidas do arquivo no commit
async function getStats(commit, path) {
  const { stdout } = await execa(
    "git",
    [
      "show",
      "--numstat",
      "--format=",
      commit.fullHash,
      "--",
      pather.basename(path)
    ],
    { cwd: pather.dirname(path) }
  );
  let added = 0;
  let removed = 0;
  stdout.split(/\r?\n/).forEach(line => {
    const match = line.match(/^(\d+)\t(\d+)\t/);
    if (match) {
      added += Number(match[1]);
      removed += Number(match[2]);
    }
  });
  return { added, removed };
}

// Branch atual do repositório (ou o hash curto quando o HEAD está destacado)
async function getBranch(path) {
  const options = { cwd: pather.dirname(path) };
  try {
    const { stdout } = await execa(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      options
    );
    const branch = stdout.trim();
    if (branch && branch !== "HEAD") {
      return branch;
    }
    const short = await execa("git", ["rev-parse", "--short", "HEAD"], options);
    return short.stdout.trim();
  } catch (e) {
    return null;
  }
}

module.exports = async function(path, last, before) {
  const [commits, branch] = await Promise.all([
    getCommits(path, last, before),
    getBranch(path)
  ]);
  await Promise.all(
    commits.map(async commit => {
      commit.branch = branch;
      commit.content = await getContent(commit, path);
      try {
        Object.assign(commit, await getStats(commit, path));
      } catch (e) {
        // estatísticas são opcionais
      }
    })
  );
  return commits;
};
