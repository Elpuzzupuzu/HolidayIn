import React from "react";
import { useDispatch } from "react-redux";
import { X, User, Calendar, Download } from "lucide-react"; // Se eliminó 'List' ya que ya no se usa para una sección separada
import "./styles/EmployeeResume.css";
import WorkedHoursSummary from "./WorkedHoursSummary";
import { downloadWorkedHoursCSV } from "../../features/datEvents/datEventsSlice";

const EmployeeResume = ({ resumen, workedHours = [], onClose }) => {
    const dispatch = useDispatch();

    if (!resumen) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString + 'T12:00:00'); // Ensure UTC neutrality for date parsing
            if (isNaN(date.getTime())) {
                // Fallback for different date formats if initial parsing fails
                const parts = dateString.split(/[-\/]/);
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexede
                    const day = parseInt(parts[2], 10);
                    const fallbackDate = new Date(year, month, day, 12);
                    if (!isNaN(fallbackDate.getTime())) {
                        return fallbackDate.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });
                    }
                }
                return "Fecha inválida"; // If all parsing attempts fail
            }
            return date.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (error) {
            console.error("Error al formatear fecha:", dateString, error);
            return "Error de fecha";
        }
    };

    // Esta función no se usa en el display actual del modal, pero la mantengo si la usas internamente
    const formatHours = (hours) => {
        if (!hours) return "0h 0m";
        const numHours = parseFloat(hours);
        const wholeHours = Math.floor(numHours);
        const minutes = Math.round((numHours - wholeHours) * 60);
        return `${wholeHours}h ${minutes}m`;
    };

    const totalDaysWithRecords = workedHours.length; // Cambiado de totalDays a totalDaysWithRecords para mayor claridad

    // Esta función no se usa en el display actual del modal, pero la mantengo si la usas internamente
    const calculateAverageHours = () => {
        if (totalDaysWithRecords === 0) return "0.00";
        const avgHours = parseFloat(resumen.total_hours || 0) / totalDaysWithRecords;
        return avgHours.toFixed(2);
    };

    const handleDownloadCSV = () => {
        dispatch(
            downloadWorkedHoursCSV({
                startDate: resumen.from,
                endDate: resumen.to,
                employeeNumber: resumen.employee_number,
            })
        );
    };

    return (
        <div className="employee-resume-overlay active">
            <div className="employee-resume-modal" role="dialog" aria-modal="true" aria-labelledby="employee-resume-title">
                <header className="employee-resume-header">
                    <div className="header-decoration-1" aria-hidden="true"></div>
                    <div className="header-decoration-2" aria-hidden="true"></div>

                    <div className="header-content">
                        <div className="header-info">
                            <div className="header-icon">
                                <User size={24} aria-hidden="true" />
                            </div>
                            <div className="header-text">
                                <h3 id="employee-resume-title" className="header-title">Resumen del Empleado</h3>
                                <p className="header-subtitle">#{resumen.employee_number}</p>
                                {resumen.employee_name && <p className="employee-name">{resumen.employee_name}</p>}
                                {resumen.employee_position && <p className="employee-position">{resumen.employee_position}</p>}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="header-close-btn"
                            aria-label="Cerrar resumen del empleado"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <section className="employee-resume-body">
                    <div className="info-section date-range-section">
                        <div className="section-header">
                            <Calendar size={18} aria-hidden="true" />
                            <h4 className="section-title">Período de Consulta</h4>
                        </div>
                        <div className="date-info-grid">
                            <span className="date-label">Desde:</span>
                            <span className="date-value">{formatDate(resumen.from)}</span>
                            <span className="date-label">Hasta:</span>
                            <span className="date-value">{formatDate(resumen.to)}</span>
                            {/* Días con Registros - Integrado en la misma sección */}
                            <span className="date-label">Días con Registros:</span>
                            <span className="date-value days-with-records-value">{totalDaysWithRecords} días</span>
                        </div>
                    </div>

                    {/* La sección Days with Records separada ha sido eliminada de aquí */}

                    <div className="results-wrapper">
                        {/* Se eliminó la etiqueta h3 duplicada dentro de WorkedHoursSummary */}
                        <WorkedHoursSummary
                            employeeNumber={resumen.employee_number}
                            from={resumen.from}
                            to={resumen.to}
                            // No pasar workedHours directamente si WorkedHoursSummary lo maneja internamente con Redux
                            // o si espera una prop específica de datos
                        />
                    </div>
                </section>

                <footer className="employee-resume-footer">
                    <button onClick={handleDownloadCSV} className="btn btn-download-csv">
                        <Download size={18} aria-hidden="true" /> Descargar CSV
                    </button>
                    <button onClick={onClose} className="btn btn-close-modal">
                        Cerrar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EmployeeResume;