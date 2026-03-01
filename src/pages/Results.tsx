import React from 'react';
import { MatchResult } from '../components/MatchResult';

const resultsData = {
  "BR Match": {
    players: 100,
    matches: 120,
    wins: 80,
    losses: 40,
    draws: 0,
    topScore: 200,
  },
  "Clash Squad": {
    players: 10,
    matches: 50,
    wins: 30,
    losses: 20,
    draws: 0,
    topScore: 60,
  },
  "Lone Wolf": {
    players: 1,
    matches: 30,
    wins: 15,
    losses: 15,
    draws: 0,
    topScore: 30,
  },
  "1v1": {
    players: 2,
    matches: 10,
    wins: 5,
    losses: 5,
    draws: 0,
    topScore: 10,
  },
  "2v2": {
    players: 4,
    matches: 20,
    wins: 12,
    losses: 8,
    draws: 0,
    topScore: 20,
  }
};

const ResultsPage = () => {
  return (
    <div>
      <h1>Game-wise Match Results</h1>
      {Object.entries(resultsData).map(([gameType, stats]) => (
        <MatchResult key={gameType} gameType={gameType} stats={stats} />
      ))}
    </div>
  );
};

export default ResultsPage;

