import React from 'react';

interface RepairSiteProps {
  type: 'repair' | 'option';
  tileSize: number;
}

export default function RepairSite({ type, tileSize }: RepairSiteProps) {
  const fontSize = tileSize * 0.3;
  const isOption = type === 'option';
  const bgColor = isOption ? 'bg-purple-600' : 'bg-yellow-600';
  const innerColor = isOption ? 'bg-purple-500' : 'bg-yellow-500';
  const icon = isOption ? '🛠️' : '🔧';

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div 
        className={`${bgColor} rounded-full p-1`} 
        style={{ width: `${tileSize * 0.75}px`, height: `${tileSize * 0.75}px` }}
      >
        <div className={`${innerColor} rounded-full w-full h-full flex items-center justify-center`}>
          <span 
            style={{ 
              fontSize: `${fontSize * 1.4}px`, 
              ...(type === 'repair' && { filter: 'grayscale(100%) brightness(0%)' })
            }}
          >
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}