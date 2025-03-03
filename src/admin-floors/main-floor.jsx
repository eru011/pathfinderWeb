import React, { useState, useEffect, Suspense } from "react";
import { ReactSVG } from "react-svg";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Map } from 'lucide-react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import svgPath from "../assets/AB_up.svg";
import "../App.css";
import { useDarkMode } from '../contexts/DarkModeContext';
import main_3DModel from "../assets/3d-models/AB_up.glb";
import { useBackButton } from '../hooks/useBackButton';


// Create a separate Model component for the 3D model
function Model() {
  const gltf = useLoader(GLTFLoader, main_3DModel);
  return <primitive object={gltf.scene} />;
}

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
  const [showPath, setShowPath] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [is3DView, setIs3DView] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const { isDarkMode } = useDarkMode();
  const [clickedCoords, setClickedCoords] = useState(null);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [pathData, setPathData] = useState(state?.pathData || null);
  const [showStairButtons, setShowStairButtons] = useState(false);
  const [selectedStairs, setSelectedStairs] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Use effect to handle navigation when coming from saved paths
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
      newScale = newScale * .62;
      
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
    Entrance: { x: 680, y: 750},
    LAZARO_HALL: { x: 680, y: 500 },
    NURSE_OFFICE: { x: 460, y: 700 },
    DEANS_OFFICE: { x: 910, y: 700 },
    SPEECH_ROOM: { x: 1270, y: 700},
    TESTING1: { x: 910, y: 550 },
    GUIDANCE_OFFICE: { x: 1100, y: 550 },
    CASHIER: { x: 330, y: 550 },
    REGISTRAR: { x: 160, y: 625 },
    SUPREME_STUDENT_COUNCIL: { x: 365, y: 375 },
    PRESIDENTS_OFFICE: { x: 650, y: 90 },
    HR_OFFICE: { x: 600, y: 140 },
    CONFERENCE_ROOM: { x: 800, y:140 },
    FACULTY_ROOM: { x: 970, y: 300 },
    TESTING2: { x: 1250, y: 400},
    VICE_PRESIDENT_OFFICE: { x: 1250, y: 250},
    OFFICE_OF_STUDENT_AFFAIRS: { x: 1250, y: 120},
    BIOLOGY_LAB: { x: 225, y: 350 },
    MISD: { x: 160, y: 140 },
    PHYSICS_LAB: { x: 430, y: 140 },
    CR: { x: 1270, y: 600 },
    BASEMENT1: { x: 525, y: 550 },
    BASEMENT2: { x: 850, y:550 },
    EXIT: { x: 225, y: 750},
  };

  // Define waypoints for corridors and intersections
  const waypoints = {
    // Central corridor waypoints - Left side
    wpC: { x: 680, y: 625 },
    wpC1: { x: 460, y: 625 },
    wpC2: { x: 405, y: 625 },
    wpC3: { x: 405, y: 550 },
    wpC4: { x: 405, y: 400 },
    wpC5: { x: 365, y: 400 },
    wpC6: { x: 225, y: 625 },
    wpC7: { x: 225, y: 550 },
    wpC8: { x: 225, y: 450 },
    wpC9: { x: 300, y: 450 },
    wpD: { x: 300, y: 350 },
    wpD1: { x: 300, y: 140 },
    wpD2: { x: 910, y: 625 },
    wpD3: { x: 1100, y: 625 },
    wpD4: { x: 1200, y: 625 },
    wpD5: { x: 1200, y: 645 },
    wpD6: { x: 1270, y: 645 },
    wpD7: { x: 1200, y: 600 },
    wpD8: { x: 1200, y: 450 },
    wpD9: { x: 1120, y: 450 },
    wpE: { x: 1120, y: 400 },
    wpE1: { x: 1120, y: 300 },
    wpE2: { x: 1120, y:250 },
    wpE3  : { x: 1120, y:120 },
    wpE4  : { x: 970, y:120 },

    wpA: { x: 525, y: 625 },
    wpA1: { x: 525, y: 140 },
    wpA2: { x: 650, y: 140 },
    wpA3: { x: 850, y: 625 },
    wpA5: { x: 970, y: 200 },

    wpB: { x: 525, y: 425 },
    wpB1: { x: 680, y: 425 },

  };
  // Update waypointPairs to ensure bidirectional connections
  const waypointPairs = {
    // Central corridor connections
    wpC: ['wpC1', 'wpA', 'wpA3', 'wpB1', 'wpD2'],
    wpC1: ['wpC', 'wpC2'],
    wpC2: ['wpC1', 'wpC3', 'wpC6'],
    wpC3: ['wpC2', 'wpC4'],
    wpC4: ['wpC3', 'wpC5'],
    wpC5: ['wpC4'],
    wpC6: ['wpC2', 'wpC7', 'wpC8'],
    wpC7: ['wpC6'],
    wpC8: ['wpC6', 'wpC9'],
    wpC9: ['wpC8', 'wpD'],
    wpD: ['wpC9', 'wpD1'],
    wpD1: ['wpD'],

    // Right side connections
    wpD2: ['wpC', 'wpD3', 'wpD4', 'wpA3'],
    wpD3: ['wpD2', 'wpD4'],
    wpD4: ['wpD2', 'wpD3', 'wpD5', 'wpD7', 'wpD8'],
    wpD5: ['wpD4', 'wpD6'],
    wpD6: ['wpD5'],
    wpD7: ['wpD4'],
    wpD8: ['wpD4', 'wpD9'],
    wpD9: ['wpD8', 'wpE'],
    wpE: ['wpD9', 'wpE1'],
    wpE1: ['wpE', 'wpE2'],
    wpE2: ['wpE1', 'wpE3'],
    wpE3: ['wpE2', 'wpE4'],
    wpE4: ['wpE3', 'wpA5'],

    // A and B connections
    wpA: ['wpC'],
    wpA1: [ 'wpA2', 'wpB'],
    wpA2: ['wpA1'],
    wpA3: ['wpC', 'wpD2'],
    wpA5: ['wpE4'],
    wpB: ['wpB1', 'wpA1'],
    wpB1: ['wpB', 'wpC']
  };

  // Update roomToWaypointConnections for the Entrance
  const roomToWaypointConnections = {
    Entrance: ['wpC'],
    LAZARO_HALL: ['wpC'],
    NURSE_OFFICE: ['wpC1'],
    DEANS_OFFICE: ['wpD2'],
    SPEECH_ROOM: ['wpD6'],
    TESTING1: ['wpD2'],
    GUIDANCE_OFFICE: ['wpD3'],
    CASHIER: ['wpC3'],
    REGISTRAR: ['wpC6'],
    SUPREME_STUDENT_COUNCIL: ['wpC5'],
    PRESIDENTS_OFFICE: ['wpA2'],
    HR_OFFICE: ['wpA1'],
    CONFERENCE_ROOM: ['wpA2'],
    FACULTY_ROOM: ['wpA5', 'wpE1'],
    TESTING2: ['wpE'],
    VICE_PRESIDENT_OFFICE: ['wpE2'],
    OFFICE_OF_STUDENT_AFFAIRS: ['wpE3'],
    BIOLOGY_LAB: ['wpD'],
    MISD: ['wpD1'],
    PHYSICS_LAB: ['wpD1'],
    CR: ['wpD7'],
    BASEMENT1: ['wpA'],
    BASEMENT2: ['wpA3'],
    EXIT: ['wpC6']
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
    ['wpC', 'wpA'],
    ['wpC', 'wpA3'],
    ['wpC', 'wpB1'],
    ['wpA1', 'wpA2'],
    ['wpA2', 'wpA1'],
    ['wpA3', 'wpA4'],
    ['wpA3', 'wpC'],
    ['wpA3', 'wpD2'],
    ['wpA4', 'wpA5'],
    ['wpA4', 'wpA3'],
    ['wpA5', 'wpA4'],

    // B connections (added)
    ['wpB', 'wpB1'],
    ['wpB1', 'wpB'],
    ['wpB1', 'wpC'],
    ['wpB', 'wpA1'],
    ['wpA1', 'wpB'],

    // Left side connections
    ['wpC1', 'wpC'],
    ['wpC1', 'wpC2'],
    ['wpC2', 'wpC1'],
    ['wpC2', 'wpC3'],
    ['wpC3', 'wpC2'],
    ['wpC3', 'wpC4'],
    ['wpC4', 'wpC3'],
    ['wpC4', 'wpC5'],
    ['wpC5', 'wpC4'],
    ['wpC6', 'wpC7'],
    ['wpC6', 'wpC8'],
    ['wpC6', 'wpC2'],
    ['wpC7', 'wpC6'],
    ['wpC8', 'wpC9'],
    ['wpC8', 'wpC6'],
    ['wpC9', 'wpC8'],
    ['wpC9', 'wpD'],
    ['wpD', 'wpC9'],
    ['wpD', 'wpD1'],
    ['wpD1', 'wpD'],

    // Right side connections
    ['wpD2', 'wpA3'],
    ['wpD2', 'wpD3'],
    ['wpD3', 'wpD2'],
    ['wpD3', 'wpD4'],
    ['wpD4', 'wpD3'],
    ['wpD4', 'wpD5'],
    ['wpD4', 'wpD7'],
    ['wpD4', 'wpD8'],
    ['wpD5', 'wpD4'],
    ['wpD5', 'wpD6'],
    ['wpD6', 'wpD5'],
    ['wpD7', 'wpD4'],
    ['wpD8', 'wpD4'],
    ['wpD8', 'wpD9'],
    ['wpD9', 'wpD8'],
    ['wpD9', 'wpE'],
    ['wpE', 'wpD9'],
    ['wpE', 'wpE1'],
    ['wpE1', 'wpE'],
    ['wpE1', 'wpE2'],
    ['wpE2', 'wpE1'],
    ['wpE2', 'wpE3'],
    ['wpE3', 'wpE2'],
    ['wpE3', 'wpE4'],
    ['wpE4', 'wpE3'],
    ['wpE4', 'wpA5'],
    ['wpB', 'wpA1']
  ];

  // Modify the waypointConnections to be a function that checks start and end points
  const getWaypointConnections = (start, destination) => {
    return {
      // Central corridor connections
      wpC: ['wpC1', 'wpA', 'wpA3', 'wpB1', 'wpD2'],
      wpC1: ['wpC', 'wpC2'],
      wpC2: ['wpC1', 'wpC3', 'wpC6'],
      wpC3: ['wpC2', 'wpC4'],
      wpC4: ['wpC3', 'wpC5'],
      wpC5: ['wpC4'],
      wpC6: ['wpC2', 'wpC7', 'wpC8'],
      wpC7: ['wpC6'],
      wpC8: ['wpC6', 'wpC9'],
      wpC9: ['wpC8', 'wpD'],
      wpD: ['wpC9', 'wpD1'],
      wpD1: ['wpD'],

      // Right side connections
      wpD2: ['wpC', 'wpD3', 'wpD4', 'wpA3'],
      wpD3: ['wpD2', 'wpD4'],
      wpD4: ['wpD2', 'wpD3', 'wpD5', 'wpD7', 'wpD8'],
      wpD5: ['wpD4', 'wpD6'],
      wpD6: ['wpD5'],
      wpD7: ['wpD4'],
      wpD8: ['wpD4', 'wpD9'],
      wpD9: ['wpD8', 'wpE'],
      wpE: ['wpD9', 'wpE1'],
      wpE1: ['wpE', 'wpE2'],
      wpE2: ['wpE1', 'wpE3'],
      wpE3: ['wpE2', 'wpE4'],
      wpE4: ['wpE3', 'wpA5'],

      // A and B connections
      wpA: ['wpC'],
      wpA1: ['wpA2', 'wpB'],
      wpA2: ['wpA1'],
      wpA3: ['wpC', 'wpD2'],
      wpA5: ['wpE4'],
      wpB: ['wpB1', 'wpA1'],
      wpB1: ['wpB', 'wpC']
    };
  };

  // Update the dijkstra function to use the dynamic connections
  const dijkstra = (start, end) => {
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    const connections = getWaypointConnections(startRoom, targetRoom); // Pass both start and target rooms
    
    // Initialize distances for waypoints only
    Object.keys(waypoints).forEach(point => {
      distances[point] = Infinity;
      previous[point] = null;
      unvisited.add(point);
    });
    
    distances[start] = 0;
    
    while (unvisited.size > 0) {
      const current = Array.from(unvisited)
        .reduce((min, point) => 
          distances[point] < distances[min] ? point : min
        );
      
      if (current === end) break;
      
      unvisited.delete(current);
      
      // Get neighbors from dynamic connections
      const neighbors = connections[current] || [];
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

  // Add findClosestWaypoint function
  const findClosestWaypoint = (room) => {
    // If the room is actually a waypoint, return it
    if (waypoints[room]) return room;
    
    // Get the connected waypoints for the room from roomToWaypointConnections
    const connectedWaypoints = roomToWaypointConnections[room];
    if (!connectedWaypoints || connectedWaypoints.length === 0) {
      console.log(`No waypoints found for room: ${room}`);
      return null;
    }

    // If there's only one waypoint, return it
    if (connectedWaypoints.length === 1) {
      return connectedWaypoints[0];
    }

    // If there are multiple waypoints, find the closest one
    const roomCoord = roomCoordinates[room];
    let closestWaypoint = connectedWaypoints[0];
    let shortestDistance = calculateManhattanDistance(room, closestWaypoint);

    connectedWaypoints.slice(1).forEach(waypoint => {
      const distance = calculateManhattanDistance(room, waypoint);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestWaypoint = waypoint;
      }
    });

    return closestWaypoint;
  };

  // Update findShortestPath to use the new function
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
      // Find the path between rooms
      const path = findShortestPath(startRoom, targetRoom);
      
      if (!path || path.length === 0) {
        console.error('No path found between rooms');
        setSaveStatus('Error: No path found');
        return;
      }

      // Show the path
      setShowPath(true);

      // If this is from saved paths, restore any saved metadata
      if (pathData) {
        setIsSaved(true);
        setSaveStatus('Path loaded from saved paths');
        
        // Clear the status after 2 seconds
        setTimeout(() => {
          setSaveStatus('');
        }, 2000);
      }

      console.log(`Navigating from ${startRoom} to ${targetRoom}`);
      console.log('Path:', path);
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
        building: "Admin Main Building",
        startRoom,
        targetRoom,
        timestamp: new Date().toISOString(),
        floor: "Ground Floor"
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
    console.log('Rendering 3D view, model path:', main_3DModel);

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
          src={main_3DModel}
          alt="3D model of Main Building"
          camera-controls
          rotation-per-second="30deg"
          interaction-prompt="auto"
          ar
          shadow-intensity="1.5"
          exposure=".45"
          environment-image="neutral"
          loading="eager"
          camera-orbit="0deg 75deg 80%"
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
      fetch(main_3DModel)
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

  // Add this function to handle floor navigation
  const handleFloorNavigation = () => {
    navigate('/basement-floor');
  };

  // Add this useEffect to watch for basement selection
  useEffect(() => {
    setShowPath(false);
    // Check if either basement is selected as destination
    if (targetRoom === 'BASEMENT1' || targetRoom === 'BASEMENT2') {
      setShowStairButtons(true);
      setSelectedStairs(targetRoom);
    } else {
      setShowStairButtons(false);
      setSelectedStairs(null);
    }
  }, [startRoom, targetRoom]);

  // Add these zoom handler functions before your existing handlers
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

  // Add this useEffect for zoom event listeners
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

  // Add this handler function near your other zoom handlers
  const handleHorizontalPan = (direction) => {
    const panAmount = 50;
    setPan(prev => ({
      x: prev.x + (direction === 'left' ? -panAmount : panAmount),
      y: prev.y
    }));
  };

  // Add this mapping object near your roomCoordinates definition
  const roomLabels = {
    Entrance: "Main Entrance",
    LAZARO_HALL: "Lazaro Hall",
    NURSE_OFFICE: "Nurse Office",
    DEANS_OFFICE: "Deans Office",
    SPEECH_ROOM: "Speech Room",
    GUIDANCE_OFFICE: "Guidance Office",
    CASHIER: "Cashier Office",
    REGISTRAR: "Registrar Office",
    SUPREME_STUDENT_COUNCIL: "Supreme Student Council",
    PRESIDENTS_OFFICE: "Presidents Office",
    HR_OFFICE: "HR Office",
    CONFERENCE_ROOM: "Conference Room",
    FACULTY_ROOM: "Faculty Room",
    TESTING1: "Testing 1",
    TESTING2: "Testing 2",
    VICE_PRESIDENT_OFFICE: "Vice Presidents Office",
    OFFICE_OF_STUDENT_AFFAIRS: "Office of Student Affairs",
    BIOLOGY_LAB: "Biology Lab",
    MISD: "MISD Office",
    PHYSICS_LAB: "Physics Lab",
    CR: "Comfort Room",
    BASEMENT1: "Basement Left Stairs",
    BASEMENT2: "Basement Right Stairs",
    EXIT: "Emergency Exit"
  };

  return (
    <div className={`flex min-h-screen flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-sky-50'
    }`}>
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
          GROUND FLOOR ADMIN BUILDING
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
                d="M19 9l-7 7-7-7" 
              />
            </svg>
            Go to Basement
          </button>

          <p className={`text-sm text-center mt-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Using {selectedStairs === 'BASEMENT1' ? 'Main Stairs' : 'Emergency Stairs'}
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
