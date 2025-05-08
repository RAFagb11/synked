// src/components/VideoRecorder.js
import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const VideoRecorder = ({ userId, projectId, onVideoReady }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const MAX_RECORDING_TIME = 120; // 2 minutes in seconds

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Error accessing camera:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const uploadVideo = async () => {
    if (!videoBlob) return;
    
    setUploading(true);
    try {
      const filename = `applications/${userId}/${projectId}/video_${Date.now()}.webm`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, videoBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      onVideoReady(downloadURL);
    } catch (err) {
      setError('Failed to upload video');
      console.error('Error uploading video:', err);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ marginBottom: '25px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
        Video Introduction (Required)
      </label>
      
      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '8px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '15px',
        backgroundColor: '#f8fafc'
      }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          style={{ 
            width: '100%', 
            borderRadius: '8px', 
            backgroundColor: '#000',
            maxHeight: '300px'
          }}
        />
        
        {isRecording && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '10px',
            color: 'var(--danger)',
            fontWeight: '500'
          }}>
            Recording: {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        {!isRecording && !videoBlob && (
          <button 
            onClick={startRecording}
            className="btn btn-primary"
            style={{ flex: '1' }}
          >
            Start Recording
          </button>
        )}
        
        {isRecording && (
          <button 
            onClick={stopRecording}
            className="btn btn-warning"
            style={{ flex: '1' }}
          >
            Stop Recording
          </button>
        )}
        
        {videoBlob && !uploading && (
          <>
            <button 
              onClick={() => setVideoBlob(null)}
              className="btn btn-outline"
              style={{ flex: '1' }}
            >
              Record Again
            </button>
            <button 
              onClick={uploadVideo}
              className="btn btn-primary"
              style={{ flex: '1' }}
            >
              Save Video
            </button>
          </>
        )}
        
        {uploading && (
          <button 
            disabled
            className="btn btn-primary"
            style={{ flex: '1' }}
          >
            Uploading...
          </button>
        )}
      </div>
      
      <p style={{ fontSize: '14px', color: '#666' }}>
        Record a 2-minute introduction. Introduce yourself and explain why you're a good fit for this project.
      </p>
    </div>
  );
};

export default VideoRecorder;