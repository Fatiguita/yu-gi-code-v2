import React, { useState } from 'react';
import EffectIcon from './icons/EffectIcon';
import ParametersIcon from './icons/ParametersIcon';
import ReturnsIcon from './icons/ReturnsIcon';
import StructureIcon from './icons/StructureIcon';
import EffectRegionIcon from './icons/EffectRegionIcon';
import UtilityIcon from './icons/UtilityIcon';
import RenderIcon from './icons/RenderIcon';

const attributeData = [
  { name: 'STRUCTURE', Icon: StructureIcon, description: 'State, memory, and architecture', color: 'text-yellow-400' },
  { name: 'EFFECT', Icon: EffectRegionIcon, description: 'Side effects, events, and async ops', color: 'text-purple-400' },
  { name: 'UTILITY', Icon: UtilityIcon, description: 'Data transformation and helpers', color: 'text-gray-400' },
  { name: 'RENDER', Icon: RenderIcon, description: 'UI, styling, and DOM manipulation', color: 'text-blue-400' },
];

const iconData = [
  { Icon: EffectIcon, name: 'Effect', description: 'The primary purpose and action of the function.', color: 'text-yellow-300' },
  { Icon: ParametersIcon, name: 'Parameters', description: 'The inputs the function accepts.', color: 'text-blue-300' },
  { Icon: ReturnsIcon, name: 'Returns', description: 'The output or value the function provides.', color: 'text-green-300' },
];

const loreData = [
    {
        region: "The Dominion of State & Structure",
        attribute: "STRUCTURE",
        Icon: StructureIcon,
        color: "text-yellow-400",
        clans: [
            { name: "Keystone Architects", description: "Core architecture, modules, classes." },
            { name: "Mutable Weavers", description: "State management and in-memory variables." },
            { name: "Eternal Scribes", description: "Data persistence and storage." },
            { name: "Synchronous Sentinels", description: "Control flow and synchronous operations." },
        ]
    },
    {
        region: "The Ethereal Plane of Effects & Events",
        attribute: "EFFECT",
        Icon: EffectRegionIcon,
        color: "text-purple-400",
        clans: [
            { name: "Asynchronous Phantoms", description: "Async operations, Promises, async/await." },
            { name: "Lifecycle Druids", description: "Component lifecycles (mount, update, unmount)." },
            { name: "Network Voyagers", description: "API calls and networking." },
            { name: "Event Listeners", description: "User interaction and system events." },
        ]
    },
    {
        region: "The Forgelands of Transformation & Utility",
        attribute: "UTILITY",
        Icon: UtilityIcon,
        color: "text-gray-400",
        clans: [
            { name: "Array Legion", description: "Array and list manipulation." },
            { name: "String Binders", description: "String manipulation and Regex." },
            { name: "Math Magi", description: "Mathematical and numerical operations." },
            { name: "Boolean Oracles", description: "Logic, conditions, and comparison." },
        ]
    },
    {
        region: "The Canvas of Creation & Rendering",
        attribute: "RENDER",
        Icon: RenderIcon,
        color: "text-blue-400",
        clans: [
            { name: "Canvas Painters", description: "Low-level graphics and WebGL." },
            { name: "DOM Shapers", description: "UI element creation and manipulation." },
            { name: "Style Alchemists", description: "CSS, styling, and visual adjustments." },
            { name: "File Forgers", description: "File system I/O operations." },
        ]
    },
];


const Legend: React.FC = () => {
  const [isLoreExpanded, setIsLoreExpanded] = useState(false);

  return (
    <div className="max-w-4xl mx-auto bg-surface-1 bg-opacity-70 p-3 sm:p-4 rounded-lg border border-accent">
      <h3 className="text-center text-xl font-bold text-accent mb-4">Card Legend</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        {/* Attribute Legend */}
        <div>
          <h4 className="font-bold text-main mb-2">Attributes:</h4>
          <div className="space-y-2">
            {attributeData.map(attr => (
              <div key={attr.name} className="flex items-center gap-2">
                <attr.Icon className={`w-5 h-5 flex-shrink-0 ${attr.color}`} />
                <span className="font-bold text-gray-200">{attr.name}:</span>
                <span className="text-muted">{attr.description}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Icon Legend */}
        <div>
          <h4 className="font-bold text-main mb-2">Description Icons:</h4>
          <div className="space-y-2">
             {iconData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                    <item.Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                    <span className="font-bold text-gray-200">{item.name}:</span>
                    <span className="text-muted">{item.description}</span>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* World Lore Section */}
      <div className="mt-4 pt-4 border-t border-muted">
        <button
          onClick={() => setIsLoreExpanded(!isLoreExpanded)}
          className="w-full flex justify-between items-center text-left text-lg font-bold text-main hover:text-accent transition-colors"
        >
          <span>World Lore</span>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isLoreExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isLoreExpanded && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {loreData.map(region => (
              <div key={region.region}>
                <h5 className={`flex items-center gap-2 font-bold ${region.color} mb-2`}>
                  <region.Icon className="w-5 h-5" />
                  {region.region}
                </h5>
                <ul className="space-y-1 pl-4">
                  {region.clans.map(clan => (
                    <li key={clan.name}>
                      <span className="font-bold text-gray-300">{clan.name}:</span>
                      <span className="text-muted ml-1">{clan.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Legend;
