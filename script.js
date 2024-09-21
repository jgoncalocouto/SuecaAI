// Game constants
const ranks = ["Ace", "7", "King", "Jack", "Queen", "6", "5", "4", "3", "2"];
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const points = {"Ace": 11, "7": 10, "King": 4, "Jack": 3, "Queen": 2, "6": 0, "5": 0, "4": 0, "3": 0, "2": 0};
const players = ["Player 1", "Player 2", "Player 3", "Player 4"];
const teams = {
    "Team A": ["Player 1", "Player 3"],
    "Team B": ["Player 2", "Player 4"]
};
const suitSymbols = {
    "Spades": "♠",
    "Hearts": "♥",
    "Clubs": "♣",
    "Diamonds": "♦"
};

// Game state
let deck = [];
let playerHands = {};
let trumpSuit;
let trumpCard;
let currentPlayer;
let leadingSuit;
let playedCards = [];
let teamScores = {"Team A": 0, "Team B": 0};
let trickCards = [];
let trickStartPlayer;
let isDeveloperMode = false;

function toggleMode() {
    isDeveloperMode = !isDeveloperMode;
    updateUI();
    document.getElementById("mode-toggle").textContent = isDeveloperMode ? "Switch to User Mode" : "Switch to Developer Mode";
}

function getColoredSuitSymbol(suit) {
    const symbol = suitSymbols[suit];
    const color = (suit === "Hearts" || suit === "Diamonds") ? "red" : "black";
    return `<span class="card-suit" style="color: ${color};">${symbol}</span>`;
}

function updateUI() {
    document.getElementById("trump-suit").innerHTML = getColoredSuitSymbol(trumpSuit);
    document.getElementById("trump-card").innerHTML = `${trumpCard.rank} ${getColoredSuitSymbol(trumpCard.suit)}`;
    document.getElementById("current-player").textContent = currentPlayer;
    document.getElementById("leading-suit").innerHTML = leadingSuit ? getColoredSuitSymbol(leadingSuit) : "None";
    
    for (let player of players) {
        const handElement = document.querySelector(`#${player.toLowerCase().replace(" ", "")}-hand .cards`);
        handElement.innerHTML = "";
        if (isDeveloperMode || player === "Player 1") {
            playerHands[player].forEach(card => {
                const cardElement = document.createElement("div");
                cardElement.className = "card";
                cardElement.innerHTML = `
                    <div class="card-value">
                        <span class="card-rank">${card.rank}</span>
                        ${getColoredSuitSymbol(card.suit)}
                    </div>
                `;
                if (player === "Player 1") {
                    cardElement.onclick = () => playCard("Player 1", card);
                }
                handElement.appendChild(cardElement);
            });
        } else {
            handElement.innerHTML = `<div class="card-back">${playerHands[player].length}</div>`;
        }
    }
    
    const playedCardsElement = document.getElementById("played-cards");
    playedCardsElement.innerHTML = "";
    const orderedPlayers = ["Player 3", "Player 2", "Player 1", "Player 4"];
    orderedPlayers.forEach(player => {
        const tc = trickCards.find(card => card.player === player);
        if (tc) {
            const cardElement = document.createElement("div");
            cardElement.className = "card played";
            cardElement.innerHTML = `
                <span class="player-name">${tc.player}</span>
                <div class="card-value">
                    <span class="card-rank">${tc.card.rank}</span>
                    ${getColoredSuitSymbol(tc.card.suit)}
                </div>
            `;
            playedCardsElement.appendChild(cardElement);
        }
    });
    
    document.getElementById("team-a-score").textContent = teamScores["Team A"];
    document.getElementById("team-b-score").textContent = teamScores["Team B"];

    // Update the visibility of game controls
    document.getElementById("start-game").style.display = 
        playerHands["Player 1"].length === 0 ? "block" : "none";
    document.getElementById("next-play").disabled = 
        trickCards.length < 4 || playerHands["Player 1"].length === 0;

    // Update the message display
    const messageElement = document.getElementById("message");
    if (playerHands["Player 1"].length === 0) {
        const winner = teamScores["Team A"] > teamScores["Team B"] ? "Team A" : "Team B";
        messageElement.textContent = `Game Over! ${winner} wins with ${teamScores[winner]} points!`;
    } else if (currentPlayer === "Player 1" && trickCards.length < 4) {
        messageElement.textContent = "It's your turn. Please select a card to play.";
    } else {
        messageElement.textContent = "";
    }
}

function createAndShuffleDeck() {
    deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({rank, suit});
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards() {
    playerHands = {
        "Player 1": [],
        "Player 2": [],
        "Player 3": [],
        "Player 4": []
    };
    
    trumpCard = deck.pop();
    trumpSuit = trumpCard.suit;
    playerHands["Player 1"].push(trumpCard);
    
    for (let i = 0; i < 9; i++) {
        playerHands["Player 1"].push(deck.pop());
    }
    
    for (let player of ["Player 2", "Player 3", "Player 4"]) {
        for (let i = 0; i < 10; i++) {
            playerHands[player].push(deck.pop());
        }
    }
}

function startGame() {
    createAndShuffleDeck();
    dealCards();
    currentPlayer = "Player 1";
    trickStartPlayer = "Player 1";
    leadingSuit = null;
    trickCards = [];
    teamScores = {"Team A": 0, "Team B": 0};
    updateUI();
    document.getElementById("next-play").disabled = true;
}

function playCard(player, card) {
    if (player !== currentPlayer) return;
    
    if (!isValidPlay(card)) {
        showMessage("Invalid play. You must follow suit if possible.");
        return;
    }

    if (!card || !card.rank || !card.suit) {
        console.error("Invalid card played: ", card);
        return;
    }
    
    playerHands[player] = playerHands[player].filter(c => c.rank !== card.rank || c.suit !== card.suit);
    trickCards.push({player, card});
    playedCards.push(card);

    if (leadingSuit === null) {
        leadingSuit = card.suit;
    }

    updateUI();

    if (trickCards.length === 4) {
        setTimeout(endTrick, 1000);
    } else {
        currentPlayer = players[(players.indexOf(currentPlayer) + 1) % 4];
        if (currentPlayer !== "Player 1") {
            setTimeout(playAITurn, 500);
        }
    }
}

function isValidPlay(card) {
    if (leadingSuit === null) return true;
    if (card.suit === leadingSuit) return true;
    return !playerHands[currentPlayer].some(c => c.suit === leadingSuit);
}

function playAITurn() {
    const hand = playerHands[currentPlayer];
    const playableCards = hand.filter(card => isValidPlay(card));
    const chosenCard = playableCards[Math.floor(Math.random() * playableCards.length)];
    playCard(currentPlayer, chosenCard);
}

function endTrick() {
    console.log("Trick Cards:", trickCards);
    
    const winningCard = determineWinningCard();
    
    if (!winningCard) {
        console.error("No winning card could be determined.");
        showMessage("No valid card to determine the winner. Check the game logic.");
        return;
    }
    
    const winningPlayer = trickCards.find(tc => 
        tc && tc.card && 
        tc.card.rank === winningCard.rank && 
        tc.card.suit === winningCard.suit
    )?.player;
    
    if (!winningPlayer) {
        console.error("No winning player found for card:", winningCard);
        return;
    }
    
    const trickPoints = trickCards.reduce((sum, tc) => sum + (tc && tc.card ? points[tc.card.rank] : 0), 0);
    
    const winningTeam = Object.keys(teams).find(team => teams[team].includes(winningPlayer));
    teamScores[winningTeam] += trickPoints;

    showMessage(`${winningPlayer} wins the trick! (${trickPoints} points)`);

    currentPlayer = winningPlayer;
    trickStartPlayer = winningPlayer;

    updateUI();

    if (playerHands["Player 1"].length === 0) {
        endGame();
    } else {
        document.getElementById("next-play").disabled = false;
    }
}

function determineWinningCard() {
    const validTrickCards = trickCards.filter(tc => tc && tc.card && tc.card.rank && tc.card.suit);

    if (validTrickCards.length === 0) {
        console.error("No valid cards in the trick", trickCards);
        return null;
    }

    const trumpCards = validTrickCards.filter(tc => tc.card.suit === trumpSuit);

    if (trumpCards.length > 0) {
        return trumpCards.reduce((highest, current) => 
            ranks.indexOf(current.card.rank) < ranks.indexOf(highest.card.rank) ? current : highest
        ).card;
    }

    const leadingSuitCards = validTrickCards.filter(tc => tc.card.suit === leadingSuit);
    
    if (leadingSuitCards.length > 0) {
        return leadingSuitCards.reduce((highest, current) => 
            ranks.indexOf(current.card.rank) < ranks.indexOf(highest.card.rank) ? current : highest
        ).card;
    }

    return validTrickCards[0].card;
}

function endGame() {
    const winner = teamScores["Team A"] > teamScores["Team B"] ? "Team A" : "Team B";
    showMessage(`Game Over! ${winner} wins with ${teamScores[winner]} points!`);
    document.getElementById("start-game").style.display = "block";
    document.getElementById("next-play").disabled = true;
}

function showMessage(message) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    setTimeout(() => messageElement.textContent = "", 3000);
}

function nextPlay() {
    trickCards = [];
    leadingSuit = null;
    updateUI();
    
    if (currentPlayer !== "Player 1") {
        playAITurn();
    } else {
        showMessage("It's your turn. Please select a card to play.");
    }
    
    setTimeout(() => {
        document.getElementById("next-play").disabled = true;
    }, 1000);
}

document.getElementById("start-game").addEventListener("click", startGame);
document.getElementById("next-play").addEventListener("click", nextPlay);
document.getElementById("mode-toggle").addEventListener("click", toggleMode);

// Initialize the game
startGame();