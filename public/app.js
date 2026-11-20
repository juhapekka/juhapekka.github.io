
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

function makeComputerMove() {
  if (isGameFinished || checkForGameEnd('musta'))
    return;

  const difficulty = getSelectedDifficulty();
  const move = chooseSearchedMove(board, difficulty.depth);

  if (!move)
    return;

  board = applyMove(board, move);
  
  historia.push(encodeMove(move.from, move.to));

  statusElement.textContent = `Tietokone pleasi ${moveToString(move)}. Sun vuoro.`;
  renderBoard();
  checkForGameEnd('valkoinen');
}

function makePlayerMove(move) {
  board = applyMove(board, move);
  historia.push(encodeMove(move.from, move.to));
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

function resetGame() {
  historia = [];
  isGameFinished = false;
  selectedSquare = null;
  const difficulty = getSelectedDifficulty();
  statusElement.textContent = `Sun siirto, sä pelaat valkoisilla. ${difficulty.name} vaikeus aste.`;
  board = createInitialBoard();
  renderBoard();
}

document.querySelector('#uusipeli').onclick = resetGame;
resetGame();