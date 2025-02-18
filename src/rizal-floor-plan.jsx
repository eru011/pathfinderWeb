import React, { useState, useEffect } from "react";
import { ReactSVG } from "react-svg";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Map } from 'lucide-react';
import svgPath from "./assets/Rizal_Building.svg";
import rizal3DModel from "/buildings/rizal floorplans.glb";
import "./App.css";
import { useDarkMode } from './contexts/DarkModeContext';
import { useBackButton } from './hooks/useBackButton';

const Select = ({ placeholder, options = [], value, onChange }) => {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className={`w-full appearance-none rounded-md ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-sky-200 text-gray-700'
        } px-4 py-2 pr-8 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-700'
      }`}>
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  )
};

function App() {
  useBackButton();
  const location = useLocation();
  const { state } = location;
  
  const navigate = useNavigate();
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [startRoom, setStartRoom] = useState(state?.startRoom || '');
  const [targetRoom, setTargetRoom] = useState(state?.targetRoom || '');
  const [pathData, setPathData] = useState(state?.pathData || null);
  const [showPath, setShowPath] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [is3DView, setIs3DView] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const { isDarkMode } = useDarkMode();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Add useEffect to handle navigation from saved paths
  useEffect(() => {
    if (state?.fromSavedPaths) {
      setStartRoom(state.startRoom);
      setTargetRoom(state.targetRoom);
      setPathData(state.pathData);
      
      // Add slight delay to ensure SVG is loaded
      const timer = setTimeout(() => {
        handleNavigate();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Add useEffect to get and update screen dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.floor-plan-container');
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calculate scales based on container size and SVG viewBox, reduced by 5%
      const scaleX = (containerWidth / 1440) * 0.95;
      const scaleY = (containerHeight / 758) * 0.95;
      
      // Use the smaller scale to maintain aspect ratio
      const scale = Math.min(scaleX, scaleY);
      setScale({ x: scale, y: scale });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update click handler to use new coordinate system
  const handleSvgClick = (e) => {
    const coords = getSVGCoordinates(e);
    console.log(`Clicked at SVG coordinates: x=${coords.x}, y=${coords.y}`);
  };

  // Simplify the getAdjustedRoomCoordinates function
  const getAdjustedRoomCoordinates = () => {
    return roomCoordinates; // Return original coordinates
  };

  // Simplify the getAdjustedWaypoints function
  const getAdjustedWaypoints = () => {
    return waypoints; // Return original coordinates
  };

  // Define room coordinates
  const roomCoordinates = {
    Entrance: { x: 700, y: 850 },
    R1: { x: 1005, y: 770 },
    R2: { x: 1246, y: 770 },
    R3: { x: 958, y: 560 },
    R4: { x: 952, y: 260 },
    R5: { x: 1203, y: 130 },
    R6: { x: 1350, y: 10 },
    R7: { x: 1110, y: 10 },
    R8: { x: 870, y: 10 },
    R9: { x: 612, y: 10 },
    R10: { x: 500, y: 260},
    R11: { x: 500, y: 425 },
    R12: { x: 500, y: 587 },
    R13: { x: 171, y: 770 },
    R14: { x: 451, y: 770 },
    FACULTY_ROOM: { x: 325, y: 10 },
  };

  // Add this mapping object near your roomCoordinates definition (around line 123)
  const roomLabels = {
    Entrance: "Main Entrance",
    R1: "Rizal 1",
    R2: "Rizal 2",
    R3: "Rizal 3",
    R4: "Rizal 4",
    R5: "Rizal 5",
    R6: "Rizal 6",
    R7: "Rizal 7",
    R8: "Rizal 8",
    R9: "Rizal 9",
    R10: "Rizal 10",
    R11: "Rizal 11",
    R12: "Rizal 12",
    R13: "Rizal 13",
    R14: "Rizal 14",
    FACULTY_ROOM: "Faculty Room"
  };

  // Define waypoints for corridors and intersections
  const waypoints = {
    // Central corridor waypoints - Left side
    wpC: { x: 700, y: 720 },
    wpC1: { x: 612, y: 60 },
    wpC10: { x: 560, y: 60 },
    wpC1a: { x: 560, y: 160 },
    wpC1b: { x: 560, y: 260 },
    wpC1c: { x: 560, y: 360 },
    wpC1d: { x: 560, y: 425 },
    wpC1e: { x: 560, y: 587 },
    wpC1f: { x: 560, y: 660 },
    wpC4: { x: 560, y: 720 },

    // Central corridor waypoints - Right side
    wpC2: { x: 870, y: 60 },
    wpC2a: { x: 870, y: 160 },
    wpC2b: { x: 870, y: 260 },
    wpC2c: { x: 870, y: 360 },
    wpC2d: { x: 870, y: 460 },
    wpC2e: { x: 870, y: 560 },
    wpC2f: { x: 870, y: 660 },
    wpC3: { x: 870, y: 720 },
    
    // North corridor waypoints
    wpN1: { x: 325, y: 60 },
    wpN2: { x: 1350, y: 60 },
    wpN3: { x: 1203, y: 60 },
    wpN4: { x: 1110, y: 60 },
    
    // South corridor waypoints
    wpS1: { x: 174, y: 720 },
    wpS2: { x: 455, y: 720 },
    wpS4: { x: 1007, y: 720 },
    wpS5: { x: 1247, y: 720 }
  };

  // Simplify waypoints array using Object.keys
  const allWaypoints = Object.keys(waypoints);

  // Define logical waypoint-to-waypoint connections based on physical proximity
  const waypointPairs = {
    // Left vertical corridor - downward connections only
    wpC: ["wpC4", "wpC3"],
    wpC1: ["wpC2"],
    wpC10: ["wpC1", "wpN1"],
    wpC1a: ["wpC1b", "wpC10"],
    wpC1b: ["wpC1c"],
    wpC1c: ["wpC1d"],
    wpC1d: ["wpC1e"],
    wpC1e: ["wpC1f"],
    wpC1f: ["wpC4"],
    
    // Right vertical corridor - downward connections only
    wpC2: ["wpC2a", "wpN3", "wpN4"],
    wpC2a: ["wpC2"],
    wpC2b: ["wpC2a"],
    wpC2c: ["wpC2d", "wpC2b"],
    wpC2d: ["wpC2e"],
    wpC2e: ["wpC2f"],
    wpC2f: ["wpC3"],
    
    // South corridor connections
    wpS1: ["wpS2"],
    wpS2: ["wpC4"],
    wpC4: ["wpS4"],
    wpS4: ["wpS5"],
    wpC3: ["wpS4"],
    
    // North corridor connections
    wpN1: ["wpC1"],
    wpN3: ["wpN2"],
    wpN4: ["wpC2"]
  };

  // Connect rooms to their closest waypoint only
  const roomToWaypointConnections = {
    // North side rooms
    Entrance: ["wpC"],
    R6: ["wpN2"],
    R7: ["wpN4"],
    R8: ["wpC2"],
    R9: ["wpC1"],
    FACULTY_ROOM: ["wpN1"],
    
    // East side rooms
    R1: ["wpS4"],
    R2: ["wpS5"],
    R3: ["wpC2e"],
    R4: ["wpC2b"],
    R5: ["wpN3"],
    
    // West side rooms
    R10: ["wpC1b"],
    R11: ["wpC1d"],
    R12: ["wpC1e"],
    R13: ["wpS1"],
    R14: ["wpS2"]
  };

  // Function to create bidirectional connections
  const createBidirectionalConnections = () => {
      const connections = {};
      
      // Add room-to-waypoint connections
      Object.entries(roomToWaypointConnections).forEach(([room, waypoints]) => {
          connections[room] = waypoints;
          // Add reverse connections (waypoint to room)
          waypoints.forEach(waypoint => {
              if (!connections[waypoint]) {
                  connections[waypoint] = [];
              }
              if (!connections[waypoint].includes(room)) {
                  connections[waypoint].push(room);
              }
          });
      });
      
      // Add waypoint-to-waypoint connections
      Object.entries(waypointPairs).forEach(([waypoint, connectedPoints]) => {
          if (!connections[waypoint]) {
              connections[waypoint] = [];
          }
          
          // Add connections in both directions
          connectedPoints.forEach(point => {
              if (!connections[waypoint].includes(point)) {
                  connections[waypoint].push(point);
              }
              if (!connections[point]) {
                  connections[point] = [];
              }
              if (!connections[point].includes(waypoint)) {
                  connections[point].push(waypoint);
              }
          });
      });
      
      return connections;
  };

  // Replace the existing roomConnections initialization with this:
  const roomConnections = createBidirectionalConnections();

  // Calculate Manhattan distance (prioritizes horizontal/vertical movements)
  const calculateManhattanDistance = (point1, point2) => {
    const coords1 = waypoints[point1] || roomCoordinates[point1];
    const coords2 = waypoints[point2] || roomCoordinates[point2];
    
    if (!coords1 || !coords2) return Infinity;
    
    // Manhattan distance = |x1 - x2| + |y1 - y2|
    return Math.abs(coords2.x - coords1.x) + Math.abs(coords2.y - coords1.y);
  };

  // Modified Dijkstra's algorithm with improved path cost calculation
  const dijkstra = (start, end) => {
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    
    // Initialize
    Object.keys(roomConnections).forEach(node => {
        distances[node] = Infinity;
        previous[node] = null;
        unvisited.add(node);
    });
    distances[start] = 0;
    
    while (unvisited.size > 0) {
        let current = null;
        let minDistance = Infinity;
        
        unvisited.forEach(node => {
            if (distances[node] < minDistance) {
                minDistance = distances[node];
                current = node;
            }
        });
        
        if (current === null || current === end) break;
        
        unvisited.delete(current);
        
        const neighbors = roomConnections[current] || [];
        neighbors.forEach(neighbor => {
            if (!unvisited.has(neighbor)) return;
            
            const currentCoords = waypoints[current] || roomCoordinates[current];
            const neighborCoords = waypoints[neighbor] || roomCoordinates[neighbor];
            
            if (!currentCoords || !neighborCoords) return;
            
            // Calculate base distance
            let distance = calculateManhattanDistance(current, neighbor);
            
            // Apply penalties for different types of movements
            const isLeftSide = currentCoords.x < 750;
            const neighborIsLeft = neighborCoords.x < 750;
            
            // Penalize corridor switching
            if (isLeftSide !== neighborIsLeft) {
                distance *= 1.5;
            }
            
            // Heavily penalize diagonal movements
            const isDiagonal = 
                Math.abs(currentCoords.x - neighborCoords.x) > 50 && 
                Math.abs(currentCoords.y - neighborCoords.y) > 50;
            
            if (isDiagonal) {
                distance *= 2;
            }
            
            const totalDistance = distances[current] + distance;
            if (totalDistance < distances[neighbor]) {
                distances[neighbor] = totalDistance;
                previous[neighbor] = current;
            }
        });
    }
    
    // Reconstruct path
    const path = [];
    let current = end;
    while (current) {
        path.unshift(current);
        current = previous[current];
    }
    
    return path[0] === start ? path : [];
};

  // Modified findClosestWaypoint to better handle corridor preferences
  const findClosestWaypoint = (point) => {
    const coords = roomCoordinates[point] || waypoints[point];
    if (!coords) return null;
    
    let closestWaypoint = null;
    let shortestDistance = Infinity;
    
    // Determine if point is on left or right side of building
    const isLeftSide = coords.x < 750;
    
    allWaypoints.forEach(waypoint => {
        if (waypoint === point) return;
        
        const waypointCoords = waypoints[waypoint];
        const waypointIsLeft = waypointCoords.x < 750;
        
        // Skip waypoints from opposite corridor unless necessary
        if (isLeftSide !== waypointIsLeft && 
            !waypoint.startsWith('wpN') && 
            !waypoint.startsWith('wpS')) {
            return;
        }
        
        // Calculate vertical and horizontal distances separately
        const verticalDist = Math.abs(coords.y - waypointCoords.y);
        const horizontalDist = Math.abs(coords.x - waypointCoords.x);
        
        // Prioritize vertical alignment for corridor waypoints
        let adjustedDistance = verticalDist + horizontalDist;
        
        // Penalize cross-corridor movements
        if (isLeftSide !== waypointIsLeft) {
            adjustedDistance *= 1.5;
        }
        
        // Extra weight for vertical connections within the same corridor
        if (horizontalDist < 50 && waypoint.startsWith('wpC')) {
            adjustedDistance *= 0.8; // Preference for vertical corridor movement
        }
        
        if (adjustedDistance < shortestDistance) {
            shortestDistance = adjustedDistance;
            closestWaypoint = waypoint;
        }
    });
    
    return closestWaypoint;
};

  // Keep findShortestPath simple
  const findShortestPath = (start, destination) => {
    if (!start || !destination) return [];
    if (start === destination) return [start];
    
    const startWaypoint = findClosestWaypoint(start);
    const endWaypoint = findClosestWaypoint(destination);
    
    if (!startWaypoint || !endWaypoint) return [];
    
    const waypointPath = dijkstra(startWaypoint, endWaypoint);
    if (!waypointPath.length) return [];
    
    return [start, ...waypointPath, destination];
  };

  // Modify drawConnections to return null (hide all waypoint connections)
  const drawConnections = () => {
    return null;
  };

  // Update drawPath to use original coordinates
  const drawPath = () => {
    if (!startRoom || !targetRoom || !showPath) return null;

    const path = findShortestPath(startRoom, targetRoom);
    console.log("Path found:", path);
    
    return (
      <>
        {path.map((node, index) => {
          if (index < path.length - 1) {
            const start = roomCoordinates[node] || waypoints[node];
            const end = roomCoordinates[path[index + 1]] || waypoints[path[index + 1]];
            
            if (!start || !end) return null;

            return (
              <g key={`path-segment-${index}`}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="red"
                  strokeWidth={10}
                />
              </g>
            );
          }
          return null;
        })}

        {targetRoom && roomCoordinates[targetRoom] && (
          <g>
            <circle
              cx={roomCoordinates[targetRoom].x}
              cy={roomCoordinates[targetRoom].y}
              r={8}
              fill="rgba(0, 255, 0, 0.5)"
              stroke="green"
              strokeWidth={2}
            />
            <circle
              cx={roomCoordinates[targetRoom].x}
              cy={roomCoordinates[targetRoom].y}
              r={4}
              fill="green"
            />
          </g>
        )}
      </>
    );
  };

  // Modify drawWaypoints to return null (hide waypoint dots and labels)
  const drawWaypoints = () => {
    return null;
  };

  // Add this function to your component
  const handleSvgLoad = (svg) => {
    // This will log the viewBox and dimensions of your base SVG
    console.log('SVG viewBox:', svg.viewBox);
    console.log('SVG dimensions:', svg.getBoundingClientRect());
  };

  // Update drawRoomLabels to use original coordinates
  const drawRoomLabels = () => {
    return Object.entries(roomCoordinates).map(([room, coords]) => {
      return (
        <g key={`label-${room}`}>
          {/* <text
            x={coords.x}
            y={coords.y - 15}
            textAnchor="middle"
            fill={isDarkMode ? "white" : "black"}
            fontSize="20px"
            fontWeight="bold"
          >
            {room}
          </text>
          <text
            x={coords.x}
            y={coords.y + 15}
            textAnchor="middle"
            fill={isDarkMode ? "#9ca3af" : "gray"}
            fontSize="14px"
          >
            ({coords.x}, {coords.y})
          </text> */}
        </g>
      );
    });
  };

  const handleNavigate = () => {
    if (!startRoom || !targetRoom) {
      console.log('Missing start or target room');
      return;
    }

    try {
      const path = findShortestPath(startRoom, targetRoom);
      
      if (!path || path.length === 0) {
        console.error('No path found between rooms');
        setSaveStatus('Error: No path found');
        return;
      }

      setShowPath(true);
      console.log(`Navigating from ${startRoom} to ${targetRoom}`);
      
      // If this is from saved paths, update UI accordingly
      if (pathData) {
        setIsSaved(true);
        setSaveStatus('Path loaded from saved paths');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setSaveStatus('Error during navigation');
      setShowPath(false);
    }
  };

  // Add function to generate a unique ID for the path
  const generatePathId = () => {
    return `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Update handleSave function to include correct building name
  const handleSave = () => {
    try {
      if (!startRoom || !targetRoom) {
        console.log('Missing start or target room');
        return;
      }

      const pathData = {
        id: `path_${Date.now()}`,
        building: "Rizal Building",
        startRoom,
        targetRoom,
        timestamp: new Date().toISOString(),
        floor: "Ground Floor" // Updated floor name
      };

      // Get existing paths
      let existingPaths = [];
      try {
        const saved = localStorage.getItem('savedPaths');
        existingPaths = saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        existingPaths = [];
      }

      const updatedPaths = [...existingPaths, pathData];
      localStorage.setItem('savedPaths', JSON.stringify(updatedPaths));
      
      setIsSaved(true);
      setSaveStatus('Path saved successfully!');
      
      setTimeout(() => {
        setIsSaved(false);
        setSaveStatus('');
      }, 2000);

    } catch (error) {
      console.error('Error saving path:', error);
      setSaveStatus('Error saving path');
    }
  };

  // Reset showPath when rooms change
  useEffect(() => {
    setShowPath(false);
  }, [startRoom, targetRoom]);

  // Add this at the top of your component
  useEffect(() => {
    // Load model-viewer script dynamically if not already loaded
    if (!customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.1.1/model-viewer.min.js';
      document.head.appendChild(script);

      script.onload = () => {
        console.log('model-viewer script loaded successfully');
      };

      script.onerror = (error) => {
        console.error('Error loading model-viewer script:', error);
      };
    }
  }, []); // Empty dependency array means this runs once on mount

  // Update your render3DView function
  const render3DView = () => {
    if (!customElements.get('model-viewer')) {
      return (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-gray-600">Loading 3D viewer...</div>
        </div>
      );
    }

    return (
      <div className="h-full w-full">
        <model-viewer
          src={rizal3DModel}
          alt="3D model of Rizal Building"
          camera-controls
          rotation-per-second="20deg"
          interaction-prompt="auto"
          ar
          shadow-intensity="1"
          exposure="0.5"
          environment-image="neutral"
          loading="eager"
          camera-orbit="0deg 70deg 105%"
          min-camera-orbit="-Infinity 0deg 0%"
          max-camera-orbit="Infinity 180deg 200%"
          min-field-of-view="10deg"
          max-field-of-view="20deg"
          interpolation-decay="200"
          orbit-sensitivity="1"
          style={{ width: '100%', height: '100%' }}
          onError={(error) => {
            console.error('Error loading 3D model:', error);
            if (error.type === 'loadfailure') {
              console.error('Model failed to load. Path:', main_3DModel);
            }
          }}
          onLoad={() => console.log('3D model loaded successfully')}
        >
          <div className="absolute inset-0 flex items-center justify-center" slot="poster">
            <div className="text-gray-600">Loading 3D Model...</div>
          </div>
        </model-viewer>
      </div>
    );
  };

  useEffect(() => {
    if (is3DView) {
      // Check if model-viewer is defined
      if (customElements.get('model-viewer')) {
        console.log('model-viewer is available');
      } else {
        console.error('model-viewer is not loaded!');
      }

      // Try to fetch the model directly to verify it's accessible
      fetch(rizal3DModel)
        .then(response => {
          if (!response.ok) {
            throw new Error('Model file not found');
          }
          console.log('Model file is accessible');
        })
        .catch(error => {
          console.error('Error accessing model file:', error);
        });
    }
  }, [is3DView]);

  // Add useEffect to trigger navigation when rooms are set from state
  useEffect(() => {
    if (state?.startRoom && state?.targetRoom) {
      const timer = setTimeout(() => {
        handleNavigate();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Add these zoom and pan handler functions after your existing handlers
  const handleWheel = (event) => {
    event.preventDefault();
    const zoomSensitivity = 0.1;
    const delta = event.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
    const newZoom = Math.max(0.5, Math.min(4, zoom + delta));
    setZoom(newZoom);
  };

  const handleMouseDown = (event) => {
    if (event.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: event.clientX - pan.x,
        y: event.clientY - pan.y
      });
    }
  };

  const handleMouseMove = (event) => {
    if (isDragging) {
      setPan({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleHorizontalPan = (direction) => {
    const panAmount = 50;
    setPan(prev => ({
      x: prev.x + (direction === 'left' ? -panAmount : panAmount),
      y: prev.y
    }));
  };

  // Add this useEffect for event listeners (after your existing useEffects)
  useEffect(() => {
    const container = document.querySelector('.floor-plan-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseUp);

      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [zoom, isDragging, dragStart, pan]);

  return (
    <div className={`flex min-h-screen flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-sky-50'
    }`}>
      {/* Header */}
      <header className={`flex items-center justify ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } p-[2%] h-[10vh] shadow-sm`}>
        <button 
          onClick={() => navigate('/rizal-floor-page')} 
          className={`rounded-full p-[1%] ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-100'
          } transition-colors`}
        >
          <ArrowLeft className={`h-[100%] w-[100%] ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`} />
        </button>
        <div className="flex items-center gap-4">
          <img
            src="/assets/logo/lightLogo.png"
            alt="CCC PathFinder Logo"
            className="h-[60%] w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          />
        </div>
        
      </header>

      <main className="flex-1 p-[2%] pb-0 flex flex-col h-[80vh]">
        <h1 className={`text-center mb-[2%] text-[5vmin] font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          RIZAL BUILDING
        </h1>
        
        <div className={`rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } p-[2%] shadow-md w-[95%] max-w-3xl mx-auto`}>
          <div className="flex justify-between items-center mb-[2%]">
            <h2 className={`text-[4vmin] font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {is3DView ? '3D VIEW' : 'FLOOR PLAN'}
            </h2>
            
            <button
              onClick={() => setIs3DView(!is3DView)}
              className={`flex items-center gap-[1%] px-[2%] py-[1%] rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-blue-400'
                  : 'bg-sky-100 hover:bg-sky-200 text-sky-700'
              } transition-colors`}
            >
              {is3DView ? (
                <>
                  <Map className="w-[3vmin] h-[3vmin]" />
                  <span className="text-[2.5vmin] font-medium">2D View</span>
                </>
              ) : (
                <>
                  <span className="text-[2.5vmin] font-medium">3D View</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg bg-gray-200 p-[2%] w-full h-[55vh] relative overflow-hidden floor-plan-container">
            {is3DView ? (
              render3DView()
            ) : (
              <div className="h-full w-full absolute inset-0 flex items-center justify-center">
                {/* Add zoom controls */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button
                    onClick={() => handleHorizontalPan('right')}
                    className={`p-2 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setZoom(prev => Math.min(4, prev + 0.1))}
                    className={`p-2 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                    className={`p-2 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleHorizontalPan('left')}
                    className={`p-2 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={resetZoomAndPan}
                    className={`p-2 rounded-full ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                    </svg>
                  </button>
                </div>

                <div 
                  className="relative h-full w-full flex items-center justify-center"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                >
                  <ReactSVG 
                    src={svgPath} 
                    beforeInjection={handleSvgLoad}
                    wrapper="div"
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `scale(${scale.x * zoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                  />
                  <svg
                    className="absolute inset-0 floor-plan-svg"
                    style={{
                      width: '100%',
                      height: '100%',
                      transformOrigin: 'center center',
                      transform: `scale(${zoom})`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    viewBox="0 0 1440 758"
                    preserveAspectRatio="xMidYMid meet"
                    onClick={handleSvgClick}
                  >
                    {drawConnections()}
                    {drawWaypoints()}
                    {drawPath()}
                    {drawRoomLabels()}
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={`${
        isDarkMode ? 'bg-gray-800' : 'bg-[rgba(147,180,219,1)]'
      } p-3 pt-1`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPin className={`h-5 w-5 ${
              isDarkMode ? 'text-gray-300' : 'text-white'
            }`} />
            <Select
              placeholder="Current Location..."
              options={Object.keys(roomCoordinates).map(key => ({
                value: key,
                label: roomLabels[key]
              }))}
              value={startRoom}
              onChange={(e) => {
                setStartRoom(e.target.value);
                setShowPath(false);
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Navigation className={`h-5 w-5 ${
              isDarkMode ? 'text-gray-300' : 'text-white'
            }`} />
            <Select
              placeholder="Target Location..."
              options={Object.keys(roomCoordinates).map(key => ({
                value: key,
                label: roomLabels[key]
              }))}
              value={targetRoom}
              onChange={(e) => {
                setTargetRoom(e.target.value);
                setShowPath(false);
              }}
            />
          </div>
          <div className="flex space-x-2">
            <button
              className={`flex-1 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800'
                  : 'bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400'
              } py-1.5 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
              disabled={!startRoom || !targetRoom}
              onClick={handleNavigate}
            >
              Navigate Now
            </button>
            <button
              className={`w-24 rounded-md py-1.5 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isSaved 
                  ? isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-800'
                    : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800'
                    : 'bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400'
              }`}
              disabled={!startRoom || !targetRoom}
              onClick={handleSave}
            >
              {isSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          {saveStatus && (
            <p className={`text-sm mt-2 text-center ${
              saveStatus.includes('Error') 
                ? 'text-red-600' 
                : isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {saveStatus}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
