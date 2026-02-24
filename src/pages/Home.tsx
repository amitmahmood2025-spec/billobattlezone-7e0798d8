import React from 'react';

const GameCard = ({ title, image, description }) => (
  <div className="game-card">
    <img src={image} alt={title} />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const TournamentCard = ({ name, date }) => (
  <div className="tournament-card">
    <h4>{name}</h4>
    <p>Date: {date}</p>
  </div>
);

const Home = () => {
  return (
    <div className="home">
      <h1>Billo Battle Zone</h1>
      <div className="game-cards">
        <GameCard title="FreeFire" image="/images/freefire.jpg" description="Battle Royale game." />
        <GameCard title="PUBG" image="/images/pubg.jpg" description="PlayerUnknown's Battlegrounds." />
        <GameCard title="Ludo" image="/images/ludo.jpg" description="Classic board game." />
      </div>
      <div className="tournament-list">
        <h2>Upcoming Tournaments</h2>
        <TournamentCard name="FreeFire Tournament" date="2026-03-01" />
        <TournamentCard name="PUBG Tournament" date="2026-03-05" />
        <TournamentCard name="Ludo Championship" date="2026-03-10" />
      </div>
      <div className="ads">
        <h2>Advertisements</h2>
        <div id="adsense">Google AdSense Ad Here</div>
        <div id="adsterra">AdSterra Ad Here</div>
        <div id="monetag">Monetag Ad Here</div>
      </div>
    </div>
  );
};

export default Home;