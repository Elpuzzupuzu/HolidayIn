import React, { useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { processDatFile } from '../../features/datEvents/datEventsSlice';
import './styles/uploadDat.css';

const ProcessDatFileComponent = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.datEvents);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  // Validación de archivo
  const validateFile = useCallback((file) => {
    if (!file) return false;
    
    // Verificar extensión
    if (!file.name.toLowerCase().endsWith('.dat')) {
      setValidationError('El archivo debe tener extensión .dat');
      return false;
    }
    
    // Verificar tamaño (ejemplo: máximo 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationError('El archivo es demasiado grande (máximo 50MB)');
      return false;
    }
    
    setValidationError('');
    return true;
  }, []);

  // Manejo de cambio de archivo
  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    } else if (file) {
      setSelectedFile(null);
    }
  }, [validateFile]);

  // Manejo de drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, [validateFile]);

  // Manejo de envío
  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      setValidationError('Por favor, selecciona un archivo .dat primero.');
      return;
    }
    
    try {
      await dispatch(processDatFile(selectedFile)).unwrap();
    } catch (err) {
      console.error('Error procesando archivo:', err);
    }
  }, [selectedFile, dispatch]);

  // Limpiar selección
  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Formatear tamaño de archivo
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="process-dat-container">
      <div className="process-dat-header">
        <h2 className="process-dat-title">Procesar Archivo .DAT</h2>
        <p className="process-dat-description">
          Selecciona o arrastra un archivo .dat para procesar
        </p>
      </div>

      <div className="file-upload-section">
        <div 
          className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dat"
            onChange={handleFileChange}
            className="file-input-hidden"
            disabled={loading}
          />
          
          <div className="file-drop-content">
            {selectedFile ? (
              <div className="selected-file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="clear-file-btn"
                  disabled={loading}
                  aria-label="Eliminar archivo seleccionado"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="file-drop-placeholder">
                <div className="upload-icon">📁</div>
                <span className="upload-text">
                  Haz clic aquí o arrastra tu archivo .DAT
                </span>
                <span className="upload-subtext">
                  Tamaño máximo: 50MB
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || loading || !!validationError}
            className={`process-button ${loading ? 'loading' : ''}`}
            type="button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Procesando...
              </>
            ) : (
              'Procesar Archivo'
            )}
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      <div className="status-section">
        {validationError && (
          <div className="status-message status-validation-error" role="alert">
            <span className="status-icon">⚠️</span>
            {validationError}
          </div>
        )}
        
        {loading && (
          <div className="status-message status-loading" role="status">
            <span className="status-icon loading-icon">⏳</span>
            Procesando el archivo, por favor espera...
          </div>
        )}
        
        {error && !loading && (
          <div className="status-message status-error" role="alert">
            <span className="status-icon">❌</span>
            Error: {error?.error || error?.message || 'Error desconocido'}
          </div>
        )}
        
        {message && !loading && !error && (
          <div className="status-message status-success" role="status">
            <span className="status-icon">✅</span>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessDatFileComponent;