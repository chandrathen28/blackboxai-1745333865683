import { useState, useRef } from 'react';

export default function Home() {
  const [imageSrc, setImageSrc] = useState(null);
  const [coords, setCoords] = useState(null);
  const [targetCoord, setTargetCoord] = useState('');
  const [isWithinRadius, setIsWithinRadius] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera stream
  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };

  // Take picture and get coordinates
  const takePicture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setImageSrc(dataUrl);

    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          if (targetCoord) {
            checkDistance(position.coords.latitude, position.coords.longitude, targetCoord);
          }
        },
        (error) => {
          alert('Error getting location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Calculate distance between two coordinates in km using Haversine formula
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Check if current coordinates are within 3 km radius of target
  const checkDistance = (lat, lon, target) => {
    const [targetLat, targetLon] = target.split(',').map(Number);
    if (isNaN(targetLat) || isNaN(targetLon)) {
      alert('Invalid target coordinate format. Use "latitude,longitude"');
      return;
    }
    const distance = getDistanceFromLatLonInKm(lat, lon, targetLat, targetLon);
    setIsWithinRadius(distance <= 3);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Camera with Coordinate Detection</h1>
      <div className="mb-4">
        <video ref={videoRef} className="rounded shadow-lg" width="320" height="240" autoPlay muted></video>
      </div>
      <button
        onClick={startCamera}
        className="bg-blue-600 text-white px-4 py-2 rounded mr-4 hover:bg-blue-700 transition"
      >
        Start Camera
      </button>
      <button
        onClick={takePicture}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        Take Picture
      </button>
      <div className="mt-6 w-full max-w-md">
        <label htmlFor="targetCoord" className="block mb-2 font-semibold">
          Paste Target Coordinate (latitude,longitude):
        </label>
        <input
          id="targetCoord"
          type="text"
          value={targetCoord}
          onChange={(e) => setTargetCoord(e.target.value)}
          placeholder="e.g. 37.7749,-122.4194"
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      {imageSrc && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Captured Image:</h2>
          <img src={imageSrc} alt="Captured" className="rounded shadow-md max-w-xs" />
        </div>
      )}
      {coords && (
        <div className="mt-4">
          <p>Current Coordinates: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</p>
          {isWithinRadius !== null && (
            <p className={`mt-2 font-semibold ${isWithinRadius ? 'text-green-600' : 'text-red-600'}`}>
              {isWithinRadius ? 'Within 3 km radius of target coordinate' : 'Outside 3 km radius of target coordinate'}
            </p>
          )}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}
