const EMPTY = "-";
const HUMAN = "X";
const AI = "O";

// possible mill cordinates
const MILL_DEFS = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[3, 0], [3, 1], [3, 2]],
  [[3, 3], [3, 4], [3, 5]],
  [[4, 0], [4, 1], [4, 2]],
  [[5, 0], [5, 1], [5, 2]],
  [[6, 0], [6, 1], [6, 2]],
  [[0, 0], [3, 0], [6, 0]],
  [[1, 0], [3, 1], [5, 0]],
  [[2, 0], [3, 2], [4, 0]],
  [[2, 2], [3, 3], [4, 2]],
  [[1, 2], [3, 4], [5, 2]],
  [[0, 2], [3, 5], [6, 2]],
].map((mill) => mill.map(([s, i]) => ({ s, i })));

function pointKey(pos) {
  return `${pos.s}:${pos.i}`;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function boardsEqual(left, right) {
  for (let s = 0; s < left.length; s++) {
    for (let i = 0; i < left[s].length; i++) {
      if (left[s][i] !== right[s][i]) return false;
    }
  }
  return true;
}

function makeBoard() {
  // creates the empty board used at the start of each game
  const board = Array.from({ length: 7 }, () => Array(6).fill(" "));

  for (let s = 0; s < 7; s++) {
    for (let i = 0; i < 3; i++) board[s][i] = EMPTY;
  }

  for (let i = 3; i < 6; i++) board[3][i] = EMPTY;
  return board;
}

function positionName(s, i) {
  // changes the board coordinates into the labels required in the brief
  if (s === 0 && i === 0) return "S0,i0";
  if (s === 0 && i === 1) return "S0,i1";
  if (s === 0 && i === 2) return "S0,i2";
  if (s === 3 && i === 3) return "S0,i3";
  if (s === 4 && i === 2) return "S0,i4";
  if (s === 4 && i === 1) return "S0,i5";
  if (s === 4 && i === 0) return "S0,i6";
  if (s === 3 && i === 2) return "S0,i7";

  if (s === 1 && i === 0) return "S1,i0";
  if (s === 1 && i === 1) return "S1,i1";
  if (s === 1 && i === 2) return "S1,i2";
  if (s === 3 && i === 4) return "S1,i3";
  if (s === 5 && i === 2) return "S1,i4";
  if (s === 5 && i === 1) return "S1,i5";
  if (s === 5 && i === 0) return "S1,i6";
  if (s === 3 && i === 1) return "S1,i7";

  if (s === 2 && i === 0) return "S2,i0";
  if (s === 2 && i === 1) return "S2,i1";
  if (s === 2 && i === 2) return "S2,i2";
  if (s === 3 && i === 5) return "S2,i3";
  if (s === 6 && i === 2) return "S2,i4";
  if (s === 6 && i === 1) return "S2,i5";
  if (s === 6 && i === 0) return "S2,i6";
  if (s === 3 && i === 0) return "S2,i7";

  return "S0,i0";
}

function millposition(mill) {
  // puts the three mill positions into one output string
  return mill.map((point) => positionName(point.s, point.i)).join(", ");
}

function countPieces(board, player) {
  // counts how many cows a player still has on the board
  let count = 0;
  for (let s = 0; s < board.length; s++) {
    for (let i = 0; i < board[s].length; i++) {
      if (board[s][i] === player) count++;
    }
  }
  return count;
}

function countAllPieces(board) {
  let pieces = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === HUMAN || cell === AI) pieces++;
    }
  }
  return pieces;
}

function newmill(board, player, prev, mills = MILL_DEFS) {
  // finds which mill was just formed
  let found = -1;

  for (let m = 0; m < mills.length; m++) {
    const formed = mills[m].every((point) => board[point.s][point.i] === player);

    if (formed && !prev[m]) {
      prev[m] = true;
      if (found === -1) found = m;
    } else if (!formed) {
      prev[m] = false;
    }
  }

  return found;
}

function moveText(before, after, player) {
  // compares the old board and new board to write the move correctly
  let fromS = -1;
  let fromI = -1;
  let toS = -1;
  let toI = -1;

  for (let s = 0; s < 7; s++) {
    for (let i = 0; i < 6; i++) {
      if (before[s][i] === player && after[s][i] === EMPTY) {
        fromS = s;
        fromI = i;
      } else if (before[s][i] === EMPTY && after[s][i] === player) {
        toS = s;
        toI = i;
      }
    }
  }

  if (toS === -1) return "no move";
  if (fromS === -1) return `00-${positionName(toS, toI)}`;
  return `${positionName(fromS, fromI)}-${positionName(toS, toI)}`;
}

function actionText(action) {
  if (!action) return "no move";
  if (!action.from) return `00-${positionName(action.to.s, action.to.i)}`;
  return `${positionName(action.from.s, action.from.i)}-${positionName(action.to.s, action.to.i)}`;
}

class Alg1 {
  // this is the class for algorithm 1
  constructor() {
    // these weights tell alg1 what it should prioritise
    this.win_weight = 10000;
    this.createMill_weight = 1300;
    this.block_weight = 950;
    this.centre_weight = 450;
    this.junction_weight = 150;
  }

  spots_open(board) {
    // this array will store all empty positions
    const spots = [];

    // goes through the whole board and saves every playable empty spot
    for (let s = 0; s < board.length; s++) {
      for (let i = 0; i < board[s].length; i++) {
        if (board[s][i] === EMPTY) spots.push({ s, i });
      }
    }
    return spots;
  }

  getNeighbours(s, i) {
    // neigh stores all positions that this cow can move to
    const neigh = [];

    // Horizontal neighbours within same row
    if (i <= 2) {
      if (i > 0) neigh.push({ s, i: i - 1 });
      if (i < 2) neigh.push({ s, i: i + 1 });
    }

    if (s === 3 && i >= 3) {
      if (i > 3) neigh.push({ s, i: i - 1 });
      if (i < 5) neigh.push({ s, i: i + 1 });
    }

    // Vertical / diagonal neighbours
    if (i === 0) {
      if (s === 0) neigh.push({ s: 3, i: 0 });
      if (s === 6) neigh.push({ s: 3, i: 0 });
      if (s === 3) {
        neigh.push({ s: 0, i: 0 });
        neigh.push({ s: 6, i: 0 });
      }
    }

    if (i === 0 && s === 1) neigh.push({ s: 3, i: 1 });
    if (i === 0 && s === 5) neigh.push({ s: 3, i: 1 });
    if (i === 1 && s === 3) {
      neigh.push({ s: 1, i: 0 });
      neigh.push({ s: 5, i: 0 });
    }

    if (i === 0 && s === 2) neigh.push({ s: 3, i: 2 });
    if (i === 0 && s === 4) neigh.push({ s: 3, i: 2 });
    if (i === 2 && s === 3) {
      neigh.push({ s: 2, i: 0 });
      neigh.push({ s: 4, i: 0 });
    }

    if (i === 2 && s === 2) neigh.push({ s: 3, i: 3 });
    if (i === 2 && s === 4) neigh.push({ s: 3, i: 3 });
    if (i === 3 && s === 3) {
      neigh.push({ s: 2, i: 2 });
      neigh.push({ s: 4, i: 2 });
    }

    if (i === 2 && s === 1) neigh.push({ s: 3, i: 4 });
    if (i === 2 && s === 5) neigh.push({ s: 3, i: 4 });
    if (i === 4 && s === 3) {
      neigh.push({ s: 1, i: 2 });
      neigh.push({ s: 5, i: 2 });
    }

    if (i === 2 && s === 0) neigh.push({ s: 3, i: 5 });
    if (i === 2 && s === 6) neigh.push({ s: 3, i: 5 });
    if (i === 5 && s === 3) {
      neigh.push({ s: 0, i: 2 });
      neigh.push({ s: 6, i: 2 });
    }

    return neigh;
  }

  createsMill(board, s, i, player) {
    // checks every mill pattern to see if all three spots belong to the player
    for (const mill of MILL_DEFS) {
      let formed = true;
      let inMill = false;

      for (const point of mill) {
        const cell = point.s === s && point.i === i ? player : board[point.s][point.i];
        if (cell !== player) {
          formed = false;
          break;
        }
        if (point.s === s && point.i === i) inMill = true;
      }

      if (formed && inMill) return true;
    }

    return false;
  }

  block(board, s, i, player, opp) {
    void player;
    // if the opponent could make a mill here, then playing here blocks them
    return this.createsMill(board, s, i, opp);
  }

  centre(board, s, i) {
    void board;
    void s;
    return i === 1;
  }

  junction(board, s, i) {
    void board;
    void s;
    return i === 0 || i === 2;
  }

  millPotential(board, player, s, i) {
    // all possible mills are checked to see how useful this position is
    let count = 0;

    for (const mill of MILL_DEFS) {
      let inMill = false;
      let playerCount = 0;

      for (const point of mill) {
        if (point.s === s && point.i === i) inMill = true;
        if (board[point.s][point.i] === player) playerCount++;
      }

      if (inMill && playerCount >= 1) count++;
    }

    return count;
  }

  validMoves(board, player) {
    const moves = [];

    // finds every cow belonging to the player, then checks its neighbours
    for (let s = 0; s < board.length; s++) {
      for (let i = 0; i < board[s].length; i++) {
        if (board[s][i] === player) {
          for (const n of this.getNeighbours(s, i)) {
            if (board[n.s][n.i] === EMPTY) moves.push({ from: { s, i }, to: n });
          }
        }
      }
    }

    return moves;
  }

  noMoves(board, player) {
    // if validMoves returns nothing, the player is stuck
    return this.validMoves(board, player).length === 0;
  }

  winmove(board, player) {
    // tests every empty space to see if the player can make a mill there
    for (let s = 0; s < board.length; s++) {
      for (let i = 0; i < board[s].length; i++) {
        if (board[s][i] === EMPTY && this.createsMill(board, s, i, player)) return true;
      }
    }
    return false;
  }

  gameOver(board, placingComplete) {
    // game over rules only count after all cows have been placed
    if (!placingComplete) return false;

    const countX = countPieces(board, HUMAN);
    const countO = countPieces(board, AI);

    if (countX < 3 || countO < 3) return true;
    if (this.noMoves(board, HUMAN) || this.noMoves(board, AI)) return true;
    return false;
  }

  removablePieces(board, opp) {
    // pieces stores opponent cows that can be captured
    let pieces = [];

    // first try to remove cows that are not inside a mill
    for (let s = 0; s < board.length; s++) {
      for (let i = 0; i < board[s].length; i++) {
        if (board[s][i] === opp && !this.createsMill(board, s, i, opp)) {
          pieces.push({ s, i });
        }
      }
    }

    // if all opponent pieces are in mills, allow removing any of them
    if (pieces.length === 0) {
      pieces = [];
      for (let s = 0; s < board.length; s++) {
        for (let i = 0; i < board[s].length; i++) {
          if (board[s][i] === opp) pieces.push({ s, i });
        }
      }
    }

    return pieces;
  }

  scoringSystem(board, player, opp, moveCount) {
    void moveCount;
    // if alg1 can make a mill soon, the score becomes very high
    if (this.winmove(board, player)) return this.win_weight;

    // if the opponent can make a mill soon, the score becomes very low
    if (this.winmove(board, opp)) return -this.win_weight;

    let score = 0;
    let playerPieces = 0;
    let oppPieces = 0;

    // goes through the board and adds or subtracts points
    for (let s = 0; s < board.length; s++) {
      for (let i = 0; i < board[s].length; i++) {
        if (board[s][i] === EMPTY) {
          if (this.createsMill(board, s, i, player)) score += this.createMill_weight;
          else if (this.block(board, s, i, player, opp)) score += this.block_weight;
          if (this.createsMill(board, s, i, opp)) score -= this.createMill_weight;
        }

        if (board[s][i] === player) {
          playerPieces++;
          if (i === 1) score += this.centre_weight;
          if (i === 0 || i === 2) score += this.junction_weight;
        }

        if (board[s][i] === opp) {
          oppPieces++;
          if (i === 1) score -= this.centre_weight;
          if (i === 0 || i === 2) score -= this.junction_weight;
        }
      }
    }

    score += (playerPieces - oppPieces) * 200;
    return score;
  }

  minimax(board, depth, alpha, beta, maximizing, player, opp) {
    // counts how many cows are currently on the board
    const piecesOnBoard = countAllPieces(board);
    const placingDone = piecesOnBoard >= 18;

    // stop looking ahead when depth reaches zero or the game is over
    if (depth === 0 || this.gameOver(board, placingDone)) {
      return this.scoringSystem(board, player, opp, depth);
    }

    const placementPhase = piecesOnBoard < 24;

    if (maximizing) {
      // maximizing means alg1 is trying to get the highest score
      let maxEval = -1000000;
      let tested = 0;

      if (placementPhase) {
        for (const m of this.spots_open(board)) {
          tested++;
          board[m.s][m.i] = player;

          if (this.createsMill(board, m.s, m.i, player)) {
            for (const r of this.removablePieces(board, opp)) {
              const saved = board[r.s][r.i];
              board[r.s][r.i] = EMPTY;
              const evalScore = this.minimax(board, depth - 1, alpha, beta, false, player, opp);
              board[r.s][r.i] = saved;
              maxEval = Math.max(maxEval, evalScore);
              alpha = Math.max(alpha, evalScore);
              if (beta <= alpha) break;
            }
          } else {
            const evalScore = this.minimax(board, depth - 1, alpha, beta, false, player, opp);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
          }

          board[m.s][m.i] = EMPTY;
          if (beta <= alpha) break;
        }
      } else {
        for (const mv of this.validMoves(board, player)) {
          tested++;
          board[mv.from.s][mv.from.i] = EMPTY;
          board[mv.to.s][mv.to.i] = player;

          if (this.createsMill(board, mv.to.s, mv.to.i, player)) {
            for (const r of this.removablePieces(board, opp)) {
              const saved = board[r.s][r.i];
              board[r.s][r.i] = EMPTY;
              const evalScore = this.minimax(board, depth - 1, alpha, beta, false, player, opp);
              board[r.s][r.i] = saved;
              maxEval = Math.max(maxEval, evalScore);
              alpha = Math.max(alpha, evalScore);
              if (beta <= alpha) break;
            }
          } else {
            const evalScore = this.minimax(board, depth - 1, alpha, beta, false, player, opp);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
          }

          board[mv.from.s][mv.from.i] = player;
          board[mv.to.s][mv.to.i] = EMPTY;
          if (beta <= alpha) break;
        }
      }

      return tested === 0 ? this.scoringSystem(board, player, opp, depth) : maxEval;
    }

    // minimizing means the opponent is trying to lower alg1's score
    let minEval = 1000000;
    let tested = 0;

    if (placementPhase) {
      for (const m of this.spots_open(board)) {
        tested++;
        board[m.s][m.i] = opp;

        if (this.createsMill(board, m.s, m.i, opp)) {
          for (const r of this.removablePieces(board, player)) {
            const saved = board[r.s][r.i];
            board[r.s][r.i] = EMPTY;
            const evalScore = this.minimax(board, depth - 1, alpha, beta, true, player, opp);
            board[r.s][r.i] = saved;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
          }
        } else {
          const evalScore = this.minimax(board, depth - 1, alpha, beta, true, player, opp);
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
        }

        board[m.s][m.i] = EMPTY;
        if (beta <= alpha) break;
      }
    } else {
      for (const mv of this.validMoves(board, opp)) {
        tested++;
        board[mv.from.s][mv.from.i] = EMPTY;
        board[mv.to.s][mv.to.i] = opp;

        if (this.createsMill(board, mv.to.s, mv.to.i, opp)) {
          for (const r of this.removablePieces(board, player)) {
            const saved = board[r.s][r.i];
            board[r.s][r.i] = EMPTY;
            const evalScore = this.minimax(board, depth - 1, alpha, beta, true, player, opp);
            board[r.s][r.i] = saved;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
          }
        } else {
          const evalScore = this.minimax(board, depth - 1, alpha, beta, true, player, opp);
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
        }

        board[mv.from.s][mv.from.i] = opp;
        board[mv.to.s][mv.to.i] = EMPTY;
        if (beta <= alpha) break;
      }
    }

    return tested === 0 ? this.scoringSystem(board, player, opp, depth) : minEval;
  }

  getbestmove(board, player, opp) {
    // counts pieces to decide if the game is still in placement phase
    const pieces = countAllPieces(board);
    const placementPhase = pieces < 24;
    let bestscore = -1000000;
    let bestMove = { from: { s: -1, i: -1 }, to: { s: -1, i: -1 } };

    if (placementPhase) {
      // during placing, test every empty position
      for (const m of this.spots_open(board)) {
        board[m.s][m.i] = player;

        if (this.createsMill(board, m.s, m.i, player)) {
          for (const r of this.removablePieces(board, opp)) {
            const saved = board[r.s][r.i];
            board[r.s][r.i] = EMPTY;
            const score = this.minimax(board, 2, -1000000, 1000000, false, player, opp);
            board[r.s][r.i] = saved;
            if (score > bestscore) {
              bestscore = score;
              bestMove = { from: { s: -1, i: -1 }, to: { ...m } };
            }
          }
        } else {
          const score = this.minimax(board, 2, -1000000, 1000000, false, player, opp);
          if (score > bestscore) {
            bestscore = score;
            bestMove = { from: { s: -1, i: -1 }, to: { ...m } };
          }
        }

        board[m.s][m.i] = EMPTY;
      }
    } else {
      // during moving, test every legal slide
      for (const mv of this.validMoves(board, player)) {
        board[mv.from.s][mv.from.i] = EMPTY;
        board[mv.to.s][mv.to.i] = player;

        if (this.createsMill(board, mv.to.s, mv.to.i, player)) {
          for (const r of this.removablePieces(board, opp)) {
            const saved = board[r.s][r.i];
            board[r.s][r.i] = EMPTY;
            const score = this.minimax(board, 2, -1000000, 1000000, false, player, opp);
            board[r.s][r.i] = saved;
            if (score > bestscore) {
              bestscore = score;
              bestMove = { from: { ...mv.from }, to: { ...mv.to } };
            }
          }
        } else {
          const score = this.minimax(board, 2, -1000000, 1000000, false, player, opp);
          if (score > bestscore) {
            bestscore = score;
            bestMove = { from: { ...mv.from }, to: { ...mv.to } };
          }
        }

        board[mv.from.s][mv.from.i] = player;
        board[mv.to.s][mv.to.i] = EMPTY;
      }
    }

    return bestMove;
  }

  playTurn(board, player, opp) {
    // gets the best move according to alg1's scoring
    const best = this.getbestmove(board, player, opp);
    if (best.to.s === -1) return false;

    if (best.from.s === -1) {
      // placement phase, so the cow starts outside the board
      board[best.to.s][best.to.i] = player;
    } else {
      // movement phase, so remove it from old position and put it in new position
      board[best.from.s][best.from.i] = EMPTY;
      board[best.to.s][best.to.i] = player;
    }

    return true;
  }
}

// chooses the best opponent piece to remove after alg1 forms a mill
function bestRemovable(alg1, board, opp) {
  const candidates = alg1.removablePieces(board, opp);
  if (candidates.length === 0) return -1;

  let besti = 0;
  let bestPot = -1;

  for (let k = 0; k < candidates.length; k++) {
    const pot = alg1.millPotential(board, opp, candidates[k].s, candidates[k].i);
    if (pot > bestPot) {
      bestPot = pot;
      besti = k;
    }
  }

  return besti;
}

function chooseAlg1Move(board, alg1, player, opp) {
  // alg1 tries all possible moves and keeps the move with the best score
  const moves = alg1.validMoves(board, player);
  if (moves.length === 0) return false;

  let bestScore = -1000000;
  let bestMove = 0;

  for (let k = 0; k < moves.length; k++) {
    // Try the move, score it, then undo it before trying the next one.
    board[moves[k].from.s][moves[k].from.i] = EMPTY;
    board[moves[k].to.s][moves[k].to.i] = player;

    let score = alg1.scoringSystem(board, player, opp, 0);
    if (alg1.createsMill(board, moves[k].to.s, moves[k].to.i, player)) score += 3000;
    if (alg1.block(board, moves[k].to.s, moves[k].to.i, player, opp)) score += 1200;
    score += alg1.millPotential(board, player, moves[k].to.s, moves[k].to.i) * 150;

    board[moves[k].from.s][moves[k].from.i] = player;
    board[moves[k].to.s][moves[k].to.i] = EMPTY;

    if (score > bestScore) {
      bestScore = score;
      bestMove = k;
    }
  }

  board[moves[bestMove].from.s][moves[bestMove].from.i] = EMPTY;
  board[moves[bestMove].to.s][moves[bestMove].to.i] = player;
  return true;
}

function placepiece(board, s, i) {
  // only place on a playable empty position
  if (board[s][i] === EMPTY) {
    board[s][i] = AI;
    return true;
  }
  return false;
}

function milling(board, player) {
  // aims to complete a mill or block an opponents pontetial mill
  for (const mill of MILL_DEFS) {
    let count = 0;
    let emptyS = -1;
    let emptyI = -1;

    // check the three positions inside the current mill
    for (const point of mill) {
      if (board[point.s][point.i] === player) count++;
      else if (board[point.s][point.i] === EMPTY) {
        emptyS = point.s;
        emptyI = point.i;
      }
    }

    // if two pieces are already there and one spot is empty, play there
    if (count === 2 && emptyS !== -1) return placepiece(board, emptyS, emptyI);
  }
  return false;
}

function openings(board) {
  // look through the board until the first open position is found
  for (let s = 0; s < 7; s++) {
    for (let i = 0; i < 6; i++) {
      if (placepiece(board, s, i)) return true;
    }
  }
  return false;
}

class Alg2 {
  constructor() {
    this.expmoves = 0;
  }

  millcapture(board) {
    // alg2 removes the first alg1 cow it finds
    for (let s = 0; s < 7; s++) {
      for (let i = 0; i < 6; i++) {
        if (board[s][i] === HUMAN) {
          board[s][i] = EMPTY;
          return true;
        }
      }
    }
    return false;
  }

  firstmoves(board, moves) {
    void moves;
    // was prevously designed to find the optimal first move, now it calls the placing phase to decide
    return this.placingphase(board, moves);
  }

  placingphase(board, moves) {
    void moves;
    // first try to complete alg2's own mill
    if (milling(board, AI)) return true;

    // then try to block alg1 from making a mill
    if (milling(board, HUMAN)) return true;

    // if nothing special is possible, just play on an open space
    return openings(board);
  }

  movingphase(board, moves) {
    void moves;
    // search for an O cow that can be moved
    for (let s = 0; s < 7; s++) {
      for (let i = 0; i < 6; i++) {
        if (board[s][i] === AI) {
          // check every mill line that might contain this cow
          for (const mill of MILL_DEFS) {
            for (let k = 0; k < mill.length; k++) {
              if (mill[k].s === s && mill[k].i === i) {
                // try moving backwards along the line
                if (k > 0) {
                  const next = mill[k - 1];
                  if (board[next.s][next.i] === EMPTY) {
                    board[s][i] = EMPTY;
                    board[next.s][next.i] = AI;
                    return true;
                  }
                }

                // try moving forwards along the line
                if (k < 2) {
                  const next = mill[k + 1];
                  if (board[next.s][next.i] === EMPTY) {
                    board[s][i] = EMPTY;
                    board[next.s][next.i] = AI;
                    return true;
                  }
                }
              }
            }
          }
        }
      }
    }
    return false;
  }
}

const app = {
  board: makeBoard(),
  alg1: new Alg1(),
  alg2: new Alg2(),
  difficulty: "hard",
  pieces: 12,
  placedHuman: 0,
  placedAi: 0,
  current: HUMAN,
  selected: null,
  captureMode: false,
  pendingMill: -1,
  turns: 0,
  turnsWithoutCapture: 0,
  millsHuman: Array(MILL_DEFS.length).fill(false),
  millsAi: Array(MILL_DEFS.length).fill(false),
  gameOver: false,
  status: "",
  log: [],
};

let elements = null;
let scene3d = null;

function isSamePoint(a, b) {
  return a && b && a.s === b.s && a.i === b.i;
}

function isPointInList(point, list) {
  return list.some((item) => isSamePoint(point, item));
}

function fullPlacementDone() {
  return app.placedHuman >= app.pieces && app.placedAi >= app.pieces;
}

function currentAiName() {
  return app.difficulty === "hard" ? "Alg 1" : "Alg 2";
}

function addLog(text) {
  app.log.unshift(text);
  app.log = app.log.slice(0, 80);
}

function setTurnStatus() {
  if (app.gameOver) return;

  if (app.captureMode) {
    app.status = `Mill formed: ${millposition(MILL_DEFS[app.pendingMill])}. Capture an AI cow.`;
    return;
  }

  if (app.current === HUMAN) {
    app.status = app.placedHuman < app.pieces
      ? `Your turn: place cow ${app.placedHuman + 1} of ${app.pieces}.`
      : "Your turn: move a cow.";
    return;
  }

  app.status = `${currentAiName()} is thinking.`;
}

function legalHumanMovesFrom(point) {
  return app.alg1
    .getNeighbours(point.s, point.i)
    .filter((next) => app.board[next.s][next.i] === EMPTY);
}

function impossibleMove(point) {
  if (scene3d) scene3d.playImpossibleMove(point);
}

function renderScene() {
  if (!scene3d) return;

  scene3d.update({
    board: app.board,
    selected: app.selected,
    legalTargets: app.selected ? legalHumanMovesFrom(app.selected) : [],
    captureTargets: app.captureMode ? app.alg1.removablePieces(app.board, AI) : [],
    current: app.current,
    gameOver: app.gameOver,
  });
}

function renderControls() {
  for (const button of elements.difficultyButtons) {
    const active = button.dataset.difficulty === app.difficulty;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  elements.pieceCount.value = String(app.pieces);
  elements.humanCount.textContent = String(countPieces(app.board, HUMAN));
  elements.aiCount.textContent = String(countPieces(app.board, AI));
  elements.phaseLabel.textContent = fullPlacementDone() ? "Move" : "Place";
  elements.statusText.textContent = app.status;
  elements.turnBadge.textContent = app.gameOver ? "Game over" : app.current === HUMAN ? "Your turn" : "AI turn";

  elements.moveLog.innerHTML = "";
  for (const item of app.log) {
    const li = document.createElement("li");
    li.textContent = item;
    elements.moveLog.append(li);
  }
}

function render() {
  renderScene();
  renderControls();
}

function startNewGame() {
  app.board = makeBoard();
  app.alg1 = new Alg1();
  app.alg2 = new Alg2();
  app.pieces = Number(elements.pieceCount.value);
  app.placedHuman = 0;
  app.placedAi = 0;
  app.current = HUMAN;
  app.selected = null;
  app.captureMode = false;
  app.pendingMill = -1;
  app.turns = 0;
  app.turnsWithoutCapture = 0;
  app.millsHuman = Array(MILL_DEFS.length).fill(false);
  app.millsAi = Array(MILL_DEFS.length).fill(false);
  app.gameOver = false;
  app.log = [];
  app.status = "";

  if (scene3d) scene3d.resetEndAnimation();
  setTurnStatus();
  render();
}

function endGame(message, outcome) {
  app.gameOver = true;
  app.captureMode = false;
  app.selected = null;
  app.status = message;
  addLog(message);
  if (scene3d) scene3d.playEndAnimation(outcome);
  render();
}

function checkGameEnd() {
  if (app.turns >= app.pieces * 2 + 40) {
    endGame("It is a draw.", "draw");
    return true;
  }

  if (!fullPlacementDone()) return false;

  const humanPieces = countPieces(app.board, HUMAN);
  const aiPieces = countPieces(app.board, AI);

  if (humanPieces < 3) {
    endGame(`${currentAiName()} wins.`, "lose");
    return true;
  }

  if (aiPieces < 3) {
    endGame("You win.", "win");
    return true;
  }

  if (app.alg1.noMoves(app.board, HUMAN)) {
    endGame(`${currentAiName()} wins.`, "lose");
    return true;
  }

  if (app.alg1.noMoves(app.board, AI)) {
    endGame("You win.", "win");
    return true;
  }

  if ((humanPieces === 3 || aiPieces === 3) && app.turnsWithoutCapture >= 10) {
    endGame("It is a draw.", "draw");
    return true;
  }

  return false;
}

function finishHumanTurn() {
  app.turns++;
  app.selected = null;

  if (checkGameEnd()) return;

  app.current = AI;
  setTurnStatus();
  render();
  window.setTimeout(playAiTurn, 440);
}

function finishAiTurn() {
  app.turns++;
  if (checkGameEnd()) return;

  app.current = HUMAN;
  setTurnStatus();
  render();
}

function afterHumanMove(action) {
  const millIndex = newmill(app.board, HUMAN, app.millsHuman);
  const line = `You ${actionText(action)}`;

  if (millIndex !== -1) {
    app.captureMode = true;
    app.pendingMill = millIndex;
    app.status = `Mill formed: ${millposition(MILL_DEFS[millIndex])}. Capture an AI cow.`;
    addLog(`${line} (mill = ${millposition(MILL_DEFS[millIndex])})`);
    render();
    return;
  }

  app.turnsWithoutCapture++;
  addLog(line);
  finishHumanTurn();
}

function handleHumanCapture(point) {
  const removable = app.alg1.removablePieces(app.board, AI);

  if (!isPointInList(point, removable)) {
    app.status = "Choose a highlighted AI cow.";
    impossibleMove(point);
    render();
    return;
  }

  app.board[point.s][point.i] = EMPTY;
  app.turnsWithoutCapture = 0;
  app.captureMode = false;
  addLog(`You captured ${positionName(point.s, point.i)}.`);
  app.pendingMill = -1;
  finishHumanTurn();
}

function handleHumanPlacement(point) {
  if (app.board[point.s][point.i] !== EMPTY) {
    app.status = "Choose an empty point.";
    impossibleMove(point);
    render();
    return;
  }

  app.board[point.s][point.i] = HUMAN;
  app.placedHuman++;
  afterHumanMove({ from: null, to: { s: point.s, i: point.i } });
}

function handleHumanMovement(point) {
  if (!app.selected) {
    if (app.board[point.s][point.i] !== HUMAN) {
      app.status = "Choose one of your cows.";
      impossibleMove(point);
      render();
      return;
    }

    app.selected = { s: point.s, i: point.i };
    app.status = "Choose a connected empty point.";
    render();
    return;
  }

  if (isSamePoint(point, app.selected)) {
    app.selected = null;
    setTurnStatus();
    render();
    return;
  }

  if (app.board[point.s][point.i] === HUMAN) {
    app.selected = { s: point.s, i: point.i };
    app.status = "Choose a connected empty point.";
    render();
    return;
  }

  const legalTargets = legalHumanMovesFrom(app.selected);
  if (!isPointInList(point, legalTargets)) {
    app.status = "Choose a highlighted point.";
    impossibleMove(point);
    render();
    return;
  }

  const from = { ...app.selected };
  app.board[from.s][from.i] = EMPTY;
  app.board[point.s][point.i] = HUMAN;
  app.selected = null;
  afterHumanMove({ from, to: { s: point.s, i: point.i } });
}

function handlePointClick(point) {
  if (app.gameOver || app.current !== HUMAN) {
    impossibleMove(point);
    return;
  }

  if (app.captureMode) {
    handleHumanCapture(point);
    return;
  }

  if (app.placedHuman < app.pieces) handleHumanPlacement(point);
  else handleHumanMovement(point);
}

function captureForHardAi() {
  const removable = app.alg1.removablePieces(app.board, HUMAN);
  const index = bestRemovable(app.alg1, app.board, HUMAN);
  if (index === -1) return "";

  const removed = removable[index];
  app.board[removed.s][removed.i] = EMPTY;
  return positionName(removed.s, removed.i);
}

function captureForMediumAi() {
  const beforeRemove = cloneBoard(app.board);
  app.alg2.millcapture(app.board);

  for (let s = 0; s < 7; s++) {
    for (let i = 0; i < 6; i++) {
      if (beforeRemove[s][i] === HUMAN && app.board[s][i] === EMPTY) {
        return positionName(s, i);
      }
    }
  }
  return "";
}

function playAiTurn() {
  if (app.gameOver || app.current !== AI) return;

  const before = cloneBoard(app.board);
  let moved = false;

  if (app.placedAi < app.pieces) {
    if (app.difficulty === "hard") {
      moved = app.alg1.playTurn(app.board, AI, HUMAN);
    } else {
      moved = app.turns < 2
        ? app.alg2.firstmoves(app.board, app.turns)
        : app.alg2.placingphase(app.board, app.turns);
    }

    if (moved) app.placedAi++;
  } else if (app.difficulty === "hard") {
    moved = chooseAlg1Move(app.board, app.alg1, AI, HUMAN);
  } else {
    moved = app.alg2.movingphase(app.board, app.turns);
  }

  if (!moved || boardsEqual(before, app.board)) {
    endGame("You win.", "win");
    return;
  }

  let line = `${currentAiName()} ${moveText(before, app.board, AI)}`;
  const millIndex = newmill(app.board, AI, app.millsAi);

  if (millIndex !== -1) {
    const removedName = app.difficulty === "hard" ? captureForHardAi() : captureForMediumAi();
    app.turnsWithoutCapture = 0;
    line += ` (mill = ${millposition(MILL_DEFS[millIndex])}) You lose cow (${removedName}) | ${countPieces(app.board, HUMAN)} left`;
  } else {
    app.turnsWithoutCapture++;
  }

  addLog(line);
  finishAiTurn();
}

function bindControls() {
  for (const button of elements.difficultyButtons) {
    button.addEventListener("click", () => {
      app.difficulty = button.dataset.difficulty;
      startNewGame();
    });
  }

  elements.pieceCount.addEventListener("change", startNewGame);
  elements.newGameButton.addEventListener("click", startNewGame);
}

async function initScene() {
  try {
    const { createParkTableScene } = await import("./scene.mjs");
    scene3d = await createParkTableScene(elements.sceneHost, {
      onPointClick: handlePointClick,
    });
    elements.sceneMessage.hidden = true;
    render();
  } catch (error) {
    console.error(error);
    elements.sceneMessage.hidden = false;
    elements.sceneMessage.textContent = "3D scene could not load. Check the browser connection and reload.";
  }
}

function initApp() {
  elements = {
    sceneHost: document.querySelector("#sceneHost"),
    sceneMessage: document.querySelector("#sceneMessage"),
    difficultyButtons: [...document.querySelectorAll("[data-difficulty]")],
    pieceCount: document.querySelector("#pieceCount"),
    newGameButton: document.querySelector("#newGameButton"),
    humanCount: document.querySelector("#humanCount"),
    aiCount: document.querySelector("#aiCount"),
    phaseLabel: document.querySelector("#phaseLabel"),
    statusText: document.querySelector("#statusText"),
    turnBadge: document.querySelector("#turnBadge"),
    moveLog: document.querySelector("#moveLog"),
  };

  bindControls();
  startNewGame();
  initScene();
}

if (typeof document !== "undefined") {
  initApp();
}

export {
  AI,
  Alg1,
  Alg2,
  EMPTY,
  HUMAN,
  MILL_DEFS,
  bestRemovable,
  chooseAlg1Move,
  cloneBoard,
  countPieces,
  makeBoard,
  newmill,
  pointKey,
};
