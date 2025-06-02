import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { processDatFile } from '../../features/datEvents/datEventsSlice'; // Asegúrate de que la ruta sea correcta

const ProcessDatFileComponent = () => {
  const dispatch = useDispatch();
  // Asumiendo que tu slice se llama 'datEvents' y tiene estos estados
  const { loading, error, message } = useSelector((state) => state.datEvents);

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]); // Captura el archivo seleccionado
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      alert('Por favor, selecciona un archivo .dat primero.');
      return;
    }
    // Despacha el thunk, pasando el objeto File directamente
    dispatch(processDatFile(selectedFile));
  };

  return (
    <div>
      <h2>Procesar Archivo .DAT</h2>
      <input
        type="file"
        accept=".dat" // Sugiere al navegador que solo muestre archivos .dat
        onChange={handleFileChange}
      />
      <button onClick={handleSubmit} disabled={!selectedFile || loading}>
        {loading ? 'Cargando y Procesando...' : 'Cargar y Procesar Archivo .DAT'}
      </button>

      {loading && <p>Procesando el archivo...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error?.error || error?.message || 'Error desconocido'}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
    </div>
  );
};

export default ProcessDatFileComponent;