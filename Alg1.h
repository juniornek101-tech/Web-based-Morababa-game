// 3003122 and 2944172
#ifndef ALG1_H
#define ALG1_H

#include <vector>
using namespace std;

//stores one board position
struct pos{
    int s;
    int i;
};

//stores a move from one position to another
struct move{
    pos from;
    pos to;
};

//this is the class for algorithm 1
class Alg1
{
public:
    //these names describe the phases of the game
    enum gamephase{
        beginningPhase, middlePhase, endPhase, blitzPhase
    };

    //these values are used to score how good a move is
    int win_weight;
    int createMill_weight;
    int block_weight;
    int centre_weight;
    int junction_weight;

    //constructor that sets the scoring values
    Alg1();

    //finds all empty spaces on the board
    vector<pos> spots_open(const vector<vector<char>>& board);

    //checks if the game is over, but only after placing is done
    bool gameOver(const vector<vector<char>>& board, bool placingComplete);

    //checks if the player can make a mill in one move
    bool winmove(const vector<vector<char>>& board, char player);

    //checks if putting a cow at a position creates a mill
    bool createsMill(const vector<vector<char>>& board, int s, int i, char player);

    //checks if a move blocks the opponent from making a mill
    bool block(const vector<vector<char>>& board, int s, int i, char player, char opp);

    //checks if the player has no legal movement moves
    bool noMoves(const vector<vector<char>>& board, char player);

    //gets the positions connected to one board position
    vector<pos> getNeighbours(int s, int i);

    //plays one turn for alg1
    void playTurn(vector<vector<char>>& board, char player, char opp);

    //gets every legal slide move for the player
    vector<struct move> validMoves(const vector<vector<char>>& board, char player);

    //chooses the best move alg1 can find
    struct move getbestmove(vector<vector<char>>& board, char player, char opp);

    //checks if a position is a centre position
    bool centre(const vector<vector<char>>& board, int s, int i);

    //checks if a position is a junction position
    bool junction(const vector<vector<char>>& board, int s, int i);

    //counts how useful a position is for forming mills
    int millPotential(const vector<vector<char>>& board, char player, int s, int i);

    //gives the current board a score for alg1
    int scoringSystem(const vector<vector<char>>& board, char player, char opp, int moveCount);

    //gets the opponent pieces that can be removed
    vector<pos> removablePieces(const vector<vector<char>>& board, char opp);

    //looks ahead at future moves to help alg1 choose better
    int minimax(vector<vector<char>>& board, int depth, int alpha, int beta, bool maximizing, char player, char opp);
};

#endif
