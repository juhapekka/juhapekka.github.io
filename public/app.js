//alert("Hello world!");

/*
    <h2>♙♘♗♖♕♔</h2>
    <h2>♟♞♝♜♛♚</h2>
*/

const boardElement = document.querySelector('#board');

//lauta
let board;

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

function createInitialBoard() {
  return [
    'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',
    'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',
    ...Array(32).fill(null),
    'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',
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
  return String.fromCharCode(97 + (square & 7)) + ((square >> 3) + 1);
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

function createSquareButton(square) {
  const piece = board[square];
  const colorName = getPieceColor(piece);
  const isLightSquare = ((square & 7) + (square >> 3)) % 2 === 0;

  const button = document.createElement('button');
  button.className = [
    'square',
    isLightSquare ? 'light' : 'dark',
    piece ? 'piece' : '',
    piece ? `${colorName}-nappula` : ''
  ].filter(Boolean).join(' ');
  button.textContent = getPieceGlyph(piece);
  return button;
}

function renderBoard() {
  boardElement.replaceChildren();
  for (const square of getSquareDisplayOrder()) {
    boardElement.append(createSquareButton(square));
  }
}

board = createInitialBoard();
renderBoard();