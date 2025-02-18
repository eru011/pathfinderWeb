import React, { Suspense, useState, useEffect } from 'react'
import { ClipboardList, Navigation, Settings, Search, ChevronDown, Mic } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three'
import { useDarkMode } from './contexts/DarkModeContext';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { VOICE_RECOGNITION_MAPPINGS } from './constants/voiceRecognitionMappings';

// Add these size constants at the top of your file
const LAYOUT_CONFIG = {
  // Main container
  CONTAINER_MAX_WIDTH: '1024px',  // or '5xl' in tailwind
  CONTAINER_PADDING: '2rem',      // or '8' in tailwind
  
  // Card layout
  CARD_MAX_WIDTH: '650px',        // Individual card width
  CARD_GAP: '2rem',            // Space between cards
  CARD_MARGIN: '1rem',         // Card side margins
  CARD_PADDING: '.5rem',          // Inside card padding
  
  // 3D model container
  MODEL_HEIGHT_MOBILE: '220px',   // Model height on mobile
  MODEL_HEIGHT_DESKTOP: '260px',  // Model height on desktop
  
  // Text sizes
  TITLE_SIZE_MOBILE: '1rem',  // 18px
  TITLE_SIZE_DESKTOP: '1rem',   // 24px
  TITLE_MARGIN_TOP: '0rem',      // Space above title
  
  // Footer
  FOOTER_HEIGHT: '70px',  // Match your footer height
  BOTTOM_SPACING: '30px', // Extra space to ensure last card is visible
};

// Background circle component
function BackgroundCircle() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <circleGeometry args={[25, 32]} />
      <meshStandardMaterial color="#e5e7eb" /> {/* Tailwind gray-200 */}
    </mesh>
  );
}

function Building({ modelPath, name }) {
  const cameraSettings = name === "JMC BUILDING OVERVIEW" 
    ? {
        position: [45, 45, 60],
        fov: 35,
        minDistance: 18,
        maxDistance: 65,
        scale: 0.16
      }
    : {
        position: [22, 22, 40],
        fov: 60,
        minDistance: 10,
        maxDistance: 40,
        scale: 0.25
      };

  return (
    <Canvas 
      style={{ 
        height: '100%', 
        width: '100%',
        margin: '0',
        touchAction: 'pan-y',
        borderRadius: '0.5rem',
      }}
      camera={{ position: cameraSettings.position, fov: cameraSettings.fov }}
    >
      <ambientLight intensity={2.5} />
      <directionalLight position={[10, 10, 5]} intensity={3} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={2} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <hemisphereLight intensity={1} groundColor="white" />
      
      <Suspense fallback={null}>
        <BackgroundCircle />
        <Model path={modelPath} scale={cameraSettings.scale} />
      </Suspense>
      <OrbitControls 
        minDistance={cameraSettings.minDistance}
        maxDistance={cameraSettings.maxDistance}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        enablePan={true}
        panSpeed={0.5}
        screenSpacePanning={true}
      />
    </Canvas>
  );
}

function Model({ path, scale }) {
  const gltf = useLoader(GLTFLoader, path);
  return <primitive object={gltf.scene} scale={scale} />;
}

export default function Dashboard() {
  const { isDarkMode } = useDarkMode();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedOfficeCategory, setSelectedOfficeCategory] = useState(null);
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('voiceEnabled') === 'true'
  });
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setVoiceEnabled(localStorage.getItem('voiceEnabled') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const searchCategories = {
    Buildings: [
      { 
        label: "Admin Building", 
        value: "admin-building",
        floors: [
          {
            label: "Ground Floor",
            value: "admin-ground",
            rooms: [
              { label: "Lazaro Hall", value: "LAZARO_HALL" },
              { label: "Nurse Office", value: "NURSE_OFFICE" },
              { label: "Dean's Office", value: "DEANS_OFFICE" },
              { label: "Speech Room", value: "SPEECH_ROOM" },
              { label: "Guidance Office", value: "GUIDANCE_OFFICE" },
              { label: "Cashier", value: "CASHIER" },
              { label: "Registrar", value: "REGISTRAR" },
              { label: "Vice President's Office", value: "VICE_PRESIDENT_OFFICE" },
              { label: "Office of Student Affairs", value: "OFFICE_OF_STUDENT_AFFAIRS" },
              { label: "President's Office", value: "PRESIDENT_OFFICE" },
              { label: "HR Office", value: "HR_OFFICE" },
              { label: "Conference Room", value: "CONFERENCE_ROOM" },
              { label: "Faculty Room", value: "FACULTY_ROOM" },
              { label: "Biology Lab", value: "BIOLOGY_LAB" },
              { label: "MISD", value: "MISD" },
              { label: "Physics Lab", value: "PHYSICS_LAB" },
              { label: "CR", value: "CR" },
              { label: "Basement 1", value: "BASEMENT1" },
              { label: "Basement 2", value: "BASEMENT2" },
              { label: "Exit", value: "EXIT" },
            ]
          },
          {
            label: "Basement",
            value: "basement",
            rooms: [
              { label: "AB2", value: "AB2" },
              { label: "AB3", value: "AB3" },
              { label: "AB4", value: "AB4" },
              { label: "AB5", value: "AB5" },
              { label: "AB6", value: "AB6" },
              { label: "AB7", value: "AB7" },
              { label: "AB8", value: "AB8" },
              { label: "AB9", value: "AB9" },
              { label: "Canteen", value: "canteen" },
              { label: "Alumni Office", value: "alumni" },
              { label: "Socia-Cultural Room", value: "socios" },
              { label: "Storage Room", value: "storage" },
              { label: "Sports Room", value: "sports" },
            ]
          }
        ]
      },
      { 
        label: "JMC Building", 
        value: "jmc-building",
        floors: [
          {
            label: "First Floor",
            value: "jmc-first",
            rooms: [
              { label: "1JMC-CL1", value: "JMC_CL1" },
              { label: "1JMC-CL2", value: "JMC_CL2" },
              { label: "1JMC-CL3", value: "JMC_CL3" },
              { label: "1JMC-CL4", value: "JMC_CL4" },
              { label: "1JMC-CL5", value: "JMC_CL5" },
              { label: "1JMC-CA", value: "JMC_CA" },
            ]
          },
          {
            label: "Second Floor",
            value: "jmc-second",
            rooms: [
              { label: "2JMC3", value: "JMC3" },
              { label: "2JMC4", value: "JMC4" },
              { label: "2JMC5", value: "JMC5" },
              { label: "2JMC6", value: "JMC6" },
              { label: "OCL", value: "OFFICE_OF_THE_CHIEF_LIBRARIAN" },
              { label: "Library", value: "LIBRARY" },
            ]
          },
          {
            label: "Third Floor",
            value: "jmc-third",
            rooms: [
              { label: "3JMC7", value: "JMC7" },
              { label: "3JMC8", value: "JMC8" },
              { label: "3JMC9", value: "JMC9" },
              { label: "3JMC10", value: "JMC10" },
              { label: "3JMC11", value: "JMC11" },
              { label: "3JMC12", value: "JMC12" },
              { label: "AVR", value: "AV_ROOM" },
            ]
          }
        ]
      },
      { 
        label: "Rizal Building", 
        value: "rizal-building",
        floors: [
          {
            label: "Ground Floor",
            value: "rizal-ground",
            rooms: [
              { label: "Faculty Room", value: "FACULTY_ROOM" },
              { label: "R1", value: "R1" },
              { label: "R2", value: "R2" },
              { label: "R3", value: "R3" },
              { label: "R4", value: "R4" },
              { label: "R5", value: "R5" },
              { label: "R6", value: "R6" },
              { label: "R7", value: "R7" },
              { label: "R8", value: "R8" },
              { label: "R9", value: "R9" },
              { label: "R10", value: "R10" },
              { label: "R11", value: "R11" },
              { label: "R12", value: "R12" },
              { label: "R13", value: "R13" },
              { label: "R14", value: "R14" },
            ]
          },
        ]
      }
    ],
    Offices: [
      { 
        label: "Academic Offices",
        value: "academic-offices",
        items: [
          { label: "Dean's Office", value: "DEANS_OFFICE", location: "Admin Building, GF" },
          { label: "Faculty Room", value: "FACULTY_ROOM", location: "Rizal Building, GF" },
          { label: "Guidance Office", value: "GUIDANCE_OFFICE", location: "Admin Building, GF" },
          { label: "Registrar", value: "REGISTRAR", location: "Admin Building, GF" },
          { label: "MISD", value: "MISD", location: "Admin Building, GF" },
          { label: "Library", value: "LIBRARY", location: "Rizal Building, GF" },

        ]
      },
      {
        label: "Student Services",
        value: "student-services",
        items: [
          { label: "Lazaro Hall", value: "LAZARO_HALL", location: "Admin Building, GF" },
          { label: "Nurse Office", value: "NURSE_OFFICE", location: "Admin Building, GF" },
          { label: "Cashier", value: "CASHIER", location: "Admin Building, GF" },
          { label: "Office of Student Affairs", value: "OFFICE_OF_STUDENT_AFFAIRS", location: "Admin Building, GF" },
          { label: "President's Office", value: "PRESIDENTS_OFFICE", location: "Admin Building, GF" },
          { label: "HR Office", value: "HR_OFFICE", location: "Admin Building, GF" },
          { label: "Conference Room", value: "CONFERENCE_ROOM", location: "Admin Building, GF" },
          { label: "Supreme Student Council", value: "SUPREME_STUDENT_COUNCIL", location: "Admin Building, GF" },
          { label: "Canteen", value: "canteen", location: "Admin Building, GF" },
        ]
      }
    ]
  };

  const buildings = [
    { 
      name: "JMC BUILDING OVERVIEW", 
      path: "/jmc-floor-page",
      modelPath: "/buildings/jmc.glb"
    },
    { 
      name: "ADMIN BUILDING OVERVIEW", 
      path: "/admin-floor-page",
      modelPath: "/buildings/admin.glb"
    },
    { 
      name: "RIZAL BUILDING OVERVIEW", 
      path: "/rizal-floor-page",
      modelPath: "/buildings/rizal.glb",
    }
  ];

  const handleItemClick = (value) => {
    switch(value) {
      // JMC Building Rooms - First Floor
      case 'JMC_CL1':
      case 'JMC_CL2':
      case 'JMC_CL3':
      case 'JMC_CL4':
      case 'JMC_CL5':
      case 'JMC_CA':
        navigate('/jmc-first-floor', {
          state: {
            targetRoom: value,
            startRoom: 'Entrance'
          }
        });
        break;

      // JMC Building Rooms - Second Floor
      case 'JMC3':
      case 'JMC4':
      case 'JMC5':
      case 'JMC6':
      case 'OCL':
      case 'LIBRARY':
        navigate('/jmc-second-floor', {
          state: {
            targetRoom: value,
            startRoom: 'STAIRS1'
          }
        });
        break;

      // JMC Building Rooms - Third Floor
      case 'JMC7':
      case 'JMC8':
      case 'JMC9':
      case 'JMC10':
      case 'JMC11':
      case 'JMC12':
      case 'AVR':
        navigate('/jmc-third-floor', {
          state: {
            targetRoom: value,
            startRoom: 'STAIRS1'
          }
        });
        break;

      // Rizal Building Rooms
      case 'R1':
      case 'R2':
      case 'R3':
      case 'R4':
      case 'R5':
      case 'R6':
      case 'R7':
      case 'R8':
      case 'R9':
      case 'R10':
      case 'R11':
      case 'R12':
      case 'R13':
      case 'R14':
        navigate('/rizal-floor-plan', {
          state: {
            targetRoom: value,
            startRoom: 'Entrance'
          }
        });
        break;

      // Admin Building Rooms
      case 'LAZARO_HALL':
      case 'NURSE_OFFICE':
      case 'DEANS_OFFICE':
      case 'SPEECH_ROOM':
      case 'GUIDANCE_OFFICE':
      case 'CASHIER':
      case 'OFFICE_OF_STUDENT_AFFAIRS':
      case 'REGISTRAR':
      case 'SUPREME_STUDENT_COUNCIL':
      case 'PRESIDENTS_OFFICE':
      case 'HR_OFFICE':
      case 'CONFERENCE_ROOM':
      case 'FACULTY_ROOM':
      case 'BASEMENT1':
      case 'BASEMENT2':
      case 'EXIT':
        navigate('/main-floor', {
          state: {
            targetRoom: value,
            startRoom: 'Entrance'
          }
        });
        break;

      case 'AB2':
      case 'AB3':
      case 'AB4':
      case 'AB5':
      case 'AB6':
      case 'AB7':
      case 'AB8':
      case 'AB9':
      case 'canteen':
      case 'storage':
      case 'sports':  // Add any other basement rooms here
          navigate('/basement-floor', {
            state: {
              startRoom: 'Entrance',
              targetRoom: value,
              fromMainDashboard: true  // Optional: to know where the navigation came from
            }
          });
          break;

      // Building Overview Pages
      case 'jmc-building':
        navigate('/jmc-floor-page');
        break;
      case 'admin-building':
        navigate('/main-floor');
        break;
      case 'rizal-building':
        navigate('/rizal-floor-page');
        break;

      // Floor-specific navigation
      case 'jmc-first':
        navigate('/jmc-first-floor');
        break;
      case 'jmc-second':
        navigate('/jmc-second-floor');
        break;
      case 'jmc-third':
        navigate('/jmc-third-floor');
        break;
      case 'rizal-ground':
        navigate('/rizal-floor-plan');
        break;
      case 'admin-ground':
        navigate('/main-floor');
        break;

      default:
        console.log('No path defined for:', value);
        break;
    }
  };

  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    searchTerm = searchTerm.toLowerCase();
    
    return items.filter(item => {
      // For direct item matches
      const itemMatches = item.label?.toLowerCase().includes(searchTerm);
      
      // For buildings with floors and rooms
      if (item.floors) {
        const floorMatches = item.floors.some(floor => {
          const floorLabelMatch = floor.label.toLowerCase().includes(searchTerm);
          const roomMatches = floor.rooms.some(room => 
            room.label.toLowerCase().includes(searchTerm)
          );
          return floorLabelMatch || roomMatches;
        });
        return itemMatches || floorMatches;
      }
      
      // For offices with items
      if (item.items) {
        const officeMatches = item.items.some(office => 
          office.label.toLowerCase().includes(searchTerm) ||
          office.location?.toLowerCase().includes(searchTerm)
        );
        return itemMatches || officeMatches;
      }
      
      return itemMatches;
    }).map(item => {
      // Create a new filtered version of the item
      const newItem = { ...item };
      
      if (item.floors) {
        newItem.floors = item.floors
          .filter(floor => 
            floor.label.toLowerCase().includes(searchTerm) ||
            floor.rooms.some(room => room.label.toLowerCase().includes(searchTerm))
          )
          .map(floor => ({
            ...floor,
            rooms: floor.rooms.filter(room => 
              room.label.toLowerCase().includes(searchTerm)
            )
          }));
      }
      
      if (item.items) {
        newItem.items = item.items.filter(office =>
          office.label.toLowerCase().includes(searchTerm) ||
          office.location?.toLowerCase().includes(searchTerm)
        );
      }
      
      return newItem;
    });
  };

  // Add this effect to handle auto-expansion when searching
  useEffect(() => {
    if (searchInput) {
      // Search through all categories to find matches
      Object.entries(searchCategories).forEach(([category, items]) => {
        items.forEach(item => {
          if (category === 'Buildings') {
            item.floors?.forEach(floor => {
              floor.rooms?.forEach(room => {
                if (room.label.toLowerCase().includes(searchInput.toLowerCase())) {
                  setSelectedCategory(category);
                  setSelectedBuilding(item.value);
                  setSelectedFloor(floor.value);
                }
              });
            });
          } else if (category === 'Offices') {
            item.items?.forEach(office => {
              if (office.label.toLowerCase().includes(searchInput.toLowerCase())) {
                setSelectedCategory(category);
                setSelectedOfficeCategory(item.value);
              }
            });
          }
        });
      });
    }
  }, [searchInput]); // Only run when search input changes

  const handleVoiceRecognition = (transcript) => {
    // Convert transcript to lowercase for case-insensitive matching
    const transcriptLower = transcript.toLowerCase();

    // First check custom mappings
    for (const [phrase, value] of Object.entries(VOICE_RECOGNITION_MAPPINGS)) {
      if (transcriptLower.includes(phrase)) {
        handleItemClick(value);
        return true;
      }
    }

    // Helper function to check if a room matches
    const checkRoomMatch = (room, label) => {
      const roomLower = room.toLowerCase();
      const labelLower = label.toLowerCase();
      
      return transcriptLower.includes(roomLower) || transcriptLower.includes(labelLower);
    };

    // Check buildings first
    for (const building of buildings) {
      if (transcriptLower.includes(building.name.toLowerCase())) {
        navigate(building.path);
        return true;
      }
    }

    // Check categories in searchCategories
    for (const [category, items] of Object.entries(searchCategories)) {
      for (const item of items) {
        // Check building floors
        if (item.floors) {
          for (const floor of item.floors) {
            for (const room of floor.rooms || []) {
              // Check both room value and label
              if (checkRoomMatch(room.value, room.label)) {
                handleItemClick(room.value);
                return true;
              }
            }
          }
        }
        // Check office items
        if (item.items) {
          for (const office of item.items) {
            // Check both office value and label
            if (checkRoomMatch(office.value, office.label)) {
              handleItemClick(office.value);
              return true;
            }
          }
        }
      }
    }

    return false;
  };

  const resetSearch = () => {
    setSearchInput('');
    setIsSearchOpen(false);
    setSelectedCategory(null);
    setSelectedBuilding(null);
    setSelectedFloor(null);
    setSelectedOfficeCategory(null);
    if (isListening) {
      SpeechRecognition.stop().catch(console.error);
      setIsListening(false);
    }
  };

  const startListening = async () => {
    if (!voiceEnabled) {
      alert('Please enable voice navigation in settings first');
      return;
    }

    try {
      const { available } = await SpeechRecognition.available();
      if (!available) {
        alert('Speech recognition not available on this device');
        return;
      }

      // Remove any existing listeners before adding new ones
      await SpeechRecognition.removeAllListeners();

      // Add listeners
      SpeechRecognition.addListener('partialResults', (data) => {
        if (data.matches && data.matches.length > 0) {
          const transcript = data.matches[0].toLowerCase();
          setSearchInput(transcript);
          const found = handleVoiceRecognition(transcript);
          if (found) {
            // If a match was found, stop listening and reset
            SpeechRecognition.stop().catch(console.error);
            setIsListening(false);
            resetSearch();
          }
        }
      });

      // Add end listener to handle when speech recognition ends
      SpeechRecognition.addListener('end', () => {
        setIsListening(false);
      });

      // Start listening
      await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 2,
        prompt: 'Speak now',
        partialResults: true,
        popup: false,
      });

      setIsListening(true);

    } catch (error) {
      console.error('Error with speech recognition:', error);
      setIsListening(false);
      if (error.message.includes('permission')) {
        alert('Please allow microphone access to use voice search');
      }
    }
  };

  // Ensure cleanup of listeners when component unmounts
  useEffect(() => {
    return () => {
      if (isListening) {
        SpeechRecognition.stop().catch(console.error);
      }
      SpeechRecognition.removeAllListeners();
    };
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-sky-50 text-gray-900'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-20 flex items-center justify-center">
            <img
              src="/assets/logo/lightLogo.png"
              alt="CCC PathFinder Logo"
              className="h-24.5 w-auto"
            />
          </div>
          
          {/* Search Dropdown */}
          <div className="relative w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onClick={() => setIsSearchOpen(true)}
                placeholder="Search location..."
                className={`w-full flex items-center justify-between rounded-lg px-4 py-2 pl-10 ${
                  voiceEnabled ? 'pr-28' : 'pr-10'
                } shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 
                  ${isDarkMode 
                    ? 'bg-gray-800 text-white placeholder-gray-400 hover:bg-gray-700' 
                    : 'bg-white text-gray-900 placeholder-gray-500 hover:bg-gray-50'
                  }`}
              />
              <Search 
                size={20} 
                className="text-sky-600 absolute left-3 top-1/2 transform -translate-y-1/2" 
              />
              
              {/* Reset button */}
              {searchInput && (
                <button
                  onClick={resetSearch}
                  className={`absolute right-16 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full pr-4
                    ${isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                    }`}
                >
                  ×
                </button>
              )}
              
              {voiceEnabled && (
                <button
                  onClick={startListening}
                  className={`absolute right-10 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full
                    ${isDarkMode 
                      ? 'hover:bg-gray-700 text-sky-400' 
                      : 'hover:bg-gray-100 text-sky-600'
                    } ${isListening ? 'animate-pulse text-red-500' : ''}`}
                >
                  <Mic size={18} />
                </button>
              )}

              <ChevronDown 
                size={20} 
                className={`text-sky-600 transition-transform absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isSearchOpen ? 'rotate-180' : ''
                }`}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              />
            </div>

            {/* Dropdown Menu */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {Object.entries(searchCategories).map(([category, items]) => {
                  const filteredItems = filterItems(items, searchInput);
                  if (filteredItems.length === 0) return null;
                  
                  return (
                    <div key={category} className="border-b border-gray-100 last:border-none">
                      <button
                        onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-sky-50 transition-colors"
                      >
                        <span className="font-medium text-sky-800">{category}</span>
                        <ChevronDown 
                          size={16} 
                          className={`text-sky-600 transition-transform ${selectedCategory === category ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      {selectedCategory === category && (
                        <div className="bg-gray-50 py-1">
                          {category === 'Buildings' ? (
                            // Render building floors and rooms
                            filteredItems.map((building) => (
                              <div key={building.value} className="px-2">
                                <button
                                  className="w-full text-left px-4 py-1.5 hover:bg-sky-100 transition-colors text-sm text-gray-700 font-medium"
                                  onClick={() => setSelectedBuilding(building.value === selectedBuilding ? null : building.value)}
                                >
                                  {building.label}
                                </button>
                                {selectedBuilding === building.value && (
                                  <div className="ml-4">
                                    {building.floors.map((floor) => (
                                      <div key={floor.value}>
                                        <button
                                          className="w-full text-left px-4 py-1 hover:bg-sky-100 transition-colors text-sm text-gray-600"
                                          onClick={() => setSelectedFloor(floor.value === selectedFloor ? null : floor.value)}
                                        >
                                          {floor.label}
                                        </button>
                                        {selectedFloor === floor.value && (
                                          <div className="ml-4">
                                            {floor.rooms.map((room) => (
                                              <button
                                                key={room.value}
                                                className="w-full text-left px-4 py-1 hover:bg-sky-100 transition-colors text-sm text-gray-500"
                                                onClick={() => handleItemClick(room.value)}
                                              >
                                                {room.label}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            // Render office categories
                            filteredItems.map((category) => (
                              <div key={category.value} className="px-2">
                                <button
                                  className="w-full text-left px-4 py-1.5 hover:bg-sky-100 transition-colors text-sm text-gray-700 font-medium"
                                  onClick={() => setSelectedOfficeCategory(category.value === selectedOfficeCategory ? null : category.value)}
                                >
                                  {category.label}
                                </button>
                                {selectedOfficeCategory === category.value && (
                                  <div className="ml-4">
                                    {category.items.map((office) => (
                                      <button
                                        key={office.value}
                                        className="w-full text-left px-4 py-1 hover:bg-sky-100 transition-colors text-sm text-gray-500"
                                        onClick={() => handleItemClick(office.value)}
                                      >
                                        <span>{office.label}</span>
                                        <span className="text-xs text-gray-400 ml-2">({office.location})</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main style={{ 
        padding: LAYOUT_CONFIG.CONTAINER_PADDING,
        paddingBottom: `calc(${LAYOUT_CONFIG.FOOTER_HEIGHT} + ${LAYOUT_CONFIG.BOTTOM_SPACING})`,
        maxWidth: LAYOUT_CONFIG.CONTAINER_MAX_WIDTH 
      }} className="container mx-auto pb-safe">
        <div style={{ gap: LAYOUT_CONFIG.CARD_GAP }} className="grid">
          {buildings.map(({ name, path, modelPath, isExternalLink, externalUrl }) => (
            <div
              key={name}
              style={{ maxWidth: LAYOUT_CONFIG.CARD_MAX_WIDTH }}
              className="mx-auto w-full"
            >
              <div 
                style={{ 
                  padding: LAYOUT_CONFIG.CARD_PADDING,
                  marginLeft: LAYOUT_CONFIG.CARD_MARGIN,
                  marginRight: LAYOUT_CONFIG.CARD_MARGIN
                }}
                className={`rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-sky-50'
                } shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
              > 
                {!isExternalLink ? (
                  <Link to={path} className="block">
                    <div style={{ 
                      height: window.innerWidth < 640 ? 
                        LAYOUT_CONFIG.MODEL_HEIGHT_MOBILE : 
                        LAYOUT_CONFIG.MODEL_HEIGHT_DESKTOP 
                    }} className="w-full relative rounded-lg overflow-hidden">
                      <Building modelPath={modelPath} name={name} />
                    </div>
                    <h2 style={{
                      fontSize: window.innerWidth < 640 ? 
                        LAYOUT_CONFIG.TITLE_SIZE_MOBILE : 
                        LAYOUT_CONFIG.TITLE_SIZE_DESKTOP,
                      marginTop: LAYOUT_CONFIG.TITLE_MARGIN_TOP
                    }} className={`font-bold text-center py-2 ${
                      isDarkMode 
                        ? 'text-sky-400 text-lg' 
                        : 'text-sky-700 text-lg'
                    }`}>
                      {name}
                    </h2>
                  </Link>
                ) : (
                  <>
                    <div style={{ 
                      height: window.innerWidth < 640 ? 
                        LAYOUT_CONFIG.MODEL_HEIGHT_MOBILE : 
                        LAYOUT_CONFIG.MODEL_HEIGHT_DESKTOP 
                    }} className="w-full relative rounded-lg overflow-hidden">
                      <Building modelPath={modelPath} name={name} />
                    </div>
                    <h2 style={{
                      fontSize: window.innerWidth < 640 ? 
                        LAYOUT_CONFIG.TITLE_SIZE_MOBILE : 
                        LAYOUT_CONFIG.TITLE_SIZE_DESKTOP,
                      marginTop: LAYOUT_CONFIG.TITLE_MARGIN_TOP
                    }} className={`font-bold text-center py-2 ${
                      isDarkMode 
                        ? 'text-sky-400 text-lg' 
                        : 'text-sky-700 text-lg'
                    }`}>
                      {name}
                    </h2>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-sky-200'} 
        border-t fixed bottom-0 w-full`}
        style={{ height: LAYOUT_CONFIG.FOOTER_HEIGHT }}
      >
        <nav className="flex justify-around max-w-md mx-auto py-2">
          {[
            { icon: ClipboardList, label: "List", path: "/saved-paths" },
            { icon: Navigation, label: "Navigate", path: "/" },
            { icon: Settings, label: "Settings", path: "/settings" },
          ].map(({ icon: Icon, label, path }) => (
            <Link
              key={label}
              to={path}
              className={`flex flex-col items-center`}
            >
              <div className={`p-2 rounded-full ${
                path === '/' 
                  ? (isDarkMode ? 'bg-sky-900/50' : 'bg-sky-100') // Active background
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700' // Hover state
              }`}>
                <Icon className={`h-6 w-6 ${
                  path === '/' 
                    ? (isDarkMode ? 'text-sky-400' : 'text-sky-600')
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`} />
              </div>
              <span className={`text-xs mt-1 ${
                path === '/' 
                  ? (isDarkMode ? 'text-sky-400 font-medium' : 'text-sky-600 font-medium')
                  : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
              }`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}