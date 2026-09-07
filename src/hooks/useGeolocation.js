import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook to handle live GPS Geolocation
 */
export function useGeolocation(autoStart = true) {
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    locationString: 'Mendeteksi lokasi...'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      const errStr = 'Geolocation tidak didukung pada peramban ini.';
      setError(errStr);
      setCoordinates(prev => ({ ...prev, locationString: errStr }));
      return;
    }

    setLoading(true);
    setError(null);
    setCoordinates(prev => ({ ...prev, locationString: 'Mengunci koordinat GPS...' }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);

        setCoordinates({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          locationString: `${lat}, ${lng}`
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        let msg = 'Gagal Deteksi Lokasi';
        if (err.code === 1) msg = 'Akses Lokasi Ditolak';
        else if (err.code === 2) msg = 'Posisi GPS Tidak Tersedia';
        else if (err.code === 3) msg = 'Waktu Deteksi GPS Habis';

        setError(msg);
        setCoordinates(prev => ({
          ...prev,
          locationString: msg
        }));
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    if (autoStart) {
      getPosition();
    }
  }, [autoStart, getPosition]);

  return {
    ...coordinates,
    loading,
    error,
    refreshLocation: getPosition
  };
}
