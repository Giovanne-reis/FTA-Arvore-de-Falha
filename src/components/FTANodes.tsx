import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Plus } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BaseNode = ({ 
  className, 
  data, 
  selected,
  showTopHandle = true,
  showBottomHandle = true,
  id
}: { 
  className?: string; 
  data: any;
  selected?: boolean;
  showTopHandle?: boolean;
  showBottomHandle?: boolean;
  id?: string;
}) => (
  <div className={cn(
    "group px-4 py-2 shadow-md border-2 transition-all min-w-[180px] text-center font-bold text-xs uppercase tracking-wider relative",
    selected ? "border-emerald-500 scale-105 shadow-xl" : "border-zinc-200",
    className
  )}>
    {showTopHandle && <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-zinc-400 border-white" />}
    
    {/* Add Child Button */}
    <button 
      onClick={(e) => {
        e.stopPropagation();
        data.onOpenAddChildMenu?.(e, id);
      }}
      className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-emerald-500 z-50 border-2 border-white"
      title="Adicionar sub-nó"
    >
      <Plus className="w-4 h-4" />
    </button>

    <div className="flex flex-col items-center justify-center min-h-[45px] leading-tight whitespace-pre-wrap">
      {data.label}
    </div>
    {showBottomHandle && <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-zinc-400 border-white" />}
  </div>
);

export const TopEventNode = memo(({ id, data, selected }: NodeProps) => (
  <BaseNode 
    id={id}
    data={data} 
    selected={selected} 
    className="bg-red-600 text-white rounded-md" 
    showTopHandle={false}
  />
));

export const ImmediateCauseNode = memo(({ id, data, selected }: NodeProps) => (
  <BaseNode 
    id={id}
    data={data} 
    selected={selected} 
    className="bg-blue-900 text-white rounded-md" 
  />
));

export const IntermediateCauseNode = memo(({ id, data, selected }: NodeProps) => (
  <BaseNode 
    id={id}
    data={data} 
    selected={selected} 
    className="bg-green-900 text-white rounded-md" 
  />
));

export const UndevelopedEventNode = memo(({ id, data, selected }: NodeProps) => (
  <div className="relative">
    <BaseNode 
      id={id}
      data={data} 
      selected={selected} 
      className="bg-pink-500 text-white rounded-md" 
    />
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-cyan-400 rotate-45 border border-white flex items-center justify-center">
      {(data.totalCount as number) > 1 && (
        <span className="text-[10px] font-bold text-white -rotate-45">{(data.index as number) + 1}</span>
      )}
    </div>
  </div>
));

export const BasicCauseNode = memo(({ id, data, selected }: NodeProps) => (
  <div className="relative">
    <BaseNode 
      id={id}
      data={data} 
      selected={selected} 
      className="bg-yellow-400 text-black rounded-md" 
    />
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-cyan-400 rounded-full border border-white flex items-center justify-center">
      {(data.totalCount as number) > 1 && (
        <span className="text-[10px] font-bold text-white">{(data.index as number) + 1}</span>
      )}
    </div>
  </div>
));

export const ContributingFactorNode = memo(({ id, data, selected }: NodeProps) => (
  <BaseNode 
    id={id}
    data={data} 
    selected={selected} 
    className="bg-sky-700 text-white rounded-md" 
  />
));

export const AndGateNode = memo(({ selected }: NodeProps) => (
  <div className={cn(
    "w-12 h-12 relative transition-all",
    selected ? "scale-110" : ""
  )}>
    <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-sm">
      <path 
        d="M 4,44 L 44,44 L 44,22 C 44,10 35,4 24,4 C 13,4 4,10 4,22 Z" 
        fill="#d2d2a0" 
        stroke={selected ? "#10b981" : "#4b5563"} 
        strokeWidth="2" 
      />
      <text x="24" y="32" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1f2937">E</text>
    </svg>
    <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 bg-gray-600 !top-1" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 bg-gray-600 !bottom-0" />
    <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 bg-gray-600 !left-0" />
    <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 bg-gray-600 !right-0" />
  </div>
));

export const OrGateNode = memo(({ selected }: NodeProps) => (
  <div className={cn(
    "w-12 h-12 relative transition-all",
    selected ? "scale-110" : ""
  )}>
    <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-sm">
      <path 
        d="M 4,44 Q 24,34 44,44 L 44,14 C 44,14 44,4 24,4 C 4,4 4,14 4,14 Z" 
        fill="#d2d2a0" 
        stroke={selected ? "#10b981" : "#4b5563"} 
        strokeWidth="2" 
      />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1f2937">OU</text>
    </svg>
    <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 bg-gray-600 !top-1" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 bg-gray-600 !bottom-0" />
    <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 bg-gray-600 !left-0" />
    <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 bg-gray-600 !right-0" />
  </div>
));

export const TransferInNode = memo(({ data, selected }: NodeProps) => (
  <div className={cn(
    "w-12 h-12 relative transition-all",
    selected ? "scale-110" : ""
  )}>
    <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-sm">
      <path 
        d="M 24,4 L 44,44 L 4,44 Z" 
        fill="#d2d2a0" 
        stroke={selected ? "#10b981" : "#4b5563"} 
        strokeWidth="2" 
      />
      <text x="24" y="38" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">{data.label}</text>
    </svg>
    <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 bg-gray-600 !top-1" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 bg-gray-600 !bottom-0" />
    <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 bg-gray-600 !left-0" />
    <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 bg-gray-600 !right-0" />
  </div>
));

export const TransferOutNode = memo(({ data, selected }: NodeProps) => (
  <div className={cn(
    "w-12 h-12 relative transition-all",
    selected ? "scale-110" : ""
  )}>
    <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-sm">
      <path 
        d="M 4,4 L 44,4 L 24,44 Z" 
        fill="#d2d2a0" 
        stroke={selected ? "#10b981" : "#4b5563"} 
        strokeWidth="2" 
      />
      <text x="24" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">{data.label}</text>
    </svg>
    <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 bg-gray-600 !top-1" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 bg-gray-600 !bottom-0" />
    <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 bg-gray-600 !left-0" />
    <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 bg-gray-600 !right-0" />
  </div>
));

export const AnnotationNode = memo(({ data, selected }: NodeProps) => (
  <div className={cn(
    "px-3 py-2 min-w-[100px] text-center transition-all relative group",
    selected ? "outline outline-1 outline-emerald-500/50 rounded-md bg-emerald-50/10" : "hover:outline hover:outline-1 hover:outline-zinc-200 hover:rounded-md"
  )}>
    <div className="text-sm font-medium text-zinc-700 whitespace-pre-wrap">{data.label || 'Texto...'}</div>
  </div>
));
