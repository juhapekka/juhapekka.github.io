function getSquareDisplayOrder() {
	const squares = [];

	// 8 rivi on eka jolloin valkoset tulee alariviin
	for (let r = 7; r >= 0; r -= 1)
		for (let ff = 0; ff < 8; ff += 1)
			squares.push(ff + r * 8);

	return squares;
}

function getPieceGlyph(piece) {
	if (!piece)
		return '';

	const colorName = getPieceColor(piece);
	const pieceName = PIECE_NAMES[piece.toLowerCase()];

	return PIECE_GLYPHS[`${colorName}${pieceName}`];
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

function renderBoard() {
	boardElement.replaceChildren();
	for (const square of getSquareDisplayOrder()) {
		boardElement.append(createSquareButton(square));
	}
}

function getSelectedDifficulty() {
	return VAIKEUS_ASETUKSET[difficultyElement.value];
}
