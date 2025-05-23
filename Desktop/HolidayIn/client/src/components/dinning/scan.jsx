import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerAutoEvent, clearDinningError } from "../../features/dining_room/dinningSlice";
import { BrowserMultiFormatReader } from "@zxing/library";

export default function RegisterAutoEvent() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.dinning);

  const videoRef = useRef(null);
  const codeReader = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [scannedResult, setScannedResult] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Listar cámaras disponibles y pedir permiso
  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        return codeReader.current.listVideoInputDevices();
      })
      .then((videoInputDevices) => {
        console.log("Cámaras detectadas:", videoInputDevices);
        if (videoInputDevices.length === 0) {
          setScanError("No se detectaron cámaras disponibles.");
          return;
        }
        setCameras(videoInputDevices);
        setSelectedCameraId(videoInputDevices[0].deviceId);
      })
      .catch((err) => {
        console.error(err);
        setScanError("No se pudo acceder a la cámara. Por favor, permite el acceso o usa un dispositivo con cámara.");
      });

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  // Función para iniciar el escaneo con la cámara seleccionada
  useEffect(() => {
    if (!selectedCameraId) return;

    setScanError(null);
    setScannedResult(null);

    codeReader.current
      .decodeFromVideoDevice(selectedCameraId, videoRef.current, (result, err) => {
        if (result) {
          setScannedResult(result.getText());
          // Registrar evento automáticamente al escanear QR
          handleRegister(result.getText());
          // Opcional: detener el escaneo después de un resultado exitoso
          codeReader.current.reset();
        }
        if (err && !(err.name === "NotFoundException")) {
          console.error(err);
          setScanError("Error durante el escaneo. Intenta de nuevo.");
        }
      });

    return () => {
      codeReader.current.reset();
    };
  }, [selectedCameraId]);

  // Función para despachar el registro del evento
  const handleRegister = async (employeeNumber) => {
    if (!employeeNumber.trim()) {
      alert("Número de empleado inválido.");
      return;
    }
    setSuccessMessage(null);
    dispatch(clearDinningError());

    try {
      const resultAction = await dispatch(registerAutoEvent(employeeNumber));
      if (registerAutoEvent.fulfilled.match(resultAction)) {
        setSuccessMessage(
          `Evento registrado: Tipo ${resultAction.payload.event_type} - Timestamp: ${new Date(
            resultAction.payload.timestamp
          ).toLocaleString()}`
        );
      }
    } catch {
      // Error manejado en redux
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", textAlign: "center" }}>
      <h2>Registrar evento automático (QR)</h2>

      {scanError && <p style={{ color: "red" }}>{scanError}</p>}

      {cameras.length > 1 && (
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          disabled={loading}
          style={{ marginBottom: 10, padding: 5, width: "100%" }}
        >
          {cameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `Cámara ${camera.deviceId}`}
            </option>
          ))}
        </select>
      )}

      <video
        ref={videoRef}
        style={{ width: "100%", border: "1px solid black", borderRadius: 4 }}
        muted
        playsInline
      />

      {loading && <p>Registrando evento...</p>}

      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
}
