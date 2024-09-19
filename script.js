// Game constants
const ranks = ["Ace", "7", "King", "Jack", "Queen", "6", "5", "4", "3", "2"];
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const points = {"Ace": 11, "7": 10, "King": 4, "Jack": 3, "Queen": 2, "6": 0, "5": 0, "4": 0, "3": 0, "2": 0};
const players = ["Player 1", "Player 2", "Player 3", "Player 4"];
const teams = {
    "Team A": ["Player 1", "Player 3"],
    "Team B": ["Player 2", "Player 4"]
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
}

function playCard(player, card) {
    if (player !== currentPlayer) return;
    
    if (!isValidPlay(card)) {
        showMessage("Invalid play. You must follow suit if possible.");
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
            setTimeout(playAITurn, 1000);
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
    const winningCard = determineWinningCard();
    const winningPlayer = trickCards.find(tc => tc.card.rank === winningCard.rank && tc.card.suit === winningCard.suit).player;
    const trickPoints = trickCards.reduce((sum, tc) => sum + points[tc.card.rank], 0);
    
    const winningTeam = Object.keys(teams).find(team => teams[team].includes(winningPlayer));
    teamScores[winningTeam] += trickPoints;
    
    showMessage(`${winningPlayer} wins the trick! (${trickPoints} points)`);
    
    trickCards = [];
    leadingSuit = null;
    currentPlayer = winningPlayer;
    trickStartPlayer = winningPlayer;
    
    updateUI();
    
    if (playerHands["Player 1"].length === 0) {
        endGame();
    } else {
        if (currentPlayer !== "Player 1") {
            setTimeout(playAITurn, 1000);
        }
    }
}

function determineWinningCard() {
    const trumpCards = trickCards.filter(tc => tc.card.suit === trumpSuit);
    if (trumpCards.length > 0) {
        return trumpCards.reduce((highest, current) => 
            ranks.indexOf(current.card.rank) < ranks.indexOf(highest.card.rank) ? current.card : highest.card
        );
    }
    
    const leadingSuitCards = trickCards.filter(tc => tc.card.suit === leadingSuit);
    return leadingSuitCards.reduce((highest, current) => 
        ranks.indexOf(current.card.rank) < ranks.indexOf(highest.card.rank) ? current.card : highest.card
    );
}

function endGame() {
    const winner = teamScores["Team A"] > teamScores["Team B"] ? "Team A" : "Team B";
    showMessage(`Game Over! ${winner} wins with ${teamScores[winner]} points!`);
    document.getElementById("start-game").style.display = "block";
}

function updateUI() {
    document.getElementById("trump-suit").textContent = trumpSuit;
    document.getElementById("trump-card").textContent = `${trumpCard.rank} of ${trumpCard.suit}`;
    document.getElementById("current-player").textContent = currentPlayer;
    document.getElementById("leading-suit").textContent = leadingSuit || "None";
    
    for (let player of players) {
        const handElement = document.querySelector(`#${player.toLowerCase().replace(" ", "")}-hand .cards`);
        handElement.innerHTML = "";
        playerHands[player].forEach(card => {
            const cardElement = document.createElement("div");
            cardElement.className = "card";
            cardElement.textContent = `${card.rank} ${card.suit.charAt(0)}`;
            if (player === "Player 1") {
                cardElement.onclick = () => playCard("Player 1", card);
            }
            handElement.appendChild(cardElement);
        });
    }
    
    const playedCardsElement = document.getElementById("played-cards");
    playedCardsElement.innerHTML = "";
    trickCards.forEach(tc => {
        const cardElement = document.createElement("div");
        cardElement.className = "card played";
        cardElement.textContent = `${tc.card.rank} ${tc.card.suit.charAt(0)}`;
        playedCardsElement.appendChild(cardElement);
    });
    
    document.getElementById("team-a-score").textContent = teamScores["Team A"];
    document.getElementById("team-b-score").textContent = teamScores["Team B"];
}

function showMessage(message) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    setTimeout(() => messageElement.textContent = "", 3000);
}

document.getElementById("start-game").addEventListener("click", startGame);

// Initialize the game
startGame();
