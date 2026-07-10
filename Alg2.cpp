// 3003122 and 2944172
#include "Alg2.h"

using namespace std;

//it checks if the board is empty it being empty it would contain a '-', otherwise a move can't be made
static bool placepiece(vector<vector<char>>& board, int s, int i)
{
    //only place on a playable empty position
    if (board[s][i] == '-')
    {
        board[s][i] = 'O';
        return true;
    }

    return false;
}

//aims to complete a mill or block an opponents pontetial mill
static bool milling(vector<vector<char>>& board, char player)
{
    //these are all the mill lines that can be checked
    const int totalmills = 14;
    const int mills[totalmills][3][2] =
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

    //go through every possible mill line
    for (int m = 0; m < totalmills; m++)
    {
        int count = 0;
        int emptyS = -1;
        int emptyI = -1;

        //check the three positions inside the current mill
        for (int k = 0; k < 3; k++)
        {
            int s = mills[m][k][0];
            int i = mills[m][k][1];

            if (board[s][i] == player)
                count++;
            else if (board[s][i] == '-')
            {
                emptyS = s;
                emptyI = i;
            }
        }

        //if two pieces are already there and one spot is empty, play there
        if (count == 2 && emptyS != -1)
            return placepiece(board, emptyS, emptyI);
    }

    return false;
}

//if a mill cant formed or there's no potential mill being formed by the oppenent, the algorithm plays a move on an empty position to gurentee a move is still made
static bool openings(vector<vector<char>>& board)
{
    //look through the board until the first open position is found
    for (int s = 0; s < 7; s++)
        for (int i = 0; i < 6; i++)
            if (placepiece(board, s, i))
                return true;

    return false;
}

// when a mill is formed it removes a piece
bool Alg2::millcapture(vector<vector<char>>& board)
{
    //alg2 removes the first alg1 cow it finds
    for (int s = 0; s < 7; s++)
    {
        for (int i = 0; i < 6; i++)
        {
            if (board[s][i] == 'X')
            {
                board[s][i] = '-';
                return true;
            }
        }
    }

    return false;
}

//was prevously designed to find the optimal first move, now it calls the placing phase to decide
bool Alg2::firstmoves(vector<vector<char>>& board, int& moves)
{
    return placingphase(board, moves);
}

//it is basicially the "headquarters" of the placing phase, it calls the missling function to see if there are potential millformation or blocks, if not it calls the openings function to find an empty spot play on
bool Alg2::placingphase(vector<vector<char>>& board, int& moves)
{
    //first try to complete alg2's own mill
    if (milling(board, 'O'))
        return true;

    //then try to block alg1 from making a mill
    if (milling(board, 'X'))
        return true;

    //if nothing special is possible, just play on an open space
    return openings(board);
}

//It scans for an O cow, finds a mill line containing that cow, and moves it to a neighbouring empty position in that line
bool Alg2::movingphase(vector<vector<char>>& board, int& moves)
{
    //these are all possible mill lines, used here as movement paths
    const int totalmills = 14;
    const int mills[totalmills][3][2] =
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

    //search for an O cow that can be moved
    for (int s = 0; s < 7; s++)
    {
        for (int i = 0; i < 6; i++)
        {
            if (board[s][i] == 'O')
            {
                //check every mill line that might contain this cow
                for (int m = 0; m < totalmills; m++)
                {
                    for (int k = 0; k < 3; k++)
                    {
                        if (mills[m][k][0] == s && mills[m][k][1] == i)
                        {
                            //try moving backwards along the line
                            if (k > 0)
                            {
                                int ns = mills[m][k - 1][0];
                                int ni = mills[m][k - 1][1];
                                if (board[ns][ni] == '-')
                                {
                                    board[s][i] = '-';
                                    board[ns][ni] = 'O';
                                    return true;
                                }
                            }

                            //try moving forwards along the line
                            if (k < 2)
                            {
                                int ns = mills[m][k + 1][0];
                                int ni = mills[m][k + 1][1];
                                if (board[ns][ni] == '-')
                                {
                                    board[s][i] = '-';
                                    board[ns][ni] = 'O';
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return false;
}
