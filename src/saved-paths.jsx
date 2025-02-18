import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Trash2, ClipboardList, Settings, Calendar, Search, Filter, Edit2 } from 'lucide-react';
import { useDarkMode } from './contexts/DarkModeContext';
import { useBackButton } from './hooks/useBackButton';
import { showNotification } from './utils/notifications';

function SavedPaths() {
  useBackButton();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [savedPaths, setSavedPaths] = useState([]);
  
  const [editingPath, setEditingPath] = useState(null);
  
  useEffect(() => {
    const paths = JSON.parse(localStorage.getItem('savedPaths') || '[]');
    const sortedPaths = sortPathsByDate(paths);
    setSavedPaths(sortedPaths);
  }, [sortOrder]);

  const sortPathsByDate = (paths) => {
    return paths.sort((a, b) => {
      const dateA = new Date(a.appointmentDate || 0);
      const dateB = new Date(b.appointmentDate || 0);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const handleSetAppointment = (pathId, date) => {
    const updatedPaths = savedPaths.map(path => {
      if (path.id === pathId) {
        return { ...path, appointmentDate: date };
      }
      return path;
    });
    localStorage.setItem('savedPaths', JSON.stringify(updatedPaths));
    setSavedPaths(sortPathsByDate(updatedPaths));
  };

  const handleEdit = (path) => {
    setEditingPath(path);
  };

  const handleUpdatePath = (updatedPath) => {
    const updatedPaths = savedPaths.map(path => 
      path.id === updatedPath.id ? updatedPath : path
    );
    localStorage.setItem('savedPaths', JSON.stringify(updatedPaths));
    setSavedPaths(sortPathsByDate(updatedPaths));
    setEditingPath(null);
  };

  const filteredPaths = savedPaths.filter(path => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // Check if path matches search term
    const matchesSearch = !searchTermLower || (
      (path.building?.toLowerCase().includes(searchTermLower)) ||
      (path.floor?.toLowerCase().includes(searchTermLower)) ||
      (path.startRoom?.toLowerCase().includes(searchTermLower)) ||
      (path.targetRoom?.toLowerCase().includes(searchTermLower))
    );
    
    // Check if path matches selected building filter
    const matchesBuilding = selectedBuildingFilter === 'all' || 
      path.building === selectedBuildingFilter;
    
    // Only show paths that match both conditions
    return matchesSearch && matchesBuilding;
  });

  const PathCard = ({ path }) => (
    <div className={`rounded-lg p-3 sm:p-4 ${
      isDarkMode 
        ? 'bg-gray-700/50 hover:bg-gray-700' 
        : 'bg-gray-50 hover:bg-gray-100'
    } transition-all duration-200`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-sky-400' : 'text-sky-600'
            }`}>
              {path.building}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDarkMode 
                ? 'bg-gray-600 text-gray-300' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {path.floor}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className={`h-4 w-4 ${
                isDarkMode ? 'text-sky-400' : 'text-sky-600'
              }`} />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {path.startRoom}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className={`h-4 w-4 ${
                isDarkMode ? 'text-sky-400' : 'text-sky-600'
              }`} />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {path.targetRoom}
              </span>
            </div>
          </div>

          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Saved: {new Date(path.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handlePathClick(path)}
            className={`p-2 rounded-full ${
              isDarkMode 
                ? 'hover:bg-gray-600' 
                : 'hover:bg-sky-100'
            } transition-colors`}
          >
            <Navigation className={`h-4 w-4 ${
              isDarkMode ? 'text-sky-400' : 'text-sky-600'
            }`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(path.id);
            }}
            className={`p-2 rounded-full ${
              isDarkMode 
                ? 'hover:bg-gray-600' 
                : 'hover:bg-red-100'
            } transition-colors`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );

  const handleDelete = async (pathId) => {
    const pathToDelete = savedPaths.find(path => path.id === pathId);
    const updatedPaths = savedPaths.filter(path => path.id !== pathId);
    localStorage.setItem('savedPaths', JSON.stringify(updatedPaths));
    setSavedPaths(updatedPaths);
    
    await showNotification(
      'Path Deleted',
      `Successfully deleted path from ${pathToDelete.startRoom} to ${pathToDelete.targetRoom}`
    );
  };

  const handlePathClick = async (path) => {
    // Determine which floor plan to navigate to based on the building and floor
    let routePath;
    const buildingName = path.building?.toLowerCase() || '';
    const floorName = path.floor?.toLowerCase() || '';

    if (buildingName.includes('admin')) {
      // Handle different admin building floors
      if (floorName.includes('basement')) {
        routePath = '/basement-floor';
      } else if (floorName.includes('ground') || floorName.includes('first')) {
        routePath = '/main-floor';
      } 
    } else if (buildingName.includes('rizal')) {
      routePath = '/rizal-floor-plan';
    } else if (buildingName.includes('jmc')) {
      if (floorName.includes('1st')) {
        routePath = '/jmc-first-floor';
      } else if (floorName.includes('2nd')) {
        routePath = '/jmc-second-floor';
      } else if (floorName.includes('3rd')) {
        routePath = '/jmc-third-floor';
      }
    }

    if (!routePath) {
      console.error('Unknown building/floor combination:', path.building, path.floor);
      return;
    }

    if (routePath) {
      await showNotification(
        'Navigation Started',
        `Navigating from ${path.startRoom} to ${path.targetRoom}`
      );
      
      navigate(routePath, {
        state: {
          fromSavedPaths: true,
          startRoom: path.startRoom,
          targetRoom: path.targetRoom,
          pathData: {
            id: path.id,
            building: path.building,
            floor: path.floor,
            appointmentDate: path.appointmentDate,
            timestamp: path.timestamp
          },
          autoShowPath: true
        }
      });
    }
  };

  // Add this function to get raw localStorage data
  const getRawStorageData = () => {
    const data = localStorage.getItem('savedPaths');
    try {
      return JSON.parse(data);
    } catch (e) {
      return `Error parsing data: ${data}`;
    }
  };

  // Update the helper function to count paths per building
  const getPathsCountByBuilding = (paths) => {
    const counts = {
      'Admin Building': 0,
      'JMC Building': 0,
      'Rizal Building': 0
    };
    
    paths.forEach(path => {
      if (path.building) {
        counts[path.building] = (counts[path.building] || 0) + 1;
      }
    });
    
    return counts;
  };

  // Update the dropdown section
  const buildingCounts = getPathsCountByBuilding(savedPaths);

  return (
    <div className={`flex min-h-screen flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sky-50'}`}>
      <header className={`flex items-center justify ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 shadow-sm`}>
      <button 
          onClick={() => navigate('/')} 
          className={`rounded-full p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-100'} transition-colors`}
        >
          <ArrowLeft className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Saved Paths</h1>
        
      </header>

      <main className="flex-1 p-2 sm:p-4">
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-4 shadow-md max-w-3xl mx-auto`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
            <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Saved Navigation Paths
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={async () => {
                  const paths = JSON.parse(localStorage.getItem('savedPaths') || '[]');
                  setSavedPaths(sortPathsByDate(paths));
                  await showNotification(
                    'Paths Refreshed',
                    `Successfully refreshed ${paths.length} saved paths`
                  );
                }}
                className={`px-3 py-1.5 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-sky-100 hover:bg-sky-200 text-sky-700'
                } text-sm transition-colors`}
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all saved paths?')) {
                    localStorage.removeItem('savedPaths');
                    setSavedPaths([]);
                  }
                }}
                className={`px-3 py-1.5 rounded-md ${
                  isDarkMode 
                    ? 'bg-red-900/50 hover:bg-red-900/70 text-red-200' 
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                } text-sm transition-colors`}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className={`mb-4 space-y-2`}>
            <div className={`flex items-center gap-2 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            } rounded-lg p-2`}>
              <Search className={`h-5 w-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search rooms, dates, or building..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-transparent w-full focus:outline-none ${
                  isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                }`}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedBuildingFilter}
                onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                className={`flex-1 sm:flex-none rounded-md px-3 py-1.5 text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-200 border-gray-600' 
                    : 'bg-white text-gray-700 border-gray-200'
                } border`}
              >
                <option value="all">All Buildings</option>
                {[
                  'Admin Building',
                  'JMC Building',
                  'Rizal Building'
                ].map(building => (
                  <option key={building} value={building}>
                    {building}
                    {buildingCounts[building] > 0 && ` (${buildingCounts[building]})`}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-white hover:bg-gray-50 text-gray-700'
                } border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
              >
                Sort {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          
          {filteredPaths.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>No paths found.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 text-sky-600 hover:text-sky-700 underline"
              >
                Start a new navigation
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPaths.map((path, index) => (
                <PathCard key={path.id || index} path={path} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-sky-200'} 
        border-t fixed bottom-0 w-full z-10`}>
        <nav className="flex justify-around max-w-md mx-auto py-2 px-2">
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
                path === '/saved-paths' 
                  ? (isDarkMode ? 'bg-sky-900/50' : 'bg-sky-100') // Active background
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700' // Hover state
              }`}>
                <Icon className={`h-6 w-6 ${
                  path === '/saved-paths' 
                    ? (isDarkMode ? 'text-sky-400' : 'text-sky-600')
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`} />
              </div>
              <span className={`text-xs mt-1 ${
                path === '/saved-paths' 
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

export default SavedPaths;