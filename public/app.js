const boardElement = document.querySelector('#board');
const statusElement = document.querySelector('#status');

//lauta
let board;
let selectedSquare = null;
let historia;
let isGameFinished;

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

// nappuloiden arvostus
const PIECE_VALUES = Object.freeze({
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0
});

const VAIKEUS_ASETUKSET = Object.freeze({
  helppo: { nimi: 'Helppo', syvyys: 0 },
  normaali: { nimi: 'Normaali', syvyys: 1 },
  vaikea: { nimi: 'vaikea', syvyys: 2 }
});

const difficultyElement = document.querySelector('#vaikeus');

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

function siirtotokeni(from, to) {
  return (from << 6) | to;
}

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
  else if (pieceType == 'b')
    addSlidingMoves(position, moves, from, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  else if (pieceType == 'r')
    addSlidingMoves(position, moves, from, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
  else if (pieceType == 'q')
    addSlidingMoves(position, moves, from, [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);
  else if (pieceType == 'k')
    addKingMoves(position, moves, from);

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
  if (selectedSquare == null)
    return false;

  return getLegalMoves(board, 'valkoinen').some(move => move.from == selectedSquare && move.to == square);
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
  button.onclick = () => handleSquareClick(square, isTarget);
  return button;
}

function checkForGameEnd(sideToMove) {
  const legalMoves = getLegalMoves(board, sideToMove);

  if (legalMoves.length)
    return false;

  const king = sideToMove == 'valkoinen' ? 'K' : 'k';
  const kingSquare = board.indexOf(king);
  const isCheckmate = isSquareAttacked(board, kingSquare, getOpponentColor(sideToMove));

  isGameFinished = true;

  if (isCheckmate) {
    statusElement.textContent = sideToMove == 'valkoinen' ? 'Matti - tietokone voitti' : 'Matti - sä voitit';
  } else {
    statusElement.textContent = 'Tasapeli.';
  }

  return true;
}

// evaluateSituationForBlack on mutu heuristiikka
// idea on arvioida tilannetta sotilaiden, ratsujen ja lähettiensä keskustan sijainnin suhteen
// pisteytys on mustan perspektiivistä -> positiivinen arvo -> suosii mustaa
function evaluateSituationForBlack(tilanne) {
  let pisteet = 0;

  for (let paikka = 0; paikka < 64; paikka += 1) {
    const nappula = tilanne[paikka];

    if (!nappula)
      continue;

    const tyyppi = nappula.toLowerCase();
    // mustat nappulat kasvattaa pisteitä/valkoiset pienentää
    const varikerroin = getPieceColor(nappula) == 'musta' ? 1 : -1

    // 'JuhaShakki aivot'
    // keskustan läheisyys parantaa pisteitä. sotilaat saa
    // keskustasta vähän lisää, ratsut ja lähet enemmän
    // muut nappulat saa arvioinnissa vain materiaalipisteensä
    const keskusta = 7 - Math.abs(7 - 2 * column(paikka)) - Math.abs(7 - 2 * row(paikka));
    const paikkabonus = tyyppi == 'p'
      ? keskusta * 2
      : ['n', 'b'].includes(tyyppi)
        ? keskusta * 3
        : 0;

    pisteet += (PIECE_VALUES[tyyppi] + paikkabonus) * varikerroin;
  }

  return pisteet;
}

function orderCapturesFirst(position, moves) {
  return [...moves].sort((first, second) => Number(Boolean(position[second.to])) - Number(Boolean(position[first.to])));
}

// minimax alphabeta karsinnalla.
// tilanne on tutkittava lautatilanne, vuoro kertoo kumman
// vuoro on ja syvyys kertoo puolisiirtojen syvyyden tutkinnan ennen arviointia
function minimaxab(tilanne, vuoro, syvyys, alpha = -Infinity, beta = Infinity) {
  const legalMoves = getLegalMoves(tilanne, vuoro);

  // Pelin päättyminen tarkistetaan myös hakupuuta parsittaesasa. patti on tasapeli
  // matin pisteet on 100000 jotta se voittaa muut tilanteet
  if (!legalMoves.length) {
    const Kk = vuoro == 'valkoinen' ? 'K' : 'k';
    const matti = isSquareAttacked(tilanne, tilanne.indexOf(Kk), getOpponentColor(vuoro));
    
    if (!matti)
      return 0;

    return vuoro == 'musta' ? -100000 - syvyys : 100000 + syvyys;
  }

  // max hakusyvyys: arvioidaan nykyinen lauta ja palautetaan tulos
  if (syvyys == 0)
    return evaluateSituationForBlack(tilanne);

  // syönnit tutkitaan ensin. tää ei muuta lopputulosta mutta saa
  // hyviä rajoja aikaisin ja tekee alphabeta karsinnasta vauhdikkaamman
  const orderedMoves = orderCapturesFirst(tilanne, legalMoves);

  if (vuoro == 'musta') {
    // musta tähtää pistemäärän maksimointiin
    let maxPisteet = -Infinity;

    for (const move of orderedMoves) {
      // applyMove palauttaa uuden lautatilanteen. -> valkoisen vuoro.
      const pisteet = minimaxab(applyMove(tilanne, move), 'valkoinen', syvyys - 1, alpha, beta);
      maxPisteet = Math.max(maxPisteet, pisteet);

      // alpha on isoin pistemäärä mitä musta voi tässä haarasa luvata
      alpha = Math.max(alpha, maxPisteet);

      // valkoisella on toisessa haarassa jo yhtä hyvä vastaus kuin
      // tässä musta haarassa. jäljellä olevat haarat ei voi vaikuttaa
      // lopputulokseen joten ne voidaan unohtaa
      if (alpha >= beta)
        break;
    }
    return maxPisteet;
  }

  // valkoinen oletetaan puolustavan eli pyrkii pienimpään pistemäärään -> valkoisen paras tulos
  let maxPisteet = Infinity;
  for (const move of orderedMoves) {
    const pisteet = minimaxab(applyMove(tilanne, move), 'musta', syvyys - 1, alpha, beta);
    maxPisteet = Math.min(maxPisteet, pisteet);

    // beta on pienin pistemäärä mitä valkoinen tässä polussa voi
    // pakottaa -> alpha >= beta ehto pudottaa turhan parsimisen
    beta = Math.min(beta, maxPisteet);

    if (alpha >= beta)
      break;
  }

  return maxPisteet;
}

// Haun idea: tutkitaan kaikki mustan lailliset siirrot mitkä nyt voi tehdä
// ja palautetaan niistä paras. nykyistä siirtoa ei lasketa hakysyvyys mukaan vaan
// se kertoo kuinka monta puolisiirtoa tutkitaan mustalle ehdotetun siirron jälkeen
function chooseSearchedMove(hakysyvyys) {
  const legalBlackMoves = getLegalMoves(board, 'musta');
  let maxSiirto;
  let maxPisteet = -Infinity;

  for (const mustaMove of legalBlackMoves) {
    // jos musta olisi tehnyt ehdotetun siirron, aletaan hakea alkaa valkoisen vastauksia
    // tämänhetkinen maxPisteet annetaan alphaksi: jos uusi haara ei voi ylittää
    // sitä voi alpha-beta-karsinta lopettaa haaran aiemmin
    const pisteet = minimaxab(applyMove(board, mustaMove), 'valkoinen', hakysyvyys, maxPisteet, Infinity);
    if (pisteet > maxPisteet) {
      // pidetään muistissa tähän asti paras mustan siirto ja sen arvio
      maxPisteet = pisteet;
      maxSiirto = mustaMove;
    }
  }

  return maxSiirto;
}

function move2str(move) {
  return squareName(move.from) + squareName(move.to);
}

function asetaVaikeus() {
  return VAIKEUS_ASETUKSET[difficultyElement.value];
}

function makeComputerMove() {
  if (isGameFinished || checkForGameEnd('musta'))
    return;

  vaikeus = asetaVaikeus();


  //console.log("syvyys " + vaikeus.syvyys);
  move = chooseSearchedMove(vaikeus.syvyys);

  if (!move)
    return;

  board = applyMove(board, move);
  
  historia.push(siirtotokeni(move.from, move.to));

  statusElement.textContent = `Tietokone pleasi ${move2str(move)}. Sun vuoro.`;
  renderBoard();
  checkForGameEnd('valkoinen');
}

function makePlayerMove(move) {
  board = applyMove(board, move);
  historia.push(siirtotokeni(move.from, move.to));
  selectedSquare = null;
  renderBoard();

  if (!checkForGameEnd('musta')) {
    statusElement.textContent = 'Tietokoneen vuoro...';
    setTimeout(makeComputerMove, 280);
  }

  /*
  for (const x of historia) {
    console.log(" " + (x&0x3f) + " " + (x>>6));
  }
  */
}

function handleSquareClick(square, isTarget) {
  if (isGameFinished)
    return;

  if (selectedSquare != null && isTarget) {
    const selectedMove = getLegalMoves(board, 'valkoinen').find(move => move.from == selectedSquare && move.to == square);
    makePlayerMove(selectedMove);
    return;
  }

  if (getPieceColor(board[square]) == 'valkoinen') {
    selectedSquare = square;
    renderBoard();
  }

}

function renderBoard() {
  boardElement.replaceChildren();
  for (const square of getSquareDisplayOrder()) {
    boardElement.append(createSquareButton(square));
  }
}

function resetGame() {
  historia = [];
  isGameFinished = false;
  selectedSquare = null;
  vaikeus = asetaVaikeus();
  statusElement.textContent = `Sun siirto, sä pelaat valkoisilla. ${vaikeus.nimi} vaikeus aste.`;
  board = createInitialBoard();
  renderBoard();
}

document.querySelector('#uusipeli').onclick = resetGame;
resetGame();