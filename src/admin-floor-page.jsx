import React, { Suspense, useEffect } from 'react'
import { ClipboardList, Navigation, Settings, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useDarkMode } from './contexts/DarkModeContext'
import { useBackButton } from './hooks/useBackButton';

function BackgroundCircle() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <circleGeometry args={[25, 32]} />
      <meshStandardMaterial color="#e5e7eb" />
    </mesh>
  );
}

function Model() {
  const gltf = useLoader(GLTFLoader, '/buildings/admin.glb');
  
  React.useEffect(() => {
    if (gltf) {
      gltf.scene.position.set(0, 0, 0);
      gltf.scene.rotation.set(0, 0, 0);
    }
  }, [gltf]);

  return gltf ? <primitive object={gltf.scene} scale={0.16} /> : null;
}

function LoadingSpinner() {
  const { isDarkMode } = useDarkMode();
  return (
    <div className={`flex items-center justify-center h-full ${
      isDarkMode ? 'text-gray-300' : 'text-sky-600'
    }`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2"></div>
    </div>
  );
}

function BuildingViewer() {
  const controlsRef = React.useRef();

  React.useEffect(() => {
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animate);
  }, []);

  return (
    <div className="w-full h-[300px] relative">
      <Suspense fallback={<LoadingSpinner />}>
        <Canvas
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '0.75rem',
          }}
          camera={{ 
            position: [45, 45, 60], 
            fov: 35,
            near: 0.1,
            far: 1000 
          }}
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[10, 10, 5]} intensity={3} castShadow />
          <directionalLight position={[-10, 10, -5]} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <hemisphereLight intensity={1} groundColor="white" />
          
          <Suspense fallback={null}>
            <BackgroundCircle />
            <Model />
          </Suspense>
          
          <OrbitControls
            ref={controlsRef}
            autoRotate
            autoRotateSpeed={3}
            enableRotate={true}
            enableZoom={true}
            enablePan={true}
            minDistance={18}
            maxDistance={65}
            target={[0, 0, 0]}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            panSpeed={0.5}
            screenSpacePanning={true}
            rotateSpeed={0.5}
            zoomSpeed={0.5}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <p>Error loading 3D model</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Update Card component to handle dark mode
const Card = ({ children, className }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <div className={`rounded-lg ${className} ${
      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-200'
    }`}>
      {children}
    </div>
  );
};

export default function FloorPage() {
  useBackButton();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  
  const buildings = [
    { name: "MAIN FLOOR", path: "/main-floor" },
    { name: "BASEMENT FLOOR", path: "/basement-floor" },
  ];

  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      navigate('/');
    };

    window.addEventListener('popstate', handleBackButton);

    // Cleanup listener when component unmounts
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate]);

  return (
    <div className={`flex min-h-screen flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-sky-50'
    }`}>
      <header className={`flex items-center justify ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } p-[2%] h-[10vh] shadow-sm`}>
         <button 
          onClick={() => navigate('/')} 
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
      
      <main className="flex-1 p-4 space-y-6">
        {/* 3D Model Viewer */}
        <div className={`${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } p-4 rounded-xl shadow-lg`}>
          <ErrorBoundary>
            <BuildingViewer />
          </ErrorBoundary>
          <h1 className={`text-center text-xl font-bold mt-4 ${
            isDarkMode ? 'text-gray-100' : 'text-sky-800'
          }`}>
            Admin Building Overview
          </h1>
        </div>

        {/* Floor Cards */}
        <div className="grid gap-4">
          {buildings.map(({ name, path }) => (
            <Link to={path} key={name}>
              <Card className={`transition-colors duration-200 cursor-pointer p-9 text-center ${
                isDarkMode 
                  ? 'bg-gray-800 shadow-lg'
                  : 'bg-white shadow-md'
              }`}>
                <h2 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-gray-100' : 'text-sky-800'
                }`}>
                  {name}
                </h2>
              </Card>
            </Link>
          ))}
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
                label === "Navigate" 
                  ? (isDarkMode ? 'bg-sky-900/50' : 'bg-sky-100') // Active background
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700' // Hover state
              }`}>
                <Icon className={`h-6 w-6 ${
                  label === "Navigate" 
                    ? (isDarkMode ? 'text-sky-400' : 'text-sky-600')
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`} />
              </div>
              <span className={`text-xs mt-1 ${
                label === "Navigate" 
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
  )
}