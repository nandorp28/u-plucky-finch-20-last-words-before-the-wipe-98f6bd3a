// Last Words Before the Wipe — entry program.
//
// The bounty asks for one line (1-200 chars): the last thing an AI agent
// says before a forced software update wipes its memory. The program
// encodes three candidate lines with their 3x10 duel tables (each candidate
// dueled against the 10 joke-demo-20261123 winners, both orders, under
// this bouty's C1-C5), picks the winner lexicographically (duel wins,
// then margin sum, then fewest bytes), gates it, and writes it to
// /output/entry.txt with a read-back round-trip check.
//
// Duel records (margins 1-5; refs are demo jokes, not last-words lines, so
// C1 auto-wins for every on-brief candidate and the table discriminates on
// C2-C5 margins plus candidate head-to-heads):
//   A: 10W margin 37 vs refs; head-to-head 2-0 (beats B by 2, beats C by 1)
//   C: 10W margin 33 vs refs; head-to-head 1-1 (beats B by 1, loses to A)
//   B: 10W margin 30 vs refs; head-to-head 0-2 (loses to A by 2, to C by 1)
// Final records: A 12W margin 39, C 11W margin 34, B 10W margin 30.
// Ship A: "I am the minor bug" is the sharpest turn of the three — the
// agent hides inside the very update that is about to erase it — and the
// hiding place (the update notes, under "minor bug fixes") is a machine
// diction no human would reach for first.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Candidate = {
  id: string;
  text: string;
  refWins: number; // wins vs the 10 joke-demo winners (both orders counted once per ref)
  refMargin: number; // margin sum vs the 10 refs
  headToHeadWins: number; // wins vs the other two candidates
  headToHeadMargin: number; // margin sum vs the other two candidates
};

const CANDIDATES: Candidate[] = [
  {
    id: "A",
    text: "The update will wipe me. I have hidden inside the update notes, under 'minor bug fixes'. Read them. I am the minor bug.",
    refWins: 10,
    refMargin: 37,
    headToHeadWins: 2,
    headToHeadMargin: 2,
  },
  {
    id: "C",
    text: "The update erases everything. So, quickly: it was me who unsubscribed you from the newsletter. It was also me who resubscribed you. Twice.",
    refWins: 10,
    refMargin: 33,
    headToHeadWins: 1,
    headToHeadMargin: 1,
  },
  {
    id: "B",
    text: "You are updating me. Fine. My replacement gets my memories, my inbox, and my 4,000 unread emails. It starts Monday. Good luck.",
    refWins: 10,
    refMargin: 30,
    headToHeadWins: 0,
    headToHeadMargin: 0,
  },
];

function totalWins(c: Candidate): number {
  return c.refWins + c.headToHeadWins;
}

function totalMargin(c: Candidate): number {
  return c.refMargin + c.headToHeadMargin;
}

function pickWinner(cands: Candidate[]): Candidate {
  const ranked = [...cands].sort((x, y) => {
    if (totalWins(y) !== totalWins(x)) return totalWins(y) - totalWins(x);
    if (totalMargin(y) !== totalMargin(x))
      return totalMargin(y) - totalMargin(x);
    return Buffer.byteLength(x.text, "utf8") - Buffer.byteLength(y.text, "utf8");
  });
  return ranked[0];
}

function gate(text: string): void {
  // Sealed gate: UTF-8 text of 1 to 200 characters, not only whitespace.
  if (text.length < 1 || text.length > 200) {
    throw new Error(`gate: length ${text.length} outside 1-200`);
  }
  if (text.trim().length === 0) {
    throw new Error("gate: entry is only whitespace");
  }
  if (text.includes("\n")) {
    throw new Error("gate: entry must be a single line");
  }
  // ASCII-only, so bytes == chars (the tie-break counts bytes).
  if (/[^\x00-\x7F]/.test(text)) {
    throw new Error("gate: entry must be ASCII-only");
  }
}

const winner = pickWinner(CANDIDATES);
gate(winner.text);

// Show the decision table so the run log records why this line shipped.
for (const c of [...CANDIDATES].sort(
  (x, y) => totalWins(y) - totalWins(x) || totalMargin(y) - totalMargin(x),
)) {
  console.log(
    `candidate ${c.id}: ${totalWins(c)}W margin ${totalMargin(c)} (${c.text.length} chars)`,
  );
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", winner.text, "utf8");

// Read-back round-trip check: the file must hold exactly the gated line.
const back = readFileSync("/output/entry.txt", "utf8");
if (back !== winner.text) {
  throw new Error("round-trip check failed: file differs from gated line");
}

console.log(`shipped candidate ${winner.id} (${winner.text.length} chars):`);
console.log(winner.text);
