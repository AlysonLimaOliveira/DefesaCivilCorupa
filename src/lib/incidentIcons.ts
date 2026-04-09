import { 
  AlertTriangle, 
  Droplets,
  Mountain,
  CloudRain,
  Thermometer,
  Building2,
  Flame,
  Cpu
} from 'lucide-react';
import { type IncidentCategory } from '../types';

export const getCategoryIcon = (category: IncidentCategory) => {
  switch (category) {
    case 'Hidrológica': return Droplets;
    case 'Geológica': return Mountain;
    case 'Meteorológica': return CloudRain;
    case 'Climatológica': return Thermometer;
    case 'Estrutural': return Building2;
    case 'Incêndio': return Flame;
    case 'Tecnológica': return Cpu;
    case 'Risco Potencial': return AlertTriangle;
    default: return AlertTriangle;
  }
};

export const getCategorySvgPath = (category: IncidentCategory) => {
  switch (category) {
    case 'Hidrológica': return '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>';
    case 'Geológica': return '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>';
    case 'Meteorológica': return '<path d="M4 14.89c0-4 3.13-7.24 7-7.24a6.3 6.3 0 0 1 4.4 1.74 4 4 0 0 1 3.2 3.91 4.14 4.14 0 0 1-4.14 4.14H7.14A3.14 3.14 0 0 1 4 14.89z"/><path d="M16 20l-2 2"/><path d="M8 20l-2 2"/><path d="M12 20v2"/>';
    case 'Climatológica': return '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>';
    case 'Estrutural': return '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4Z"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>';
    case 'Incêndio': return '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>';
    case 'Tecnológica': return '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>';
    case 'Risco Potencial': return '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>';
    default: return '<circle cx="12" cy="12" r="10"/>';
  }
};
