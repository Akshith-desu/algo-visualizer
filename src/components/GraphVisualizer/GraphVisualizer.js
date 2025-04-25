import React, { useState, useEffect } from 'react';
import './GraphVisualizer.css';

// Node component
const Node = ({ id, x, y, visited, distance, isStart }) => (
  <div
    className={`node ${visited ? 'visited' : ''} ${isStart ? 'start' : ''}`}
    style={{ left: `${x}px`, top: `${y}px` }}
  >
    <div className="node-id">{id}</div>
    {distance !== undefined && distance !== Infinity && 
      <div className="node-distance">{distance}</div>
    
    }
  </div>
);

// Edge component
const Edge = ({ from, to, weight, active }) => {
  // Calculate center points of nodes to draw edges between centers
  const fromX = from.x + 20;
  const fromY = from.y + 20;
  const toX = to.x + 20;
  const toY = to.y + 20;
  
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Calculate midpoint for weight label
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  
  return (
    <>
      <div 
        className={`edge ${active ? 'active' : ''}`} 
        style={{
          width: `${length}px`,
          transform: `rotate(${angle}deg)`,
          top: `${fromY}px`,
          left: `${fromX}px`,
          transformOrigin: '0 0',
          position: 'absolute'
        }}
      ></div>
      <div 
        className="edge-weight"
        style={{
          top: `${midY - 10}px`,
          left: `${midX - 10}px`,
        }}
      >
        {weight}
      </div>
    </>
  );
};

// Info panel component to show algorithm details
const InfoPanel = ({ algorithm, currentStep, visitedNodes, distances }) => {
  const getAlgorithmDescription = () => {
    switch(algorithm) {
      case 'bfs':
        return "Breadth-First Search traverses the graph level by level, visiting all neighbors of a node before moving to the next level. It finds the shortest path in terms of the number of edges.";
      case 'dfs':
        return "Depth-First Search explores as far as possible along each branch before backtracking. It's useful for traversing all nodes and finding paths.";
      case 'dijkstra':
        return "Dijkstra's Algorithm finds the shortest path between nodes in a graph with non-negative edge weights by maintaining a priority queue of nodes sorted by their distance from the start node.";
      default:
        return "Select an algorithm to see its description.";
    }
  };

  return (
    <div className="info-panel">
      <h3>{algorithm ? `${algorithm.toUpperCase()} Algorithm` : 'Algorithm Details'}</h3>
      <p>{getAlgorithmDescription()}</p>
      {currentStep && (
        <div className="current-step">
          <h4>Current Step:</h4>
          <p>{currentStep}</p>
        </div>
      )}
      {visitedNodes.length > 0 && (
        <div className="visited-order">
          <h4>Visited Order:</h4>
          <p>{visitedNodes.join(' → ')}</p>
        </div>
      )}
      {distances && Object.keys(distances).length > 0 && (
        <div className="distances">
          <h4>Shortest Distances:</h4>
          <ul>
            {Object.entries(distances).map(([node, dist]) => (
              <li key={node}>{node}: {dist === Infinity ? '∞' : dist}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// GraphVisualizer component
const GraphVisualizer = () => {
  const defaultNodeCount = 7;
  
  // Generate initial nodes in a circle layout
  const generateNodes = (count) => {
    const centerX = 300;
    const centerY = 200;
    const radius = 150;
    const nodes = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodes.push({
        id: String.fromCharCode(65 + i), // A, B, C, ...
        x,
        y,
        visited: false,
        distance: undefined,
      });
    }
    return nodes;
  };
  
  // Generate edges based on nodes (more complex connectivity)
  const generateEdges = (nodes) => {
    const edges = [];
    const nodeCount = nodes.length;
    
    // Connect each node to 2-3 other nodes
    for (let i = 0; i < nodeCount; i++) {
      // Connect to next node (circular)
      edges.push({
        from: nodes[i].id,
        to: nodes[(i + 1) % nodeCount].id,
        weight: Math.floor(Math.random() * 9) + 1, // Random weight 1-9
        active: false
      });
      
      // Connect to node 2 steps away
      edges.push({
        from: nodes[i].id,
        to: nodes[(i + 2) % nodeCount].id,
        weight: Math.floor(Math.random() * 9) + 1,
        active: false
      });
      
      // 50% chance to connect to a random node
      if (Math.random() > 0.5) {
        let randomNodeIndex;
        do {
          randomNodeIndex = Math.floor(Math.random() * nodeCount);
        } while (randomNodeIndex === i || randomNodeIndex === (i + 1) % nodeCount || randomNodeIndex === (i + 2) % nodeCount);
        
        edges.push({
          from: nodes[i].id,
          to: nodes[randomNodeIndex].id,
          weight: Math.floor(Math.random() * 9) + 1,
          active: false
        });
      }
    }
    return edges;
  };

  const [nodeCount, setNodeCount] = useState(defaultNodeCount);
  const [nodes, setNodes] = useState(generateNodes(defaultNodeCount));
  const [edges, setEdges] = useState(generateEdges(generateNodes(defaultNodeCount)));
  const [startNode, setStartNode] = useState('A');
  const [algorithm, setAlgorithm] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [visitedOrder, setVisitedOrder] = useState([]);
  const [distances, setDistances] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    regenerateGraph(nodeCount);
  }, [nodeCount]);

  const regenerateGraph = (count) => {
    const newNodes = generateNodes(count);
    setNodes(newNodes);
    setEdges(generateEdges(newNodes));
    setStartNode('A');
    resetState();
  };

  const resetState = () => {
    setNodes(prev => prev.map(n => ({ ...n, visited: false, distance: undefined })));
    setEdges(prev => prev.map(e => ({ ...e, active: false })));
    setCurrentStep('');
    setVisitedOrder([]);
    setDistances({});
    setAlgorithm('');
  };

  const markVisited = async (id, distance = undefined) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === id ? { ...node, visited: true, distance } : node
      )
    );
    setVisitedOrder(prev => [...prev, id]);
    // Show step information
    setCurrentStep(`Visiting node ${id}${distance !== undefined ? ` (distance: ${distance})` : ''}`);
    
    return new Promise(resolve => setTimeout(resolve, 800)); // Slow down for better visualization
  };

  const markEdge = async (fromId, toId) => {
    setEdges(prev =>
      prev.map(edge =>
        (edge.from === fromId && edge.to === toId) || (edge.from === toId && edge.to === fromId)
          ? { ...edge, active: true }
          : edge
      )
    );
    setCurrentStep(`Exploring edge from ${fromId} to ${toId}`);
    
    return new Promise(resolve => setTimeout(resolve, 400));
  };

  const getNodeById = (id) => nodes.find(n => n.id === id);

  const getNeighbors = (id) => {
    return edges
      .filter(edge => edge.from === id)
      .map(edge => ({ id: edge.to, weight: edge.weight }));
  };

  const bfs = async (startId) => {
    setIsRunning(true);
    setAlgorithm('bfs');
    resetState();
    
    const visited = new Set();
    const queue = [startId];
    
    setCurrentStep(`Starting BFS from node ${startId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      
      visited.add(current);
      await markVisited(current);
      
      const neighbors = getNeighbors(current);
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          await markEdge(current, neighbor.id);
          queue.push(neighbor.id);
        }
      }
    }
    
    setCurrentStep(`BFS traversal complete! Visited ${visited.size} nodes.`);
    setIsRunning(false);
  };

  const dfs = async (startId) => {
    setIsRunning(true);
    setAlgorithm('dfs');
    resetState();
    
    const visited = new Set();
    
    setCurrentStep(`Starting DFS from node ${startId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dfsRecursive = async (nodeId) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      await markVisited(nodeId);
      
      const neighbors = getNeighbors(nodeId);
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          await markEdge(nodeId, neighbor.id);
          await dfsRecursive(neighbor.id);
        }
      }
    };
    
    await dfsRecursive(startId);
    setCurrentStep(`DFS traversal complete! Visited ${visited.size} nodes.`);
    setIsRunning(false);
  };

  const dijkstra = async (startId) => {
    setIsRunning(true);
    setAlgorithm('dijkstra');
    resetState();
    
    const newDistances = {};
    const visited = new Set();
    const prev = {};
    
    // Initialize distances
    nodes.forEach(node => {
      newDistances[node.id] = Infinity;
      prev[node.id] = null;
    });
    newDistances[startId] = 0;
    
    setDistances({...newDistances});
    setCurrentStep(`Starting Dijkstra's algorithm from node ${startId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Priority queue
    const pq = [{ id: startId, dist: 0 }];
    
    while (pq.length > 0) {
      pq.sort((a, b) => a.dist - b.dist);
      const { id: currentId, dist } = pq.shift();
      
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      await markVisited(currentId, dist);
      
      const neighbors = getNeighbors(currentId);
      for (let neighbor of neighbors) {
        await markEdge(currentId, neighbor.id);
        
        const newDist = dist + neighbor.weight;
        if (newDist < newDistances[neighbor.id]) {
          newDistances[neighbor.id] = newDist;
          prev[neighbor.id] = currentId;
          setDistances({...newDistances});
          pq.push({ id: neighbor.id, dist: newDist });
          
          setCurrentStep(
            `Found shorter path to ${neighbor.id} through ${currentId}. ` +
            `New distance: ${newDist}`
          );
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    setCurrentStep(`Dijkstra's algorithm complete! Found shortest paths from ${startId} to all reachable nodes.`);
    setIsRunning(false);
  };

  return (
    <div className="graph-visualizer">
      <h2>Graph Algorithm Visualizer</h2>
      
      <div className="config-panel">
        <div className="config-group">
          <label>Number of Nodes:</label>
          <input 
            type="range" 
            min="4" 
            max="12" 
            value={nodeCount} 
            disabled={isRunning}
            onChange={(e) => setNodeCount(parseInt(e.target.value))} 
          />
          <span>{nodeCount}</span>
        </div>
        
        <div className="config-group">
          <label>Start Node:</label>
          <select 
            value={startNode} 
            onChange={(e) => setStartNode(e.target.value)}
            disabled={isRunning}
          >
            {nodes.map(node => (
              <option key={node.id} value={node.id}>{node.id}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="algorithm-controls">
        <button onClick={() => bfs(startNode)} disabled={isRunning}>Run BFS</button>
        <button onClick={() => dfs(startNode)} disabled={isRunning}>Run DFS</button>
        <button onClick={() => dijkstra(startNode)} disabled={isRunning}>Run Dijkstra</button>
        <button onClick={resetState} disabled={isRunning}>Reset</button>
        <button onClick={() => regenerateGraph(nodeCount)} disabled={isRunning}>New Graph</button>
      </div>
      
      <div className="visualization-container">
        <div className="graph-container">
          {edges.map((edge, index) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            if (from && to) {
              return <Edge key={index} from={from} to={to} weight={edge.weight} active={edge.active} />;
            }
            return null;
          })}
          {nodes.map((node) => (
            <Node 
              key={node.id} 
              {...node} 
              isStart={node.id === startNode}
            />
          ))}
        </div>
        
        <InfoPanel 
          algorithm={algorithm}
          currentStep={currentStep}
          visitedNodes={visitedOrder}
          distances={distances}
        />
      </div>
    </div>
  );
};

export default GraphVisualizer;