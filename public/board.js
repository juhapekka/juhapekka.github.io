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

function encodeMove(from, to) {
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

function squareName(square) {
	return String.fromCharCode(97 + column(square)) + (row(square) + 1);
}

function getPieceColor(piece) {
	if (!piece)
		return null;

	return piece == piece.toUpperCase() ? 'valkoinen' : 'musta';
}

function getOpponentColor(color) {
	return color == 'valkoinen' ? 'musta' : 'valkoinen';
}

function moveToString(move) {
	return squareName(move.from) + squareName(move.to);
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