1import React from 'react';

const UserProfile = () => {
    const userStats = {
        matchesPlayed: 50,
        totalWins: 30,
        totalJoins: 20,
        playerStatistics: {
            wins: 30,
            losses: 20,
            winRate: '60%',
        },
    };

    return (
        <div>
            <h1>User Profile</h1>
            <h2>Match Statistics</h2>
            <p>Matches Played: {userStats.matchesPlayed}</p>
            <p>Total Wins: {userStats.totalWins}</p>
            <p>Total Joins: {userStats.totalJoins}</p>
            <h2>Player Statistics</h2>
            <p>Wins: {userStats.playerStatistics.wins}</p>
            <p>Losses: {userStats.playerStatistics.losses}</p>
            <p>Win Rate: {userStats.playerStatistics.winRate}</p>
        </div>
    );
};

export default UserProfile;
