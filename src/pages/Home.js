// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Algo Visualizer</h1>
      <p>Select a section:</p>
      <div style={{ marginTop: '20px' }}>
        <Link to="/sorting"><button>Sorting</button></Link>
        <br /><br />
        <Link to="/search"><button>Searching</button></Link>
        <br /><br />
        <Link to="/graph"><button>Graph Algorithms</button></Link>
      </div>
    </div>
  );
}

export default Home;
