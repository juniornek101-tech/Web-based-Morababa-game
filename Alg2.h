// 3003122 and 2944172
#ifndef ALG2_H
#define ALG2_H

#include <vector>
using namespace std;

class Alg2
{
public:
    bool millcapture(vector<vector<char>>& board);

    bool firstmoves(vector<vector<char>>& board, int& moves);

    bool placingphase(vector<vector<char>>& board, int& moves);

    bool movingphase(vector<vector<char>>& board, int& moves);

private:
    int expmoves = 0;
};

#endif
