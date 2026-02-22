import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { attendanceAPI, eventAPI } from '../../utils/api';
import './AttendanceDashboard.css';

const AttendanceDashboard = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState({});
  const [attendanceList, setAttendanceList] = useState([]);
  const [filterScanned, setFilterScanned] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [manualReason, setManualReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, attendanceRes] = await Promise.all([
        eventAPI.getById(eventId),
        attendanceAPI.getEventAttendance(eventId)
      ]);
      
      setEvent(eventRes.data);
      setStats(attendanceRes.data.stats);
      setAttendanceList(attendanceRes.data.attendanceList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await attendanceAPI.exportCSV(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.eventName}-attendance.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting CSV');
    }
  };

  const openManualModal = (participant) => {
    setSelectedParticipant(participant);
    setShowManualModal(true);
    setManualReason('');
  };

  const closeManualModal = () => {
    setShowManualModal(false);
    setSelectedParticipant(null);
    setManualReason('');
  };

  const handleManualAttendance = async () => {
    if (!selectedParticipant || !manualReason.trim()) {
      toast.error('Please provide a reason for manual override');
      return;
    }

    try {
      await attendanceAPI.markManual({
        eventId,
        participantId: selectedParticipant.participant._id,
        reason: manualReason
      });
      
      toast.success('Manual attendance marked');
      fetchData();
      closeManualModal();
    } catch (error) {
      console.error('Manual attendance error:', error);
      toast.error(error.response?.data?.message || 'Error marking attendance');
    }
  };

  const filteredList = attendanceList.filter(item => {
    if (filterScanned === 'scanned') return item.scanned;
    if (filterScanned === 'not-scanned') return !item.scanned;
    return true;
  });

  const scanPercentage = stats.total > 0 ? ((stats.scanned / stats.total) * 100).toFixed(1) : 0;

  if (loading) {
    return <div className="loading">Loading attendance data...</div>;
  }

  return (
    <div className="attendance-dashboard-page">
      <div className="attendance-dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>📊 Attendance Dashboard</h1>
            {event && <p className="event-name">{event.eventName}</p>}
          </div>
          <div className="header-actions">
            <button onClick={() => navigate(`/organizer/events/${eventId}/scanner`)} className="btn btn-scan">
              📷 Open Scanner
            </button>
            <button onClick={handleExportCSV} className="btn btn-export">
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total || 0}</div>
              <div className="stat-label">Total Registered</div>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.scanned || 0}</div>
              <div className="stat-label">Scanned</div>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.notScanned || 0}</div>
              <div className="stat-label">Not Scanned</div>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">✋</div>
            <div className="stat-info">
              <div className="stat-value">{stats.manualOverrides || 0}</div>
              <div className="stat-label">Manual</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span>Attendance Progress</span>
            <span className="progress-percent">{scanPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${scanPercentage}%` }}></div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={filterScanned === 'all' ? 'active' : ''}
            onClick={() => setFilterScanned('all')}
          >
            All ({attendanceList.length})
          </button>
          <button
            className={filterScanned === 'scanned' ? 'active' : ''}
            onClick={() => setFilterScanned('scanned')}
          >
            Scanned ({stats.scanned || 0})
          </button>
          <button
            className={filterScanned === 'not-scanned' ? 'active' : ''}
            onClick={() => setFilterScanned('not-scanned')}
          >
            Not Scanned ({stats.notScanned || 0})
          </button>
        </div>

        {/* Attendance List */}
        <div className="attendance-list">
          {filteredList.length === 0 ? (
            <div className="no-data">No participants found</div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roll Number</th>
                  <th>Status</th>
                  <th>Scanned At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => (
                  <tr key={item.registration._id} className={item.scanned ? 'scanned' : ''}>
                    <td>{item.participant.name}</td>
                    <td>{item.participant.email}</td>
                    <td>{item.participant.rollNumber || 'N/A'}</td>
                    <td>
                      {item.scanned ? (
                        <span className="status-badge scanned">
                          ✓ Scanned
                          {item.isManual && <span className="manual-tag"> (Manual)</span>}
                        </span>
                      ) : (
                        <span className="status-badge not-scanned">⏳ Pending</span>
                      )}
                    </td>
                    <td>
                      {item.scannedAt ? new Date(item.scannedAt).toLocaleString() : '-'}
                    </td>
                    <td>
                      {!item.scanned && (
                        <button
                          onClick={() => openManualModal(item)}
                          className="btn-manual"
                          title="Manual override"
                        >
                          ✋ Manual
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={closeManualModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeManualModal}>×</button>
            <h2>Manual Attendance Override</h2>
            <div className="modal-body">
              <div className="participant-info">
                <p><strong>Name:</strong> {selectedParticipant.participant.name}</p>
                <p><strong>Email:</strong> {selectedParticipant.participant.email}</p>
              </div>
              <div className="form-group">
                <label>Reason for manual override *</label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g., QR code not working, lost ticket, etc."
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button onClick={handleManualAttendance} className="btn btn-primary">
                  Mark Attendance
                </button>
                <button onClick={closeManualModal} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
