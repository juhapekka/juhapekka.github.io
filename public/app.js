const boardElement = document.querySelector('#board');

//lauta
let board;
let selectedSquare = null;

// Laudalla on shakkikoodit ('P', 'n, jne) Tehdään taulut missä
// on koko nimet mitkä yhdistää shakkikoodit näkyviin merkkeihin
const PIECE_GLYPHS = Object.freeze({
  valkoinenSotilas: '♙',
  valkoinenHevonen: '♘',
  valkoinenLahetti: '♗',
  valkoinenTorni: '♖',
  valkoinenKuningatar: '♕',
  valkoinenKuningas: '♔',
  mustaSotilas: '♟',
  mustaHevonen: '♞',
  mustaLahetti: '♝',
  mustaTorni: '♜',
  mustaKuningatar: '♛',
  mustaKuningas: '♚'
});

const PIECE_NAMES = Object.freeze({
  p: 'Sotilas',
  n: 'Hevonen',
  b: 'Lahetti',
  r: 'Torni',
  q: 'Kuningatar',
  k: 'Kuningas'
});

function column(square) {
  return square & 7;
}

function row(square) {
  return square >> 3;
}

function squareIndex(column, row) {
  return row * 8 + column;
}

function isOnBoard(column, row) {
  return column >= 0 && column < 8 && row >= 0 && row < 8;
}
/*
function createInitialBoard() {
  return [
    'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',
    'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',
    ...Array(32).fill(null),
    'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',
    'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'
  ];
}*/

function createInitialBoard() {
  return [
    'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',
    ...Array(32 + 2*8).fill(null),
    'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'
  ];
}


function getSquareDisplayOrder() {
  const squares = [];

  // 8 rivi on eka jolloin valkoset tulee alariviin
  for (let r = 7; r >= 0; r -= 1)
    for (let ff = 0; ff < 8; ff += 1)
        squares.push(ff + r * 8);

  return squares;
}

function squareName(square) {
  return String.fromCharCode(97 + column(square)) + (row(square) + 1);
}

function getPieceColor(piece) {
  if (!piece)
    return null;

  return piece === piece.toUpperCase() ? 'valkoinen' : 'musta';
}

function getPieceGlyph(piece) {
  if (!piece)
    return '';

  const colorName = getPieceColor(piece);
  const pieceName = PIECE_NAMES[piece.toLowerCase()];
  return PIECE_GLYPHS[`${colorName}${pieceName}`];
}

function getOpponentColor(color) {
  return color == 'valkoinen' ? 'musta' : 'valkoinen';
}

function addMoveIfAvailable(position, moves, from, to) {
  const movingColor = getPieceColor(position[from]);
  const targetColor = getPieceColor(position[to]);
  
  if (targetColor != movingColor)
    moves.push({ from, to });
}

function addPawnMoves(position, moves, from, attackOnly) {
  const movingColor = getPieceColor(position[from]);
  const startCol = column(from);
  const startRow = row(from);
  const direction = movingColor == 'valkoinen' ? 1 : -1;

  for (const colOffset of [-1, 1]) {
    const targetCol = startCol + colOffset;
    const targetRow = startRow + direction;

    if (!isOnBoard(targetCol, targetRow))
        continue;

    const to = squareIndex(targetCol, targetRow);
    const isEnemyPiece = position[to] && getPieceColor(position[to]) != movingColor;

    if (attackOnly || isEnemyPiece) {
        moves.push({ from, to });
    }
  }

  if (attackOnly)
    return;

  const oneStepRow = startRow + direction;

  if (!isOnBoard(startCol, oneStepRow))
    return;

  const oneStep = squareIndex(startCol, oneStepRow);

  if (position[oneStep])
    return;

  moves.push({ from, to: oneStep });

  const isStartingRow = startRow == 1 || startRow == 6;

  const twoStep = squareIndex(startCol, startRow + 2 * direction);

  if (isStartingRow && !position[twoStep])
    moves.push({ from, to: twoStep });
}

function addKnightMoves(position, moves, from) {
  const startCol = column(from);
  const startRow = row(from);
  const offsets = [ [1, 2],
                    [2, 1],
                    [2, -1],
                    [1, -2],
                    [-1, -2],
                    [-2, -1],
                    [-2, 1],
                    [-1, 2]
                ];

  for (const [colOffset, rowOffset] of offsets) {
    const targetCol = startCol + colOffset;
    const targetRow = startRow + rowOffset;

    if (isOnBoard(targetCol, targetRow))
      addMoveIfAvailable(position, moves, from, squareIndex(targetCol, targetRow));

  }
}

function addKingMoves(position, moves, from) {
  const startCol = column(from);
  const startRow = row(from);

  for (const colOffset of [-1, 0, 1]) {
    for (const rowOffset of [-1, 0, 1]) {
      if (colOffset == 0 && rowOffset == 0)
        continue;

      const targetCol = startCol + colOffset;
      const targetRow = startRow + rowOffset;

      if (isOnBoard(targetCol, targetRow))
        addMoveIfAvailable(position, moves, from, squareIndex(targetCol, targetRow));

    }
  }
}

function addSlidingMoves(position, moves, from, directions) {
  const movingColor = getPieceColor(position[from]);
  const startCol = column(from);
  const startRow = row(from);

  for (const [colDirection, rowDirection] of directions) {
    let nextCol = startCol + colDirection;
    let nextRow = startRow + rowDirection;

    while (isOnBoard(nextCol, nextRow)) {
      const to = squareIndex(nextCol, nextRow);
      const targetColor = getPieceColor(position[to]);
      
      if (targetColor == movingColor)
        break;

      moves.push({ from, to });

      if (position[to])
        break;

      nextCol += colDirection;
      nextRow += rowDirection;
    }
  }
}

function generateMoves(position, from, attackOnly = false) {
  const piece = position[from];

  if (!piece)
    return [];

  const pieceType = piece.toLowerCase();
  const moves = [];

  if (pieceType == 'p')
    addPawnMoves(position, moves, from, attackOnly);
  else if (pieceType == 'n') 
    addKnightMoves(position, moves, from);
  else if (pieceType == 'k')
    addKingMoves(position, moves, from);
  else if (pieceType == 'b')
    addSlidingMoves(position, moves, from, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  else if (pieceType == 'r')
    addSlidingMoves(position, moves, from, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
  else if (pieceType == 'q')
    addSlidingMoves(position, moves, from, [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);

  // Matti tunnistetaan jos kuningasta vastaan hyökätään ja kuninkaalla
  // ei ole laillisia siirtoja
  return attackOnly ? moves : moves.filter(move => position[move.to]?.toLowerCase() != 'k');
}

function isSquareAttacked(position, square, attackingColor) {
  for (let from = 0; from < 64; from += 1) {

    if (getPieceColor(position[from]) != attackingColor)
        continue;

    if (generateMoves(position, from, true).some(move => move.to == square))
        return true;
  }

  return false;
}

function applyMove(position, move) {
  const nextPosition = [...position];
  const movingPiece = nextPosition[move.from];
  nextPosition[move.to] = movingPiece;
  nextPosition[move.from] = null;

  const reachesLastRank = row(move.to) == 0 || row(move.to) == 7;

  if (movingPiece.toLowerCase() === 'p' && reachesLastRank)
    nextPosition[move.to] = getPieceColor(movingPiece) == 'valkoinen' ? 'Q' : 'q';

  return nextPosition;
}

function getLegalMoves(position, movingColor) {
  const legalMoves = [];

  const king = movingColor == 'valkoinen' ? 'K' : 'k';
  const opponent = getOpponentColor(movingColor);

  // käy läpi koko lauta, kuningas pitää käsitellä erikseen
  for (let from = 0; from < 64; from += 1) {

    if (getPieceColor(position[from]) != movingColor)
        continue;

    for (const move of generateMoves(position, from)) {
      const nextPosition = applyMove(position, move);
      const kingSquare = nextPosition.indexOf(king);

      if (!isSquareAttacked(nextPosition, kingSquare, opponent))
        legalMoves.push(move);
    }
  }

  return legalMoves;
}


function isWhiteTargetSquare(square) {
  if (selectedSquare === null)
    return false;

  return getLegalMoves(board, 'valkoinen').some(move => move.from === selectedSquare && move.to === square);
}


function createSquareButton(square) {
  const piece = board[square];
  const colorName = getPieceColor(piece);
  const isLightSquare = (column(square) + row(square)) % 2 === 0;
  const isSelected = selectedSquare === square;
  const isTarget = isWhiteTargetSquare(square);

  if (isSelected)
      console.log("isSelected");

  const button = document.createElement('button');
  button.className = [
    'square',
    isLightSquare ? 'light' : 'dark',
    isSelected ? 'selected' : '',
    isTarget ? 'target' : '',
    piece ? 'piece' : '',
    piece ? `${colorName}-nappula` : ''
  ].filter(Boolean).join(' ');
  button.textContent = getPieceGlyph(piece);
  button.onclick = () => handleSquareClick(square);
  return button;
}

function handleSquareClick(square) {
  selectedSquare = square;
  console.log(square);
  renderBoard();
}

function renderBoard() {
  boardElement.replaceChildren();
  for (const square of getSquareDisplayOrder()) {
    boardElement.append(createSquareButton(square));
  }
}

board = createInitialBoard();
renderBoard();