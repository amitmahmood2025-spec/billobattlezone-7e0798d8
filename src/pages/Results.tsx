import React from 'react';

const resultsData = {
  "BR Match": { players: 100, matches: 120, wins: 80, losses: 40, draws: 0, topScore: 200 },
  "Clash Squad": { players: 10, matches: 50, wins: 30, losses: 20, draws: 0, topScore: 60 },
  "Lone Wolf": { players: 1, matches: 30, wins: 15, losses: 15, draws: 0, topScore: 30 },
  "1v1": { players: 2, matches: 10, wins: 5, losses: 5, draws: 0, topScore: 10 },
  "2v2": { players: 4, matches: 20, wins: 12, losses: 8, draws: 0, topScore: 20 },
};

const ResultsPage = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-display font-bold mb-6">Game-wise Match Results</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(resultsData).map(([gameType, stats]) => (
          <div key={gameType} className="glass rounded-xl p-4">
            <h3 className="font-display font-semibold text-lg mb-2">{gameType}</h3>
            <p className="text-sm text-muted-foreground">Players: {stats.players}</p>
            <p className="text-sm text-muted-foreground">Matches: {stats.matches}</p>
            <p className="text-sm text-muted-foreground">Wins: {stats.wins} | Losses: {stats.losses}</p>
            <p className="text-sm text-primary font-bold">Top Score: {stats.topScore}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsPage;
