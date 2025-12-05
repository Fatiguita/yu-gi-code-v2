import React from 'react';

const EffectIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    {...props}
  >
    {/* FIX: Corrected invalid characters in SVG path data. */}
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 005.568 2.033l1.884 1.884a.75.75 0 1 1-1.06 1.06l-1.884-1.884a2.25 2.25 0 01-1.28-1.545l-.813-2.846a2.25 2.25 0 00-4.216 0l-.813 2.846a2.25 2.25 0 01-1.28 1.545L4.05 13.45a.75.75 0 01-1.06-1.06l1.884-1.884a3.75 3.75 0 005.568-2.033l.813-2.846A.75.75 0 019 4.5zM15.75 9a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 005.568 2.033l1.884 1.884a.75.75 0 1 1-1.06 1.06l-1.884-1.884a2.25 2.25 0 01-1.28-1.545l-.813-2.846a2.25 2.25 0 00-4.216 0l-.813 2.846a2.25 2.25 0 01-1.28 1.545l-1.884 1.884a.75.75 0 01-1.06-1.06l1.884-1.884a3.75 3.75 0 005.568-2.033l.813-2.846A.75.75 0 0115.75 9z" clipRule="evenodd" />
  </svg>
);

export default EffectIcon;