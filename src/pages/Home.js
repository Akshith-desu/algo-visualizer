import React from 'react';
import { Link } from 'react-router-dom';

function Home() {

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    color: 'white',
    padding: '20px'
  };

  const headerStyle = {
    fontSize: '3.5rem',
    fontWeight: '700',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    background: 'linear-gradient(45deg, #fff, #f0f8ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle = {
    fontSize: '1.3rem',
    marginBottom: '40px',
    opacity: '0.9',
    fontWeight: '300'
  };

  const buttonContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    maxWidth: '400px',
    width: '100%',
    position: 'relative'
  };

  const buttonRowStyle = {
    display: 'flex',
    gap: '15px',
    width: '100%',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const buttonWrapperStyle = {
    transform: 'translateY(0)',
    transition: 'all 0.3s ease',
    minWidth: '180px',
    flex: '1'
  };

  const buttonStyle = {
    width: '100%',
    padding: '18px 30px',
    fontSize: '1.1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const buttonHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
    background: 'rgba(255, 255, 255, 0.25)'
  };

  const linkStyle = {
    textDecoration: 'none',
    display: 'block'
  };

  const handleMouseEnter = (e) => {
    Object.assign(e.target.style, buttonHoverStyle);
    e.target.parentElement.style.transform = 'translateY(-2px)';
  };

  const handleMouseLeave = (e) => {
    Object.assign(e.target.style, buttonStyle);
    e.target.parentElement.style.transform = 'translateY(0)';
  };

  const algorithms = [
    { path: '/sorting', title: 'Sorting Algorithms', icon: '🔄' },
    { path: '/search', title: 'Search Algorithms', icon: '🔍' },
    { path: '/graph', title: 'Graph Algorithms', icon: '🕸️' },
    { path: '/mst', title: 'Minimum Spanning Tree', icon: '🌳' }
  ];

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Algo Visualizer</h1>
      <p style={subtitleStyle}>Explore and visualize algorithms interactively</p>
      
      <div style={buttonContainerStyle}>
        <div style={buttonRowStyle}>
          <div style={buttonWrapperStyle}>
            <Link to="/sorting" style={linkStyle}>
              <button 
                style={buttonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                  🔄
                </span>
                Sorting Algorithms
              </button>
            </Link>
          </div>
          <div style={buttonWrapperStyle}>
            <Link to="/search" style={linkStyle}>
              <button 
                style={buttonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                  🔍
                </span>
                Search Algorithms
              </button>
            </Link>
          </div>
        </div>
        
        <div style={buttonRowStyle}>
          <div style={buttonWrapperStyle}>
            <Link to="/graph" style={linkStyle}>
              <button 
                style={buttonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                  🕸️
                </span>
                Graph Algorithms
              </button>
            </Link>
          </div>
          <div style={buttonWrapperStyle}>
            <Link to="/mst" style={linkStyle}>
              <button 
                style={buttonStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                  🌳
                </span>
                Minimum Spanning Tree
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '0.9rem',
        opacity: '0.7'
      }}>
        Choose an algorithm category to get started
      </div>
    </div>
  );
}

export default Home;