import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Games from './pages/Games';
import FreeFire from './pages/FreeFire';
import PUBG from './pages/PUBG';
import Ludo from './pages/Ludo';
import Tournaments from './pages/Tournaments';
import AdminPanel from './pages/AdminPanel';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path='/' component={Home} />
        <Route path='/games' component={Games} />
        <Route path='/freefire' component={FreeFire} />
        <Route path='/pubg' component={PUBG} />
        <Route path='/ludo' component={Ludo} />
        <Route path='/tournaments' component={Tournaments} />
        <Route path='/admin' component={AdminPanel} />
      </Switch>
    </Router>
  );
};

export default App;
