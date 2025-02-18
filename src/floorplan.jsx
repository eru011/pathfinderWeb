import React, { useState } from "react";
import { ReactSVG } from "react-svg";
import svgPath from "./assets/Rizal_Building.svg";
import "./App.css"; // Create this file for styles

function App() {
  // Update to actual asset path
  const [startRoom, setStartRoom] = useState("");
  const [targetRoom, setTargetRoom] = useState("");

  // Define room coordinates
  const roomCoordinates = {
    Room1: { x: 1005, y: 770 },
    Room2: { x: 1246, y: 770 },
    Room3: { x: 958, y: 540 },
    Room4: { x: 952, y: 303 },
    Room5: { x: 1203, y: 130 },
    Room6: { x: 1350, y: 55 },
    Room7: { x: 1110, y: 55 },
    Room8: { x: 859, y: 55 },
    Room9: { x: 612, y: 55 },
    Room10: { x: 479, y: 270},
    Room11: { x: 465, y: 425 },
    Room12: { x: 476, y: 587 },
    Room13: { x: 171, y: 760 },
    Room14: { x: 451, y: 760 },
    Room15: { x: 325, y: 60 },
  };

  // Define waypoints for corridors and intersections
  const waypoints = {
    // Main corridor waypoints
    wpC1: { x: 710, y: 700 },  // Corridor start
    wpC2: { x: 710, y: 482 },
    wpC3: { x: 717, y: 310 },
    wpC4: { x: 717, y: 218 },
    wpC5: { x: 721, y: 100 },  // Corridor end
    
    // North corridor waypoints
    wpN1: { x: 487, y: 60 },
    wpN2: { x: 725, y: 60 },
    wpN3: { x: 1019, y: 60 },
    
    // South corridor waypoints
    wpS1: { x: 174, y: 740 },
    wpS2: { x: 455, y: 740 },
    wpS3: { x: 714, y: 740 },
    wpS4: { x: 1007, y: 740 },
    wpS5: { x: 1247, y: 740 },
  };

  // Define connections between rooms and waypoints
  const roomConnections = {
    // North side rooms
    Room15: ["wpN1", "Room9"],
    Room9: ["wpN1", "wpN2", "Room15", "Room8"],
    Room8: ["wpN2", "wpN3", "Room9", "Room7"],
    Room7: ["wpN2", "wpN3", "Room8", "Room6"],
    Room6: ["wpN3", "Room7", "Room5"],
    Room5: ["wpN3", "Room6"],

    // South side rooms
    Room10: ["wpC3", "Room11"],
    Room11: ["wpC2", "Room10", "Room12"],
    Room12: ["wpC1", "Room11", "Room14"],
    Room13: ["wpS1", "Room14"],
    Room14: ["wpS2", "Room13", "Room12"],
    Room1: ["wpS4", "Room2", "Room3"],
    Room2: ["wpS5", "Room1"],
    Room3: ["wpC2", "Room1", "Room4"],
    Room4: ["wpC3", "Room3"],

    // Waypoint connections - Main corridor
    wpC1: ["wpC2", "wpS2", "wpS3"],
    wpC2: ["wpC1", "wpC3"],
    wpC3: ["wpC2", "wpC4"],
    wpC4: ["wpC3", "wpC5"],
    wpC5: ["wpC4", "wpN3"],

    // North corridor connections
    wpN1: ["wpN2"],
    wpN2: ["wpN1", "wpN3"],
    wpN3: ["wpN2", "wpC5"],

    // South corridor connections
    wpS1: ["wpS2"],
    wpS2: ["wpS1", "wpS3", "wpC1"],
    wpS3: ["wpS2", "wpS4"],
    wpS4: ["wpS3", "wpS5"],
    wpS5: ["wpS4"]
  };

  // Implement Dijkstra's algorithm for shortest path calculation
  const calculateShortestPath = (start, destination) => {
    // Create a combined graph of rooms and waypoints
    const graph = {};
    
    // Add room connections to waypoints
    Object.entries(roomConnections).forEach(([room, connections]) => {
      graph[room] = connections;
      connections.forEach(waypoint => {
        graph[waypoint] = graph[waypoint] || [];
        if (!graph[waypoint].includes(room)) {
          graph[waypoint].push(room);
        }
      });
    });

    // Add waypoint-to-waypoint connections
    if (graph['wpN1'] && !graph['wpN1'].includes('wpN2')) graph['wpN1'].push('wpN2');
    if (graph['wpN2'] && !graph['wpN2'].includes('wpN1')) graph['wpN2'].push('wpN1');
    if (graph['wpN2'] && !graph['wpN2'].includes('wpN3')) graph['wpN2'].push('wpN3');
    if (graph['wpN3'] && !graph['wpN3'].includes('wpN2')) graph['wpN3'].push('wpN2');

    // A* specific data structures
    const openSet = new Set([start]);
    const closedSet = new Set();
    const gScore = {};
    const fScore = {};
    const previous = {};

    // Initialize scores
    Object.keys(graph).forEach(node => {
      gScore[node] = Infinity;
      fScore[node] = Infinity;
      previous[node] = null;
    });
    gScore[start] = 0;
    
    // Heuristic function (Euclidean distance)
    const heuristic = (node1, node2) => {
      const coord1 = roomCoordinates[node1] || waypoints[node1];
      const coord2 = roomCoordinates[node2] || waypoints[node2];
      return Math.sqrt(
        Math.pow(coord2.x - coord1.x, 2) + 
        Math.pow(coord2.y - coord1.y, 2)
      );
    };

    fScore[start] = heuristic(start, destination);

    while (openSet.size > 0) {
      // Find node with lowest fScore in openSet
      const current = Array.from(openSet)
        .reduce((min, node) => 
          fScore[node] < fScore[min] ? node : min
        );

      if (current === destination) {
        // Reconstruct path
        const path = [];
        let curr = destination;
        while (curr !== null && curr !== undefined) {
          path.unshift(curr);
          curr = previous[curr];
        }
        return path;
      }

      openSet.delete(current);
      closedSet.add(current);

      // Check all neighbors
      for (const neighbor of graph[current] || []) {
        if (closedSet.has(neighbor)) continue;

        const currentCoord = roomCoordinates[current] || waypoints[current];
        const neighborCoord = roomCoordinates[neighbor] || waypoints[neighbor];
        
        const tentativeGScore = gScore[current] + Math.sqrt(
          Math.pow(neighborCoord.x - currentCoord.x, 2) + 
          Math.pow(neighborCoord.y - currentCoord.y, 2)
        );

        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        } else if (tentativeGScore >= gScore[neighbor]) {
          continue;
        }

        previous[neighbor] = current;
        gScore[neighbor] = tentativeGScore;
        fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, destination);
      }
    }

    return []; // No path found
  };

  const drawPath = () => {
    if (!startRoom || !targetRoom) return [];

    const path = calculateShortestPath(startRoom, targetRoom);
    console.log('Path found:', path);

    return path.map((node, index) => {
      if (index < path.length - 1) {
        const start = roomCoordinates[node] || waypoints[node];
        const end = roomCoordinates[path[index + 1]] || waypoints[path[index + 1]];
        
        if (!start || !end) {
          console.error('Missing coordinates for', node, 'or', path[index + 1]);
          return null;
        }

        return (
          <g key={`path-segment-${index}`}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="red"
              strokeWidth="3"
            />
            {/* Debug points */}
            <circle cx={start.x} cy={start.y} r="4" fill="blue" />
            <circle cx={end.x} cy={end.y} r="4" fill="green" />
          </g>
        );
      }
      return null;
    });
  };

  // Add this function to your component
  const handleSvgLoad = (svg) => {
    // This will log the viewBox and dimensions of your base SVG
    console.log('SVG viewBox:', svg.viewBox);
    console.log('SVG dimensions:', svg.getBoundingClientRect());
  };

  // Add this function to help find coordinates
  const handleSvgClick = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate the scaled coordinates
    const viewBoxWidth = 1440;  // Update to match your SVG viewBox
    const viewBoxHeight = 758;   // Update to match your SVG viewBox
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;
    
    const svgX = Math.round(x * scaleX);
    const svgY = Math.round(y * scaleY);
    
    console.log(`Clicked at SVG coordinates: x=${svgX}, y=${svgY}`);
  };

  // Add this function to draw room labels
  const drawRoomLabels = () => {
    return Object.entries(roomCoordinates).map(([room, coords]) => (
      <text
        key={`label-${room}`}
        x={coords.x}
        y={coords.y - 10}
        textAnchor="middle"
        fill="black"
        fontSize="12"
      >
        {room}
      </text>
    ));
  };

  // Add this new function to draw waypoints
  const drawWaypoints = () => {
    return Object.entries(waypoints).map(([id, point]) => (
      <g key={`waypoint-${id}`}>
        {/* Waypoint circle */}
        <circle
          cx={point.x}
          cy={point.y}
          r="4"
          fill="purple"
        />
        {/* Waypoint label */}
        <text
          x={point.x}
          y={point.y - 10}
          textAnchor="middle"
          fill="purple"
          fontSize="10"
        >
          {id}
        </text>
      </g>
    ));
  };

  // Add this function to draw connections
  const drawConnections = () => {
    const drawnPaths = new Set(); // To avoid drawing duplicate connections
    
    return Object.entries(roomConnections).flatMap(([from, connections]) => {
      return connections.map((to) => {
        // Create a unique key for this connection
        const pathKey = [from, to].sort().join('-');
        if (drawnPaths.has(pathKey)) return null;
        drawnPaths.add(pathKey);

        const fromCoord = roomCoordinates[from] || waypoints[from];
        const toCoord = roomCoordinates[to] || waypoints[to];
        
        if (!fromCoord || !toCoord) return null;

        return (
          <g key={`connection-${pathKey}`}>
            <line
              x1={fromCoord.x}
              y1={fromCoord.y}
              x2={toCoord.x}
              y2={toCoord.y}
              stroke="rgba(0, 255, 0, 0.3)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </g>
        );
      });
    }).filter(Boolean);
  };

  return (
    <div className="App">
      <h1>Indoor Navigation</h1>
      <div className="dropdowns">
      <select
          onChange={(e) => setStartRoom(e.target.value)}
          value={startRoom}
        >
          <option value="">Select Start Room</option>
          {Object.keys(roomCoordinates).map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => setTargetRoom(e.target.value)}
          value={targetRoom}
        >
          <option value="">Select Target Room</option>
          {Object.keys(roomCoordinates).map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>
  <div className="svg-container">
      <div className="svg-wrapper" onClick={handleSvgClick}>
        <ReactSVG 
          src={svgPath} 
          beforeInjection={handleSvgLoad}
        />
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          viewBox="0 0 1440 758"  // Update these numbers to match your base SVG
          preserveAspectRatio="xMidYMid meet"
        >
          {drawConnections()} {/* Draw connections first (bottom layer) */}
          {drawWaypoints()} {/* Draw waypoints */}
          {drawPath()} {/* Draw the navigation path */}
          {drawRoomLabels()} {/* Draw room labels */}
        </svg>
      </div>
    </div>
  </div>

  
);

}

export default App;
