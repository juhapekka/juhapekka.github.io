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
	const offsets = [ 	[1, 2],
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