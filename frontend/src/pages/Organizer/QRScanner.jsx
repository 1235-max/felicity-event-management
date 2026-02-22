import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { attendanceAPI, eventAPI } from '../../utils/api';
import jsQR from 'jsqr';
import './QRScanner.css';

const QRScanner = () => {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    fetchEvent();
    return () => {
      stopCamera();
    };
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getById(eventId);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Error loading event');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setScanning(true);
        requestAnimationFrame(scanFrame);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRDetected(code.data);
        return;
      }
    }

    requestAnimationFrame(scanFrame);
  };

  const handleQRDetected = async (qrData) => {
    stopCamera();
    
    try {
      console.log('QR Data detected:', qrData);
      console.log('Event ID:', eventId);
      
      const response = await attendanceAPI.scanQR({
        qrData,
        eventId,
        scanMethod: 'camera'
      });

      setScanResult({
        success: true,
        data: response.data
      });
      toast.success(`✅ Attendance marked for ${response.data.participant.name}`);
    } catch (error) {
      console.error('Scan error:', error);
      
      if (error.response?.data?.alreadyScanned) {
        setScanResult({
          success: false,
          duplicate: true,
          message: 'Duplicate scan detected',
          attendance: error.response.data.attendance
        });
        toast.error('⚠️ Duplicate scan! Already marked attendance.');
      } else {
        setScanResult({
          success: false,
          message: error.response?.data?.message || 'Invalid QR code'
        });
        toast.error(error.response?.data?.message || 'Scan failed');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRDetected(code.data);
        } else {
          toast.error('No QR code found in image');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const resetScanner = () => {
    setScanResult(null);
  };

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-container">
        <div className="scanner-header">
          <h1>📷 QR Scanner</h1>
          {event && <p>{event.eventName}</p>}
        </div>

        {!scanResult ? (
          <div className="scanner-interface">
            {scanning ? (
              <div className="camera-view">
                <video ref={videoRef} autoPlay playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="scan-overlay">
                  <div className="scan-box"></div>
                  <p>Align QR code within frame</p>
                </div>
                <button onClick={stopCamera} className="btn btn-stop">
                  Stop Camera
                </button>
              </div>
            ) : (
              <div className="scanner-options">
                <button onClick={startCamera} className="btn btn-primary">
                  📷 Scan with Camera
                </button>
                <div className="divider">OR</div>
                <label className="btn btn-secondary">
                  📁 Upload QR Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}
          </div>
        ) : (
          <div className="scan-result">
            {scanResult.success ? (
              <div className="result-success">
                <div className="success-icon">✅</div>
                <h2>Attendance Marked!</h2>
                <div className="participant-details">
                  <p><strong>Name:</strong> {scanResult.data.participant.name}</p>
                  <p><strong>Email:</strong> {scanResult.data.participant.email}</p>
                  {scanResult.data.participant.rollNumber && (
                    <p><strong>Roll No:</strong> {scanResult.data.participant.rollNumber}</p>
                  )}
                  <p><strong>Scanned At:</strong> {new Date(scanResult.data.attendance.scannedAt).toLocaleString()}</p>
                </div>
                <button onClick={resetScanner} className="btn btn-primary">
                  Scan Next
                </button>
              </div>
            ) : (
              <div className="result-error">
                <div className="error-icon">❌</div>
                <h2>{scanResult.duplicate ? 'Duplicate Scan' : 'Scan Failed'}</h2>
                <p>{scanResult.message}</p>
                {scanResult.duplicate && scanResult.attendance && (
                  <div className="duplicate-info">
                    <p>Already scanned at: {new Date(scanResult.attendance.scannedAt).toLocaleString()}</p>
                  </div>
                )}
                <button onClick={resetScanner} className="btn btn-secondary">
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
