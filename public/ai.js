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
