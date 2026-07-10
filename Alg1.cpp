// 3003122 and 2944172
#include "Alg1.h"
#include <algorithm>


// CONSTRUCTOR

Alg1::Alg1()
{
    //these weights tell alg1 what it should prioritise
    win_weight        = 10000;
    createMill_weight = 1300;
    block_weight      = 950;
    centre_weight     = 450;
    junction_weight   = 150;
}

// OPEN SPOTS
vector<pos> Alg1::spots_open(const vector<vector<char>>& board)
{
    //this vector will store all empty positions
    vector<pos> spots;

    //goes through the whole board and saves every playable empty spot
    for (int s = 0; s < (int)board.size(); s++)
        for (int i = 0; i < (int)board[s].size(); i++)
            if (board[s][i] == '-'){
                spots.push_back({s, i});
            }
    return spots;
}

// NEIGHBOURS
vector<pos> Alg1::getNeighbours(int s, int i)
{
    //neigh stores all positions that this cow can move to
    vector<pos> neigh;

    //Horizontal neighbours within same row
    if (i <= 2) {
        if (i > 0) {
                neigh.push_back({s, i-1});
        }
        if (i < 2){
                neigh.push_back({s, i+1});
    }}
    if (s == 3 && i >= 3) {
        if (i > 3) {
                neigh.push_back({s, i-1});
        }
        if (i < 5){ neigh.push_back({s, i+1});
        }
    }
// Vertical / diagonal neighbours
    if (i == 0) {
        if (s == 0) {
                neigh.push_back({3, 0});
        }
        if (s == 6) {
                neigh.push_back({3, 0});
        }
        if (s == 3) {
                neigh.push_back({0, 0});
                neigh.push_back({6, 0}); }
    }

    if (i == 0 && s == 1) {
            neigh.push_back({3, 1});
    }
    if (i == 0 && s == 5) {
            neigh.push_back({3, 1});
    }
    if (i == 1 && s == 3) {
            neigh.push_back({1, 0});
            neigh.push_back({5, 0});
    }

    if (i == 0 && s == 2) {
            neigh.push_back({3, 2});
    }
    if (i == 0 && s == 4) {
            neigh.push_back({3, 2});
    }
    if (i == 2 && s == 3) {
            neigh.push_back({2, 0});
            neigh.push_back({4, 0});
    }


    if (i == 2 && s == 2) {
            neigh.push_back({3, 3});
    }
    if (i == 2 && s == 4) {
            neigh.push_back({3, 3});
    }
    if (i == 3 && s == 3) {
            neigh.push_back({2, 2});
            neigh.push_back({4, 2});
    }

    if (i == 2 && s == 1) {
            neigh.push_back({3, 4});
    }
    if (i == 2 && s == 5) {
            neigh.push_back({3, 4});
    }
    if (i == 4 && s == 3) {
            neigh.push_back({1, 2});
            neigh.push_back({5, 2});
    }

    if (i == 2 && s == 0) {
            neigh.push_back({3, 5});
    }
    if (i == 2 && s == 6) {
            neigh.push_back({3, 5});
    }
    if (i == 5 && s == 3) {
            neigh.push_back({0, 2});
            neigh.push_back({6, 2});
    }

    return neigh;
}

// CREATES MILL
// checks if placing 'player' at (s,i) forms any mill
bool Alg1::createsMill(const vector<vector<char>>& board, int s, int i, char player)
{
    //all possible mill lines on the board
    const int totalmills = 14;
    const int millDefs[totalmills][3][2] =
    {
        {{0,0},{0,1},{0,2}},
        {{1,0},{1,1},{1,2}},
        {{2,0},{2,1},{2,2}},
        {{3,0},{3,1},{3,2}},
        {{3,3},{3,4},{3,5}},
        {{4,0},{4,1},{4,2}},
        {{5,0},{5,1},{5,2}},
        {{6,0},{6,1},{6,2}},
        {{0,0},{3,0},{6,0}},
        {{1,0},{3,1},{5,0}},
        {{2,0},{3,2},{4,0}},
        {{2,2},{3,3},{4,2}},
        {{1,2},{3,4},{5,2}},
        {{0,2},{3,5},{6,2}}
    };


    vector<vector<char>> temp = board;      //temporarily place the piece so the real board is not changed
    temp[s][i] = player;


    for (int m = 0; m < totalmills; m++)     //checks every mill pattern to see if all three spots belong to the player
        {
        bool formed = true;
        bool inMill  = false;
        for (int k = 0; k < 3; k++) {
            int rs = millDefs[m][k][0];
            int ri = millDefs[m][k][1];
            if (temp[rs][ri] != player)
                {
                formed = false; break;
    }
            if (rs == s && ri == i) {
                    inMill = true;
            }
        }
        if (formed && inMill) {
                return true;
        }
    }
    return false;
}


// BLOCK
//does placing here block opponent from making a mill?

bool Alg1::block(const vector<vector<char>>& board, int s, int i, char player, char opp)
{
    //if the opponent could make a mill here, then playing here blocks them
    return createsMill(board, s, i, opp);
}

// Centre
bool Alg1::centre(const vector<vector<char>>& board, int s, int i)
{

    (void)board;       //board and s are not needed here, only the column matters
    return (i == 1);
}

//junction
bool Alg1::junction(const vector<vector<char>>& board, int s, int i)
{
    //junction positions are the side points used in many connections
    (void)board;
    return (i == 0 || i == 2);
}


// MILL POTENTIAL
//how many mills could (s,i) contribute to?
int Alg1::millPotential(const vector<vector<char>>& board, char player, int s, int i)
{
    //all possible mills are checked to see how useful this position is
    const int totalmills = 14;
    const int millDefs[totalmills][3][2] =
    {
        {{0,0},{0,1},{0,2}},
        {{1,0},{1,1},{1,2}},
        {{2,0},{2,1},{2,2}},
        {{3,0},{3,1},{3,2}},
        {{3,3},{3,4},{3,5}},
        {{4,0},{4,1},{4,2}},
        {{5,0},{5,1},{5,2}},
        {{6,0},{6,1},{6,2}},
        {{0,0},{3,0},{6,0}},
        {{1,0},{3,1},{5,0}},
        {{2,0},{3,2},{4,0}},
        {{2,2},{3,3},{4,2}},
        {{1,2},{3,4},{5,2}},
        {{0,2},{3,5},{6,2}}
    };

    int count = 0;

    for (int m = 0; m < totalmills; m++)  //counts how many mill lines use this position and already help the player
        {
        bool inMill = false;
        int playerCount = 0;
        for (int k = 0; k < 3; k++) {
            int rs = millDefs[m][k][0];
            int ri = millDefs[m][k][1];
            if (rs == s && ri == i) inMill = true;
            if (board[rs][ri] == player) playerCount++;
        }
        if (inMill && playerCount >= 1) count++;
    }
    return count;
}


//valid moves all legal slides for 'player'

vector<struct move> Alg1::validMoves(const vector<vector<char>>& board, char player)
{

    vector<struct move> moves;  //moves stores every legal slide that the player can make


    for (int s = 0; s < (int)board.size(); s++)   //finds every cow belonging to the player, then checks its neighbours
        {
        for (int i = 0; i < (int)board[s].size(); i++) {
            if (board[s][i] == player) {
                for (auto n : getNeighbours(s, i)) {
                    if (board[n.s][n.i] == '-')
                        moves.push_back({{s,i}, n});
                }
            }
        }
    }
    return moves;
}

bool Alg1::noMoves(const vector<vector<char>>& board, char player)
{
    //if validMoves returns nothing, the player is stuck
    return validMoves(board, player).empty();
}


// WIN MOVE can 'player' form a mill in one placement?

bool Alg1::winmove(const vector<vector<char>>& board, char player)
{
    //tests every empty space to see if the player can make a mill there
    for (int s = 0; s < (int)board.size(); s++)
        for (int i = 0; i < (int)board[s].size(); i++)
            if (board[s][i] == '-' && createsMill(board, s, i, player))
                return true;
    return false;
}


// Returns true when a player has fewer than 3 pieces or cannot make any legal slide.

bool Alg1::gameOver(const vector<vector<char>>& board, bool placingComplete)
{
    //game over rules only count after all cows have been placed
    if (!placingComplete) return false;

    int countX = 0, countO = 0;

    //counts how many cows each player still has
    for (int s = 0; s < (int)board.size(); s++)
        for (int i = 0; i < (int)board[s].size(); i++) {
            if (board[s][i] == 'X') countX++;
            else if (board[s][i] == 'O') countO++;
        }

    if (countX < 3 || countO < 3) return true;
    if (noMoves(board, 'X') || noMoves(board, 'O')) return true;
    return false;
}


// REMOVABLE PIECES opponent pieces not in a mill (prefer those)

vector<pos> Alg1::removablePieces(const vector<vector<char>>& board, char opp)
{
    //pieces stores opponent cows that can be captured
    vector<pos> pieces;

    //first try to remove cows that are not inside a mill
    for (int s = 0; s < (int)board.size(); s++)
        for (int i = 0; i < (int)board[s].size(); i++)
            if (board[s][i] == opp && !createsMill(board, s, i, opp))
                pieces.push_back({s, i});

    //if all opponent pieces are in mills, allow removing any of them
    if (pieces.empty())
        for (int s = 0; s < (int)board.size(); s++)
            for (int i = 0; i < (int)board[s].size(); i++)
                if (board[s][i] == opp)
                    pieces.push_back({s, i});

    return pieces;
}


// SCORING SYSTEM

int Alg1::scoringSystem(const vector<vector<char>>& board, char player, char opp, int /*moveCount*/)
{
    //if alg1 can make a mill soon, the score becomes very high
    if (winmove(board, player)) return  win_weight;

    //if the opponent can make a mill soon, the score becomes very low
    if (winmove(board, opp))    return -win_weight;

    int score = 0;
    int playerPieces = 0, oppPieces = 0;

    //goes through the board and adds or subtracts points
    for (int s = 0; s < (int)board.size(); s++) {
        for (int i = 0; i < (int)board[s].size(); i++) {
            if (board[s][i] == '-') {
                if (createsMill(board, s, i, player)) score += createMill_weight;
                else if (block(board, s, i, player, opp)) score += block_weight;
                if (createsMill(board, s, i, opp))    score -= createMill_weight;
            }
            if (board[s][i] == player) {
                playerPieces++;
                if (i == 1)           score += centre_weight;
                if (i == 0 || i == 2) score += junction_weight;
            }
            if (board[s][i] == opp) {
                oppPieces++;
                if (i == 1)           score -= centre_weight;
                if (i == 0 || i == 2) score -= junction_weight;
            }
        }
    }

    score += (playerPieces - oppPieces) * 200;
    return score;
}


// Minmax
int Alg1::minimax(vector<vector<char>>& board, int depth, int alpha, int beta,
                  bool maximizing, char player, char opp)
{
    //counts how many cows are currently on the board
    int piecesOnBoard = 0;
    for (auto& row : board) for (auto c : row) if (c == 'X' || c == 'O') piecesOnBoard++;
    bool placingDone = (piecesOnBoard >= 18);

    //stop looking ahead when depth reaches zero or the game is over
    if (depth == 0 || gameOver(board, placingDone))
        return scoringSystem(board, player, opp, depth);

    int pieces = 0;
    for (auto& row : board)
        for (auto c : row)
            if (c == 'X' || c == 'O') pieces++;

    bool placementPhase = (pieces < 24);

    if (maximizing) {
        //maximizing means alg1 is trying to get the highest score
        int maxEval = -1000000;

        if (placementPhase) {
            for (auto m : spots_open(board)) {
                board[m.s][m.i] = player;

                if (createsMill(board, m.s, m.i, player)) {
                    for (auto r : removablePieces(board, opp)) {
                        char saved = board[r.s][r.i];
                        board[r.s][r.i] = '-';
                        int eval = minimax(board, depth-1, alpha, beta, false, player, opp);
                        board[r.s][r.i] = saved;
                        maxEval = max(maxEval, eval);
                        alpha   = max(alpha, eval);
                        if (beta <= alpha) break;
                    }
                } else {
                    int eval = minimax(board, depth-1, alpha, beta, false, player, opp);
                    maxEval = max(maxEval, eval);
                    alpha   = max(alpha, eval);
                }

                board[m.s][m.i] = '-';
                if (beta <= alpha) break;
            }
        } else {
            for (auto mv : validMoves(board, player)) {
                board[mv.from.s][mv.from.i] = '-';
                board[mv.to.s][mv.to.i]     = player;

                if (createsMill(board, mv.to.s, mv.to.i, player)) {
                    for (auto r : removablePieces(board, opp)) {
                        char saved = board[r.s][r.i];
                        board[r.s][r.i] = '-';
                        int eval = minimax(board, depth-1, alpha, beta, false, player, opp);
                        board[r.s][r.i] = saved;
                        maxEval = max(maxEval, eval);
                        alpha   = max(alpha, eval);
                        if (beta <= alpha) break;
                    }
                } else {
                    int eval = minimax(board, depth-1, alpha, beta, false, player, opp);
                    maxEval = max(maxEval, eval);
                    alpha   = max(alpha, eval);
                }

                board[mv.from.s][mv.from.i] = player;
                board[mv.to.s][mv.to.i]     = '-';
                if (beta <= alpha) break;
            }
        }
        return maxEval;

    } else {
        //minimizing means the opponent is trying to lower alg1's score
        int minEval = 1000000;

        if (placementPhase) {
            for (auto m : spots_open(board)) {
                board[m.s][m.i] = opp;

                if (createsMill(board, m.s, m.i, opp)) {
                    for (auto r : removablePieces(board, player)) {
                        char saved = board[r.s][r.i];
                        board[r.s][r.i] = '-';
                        int eval = minimax(board, depth-1, alpha, beta, true, player, opp);
                        board[r.s][r.i] = saved;
                        minEval = min(minEval, eval);
                        beta    = min(beta, eval);
                        if (beta <= alpha) break;
                    }
                } else {
                    int eval = minimax(board, depth-1, alpha, beta, true, player, opp);
                    minEval = min(minEval, eval);
                    beta    = min(beta, eval);
                }

                board[m.s][m.i] = '-';
                if (beta <= alpha) break;
            }
        } else {
            for (auto mv : validMoves(board, opp)) {
                board[mv.from.s][mv.from.i] = '-';
                board[mv.to.s][mv.to.i]     = opp;

                if (createsMill(board, mv.to.s, mv.to.i, opp)) {
                    for (auto r : removablePieces(board, player)) {
                        char saved = board[r.s][r.i];
                        board[r.s][r.i] = '-';
                        int eval = minimax(board, depth-1, alpha, beta, true, player, opp);
                        board[r.s][r.i] = saved;
                        minEval = min(minEval, eval);
                        beta    = min(beta, eval);
                        if (beta <= alpha) break;
                    }
                } else {
                    int eval = minimax(board, depth-1, alpha, beta, true, player, opp);
                    minEval = min(minEval, eval);
                    beta    = min(beta, eval);
                }

                board[mv.from.s][mv.from.i] = opp;
                board[mv.to.s][mv.to.i]     = '-';
                if (beta <= alpha) break;
            }
        }
        return minEval;
    }
}

// GET BEST MOVE
struct move Alg1::getbestmove(vector<vector<char>>& board, char player, char opp)
{
    //counts pieces to decide if the game is still in placement phase
    int pieces = 0;
    for (auto& row : board)
        for (auto c : row)
            if (c == 'X' || c == 'O') pieces++;

    bool placementPhase = (pieces < 24);
    int bestscore = -1000000;
    struct move bestMove = {{-1,-1},{-1,-1}};

    if (placementPhase) {
        //during placing, test every empty position
        for (auto m : spots_open(board)) {
            board[m.s][m.i] = player;

            if (createsMill(board, m.s, m.i, player)) {
                for (auto r : removablePieces(board, opp)) {
                    char saved = board[r.s][r.i];
                    board[r.s][r.i] = '-';
                    int score = minimax(board, 2, -1000000, 1000000, false, player, opp);
                    board[r.s][r.i] = saved;
                    if (score > bestscore) {
                        bestscore = score;
                        bestMove  = {{-1,-1}, m};
                    }
                }
            } else {
                int score = minimax(board, 2, -1000000, 1000000, false, player, opp);
                if (score > bestscore) {
                    bestscore = score;
                    bestMove  = {{-1,-1}, m};
                }
            }

            board[m.s][m.i] = '-';
        }
    } else {
        //during moving, test every legal slide
        for (auto mv : validMoves(board, player)) {
            board[mv.from.s][mv.from.i] = '-';
            board[mv.to.s][mv.to.i]     = player;

            if (createsMill(board, mv.to.s, mv.to.i, player)) {
                for (auto r : removablePieces(board, opp)) {
                    char saved = board[r.s][r.i];
                    board[r.s][r.i] = '-';
                    int score = minimax(board, 2, -1000000, 1000000, false, player, opp);
                    board[r.s][r.i] = saved;
                    if (score > bestscore) {
                        bestscore = score;
                        bestMove  = mv;
                    }
                }
            } else {
                int score = minimax(board, 2, -1000000, 1000000, false, player, opp);
                if (score > bestscore) {
                    bestscore = score;
                    bestMove  = mv;
                }
            }

            board[mv.from.s][mv.from.i] = player;
            board[mv.to.s][mv.to.i]     = '-';
        }
    }

    return bestMove;
}


// PLAY TURN applies best move to the board

void Alg1::playTurn(vector<vector<char>>& board, char player, char opp)
{
    //gets the best move according to alg1's scoring
    struct move best = getbestmove(board, player, opp);

    if (best.to.s == -1) return;

    if (best.from.s == -1) {
        //placement phase, so the cow starts outside the board
        board[best.to.s][best.to.i] = player;
    } else {
        //movement phase, so remove it from old position and put it in new position
        board[best.from.s][best.from.i] = '-';
        board[best.to.s][best.to.i]     = player;
    }
}
