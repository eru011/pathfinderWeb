import React, { useState, useEffect, Suspense, useRef } from "react";
import { ReactSVG } from "react-svg";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Map } from 'lucide-react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import svgPath from "../assets/AB_base.svg";
import "../App.css";
import { useDarkMode } from '../contexts/DarkModeContext';
import basement_3DModel from "../assets/3d-models/basement.glb";
import { useBackButton } from '../hooks/useBackButton';
import Hammer from "hammerjs";

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

// First, add the Model component
const Model = () => {
  const gltf = useLoader(GLTFLoader, basement3DModel);
  return <primitive object={gltf.scene} />;
};

function BasementFloor() {
  useBackButton();
  const location = useLocation();
  const { state } = location;
  
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
  const [clickedCoords, setClickedCoords] = useState(null);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const navigate = useNavigate();
  const [showStairButtons, setShowStairButtons] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const hammer = new Hammer(container);

    // Enable pinch and pan gestures
    hammer.get('pinch').set({ enable: true });
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    hammer.on('pinch', (event) => {
      const newZoom = Math.max(0.5, Math.min(4, zoom * event.scale));
      setZoom(newZoom);
    });

    hammer.on('pan', (event) => {
      setPan({
        x: pan.x + event.deltaX,
        y: pan.y + event.deltaY
      });
    });

    return () => {
      hammer.destroy();
    };
  }, [zoom, pan]);

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

  // Update the useEffect for scaling
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.querySelector('.floor-plan-container');
      if (!container) return;

      // Get container dimensions (accounting for padding)
      const containerWidth = container.clientWidth * 0.96; // 2% padding on each side
      const containerHeight = container.clientHeight * 0.96;
      
      // Calculate aspect ratios
      const containerAspectRatio = containerWidth / containerHeight;
      const svgAspectRatio = 1440 / 758; // SVG viewBox dimensions
      
      let newScale;
      if (containerAspectRatio > svgAspectRatio) {
        // Container is wider than SVG - fit to height
        newScale = containerHeight / 758;
      } else {
        // Container is taller than SVG - fit to width
        newScale = containerWidth / 1440;
      }

      // Apply a slightly larger scale (e.g., 1.2x larger)
      newScale = newScale * .75;
      
      setScale({ x: newScale, y: newScale });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // SIMPLIFY getSVGCoordinates to just get raw coordinates:
  const getSVGCoordinates = (event) => {
    const svg = document.querySelector('.floor-plan-svg');
    if (!svg) {
      console.log('SVG not found');
      return { x: 0, y: 0 };
    }

    // Get click position relative to SVG element
    const rect = svg.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    console.log(`x: ${clickX}, y: ${clickY}`);
    console.log(`Room_Name: { x: ${clickX}, y: ${clickY} },`);

    return { x: clickX, y: clickY };
  };

  // SIMPLIFY drawPath to use raw coordinates:
  const drawPath = () => {
    if (!startRoom || !targetRoom || !showPath) return null;

    const path = findShortestPath(startRoom, targetRoom);
    console.log("Path found:", path);

    return (
      <>
        {/* Draw path segments */}
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
                  strokeWidth={8}
                />
              </g>
            );
          }
          return null;
        })}

        {/* Draw target marker */}
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

  // SIMPLIFY drawRoomLabels to use raw coordinates:
  const drawRoomLabels = () => {
    return Object.entries(roomCoordinates).map(([room, coords]) => {
      return (
        <g key={`label-${room}`}>
          {/* <text
            x={coords.x}
            y={coords.y - 15}
            textAnchor="middle"
            fill="black"
            fontSize="20px"
            fontWeight="bold"
          >
            {room}
          </text>
          <text
            x={coords.x}
            y={coords.y + 15}
            textAnchor="middle"
            fill="gray"
            fontSize="14px"
          >
            ({coords.x}, {coords.y})
          </text> */}
        </g>
      );
    });
  };

  // Define room coordinates
  const roomCoordinates = {
    Entrance: { x: 725, y: 650},
    AB2: { x: 900, y: 500},
    AB3 : { x: 910, y: 130},
    AB4 : { x: 750, y: 130},
    AB5 : { x: 520, y: 130},
    AB6 : { x: 350, y: 130},
    AB7 : { x: 350, y: 280},
    AB8 : { x: 350, y: 350},
    AB9 : { x: 500, y: 625 },
    alumni : { x: 500, y: 550},
    socios : { x: 350, y: 600},
    storage : { x: 350, y: 670},
    sports : { x: 800, y: 290},
    canteen : { x:100, y: 130},
    
  };

  // Define waypoints for corridors and intersections
  const waypoints = {
    // Central corridor waypoints - Left side
    wpC: {  x: 725, y: 575 },
    wpC1: {  x: 725, y: 475 },
    wpC2: {  x: 725, y: 290},
    wpC3: {  x: 670, y: 475 },
    wpC4: {  x: 670, y: 175},
    wpC5: {  x: 910, y: 175},
    wpC6: {  x: 670, y: 130},
  
    wpD: {  x: 450, y: 475 },
    wpD1: {  x: 450, y: 550},
    wpD2: {  x: 425, y: 475 },
    wpD3: {  x: 425, y: 350},
    wpD4: {  x: 425, y: 280},
    wpD5: {  x: 425, y: 130},
    wpD6: {  x: 425, y: 600 },
    wpD7: {  x: 425, y: 625 },
    wpD8: {  x: 425, y: 670 },

    wpE: {  x: 100, y: 475 },
    wpE1: {  x: 100, y: 200 },
    wpE2: {  x: 900, y: 575 },
    
  };
  // Update waypointPairs for basement floor layout
  const waypointPairs = {
    // Main corridor connections
    wpC: ['wpC1', 'wpE2'],
    wpC1: ['wpC', 'wpC2', 'wpC3'],
    wpC2: ['wpC1'],
    wpC3: ['wpC1', 'wpC4', 'wpD'],
    wpC4: ['wpC3', 'wpC5', 'wpC6'],
    wpC5: ['wpC4'],
    wpC6: ['wpC4'],

    // Left wing connections
    wpD: ['wpC3', 'wpD1', 'wpD2'],
    wpD1: ['wpD'],
    wpD2: ['wpD', 'wpD3', 'wpE'],
    wpD3: ['wpD2', 'wpD4'],
    wpD4: ['wpD3', 'wpD5'],
    wpD5: ['wpD4'],
    wpD6: ['wpD2'],
    wpD7: ['wpD2'],
    wpD8: ['wpD2'],

    // Additional connections
    wpE: ['wpE1'],
    wpE1: ['wpE'],
    wpE2: ['wpC']
  };

  // Update roomToWaypointConnections for basement rooms
  const roomToWaypointConnections = {
    Entrance: ['wpC'],
    AB2: ['wpE2'],
    AB3: ['wpC5'],
    AB4: ['wpC6'],
    AB5: ['wpD5'],
    AB6: ['wpD5'],
    AB7: ['wpD4'],
    AB8: ['wpD3'],
    AB9: ['wpD7'],
    alumni: ['wpD1'],
    socios: ['wpD6'],
    storage: ['wpD8'],
    sports: ['wpC2'],
    canteen: ['wpE1']
  };

  // Create bidirectional connections
  const createBidirectionalConnections = () => {
    const connections = {};
    
    // Add room-to-waypoint connections
    Object.entries(roomToWaypointConnections).forEach(([room, waypoints]) => {
      connections[room] = waypoints;
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

  // Initialize room connections
  const roomConnections = createBidirectionalConnections();

  // Array format for drawing lines
  const connections = [
    // Main corridor
    ['wpC', 'wpC1'],
    ['wpC1', 'wpC2'],
    ['wpC3', 'wpC4'],
    ['wpC4', 'wpC5'],
    ['wpC4', 'wpC6'],
    
    // Left wing
    ['wpC3', 'wpD'],
    ['wpD', 'wpD1'],
    ['wpD', 'wpD2'],
    ['wpD2', 'wpD3'],
    ['wpD2', 'wpD6'],
    ['wpD2', 'wpD7'],
    ['wpD2', 'wpD8'],
    ['wpD3', 'wpD4'],
    ['wpD4', 'wpD5'],
    
    // Additional connections
    ['wpC', 'wpE2'],
    ['wpE', 'wpD2'],
    ['wpE', 'wpE1']
  ];

  // Object format for pathfinding
  const waypointConnections = {
    // Main corridor
    wpC: ['wpC1', 'wpE2'],
    wpC1: ['wpC', 'wpC3', 'wpC2'],
    wpC2: ['wpC1'],
    wpC3: [ 'wpC4', 'wpD', 'wpC1'],
    wpC4: ['wpC3', 'wpC5', 'wpC6'],
    wpC5: ['wpC4'],
    wpC6: ['wpC4'],

    // Left wing
    wpD: ['wpC3', 'wpD1', 'wpD2'],
    wpD1: ['wpD'],
    wpD2: ['wpD', 'wpD3', 'wpD6', 'wpD7', 'wpD8', 'wpE'],
    wpD3: ['wpD2', 'wpD4'],
    wpD4: ['wpD3', 'wpD5'],
    wpD5: ['wpD4'],
    wpD6: ['wpD2'],
    wpD7: ['wpD2'],
    wpD8: ['wpD2'],

    // Additional connections
    wpE: ['wpE1'],
    wpE1: ['wpE'],
    wpE2: ['wpC']
  };

  // Modified findClosestWaypoint to use direct room-to-waypoint connections
  const findClosestWaypoint = (point) => {
    // If point is a waypoint, return it
    if (waypoints[point]) return point;
    
    // Check room-to-waypoint connections
    if (roomToWaypointConnections[point]) {
      return roomToWaypointConnections[point][0];
    }
    
    return null;
  };

  // Modified dijkstra to use waypoint connections
  const dijkstra = (start, end) => {
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    
    // Initialize distances for waypoints only
    Object.keys(waypoints).forEach(point => {
      distances[point] = Infinity;
      previous[point] = null;
      unvisited.add(point);
    });
    
    distances[start] = 0;
    
    while (unvisited.size > 0) {
      // Find closest unvisited node
      const current = Array.from(unvisited)
        .reduce((min, point) => 
          distances[point] < distances[min] ? point : min
        );
      
      if (current === end) break;
      
      unvisited.delete(current);
      
      // Get neighbors from waypointConnections
      const neighbors = waypointConnections[current] || [];
      neighbors
        .filter(neighbor => unvisited.has(neighbor))
        .forEach(neighbor => {
          const distance = calculateManhattanDistance(current, neighbor);
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

  // Modified findShortestPath to handle room-to-waypoint-to-room paths
  const findShortestPath = (start, destination) => {
    if (!start || !destination) return [];
    if (start === destination) return [start];
    
    // Get waypoints for start and end rooms
    const startWaypoint = findClosestWaypoint(start);
    const endWaypoint = findClosestWaypoint(destination);
    
    if (!startWaypoint || !endWaypoint) {
      console.log("Could not find connecting waypoints");
      return [];
    }
    
    // Find path between waypoints
    const waypointPath = dijkstra(startWaypoint, endWaypoint);
    
    if (!waypointPath.length) {
      console.log("No path found between waypoints");
      return [];
    }
    
    // Construct complete path
    const fullPath = [start];
    if (startWaypoint !== start) fullPath.push(startWaypoint);
    fullPath.push(...waypointPath.slice(1, -1));
    if (endWaypoint !== destination) fullPath.push(endWaypoint);
    fullPath.push(destination);
    
    return fullPath;
  };

  // KEEP but SIMPLIFY calculateManhattanDistance:
  const calculateManhattanDistance = (point1, point2) => {
    const coords1 = waypoints[point1] || roomCoordinates[point1];
    const coords2 = waypoints[point2] || roomCoordinates[point2];
    
    if (!coords1 || !coords2) return Infinity;
    
    return Math.abs(coords2.x - coords1.x) + Math.abs(coords2.y - coords1.y);
  };

  // Add this function to your component
  const handleSvgLoad = (svg) => {
    // This will log the viewBox and dimensions of your base SVG
    console.log('SVG viewBox:', svg.viewBox);
    console.log('SVG dimensions:', svg.getBoundingClientRect());
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

  // Modified handleSave function with better error handling and feedback
  const handleSave = () => {
    try {
      if (!startRoom || !targetRoom) {
        console.log('Missing start or target room');
        return;
      }

      const pathData = {
        id: generatePathId(),
        building: "Admin Main Building",
        startRoom,
        targetRoom,
        timestamp: new Date().toISOString(),
        floor: "Basement Floor"
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

      // Add new path
      const updatedPaths = [...existingPaths, pathData];
      
      // Save updated paths
      localStorage.setItem('savedPaths', JSON.stringify(updatedPaths));
      
      // Update UI
      setIsSaved(true);
      setSaveStatus('Path saved successfully!');
      console.log('Saved paths:', updatedPaths); // Debug log

      // Reset status after 2 seconds
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

 // Update render3DView function
 const render3DView = () => {
  console.log('Rendering 3D view, model path:', basement_3DModel);

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
        src={basement_3DModel}
        alt="3D model of Main Building"
        camera-controls
        rotation-per-second="30deg"
        interaction-prompt="auto"
        ar
        shadow-intensity="1.5"
        exposure=".7"
        environment-image="neutral"
        loading="eager"
        camera-orbit="0deg 75deg 100%"
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
            console.error('Model failed to load. Path:', basement_3DModel);
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
    fetch(basement_3DModel)
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

  // Add this function to your component
  const handleSvgClick = (event) => {
    const svg = document.querySelector('.floor-plan-svg');
    if (!svg) {
      console.log('SVG not found');
      return;
    }

    // Get click position relative to SVG element
    const rect = svg.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    console.log('------------------------');
    console.log('Click Coordinates:');
    console.log(`x: ${clickX}, y: ${clickY}`);
    console.log('------------------------');
    console.log(`Room_Name: { x: ${clickX}, y: ${clickY} },`);
  };

  // Update the drawWaypoints function
  const drawWaypoints = () => {
    if (!showWaypoints) return null;

    return (
      <>
        {/* Draw waypoint connections first (so they appear behind points) */}
        {Object.entries(waypointPairs).map(([start, ends]) => 
          ends.map((end, index) => {
            const startPoint = waypoints[start];
            const endPoint = waypoints[end];
            if (!startPoint || !endPoint) return null;
            
            return (
              <line
                key={`connection-${start}-${end}-${index}`}
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#00ff00"
                strokeWidth={2}
                strokeDasharray="5,5"
                opacity={0.5}
              />
            );
          })
        )}

        {/* Draw room connections */}
        {Object.entries(roomToWaypointConnections).map(([room, waypointIds]) =>
          waypointIds.map((waypointId, index) => {
            const roomPoint = roomCoordinates[room];
            const waypointPoint = waypoints[waypointId];
            if (!roomPoint || !waypointPoint) return null;

            return (
              <line
                key={`room-connection-${room}-${waypointId}-${index}`}
                x1={roomPoint.x}
                y1={roomPoint.y}
                x2={waypointPoint.x}
                y2={waypointPoint.y}
                stroke="#ff00ff"
                strokeWidth={2}
                strokeDasharray="3,3"
                opacity={0.5}
              />
            );
          })
        )}

        {/* Draw waypoint points last (so they appear on top) */}
        {Object.entries(waypoints).map(([id, point]) => (
          <g key={`waypoint-${id}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={6}
              fill="#00ff00"
              stroke="#008000"
              strokeWidth={2}
              opacity={0.7}
            />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fill="#00ff00"
              fontSize="14px"
              fontWeight="bold"
            >
              {id}
            </text>
          </g>
        ))}
      </>
    );
  };

  // Add useEffect to trigger navigation when rooms are set from state
  useEffect(() => {
    if (state?.startRoom && state?.targetRoom) {
      const timer = setTimeout(() => {
        handleNavigate();
        setShowPath(true);  // Make sure the path is visible
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Handle navigation from main dashboard
  useEffect(() => {
    if (state?.fromMainDashboard) {
      setStartRoom(state.startRoom);
      setTargetRoom(state.targetRoom);
      handleNavigate();
    }
  }, [state]);

  // Add this function to handle floor navigation
  const handleFloorNavigation = () => {
    navigate('/main-floor');
  };

  // Add this useEffect to watch for entrance selection
  useEffect(() => {
    setShowPath(false);
    // Check if entrance is selected as destination
    if (targetRoom === 'Entrance') {
      setShowStairButtons(true);
    } else {
      setShowStairButtons(false);
    }
  }, [startRoom, targetRoom]);

  // Add these zoom and pan handler functions
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

  // Add this useEffect for event listeners
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

  // Add this mapping object near your roomCoordinates definition (around line 265)
  const roomLabels = {
    Entrance: "Main Entrance",
    AB2: "AB Room 2",
    AB3: "AB Room 3",
    AB4: "AB Room 4",
    AB5: "AB Room 5",
    AB6: "AB Room 6",
    AB7: "AB Room 7",
    AB8: "AB Room 8",
    AB9: "AB Room 9",
    alumni: "Alumni Office",
    socios: "Socios Room",
    storage: "Storage Room",
    sports: "Sports Room",
    canteen: "Canteen"
  };

  return (
    <div
      ref={containerRef}
      className={`flex min-h-screen flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sky-50'}`}
    >
      {/* Header */}
      <header className={`flex items-center justify ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } p-[2%] h-[10vh] shadow-sm`}>
        <button 
          onClick={() => navigate('/admin-floor-page')} 
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
          {/* Add waypoint toggle button */}
          {!is3DView && (
            <button
              onClick={() => setShowWaypoints(!showWaypoints)}
              className={`px-3 py-1 rounded-md text-sm ${
                showWaypoints
                  ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                  : (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')
              } ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              } transition-colors`}
            >
            </button>
          )}
        </div>
        
      </header>

      {/* Main content */}
      <main className="flex-1 p-[2%] pb-0 flex flex-col h-[80vh]">
        <h1 className={`text-center mb-[2%] text-[5vmin] font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          BASEMENT FLOOR ADMIN MAIN BUILDING
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
                  <Navigation className="w-[3vmin] h-[3vmin]" />
                  <span className="text-[2.5vmin] font-medium">2D View</span>
                </>
              ) : (
                <>
                  <Navigation className="w-[3vmin] h-[3vmin]" rotate={45} />
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
                    {drawPath()}
                    {drawRoomLabels()}
                    {drawWaypoints()}
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Stair Navigation Button */}
      {showStairButtons && (
        <div className={`fixed bottom-24 right-4 z-50 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg shadow-lg p-4`}>
          <button
            onClick={handleFloorNavigation}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              isDarkMode 
                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                : 'bg-sky-500 hover:bg-sky-600 text-white'
            } transition-colors`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 15l7-7 7 7" 
              />
            </svg>
            Go to Main Floor
          </button>

          <p className={`text-sm text-center mt-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Using Main Entrance
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className={`${
        isDarkMode ? 'bg-gray-800' : 'bg-[rgba(147,180,219,1)]'
      } p-3 pt-1`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPin className={`h-5 w-5 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
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
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
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
              className="flex-1 rounded-md bg-sky-600 py-1.5 text-white transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:bg-sky-400"
              disabled={!startRoom || !targetRoom}
              onClick={handleNavigate}
            >
              Navigate Now
            </button>
            <button
              className={`w-24 rounded-md py-1.5 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isSaved 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
              } disabled:opacity-50`}
              disabled={!startRoom || !targetRoom}
              onClick={handleSave}
            >
              {isSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          {saveStatus && (
            <p className={`text-sm mt-2 text-center ${
              saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {saveStatus}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default BasementFloor;
