import React, { useState, useEffect } from "react";
import { ReactSVG } from "react-svg";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Map as MapIcon, Box } from 'lucide-react';
import svgPath from "../assets/2JMC.svg";
import jmc1_3DModel from "../assets/3d-models/jmc-2.glb";
import "../App.css";
import { useDarkMode } from '../contexts/DarkModeContext';
import { useBackButton } from '../hooks/useBackButton';

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
  const navigate = useNavigate();
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
  const [showStairButtons, setShowStairButtons] = useState(false);
  const [selectedStairs, setSelectedStairs] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
      newScale = newScale * 1.5;
      
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

    console.log('------------------------');
    console.log('Click Coordinates:');
    console.log(`x: ${clickX}, y: ${clickY}`);
    console.log('------------------------');
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
    OFFICE_OF_THE_CHIEF_LIBRARIAN: { x: 585, y: 200 },
    JMC3: { x: 850, y: 200 },
    JMC4: { x: 1100, y: 200 },
    JMC5: { x: 1100, y: 450 },
    JMC6: { x: 1100, y: 550},
    LIBRARY: { x: 340, y: 200 },
    CR: { x: 725, y: 180 },
    STAIRS1: { x: 940, y: 450 },
    STAIRS2: { x: 425, y: 725},
  };

  // Define waypoints for corridors and intersections
  const waypoints = {
    // Central corridor waypoints - Left side
    wpC: { x: 1025, y: 450 },
    wpC1: { x: 1025, y: 350 },
    wpC2: { x: 1025, y: 500 },
    wpC3: { x: 1025, y: 550 },
    wpC4: { x: 1025, y: 450 },
    wpC5: { x: 1000, y: 450 },
    wpC6: { x: 1025, y: 300 },
    wpC7: { x: 1025, y: 200 },
    wpC8: { x: 850, y: 300 },
    wpC9: { x: 725, y: 300 },
    wpD: { x: 585, y: 300 },
    wpD1: { x: 425, y: 300 },
    wpD2: { x: 425, y: 200 },
    wpD3: { x: 425, y: 600 },

  };
  // Add these after your coordinate definitions
  const waypointPairs = {
    // Central corridor connections
    wpC: ["wpC1", "wpC4"],
    wpC2: ["wpC", "wpC3"],
    wpC4: ["wpC5", "wpC2"],
    wpC6: ["wpC7", "wpC8"],
    wpC8: ["wpC9"],
    wpD: ["wpC9", "wpD1"],
    wpD1: ["wpD2", "wpD3"],
  };

  // Room to waypoint connections
  const roomToWaypointConnections = {
    OFFICE_OF_THE_CHIEF_LIBRARIAN: ["wpD"],
    JMC3: ["wpC8"],
    JMC4: ["wpC7"],
    JMC5: ["wpC4"],
    JMC6: ["wpC3"],
    LIBRARY: ["wpD2"],
    CR: ["wpC9"],
    STAIRS1: ["wpC5"],
    STAIRS2: ["wpD3"]  
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

  // First, define the connections array for visualization
  const connections = [
    // Central corridor connections
    ['wpC', 'wpC1'],
    ['wpC', 'wpC4'],
    ['wpC2', 'wpC3'],
    ['wpC4', 'wpC5'],
    ['wpC4', 'wpC2'],
    ['wpC6', 'wpC7'],
    ['wpC6', 'wpC8'],
    ['wpC8', 'wpC9'],
    ['wpD', 'wpC9'],
    ['wpD', 'wpD1'],
    ['wpD1', 'wpD2'],
    ['wpD1', 'wpD3'],

    // Room connections
    ['_3JMC1', 'wpD2'],
    ['_3JMC2', 'wpD'],
    ['_JMC3', 'wpC8'],
    ['_JMC4', 'wpC7'],
    ['_3JMC5', 'wpC4'],
    ['_3JMC6', 'wpC3'],
    ['AVR', 'wpD1'],
    ['CR', 'wpC9'],
    ['STAIRS', 'wpC5'],
    ['EXIT', 'wpD3']
  ];

  // First, define the waypoint connections more explicitly
  const waypointConnections = {
    // Central corridor connections
    wpC: ["wpC1", "wpC4"],
    wpC1: ["wpC", "wpC6"],
    wpC2: ["wpC4", "wpC3"],
    wpC3: ["wpC2"],
    wpC4: ["wpC", "wpC2", "wpC5"],
    wpC5: ["wpC4"],
    wpC6: ["wpC1", "wpC7", "wpC8"],
    wpC7: ["wpC6"],
    wpC8: ["wpC6", "wpC9"],
    wpC9: ["wpC8", "wpD"],
    wpD: ["wpC9", "wpD1"],
    wpD1: ["wpD", "wpD2", "wpD3"],
    wpD2: ["wpD1"],
    wpD3: ["wpD1"]
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
        id: `path_${Date.now()}`,
        building: "JMC Building",
        startRoom,
        targetRoom,
        timestamp: new Date().toISOString(),
        floor: "2nd Floor"
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
    // Check if stairs are selected
    if (targetRoom === 'STAIRS1' || targetRoom === 'STAIRS2') {
      setShowStairButtons(true);
      setSelectedStairs(targetRoom);
    } else {
      setShowStairButtons(false);
      setSelectedStairs(null);
    }
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
    console.log('Rendering 3D view, model path:', jmc1_3DModel);

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
          src={jmc1_3DModel}
          alt="3D model of 1JMC Building"
          camera-controls
          rotation-per-second="30deg"
          interaction-prompt="auto"
          ar
          shadow-intensity="1"
          exposure=".6"
          environment-image="neutral"
          loading="eager"
          camera-orbit="0deg 75deg 105%"
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
              console.error('Model failed to load. Path:', jmc1_3DModel);
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
      fetch(jmc1_3DModel)
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

  // Add drawWaypoints function
  const drawWaypoints = () => {
    if (!showWaypoints) return null;

    return (
      <>
        {/* Draw waypoint dots */}
        {Object.entries(waypoints).map(([id, coords]) => (
          <g key={`waypoint-${id}`}>
            <circle
              cx={coords.x}
              cy={coords.y}
              r={4}
              fill="blue"
              opacity={0.6}
            />
            <text
              x={coords.x}
              y={coords.y - 10}
              textAnchor="middle"
              fill="blue"
              fontSize="12px"
              opacity={0.8}
            >
              {id}
            </text>
          </g>
        ))}

        {/* Draw connections between waypoints */}
        {Object.entries(waypointPairs).map(([start, ends]) => 
          ends.map((end, index) => (
            <line
              key={`connection-${start}-${end}-${index}`}
              x1={waypoints[start].x}
              y1={waypoints[start].y}
              x2={waypoints[end].x}
              y2={waypoints[end].y}
              stroke="blue"
              strokeWidth={1}
              opacity={0.4}
            />
          ))
        )}
      </>
    );
  };

  // Add this function to handle floor navigation
  const handleFloorNavigation = (direction) => {
    if (direction === 'up') {
      navigate('/jmc-third-floor');
    } else if (direction === 'down') {
      navigate('/jmc-first-floor');
    }
  };

  // Add these zoom and pan handler functions
  const handleWheel = (event) => {
    event.preventDefault();
    const zoomSensitivity = 0.1;
    const delta = event.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
    const newZoom = Math.max(0.5, Math.min(4, zoom + delta)); // Limit zoom between 0.5x and 4x
    setZoom(newZoom);
  };

  const handleMouseDown = (event) => {
    if (event.button === 0) { // Left click only
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

  // Add reset zoom function
  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Add horizontal pan function
  const handleHorizontalPan = (direction) => {
    const panAmount = 50;
    setPan(prev => ({
      x: prev.x + (direction === 'left' ? -panAmount : panAmount),
      y: prev.y
    }));
  };

  // Add this mapping object near your roomCoordinates definition
  const roomLabels = {
    OFFICE_OF_THE_CHIEF_LIBRARIAN: "Office of the Chief Librarian",
    JMC3: "2JMC 3",
    JMC4: "2JMC 4",
    JMC5: "2JMC 5",
    JMC6: "2JMC 6",
    LIBRARY: "Library",
    CR: "Comfort Room",
    STAIRS1: "Main Stairs",
    STAIRS2: "Emergency Stairs"
  };

  return (
    <div className={`flex min-h-screen flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-sky-50'
    }`}>
      {/* Header */}
      <header className={`flex items-center justify- ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } p-[2%] h-[10vh] shadow-sm`}>
        <button 
          onClick={() => navigate('/jmc-floor-page')} 
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

      {/* Main content */}
      <main className="flex-1 p-[2%] pb-0 flex flex-col h-[80vh]">
        <h1 className={`text-center mb-[2%] text-[5vmin] font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          2ND FLOOR JMC BUILDING
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
                  <MapIcon className="w-[3vmin] h-[3vmin]" />
                  <span className="text-[2.5vmin] font-medium">2D View</span>
                </>
              ) : (
                <>
                  <Box className="w-[3vmin] h-[3vmin]" />
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
                  {/* Left Pan Button */}
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

                  {/* Zoom In Button */}
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

                  {/* Zoom Out Button */}
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

                  {/* Right Pan Button */}
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

                  {/* Reset Button */}
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

      {/* Stair Navigation Buttons */}
      {showStairButtons && (
        <div className={`fixed bottom-24 right-4 z-50 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg shadow-lg p-4 space-y-2`}>
          <button
            onClick={() => handleFloorNavigation('up')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md w-full ${
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
            Go to 3rd Floor
          </button>

          <button
            onClick={() => handleFloorNavigation('down')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md w-full ${
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
                d="M19 9l-7 7-7-7" 
              />
            </svg>
            Go to 1st Floor
          </button>

          <p className={`text-sm text-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {selectedStairs === 'STAIRS1' ? 'Using Main Stairs' : 'Using Emergency Stairs'}
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

export default App;
