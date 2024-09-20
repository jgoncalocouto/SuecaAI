import random

# Define the card ranks, suits, and their point values
ranks = ["Ace", "7", "King", "Jack", "Queen", "6", "5", "4", "3", "2"]
suits = ["Hearts", "Diamonds", "Clubs", "Spades"]
points = {"Ace": 11, "7": 10, "King": 4, "Jack": 3, "Queen": 2, "6": 0, "5": 0, "4": 0, "3": 0, "2": 0}

# Create the deck of cards
deck = [(rank, suit) for suit in suits for rank in ranks]

# Define the players and teams
players = ["Player 1", "Player 2", "Player 3", "Player 4"]
teams = {"Team A": ["Player 1", "Player 3"], "Team B": ["Player 2", "Player 4"]}

# Function to sort cards by suit and rank
def sort_cards(cards, trump_suit):
    def card_key(card):
        rank, suit = card
        suit_order = (suits.index(suit) - suits.index(trump_suit)) % len(suits)
        return (suit_order, ranks.index(rank))
    
    return sorted(cards, key=card_key)

# Function to format cards for display
def format_cards(cards, trump_suit):
    sorted_cards = sort_cards(cards, trump_suit)
    grouped_cards = {}
    for card in sorted_cards:
        rank, suit = card
        if suit not in grouped_cards:
            grouped_cards[suit] = []
        grouped_cards[suit].append(rank)
    
    formatted = []
    for suit in suits:
        if suit in grouped_cards:
            formatted.append(f"{suit}: {', '.join(grouped_cards[suit])}")
    
    return "\n".join(formatted)

# Function to get card from user input
def get_card_from_input(input_str, hand):
    input_str = input_str.upper()
    if len(input_str) < 2:
        return None
    
    suit_map = {'S': 'Spades', 'H': 'Hearts', 'D': 'Diamonds', 'C': 'Clubs'}
    rank_map = {'A': 'Ace', 'K': 'King', 'Q': 'Queen', 'J': 'Jack'}
    
    suit = suit_map.get(input_str[0])
    rank = rank_map.get(input_str[1], input_str[1:])
    
    if suit and rank:
        card = (rank, suit)
        if card in hand:
            return card
    return None

# Function to check if a play is valid
def is_valid_play(card, hand, leading_suit):
    if leading_suit is None:
        return True
    if card[1] == leading_suit:
        return True
    return not any(c[1] == leading_suit for c in hand)

# Function to select a card for AI players with enhanced strategy and cheat prevention
def ai_play(player, leading_suit, trick_cards):
    hand = player_hands[player]
    playable_cards = [card for card in hand if is_valid_play(card, hand, leading_suit)]
    
    # Rule 1: Play the highest-ranked card if it's a winning card
    if playable_cards:
        winning_cards = [card for card in playable_cards if (card[1] == trump_suit or card[1] == leading_suit) and all(
            ranks.index(card[0]) < ranks.index(other_card[0]) for _, other_card in trick_cards if other_card[1] == card[1]
        )]
        if winning_cards:
            chosen_card = min(winning_cards, key=lambda card: ranks.index(card[0]))
            hand.remove(chosen_card)
            played_cards.append(chosen_card)
            return chosen_card

    # Rule 2: If no winning card, play the lowest value card
    chosen_card = max(playable_cards, key=lambda card: ranks.index(card[0]))
    hand.remove(chosen_card)
    played_cards.append(chosen_card)
    return chosen_card

# Function to allow human player input with cheat prevention
def human_play(player, leading_suit):
    hand = player_hands[player]
    print(f"{player}'s turn. Hand:\n{format_cards(hand, trump_suit)}")
    while True:
        input_str = input("Choose a card to play (e.g., 'SA' for Spades Ace): ")
        chosen_card = get_card_from_input(input_str, hand)
        if chosen_card and is_valid_play(chosen_card, hand, leading_suit):
            hand.remove(chosen_card)
            played_cards.append(chosen_card)
            print(f"{player} plays {chosen_card}")
            return chosen_card
        else:
            if chosen_card:
                print("Invalid play. You must follow suit if possible.")
            else:
                print("Invalid choice, please try again.")

# Function to determine the winner of the trick
def determine_winner(trick):
    leading_suit = trick[0][1][1]  # Suit of the first card played

    # Find all cards in the trick that match the trump suit
    trump_cards = [card for player, card in trick if card[1] == trump_suit]
    
    if trump_cards:
        # If there are trump cards played, the highest trump card wins
        winning_card = min(trump_cards, key=lambda card: ranks.index(card[0]))
    else:
        # If no trump cards, find the highest card of the leading suit
        leading_suit_cards = [card for player, card in trick if card[1] == leading_suit]
        winning_card = min(leading_suit_cards, key=lambda card: ranks.index(card[0]))

    # Find the player who played the winning card
    winner = next(player for player, card in trick if card == winning_card)
    return winner

# Function to calculate scores for a single trick
def calculate_trick_score(trick):
    return sum(points[card[0]] for _, card in trick)

# Function to display current scores
def display_scores(team_scores):
    print(f"Current Scores:")
    print(f"Team A: {team_scores['Team A']} points")
    print(f"Team B: {team_scores['Team B']} points\n")

# Function to play a trick with cheat detection
def play_trick(starting_player, team_scores):
    trick = []
    leading_suit = None
    current_player_index = players.index(starting_player)

    # Each player plays a card
    for i in range(4):
        player = players[current_player_index]

        if player == "Player 1":
            # Human player - choose a card to play
            chosen_card = human_play(player, leading_suit)
        else:
            # AI player - choose a card to play
            chosen_card = ai_play(player, leading_suit, trick)
            print(f"{player} plays {chosen_card}")

        # Check for cheating
        if not is_valid_play(chosen_card, player_hands[player] + [chosen_card], leading_suit):
            cheating_team = "Team A" if player in teams["Team A"] else "Team B"
            print(f"Cheating detected! {player} played {chosen_card} when they had a card of the leading suit.")
            print(f"{cheating_team} immediately loses the game due to cheating.")
            team_scores[cheating_team] = -1  # Set a negative score to indicate loss by cheating
            return None  # End the game immediately

        # Determine the leading suit
        if leading_suit is None:
            leading_suit = chosen_card[1]

        trick.append((player, chosen_card))
        current_player_index = (current_player_index + 1) % 4

    # Determine the winner of the trick
    winner = determine_winner(trick)
    trick_score = calculate_trick_score(trick)
    
    # Update team scores
    if winner in teams["Team A"]:
        team_scores["Team A"] += trick_score
    else:
        team_scores["Team B"] += trick_score

    print(f"{winner} wins the trick with {dict(trick)[winner]}")
    print(f"Points in this trick: {trick_score}")
    display_scores(team_scores)
    
    return winner

# Function to calculate and display the final scores
def calculate_final_scores(team_scores):
    print(f"Final Scores:")
    if team_scores["Team A"] == -1:
        print("Team A loses due to cheating.")
        print("Team B wins the game!")
    elif team_scores["Team B"] == -1:
        print("Team B loses due to cheating.")
        print("Team A wins the game!")
    else:
        print(f"Team A: {team_scores['Team A']} points")
        print(f"Team B: {team_scores['Team B']} points")
        if team_scores["Team A"] > team_scores["Team B"]:
            print("Team A wins the round!")
        elif team_scores["Team B"] > team_scores["Team A"]:
            print("Team B wins the round!")
        else:
            print("It's a tie!")

# Print the team definitions
print("Teams Defined:")
for team, members in teams.items():
    print(f"{team}: {', '.join(members)}")

# Shuffle the deck
random.shuffle(deck)

# Determine which player gets the trump (starting sequentially with Player 1)
trump_player = players[0]  # Player 1 gets the trump for this round
trump_card = deck.pop()    # Reveal the trump card from the bottom of the deck
trump_suit = trump_card[1]

# Distribute the trump card to the player who gets the trump
player_hands = {player: [] for player in players}
player_hands[trump_player].append(trump_card)

# Deal the remaining 9 cards to the player who gets the trump
for _ in range(9):
    player_hands[trump_player].append(deck.pop())

# Deal the remaining cards to the other players
for player in players[1:]:
    for _ in range(10):
        player_hands[player].append(deck.pop())

# Display the players' hands
for player, hand in player_hands.items():
    print(f"{player}'s hand:\n{format_cards(hand, trump_suit)}\n")

print(f"Trump card: {trump_card}")
print(f"Trump suit: {trump_suit}\n")

# Keep track of played cards
played_cards = []

# Play the game
starting_player = players[0]
team_scores = {"Team A": 0, "Team B": 0}
for _ in range(10):  # Play 10 tricks
    starting_player = play_trick(starting_player, team_scores)
    if starting_player is None:  # Game ended due to cheating
        break

# Calculate and display final scores
calculate_final_scores(team_scores)