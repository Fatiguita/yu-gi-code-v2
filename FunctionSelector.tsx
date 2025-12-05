import React, { useState, useMemo } from 'react';
import { CoderCard } from './types';

interface FunctionSelectorProps {
    allFunctions: string[];
    functionCategories: Record<string, string>;
    selectedFunctions: Set<string>;
    setSelectedFunctions: React.Dispatch<React.SetStateAction<Set<string>>>;
    onGenerate: (options: { batchSize: number; cooldown: number }) => void;
    isLoading: boolean;
    presentationCards: CoderCard[];
    title: string;
    description: string;
    filterPlaceholder: string;
    generateButtonText: string;
}

const TIER_ORDER = ['Core', 'Staple', 'Situational', 'Niche'];
const TIER_COLORS: Record<string, string> = {
    Core: 'text-yellow-300 border-yellow-400',
    Staple: 'text-sky-300 border-sky-400',
    Situational: 'text-green-300 border-green-400',
    Niche: 'text-gray-400 border-gray-500',
};


const FunctionSelector: React.FC<FunctionSelectorProps> = ({ 
    allFunctions, 
    functionCategories,
    selectedFunctions, 
    setSelectedFunctions, 
    onGenerate,
    isLoading,
    presentationCards,
    title,
    description,
    filterPlaceholder,
    generateButtonText
}) => {
    const [filter, setFilter] = useState('');
    const [batchSize, setBatchSize] = useState(10);
    const [cooldown, setCooldown] = useState(5);
    const [openTiers, setOpenTiers] = useState<Record<string, boolean>>({
        Core: true,
        Staple: true,
        Situational: false,
        Niche: false,
    });

    const handleTierToggle = (tier: string) => {
        setOpenTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
    };

    const handleSelectionChange = (functionName: string) => {
        setSelectedFunctions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(functionName)) {
                newSet.delete(functionName);
            } else {
                newSet.add(functionName);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const functionsToSelect = allFunctions.filter(func => 
            func.toLowerCase().includes(filter.toLowerCase())
        );
        setSelectedFunctions(new Set(functionsToSelect));
    };

    const handleDeselectAll = () => {
        setSelectedFunctions(new Set());
    };

    const handleSelectPresentation = () => {
        const presentationFunctionNames = presentationCards.map(card => card.name);
        setSelectedFunctions(prev => {
            const newSet = new Set(prev);
            presentationFunctionNames.forEach(name => newSet.add(name));
            return newSet;
        });
    };
    
    const categorizedFunctions = useMemo(() => {
        const grouped: Record<string, string[]> = { Core: [], Staple: [], Situational: [], Niche: [] };
        
        allFunctions.forEach(func => {
            const category = functionCategories[func] || 'Situational';
            if (grouped.hasOwnProperty(category)) {
                grouped[category].push(func);
            } else {
                grouped['Niche'].push(func);
            }
        });

        Object.values(grouped).forEach(arr => arr.sort((a,b) => a.localeCompare(b)));

        return grouped;
    }, [allFunctions, functionCategories]);


    const BATCH_THRESHOLD = 10;

    return (
        <div className="max-w-6xl mx-auto bg-surface-1 bg-opacity-70 p-6 rounded-lg border border-accent">
            <h3 className="text-center text-2xl font-bold text-accent mb-4">{title}</h3>
            <p className="text-center text-muted mb-6">{description}</p>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
                <input 
                    type="text"
                    placeholder={filterPlaceholder}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full sm:w-auto flex-grow py-2 px-3 border rounded-md focus:outline-none focus:ring-2 form-input"
                />
                 <div className="flex gap-2 flex-wrap justify-center">
                    {presentationCards.length > 0 && (
                        <button onClick={handleSelectPresentation} className="bg-secondary hover:brightness-110 text-main font-bold py-2 px-4 rounded shadow-md transition-colors text-sm">Select Presentation</button>
                    )}
                    <button onClick={handleSelectAll} className="bg-secondary hover:brightness-110 text-main font-bold py-2 px-4 rounded shadow-md transition-colors text-sm">Select All (Filtered)</button>
                    <button onClick={handleDeselectAll} className="bg-secondary hover:brightness-110 text-main font-bold py-2 px-4 rounded shadow-md transition-colors text-sm">Deselect All</button>
                </div>
            </div>
            
            {/* Batching Controls */}
             {selectedFunctions.size > BATCH_THRESHOLD && (
                <div className="mb-4 p-4 bg-surface-2 rounded-lg border border-muted text-sm flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                    <p className="font-bold text-accent">Large selection detected!</p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="batch-size" className="text-muted whitespace-nowrap">Cards per batch:</label>
                        <input
                            id="batch-size"
                            type="number"
                            value={batchSize}
                            onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value, 10)) || 1)}
                            className="form-input w-20 py-1 px-2 rounded-md"
                            min="1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <label htmlFor="cooldown" className="text-muted whitespace-nowrap">Cooldown (sec):</label>
                        <input
                            id="cooldown"
                            type="number"
                            value={cooldown}
                            onChange={(e) => setCooldown(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                            className="form-input w-20 py-1 px-2 rounded-md"
                            min="0"
                        />
                    </div>
                </div>
            )}

            {/* Function List */}
            <div className="max-h-80 overflow-y-auto bg-black bg-opacity-30 p-4 rounded-md border border-muted space-y-2">
               {TIER_ORDER.map(tier => {
                    const filteredTierFunctions = categorizedFunctions[tier]?.filter(func => 
                        func.toLowerCase().includes(filter.toLowerCase())
                    ) || [];

                    if (filteredTierFunctions.length === 0) return null;

                    return (
                        <div key={tier}>
                            <button onClick={() => handleTierToggle(tier)} className={`w-full text-left font-bold text-lg mb-2 pb-1 border-b-2 flex justify-between items-center ${TIER_COLORS[tier] || 'text-main border-muted'}`}>
                                <span>
                                    {tier} 
                                    <span className="text-sm font-normal text-muted ml-2">({filteredTierFunctions.length})</span>
                                </span>
                                <svg className={`w-5 h-5 transition-transform ${openTiers[tier] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openTiers[tier] && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm pt-2 pb-4">
                                    {filteredTierFunctions.map(func => (
                                        <label key={func} className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors">
                                            <input 
                                                type="checkbox"
                                                checked={selectedFunctions.has(func)}
                                                onChange={() => handleSelectionChange(func)}
                                                className="form-checkbox h-4 w-4 bg-surface-2 border-muted rounded focus:ring-accent"
                                            />
                                            <span className="truncate" title={func}>{func}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
               })}
            </div>

            {/* Generate Button */}
            <div className="mt-6 text-center">
                <button 
                    onClick={() => onGenerate({ batchSize, cooldown })}
                    disabled={isLoading || selectedFunctions.size === 0}
                    className="btn btn-primary"
                >
                    {isLoading ? 'Generating...' : `${generateButtonText} ${selectedFunctions.size} Cards`}
                </button>
            </div>
        </div>
    );
};

export default FunctionSelector;