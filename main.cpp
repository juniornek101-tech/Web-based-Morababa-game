// 3003122 and 2944172
#include <iostream>
#include <vector>
#include <fstream>
#include "Alg1.h"
#include "Alg2.h"

using namespace std;

//possible mill cordinates
static vector<vector<pair<int,int>>> makemills()
{
    vector<vector<pair<int,int>>> mills =
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

    return mills;
}

bool checkmill(const vector<vector<char>>& board,char player,vector<bool>& prev,const vector<vector<pair<int,int>>>& mills)
{
    //checks if a player formed a new mill
    bool newMill = false;
    for (int i = 0; i < (int)mills.size(); i++)
    {
        bool formed =
            board[mills[i][0].first][mills[i][0].second] == player &&
            board[mills[i][1].first][mills[i][1].second] == player &&
            board[mills[i][2].first][mills[i][2].second] == player;

        if (formed && !prev[i])
        {
            prev[i] = true;
            newMill    = true;
        }
        else if (!formed)
        {
            prev[i] = false;   // reset so the mill can re-trigger after oscillation
        }
    }
    return newMill;
}

//chooses the best opponent piece to remove after alg1 forms a mill
static int bestRemovable(Alg1& alg1,const vector<vector<char>>& board,char opp)
{
    vector<pos> candidates = alg1.removablePieces(board, opp);
    if (candidates.empty()) return -1;
    int besti = 0;
    int bestPot = -1;
    for (int k = 0; k < (int)candidates.size(); k++)
    {
        int pot = alg1.millPotential(board, opp, candidates[k].s, candidates[k].i);
        if (pot > bestPot)
        {
            bestPot = pot;
            besti = k;
        }
    }
    return besti;
}


static void copyboard(const vector<vector<char>>& src,vector<vector<char>>& dst)
{
    //copies the board so we can compare before and after a move
    dst = src;
}

static vector<vector<char>> makeBoard()
{
    //creates the empty board used at the start of each game
    vector<vector<char>> board(7, vector<char>(6, ' '));

    for (int s = 0; s < 7; s++)
        for (int i = 0; i < 3; i++)
            board[s][i] = '-';

    for (int i = 3; i < 6; i++)
        board[3][i] = '-';

    return board;
}

static string positionName(int s, int i)
{
    //changes the board coordinates into the labels required in the brief
    if (s == 0 && i == 0) return "S0,i0";
    if (s == 0 && i == 1) return "S0,i1";
    if (s == 0 && i == 2) return "S0,i2";
    if (s == 3 && i == 3) return "S0,i3";
    if (s == 4 && i == 2) return "S0,i4";
    if (s == 4 && i == 1) return "S0,i5";
    if (s == 4 && i == 0) return "S0,i6";
    if (s == 3 && i == 2) return "S0,i7";

    if (s == 1 && i == 0) return "S1,i0";
    if (s == 1 && i == 1) return "S1,i1";
    if (s == 1 && i == 2) return "S1,i2";
    if (s == 3 && i == 4) return "S1,i3";
    if (s == 5 && i == 2) return "S1,i4";
    if (s == 5 && i == 1) return "S1,i5";
    if (s == 5 && i == 0) return "S1,i6";
    if (s == 3 && i == 1) return "S1,i7";

    if (s == 2 && i == 0) return "S2,i0";
    if (s == 2 && i == 1) return "S2,i1";
    if (s == 2 && i == 2) return "S2,i2";
    if (s == 3 && i == 5) return "S2,i3";
    if (s == 6 && i == 2) return "S2,i4";
    if (s == 6 && i == 1) return "S2,i5";
    if (s == 6 && i == 0) return "S2,i6";
    if (s == 3 && i == 0) return "S2,i7";

    return "S0,i0";
}

static string millposition(const vector<pair<int,int>>& mill)
{
    //puts the three mill positions into one output string
    string text = "";

    for (int k = 0; k < 3; k++)
    {
        if (k > 0)
            text += ", ";

        text += positionName(mill[k].first, mill[k].second);
    }

    return text;
}

static int countPieces(const vector<vector<char>>& board, char player)
{
    //counts how many cows a player still has on the board
    int count = 0;

    for (int s = 0; s < (int)board.size(); s++)
        for (int i = 0; i < (int)board[s].size(); i++)
            if (board[s][i] == player)
                count++;

    return count;
}

static int newmill(const vector<vector<char>>& board,char player,vector<bool>& prev,const vector<vector<pair<int,int>>>& mills)
{
    //finds which mill was just formed
    int found = -1;

    for (int i = 0; i < (int)mills.size(); i++)
    {
        bool formed =
            board[mills[i][0].first][mills[i][0].second] == player &&
            board[mills[i][1].first][mills[i][1].second] == player &&
            board[mills[i][2].first][mills[i][2].second] == player;

        if (formed && !prev[i])
        {
            prev[i] = true;
            if (found == -1)
                found = i;
        }
        else if (!formed)
            prev[i] = false;
    }

    return found;
}

static string moveText(const vector<vector<char>>& before,const vector<vector<char>>& after,char player)
{
    //compares the old board and new board to write the move correctly
    int fromS = -1, fromI = -1, toS = -1, toI = -1;

    for (int s = 0; s < 7; s++)
    {
        for (int i = 0; i < 6; i++)
        {
            if (before[s][i] == player && after[s][i] == '-')
            {
                fromS = s;
                fromI = i;
            }
            else if (before[s][i] == '-' && after[s][i] == player)
            {
                toS = s;
                toI = i;
            }
        }
    }

    if (toS == -1)
        return "no move";

    if (fromS == -1)
        return "00-" + positionName(toS, toI);

    return positionName(fromS, fromI) + "-" + positionName(toS, toI);
}

static bool chooseAlg1Move(vector<vector<char>>& board, Alg1& alg1, char player, char opp)
{
    //alg1 tries all possible moves and keeps the move with the best score
    vector<struct move> moves = alg1.validMoves(board, player);

    if (moves.empty())
        return false;

    int bestScore = -1000000;
    int bestMove = 0;

    for (int k = 0; k < (int)moves.size(); k++)
    {
        // Try the move, score it, then undo it before trying the next one.
        board[moves[k].from.s][moves[k].from.i] = '-';
        board[moves[k].to.s][moves[k].to.i] = player;

        int score = alg1.scoringSystem(board, player, opp, 0);

        if (alg1.createsMill(board, moves[k].to.s, moves[k].to.i, player))
            score += 3000;

        if (alg1.block(board, moves[k].to.s, moves[k].to.i, player, opp))
            score += 1200;

        score += alg1.millPotential(board, player, moves[k].to.s, moves[k].to.i) * 150;

        board[moves[k].from.s][moves[k].from.i] = player;
        board[moves[k].to.s][moves[k].to.i] = '-';

        if (score > bestScore)
        {
            bestScore = score;
            bestMove = k;
        }
    }

    board[moves[bestMove].from.s][moves[bestMove].from.i] = '-';
    board[moves[bestMove].to.s][moves[bestMove].to.i] = player;
    return true;
}

int main()
{
    //opens the input and output files
    ifstream input("input.txt");
    ofstream output("morabarabaResults.txt");

    //gets all possible mill patterns
    vector<vector<pair<int,int>>> mills = makemills();
    int pieces;
    bool firstGame = true;

    //runs one full game for each number in input.txt
    while (input >> pieces)
    {
        if (!firstGame)
            output << endl;

        firstGame = false;

        vector<vector<char>> board = makeBoard();
        vector<vector<char>> tracker = makeBoard();

        //creates the two algorithms
        Alg1 alg1;
        Alg2 alg2;

        //tracks mills that already exist so they are not counted every turn
        vector<bool> millsX(mills.size(), false);
        vector<bool> millsO(mills.size(), false);

        int turns = 0;
        int placedX = 0;
        int placedO = 0;
        int turnsWithoutCapture = 0;
        char current = 'X';
        string result = "its a draw";

        output << pieces << endl;

        while (turns < pieces * 2 + 40)
        {
            //keeps a copy of the board before the player moves
            copyboard(board, tracker);
            bool moved = false;

            //first place all cows after that, each turn becomes a slide
            if (current == 'X')
            {
                if (placedX < pieces)
                {
                    alg1.playTurn(board, 'X', 'O');
                    placedX++;
                    moved = true;
                }
                else
                    moved = chooseAlg1Move(board, alg1, 'X', 'O');
            }
            else
            {
                if (placedO < pieces)
                {
                    if (turns < 2)
                        moved = alg2.firstmoves(board, turns);
                    else
                        moved = alg2.placingphase(board, turns);

                    placedO++;
                }
                else
                    moved = alg2.movingphase(board, turns);
            }

            if (!moved)
            {
                //if a player cannot move, the other player wins
                result = (current == 'X') ? "Alg 2 wins" : "Alg 1 wins";
                break;
            }

            //starts building the output line for this move
            string line = (current == 'X') ? "Alg 1 " : "Alg 2 ";
            line += moveText(tracker, board, current);

            //checks if the move made a new mill
            vector<bool>& currentMills = (current == 'X') ? millsX : millsO;
            int milli = newmill(board, current, currentMills, mills);

            if (milli != -1)
            {
                //if there is a mill, remove one opponent cow and add it to the output
                char opponent = (current == 'X') ? 'O' : 'X';
                string opponentName = (current == 'X') ? "Alg 2" : "Alg 1";
                string removedName = "";

                if (current == 'X')
                {
                    vector<pos> rem = alg1.removablePieces(board, opponent);
                    if (!rem.empty())
                    {
                        int remIndex = bestRemovable(alg1, board, opponent);
                        removedName = positionName(rem[remIndex].s, rem[remIndex].i);
                        board[rem[remIndex].s][rem[remIndex].i] = '-';
                    }
                }
                else
                {
                    vector<vector<char>> beforeRemove = board;
                    alg2.millcapture(board);

                    for (int s = 0; s < 7; s++)
                        for (int i = 0; i < 6; i++)
                            if (beforeRemove[s][i] == opponent && board[s][i] == '-')
                                removedName = positionName(s, i);
                }

                line += " (mill = " + millposition(mills[milli]) + ") ";
                line += opponentName + " losses cow (" + removedName + ") | ";
                line += to_string(countPieces(board, opponent)) + " left";
                turnsWithoutCapture = 0;
            }
            else
                turnsWithoutCapture++;

            output << line << endl;

            //game ending checks only happen after both players placed their cows
            if (placedX >= pieces && placedO >= pieces)
            {
                if (countPieces(board, 'X') < 3)
                {
                    result = "Alg 2 wins";
                    break;
                }
                if (countPieces(board, 'O') < 3)
                {
                    result = "Alg 1 wins";
                    break;
                }
                if (alg1.noMoves(board, 'X'))
                {
                    result = "Alg 2 wins";
                    break;
                }
                if (alg1.noMoves(board, 'O'))
                {
                    result = "Alg 1 wins";
                    break;
                }
                if ((countPieces(board, 'X') == 3 || countPieces(board, 'O') == 3) &&
                    turnsWithoutCapture >= 10)
                {
                    result = "its a draw";
                    break;
                }
            }

            turns++;
            //changes to the next player
            current = (current == 'X') ? 'O' : 'X';
        }

        //writes the final result of this game
        output << result << endl;
    }

    return 0;
}
