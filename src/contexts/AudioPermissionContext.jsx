// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { Platform, PermissionsAndroid } from 'react-native';
// import * as Permissions from 'expo-permissions';
// import * as Audio from 'expo-av';

// const AudioPermissionContext = createContext();

// export function useAudioPermission() {
//   return useContext(AudioPermissionContext);
// }

// export function AudioPermissionProvider({ children }) {
//   const [hasPermission, setHasPermission] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [sound, setSound] = useState(null);

//   // Check permissions on mount
//   useEffect(() => {
//     checkPermissions();
//   }, []);

//   // Cleanup sound object when unmounting
//   useEffect(() => {
//     return sound
//       ? () => {
//           sound.unloadAsync();
//         }
//       : undefined;
//   }, [sound]);

//   const checkPermissions = async () => {
//     try {
//       if (Platform.OS === 'ios') {
//         const { status } = await Audio.requestPermissionsAsync();
//         setHasPermission(status === 'granted');
//       } else {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//           {
//             title: 'Audio Permission',
//             message: 'App needs access to your audio to work properly.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           }
//         );
//         setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
//       }
//     } catch (err) {
//       console.warn('Error checking audio permissions:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const requestPermission = async () => {
//     setIsLoading(true);
//     try {
//       await Audio.requestPermissionsAsync();
//       await checkPermissions();
//     } catch (err) {
//       console.warn('Error requesting audio permissions:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Initialize audio session
//   const initializeAudio = async () => {
//     try {
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: false,
//         staysActiveInBackground: true,
//         playsInSilentModeIOS: true,
//         shouldDuckAndroid: true,
//         playThroughEarpieceAndroid: false,
//       });
//     } catch (err) {
//       console.warn('Error initializing audio:', err);
//     }
//   };

//   // Play sound utility
//   const playSound = async (soundFile) => {
//     if (!hasPermission) {
//       console.warn('No audio permission granted');
//       return;
//     }

//     try {
//       if (sound) {
//         await sound.unloadAsync();
//       }

//       const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
//       setSound(newSound);
//       await newSound.playAsync();
//     } catch (err) {
//       console.warn('Error playing sound:', err);
//     }
//   };

//   const value = {
//     hasPermission,
//     isLoading,
//     requestPermission,
//     playSound,
//     initializeAudio,
//   };

//   return (
//     <AudioPermissionContext.Provider value={value}>
//       {children}
//     </AudioPermissionContext.Provider>
//   );
// }