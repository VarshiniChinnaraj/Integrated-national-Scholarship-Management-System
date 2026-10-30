import React from 'react';

const StatsCard = ({ title, value, subtitle, icon, iconBg = '#dbeafe', iconColor = '#2563eb', trend, trendType = 'positive' }) => {
  return (
    <div className="stats-card h-100 d-flex flex-column justify-content-between p-3 p-sm-4">
      <div className="d-flex align-items-start justify-content-between mb-2 mb-sm-3 gap-2">
        <div className="min-w-0 flex-grow-1">
          <span className="text-muted fw-bold text-uppercase d-block text-truncate" style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>
            {title}
          </span>
          <h3 className="fw-extrabold mb-0 mt-1" style={{ color: 'var(--charcoal)', fontSize: '1.75rem', letterSpacing: '-0.02em', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {value}
          </h3>
        </div>
        <div
          className="icon-box shadow-xs"
          style={{ 
            backgroundColor: iconBg, 
            color: iconColor,
            width: '44px',
            height: '44px',
            borderRadius: '12px'
          }}
        >
          {icon}
        </div>
      </div>
      
      <div>
        {subtitle && (
          <p className="text-secondary mb-0 fw-medium text-truncate-2" style={{ fontSize: '0.78rem' }}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="mt-2">
            <span className={`badge rounded-pill px-2.5 py-1 ${
              trendType === 'positive' 
                ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-20' 
                : 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20'
            }`} style={{ fontSize: '0.7rem' }}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
