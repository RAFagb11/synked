// src/components/StudentCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const StudentCard = ({ student, onMessage }) => {
  // Safety check for undefined student
  if (!student) {
    return (
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p style={{ color: '#666' }}>Student data not available</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
      border: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid #eee',
          flexShrink: 0
        }}>
          {student.photoURL ? (
            <img
              src={student.photoURL}
              alt={student.fullName || 'Student'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `
                  <div style="
                    width: 100%;
                    height: 100%;
                    backgroundColor: var(--primary);
                    color: white;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    fontSize: 24px;
                    fontWeight: bold
                  ">
                    ${student.fullName ? student.fullName.charAt(0) : 'S'}
                  </div>
                `;
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {student.fullName ? student.fullName.charAt(0) : 'S'}
            </div>
          )}
        </div>
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>{student.fullName || 'Student'}</h3>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {student.college || 'College'}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {student.major || 'Major'}
          </div>
        </div>
      </div>
      
      {student.bio && (
        <div style={{ marginBottom: '15px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {student.bio.length > 120 ? `${student.bio.substring(0, 120)}...` : student.bio}
          </p>
        </div>
      )}
      
      {student.skills && student.skills.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {student.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  backgroundColor: 'rgba(108, 99, 255, 0.1)',
                  color: 'var(--primary)',
                  borderRadius: '12px'
                }}
              >
                {skill}
              </span>
            ))}
            {student.skills.length > 3 && (
              <span style={{
                fontSize: '12px',
                padding: '3px 8px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                borderRadius: '12px'
              }}>
                +{student.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to={`/students/${student.id}`}
            className="btn btn-outline"
            style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: '14px' }}
          >
            View Profile
          </Link>
          {onMessage && (
            <button
              onClick={onMessage}
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 0', fontSize: '14px' }}
            >
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCard;