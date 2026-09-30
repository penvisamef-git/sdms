import React from 'react';
import './error.style.css'; // We'll create this

function ErrorComponent() {
  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">🚀</div>
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Oops! Page Not Found</h2>
        <p className="error-message">
          The page you're looking for seems to have vanished into thin air.
          <br />
          Let's get you back on track.
        </p>
        <button className="error-button" onClick={() => window.location.href = '/'}>
          🏠 Back to Home
        </button>
        <div className="error-emoji">😅</div>
      </div>
    </div>
  );
}

export default ErrorComponent;