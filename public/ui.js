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

const DIFFICULTY_SETTINGS = Object.freeze({
	easy: { name: 'Helppo', depth: 0 },
	normal: { name: 'Normaali', depth: 1 },
	difficult: { name: 'vaikea', depth: 2 }
});

const difficultyElement = document.querySelector('#vaikeus');
const boardElement = document.querySelector('#board');
const statusElement = document.querySelector('#status');
let selectedSquare = null;

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
	return DIFFICULTY_SETTINGS[difficultyElement.value];
}
