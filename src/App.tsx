/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  Node,
  getOutgoers,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Trash2, 
  Download, 
  Settings2, 
  Info,
  AlertTriangle,
  Zap,
  Layers,
  HelpCircle,
  FileText,
  Share2,
  Image as ImageIcon,
  FileDown,
  Lightbulb,
  ChevronRight,
  X,
  Grid,
  Save,
  FolderOpen,
  History,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { 
  TopEventNode,
  ImmediateCauseNode,
  IntermediateCauseNode,
  UndevelopedEventNode,
  BasicCauseNode,
  ContributingFactorNode,
  AndGateNode,
  OrGateNode,
  TransferInNode,
  TransferOutNode,
  AnnotationNode,
  cn
} from './components/FTANodes';
import { COMMON_EQUIPMENT_FAILURES } from './constants/suggestions';

import { getFTASuggestions, getLocalUsage, AIProvider } from './services/geminiService';

const nodeTypes = {
  topEvent: TopEventNode,
  immediateCause: ImmediateCauseNode,
  intermediateCause: IntermediateCauseNode,
  undevelopedEvent: UndevelopedEventNode,
  basicCause: BasicCauseNode,
  contributingFactor: ContributingFactorNode,
  andGate: AndGateNode,
  orGate: OrGateNode,
  transferIn: TransferInNode,
  transferOut: TransferOutNode,
  annotation: AnnotationNode,
};

const defaultEdgeOptions = {
  type: 'step',
  style: { strokeWidth: 2, stroke: '#94a3b8' },
};

const Sidebar = () => {
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('custom_gemini_api_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('custom_openai_api_key') || '');
  const [activeProvider, setActiveProvider] = useState<AIProvider>((localStorage.getItem('active_ai_provider') as AIProvider) || 'gemini');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [usage, setUsage] = useState(getLocalUsage());

  const handleSaveKeys = () => {
    localStorage.setItem('custom_gemini_api_key', geminiKey);
    localStorage.setItem('custom_openai_api_key', openaiKey);
    localStorage.setItem('active_ai_provider', activeProvider);
    setShowKeyInput(false);
    window.location.reload(); // Reload to apply new settings
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setUsage(getLocalUsage());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-zinc-50 border-r border-zinc-200 p-6 flex flex-col gap-6 overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-4 h-4" /> Elementos da Árvore
        </h2>
        <p className="text-zinc-400 text-[10px]">Arraste para o canvas para adicionar</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div
            className="bg-red-600 p-3 rounded-lg cursor-grab active:cursor-grabbing text-white font-bold text-xs text-center shadow-sm hover:brightness-110 transition-all border border-red-700"
            onDragStart={(event) => onDragStart(event, 'topEvent')}
            draggable
          >
            EVENTO DE TOPO
          </div>
          <div
            className="bg-blue-900 p-3 rounded-lg cursor-grab active:cursor-grabbing text-white font-bold text-xs text-center shadow-sm hover:brightness-110 transition-all border border-blue-950"
            onDragStart={(event) => onDragStart(event, 'immediateCause')}
            draggable
          >
            CAUSA IMEDIATA
          </div>
          <div
            className="bg-green-900 p-3 rounded-lg cursor-grab active:cursor-grabbing text-white font-bold text-xs text-center shadow-sm hover:brightness-110 transition-all border border-green-950"
            onDragStart={(event) => onDragStart(event, 'intermediateCause')}
            draggable
          >
            CAUSA INTERMEDIÁRIA
          </div>
          <div
            className="bg-pink-500 p-3 rounded-lg cursor-grab active:cursor-grabbing text-white font-bold text-xs text-center shadow-sm hover:brightness-110 transition-all border border-pink-600"
            onDragStart={(event) => onDragStart(event, 'undevelopedEvent')}
            draggable
          >
            EVENTO DESCARTADO
          </div>
          <div
            className="bg-yellow-400 p-3 rounded-lg cursor-grab active:cursor-grabbing text-black font-bold text-xs text-center shadow-sm hover:brightness-110 transition-all border border-yellow-500"
            onDragStart={(event) => onDragStart(event, 'basicCause')}
            draggable
          >
            CAUSA BÁSICA
          </div>
          <div
            className="bg-sky-700 p-3 rounded-lg cursor-grab active:cursor-grabbing text-white font-bold text-xs text-center shadow-sm hover:brightness-110 transition-all border border-sky-800"
            onDragStart={(event) => onDragStart(event, 'contributingFactor')}
            draggable
          >
            FATOR CONTRIBUINTE
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 space-y-2">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Portões Lógicos</h3>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:brightness-110 transition-all p-1"
              onDragStart={(event) => onDragStart(event, 'andGate')}
              draggable
            >
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path d="M 4,44 L 44,44 L 44,22 C 44,10 35,4 24,4 C 13,4 4,10 4,22 Z" fill="#d2d2a0" stroke="#4b5563" strokeWidth="2" />
                <text x="24" y="32" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1f2937">E</text>
              </svg>
            </div>
            <div
              className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:brightness-110 transition-all p-1"
              onDragStart={(event) => onDragStart(event, 'orGate')}
              draggable
            >
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path d="M 4,44 Q 24,34 44,44 L 44,14 C 44,14 44,4 24,4 C 4,4 4,14 4,14 Z" fill="#d2d2a0" stroke="#4b5563" strokeWidth="2" />
                <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1f2937">OU</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 space-y-2">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Transferência</h3>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:brightness-110 transition-all p-1"
              onDragStart={(event) => onDragStart(event, 'transferIn')}
              draggable
            >
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path d="M 24,4 L 44,44 L 4,44 Z" fill="#d2d2a0" stroke="#4b5563" strokeWidth="2" />
                <text x="24" y="38" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">VAI</text>
              </svg>
            </div>
            <div
              className="flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:brightness-110 transition-all p-1"
              onDragStart={(event) => onDragStart(event, 'transferOut')}
              draggable
            >
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path d="M 4,4 L 44,4 L 24,44 Z" fill="#d2d2a0" stroke="#4b5563" strokeWidth="2" />
                <text x="24" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">VEM</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 space-y-2">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Anotação</h3>
          <div
            className="bg-white p-3 rounded-lg cursor-grab active:cursor-grabbing text-zinc-600 font-medium text-xs text-center border-2 border-dashed border-zinc-300 shadow-sm hover:bg-zinc-50 transition-all"
            onDragStart={(event) => onDragStart(event, 'annotation')}
            draggable
          >
            CAIXA DE TEXTO
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-200 space-y-4">
        <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-zinc-600 text-xs font-bold flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" /> Inteligência Artificial
            </h4>
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <Settings2 className="w-3 h-3" />
            </button>
          </div>
          
          {showKeyInput ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Provedor Ativo</label>
                <select 
                  className="w-full p-1.5 text-[10px] border border-zinc-300 rounded bg-white"
                  value={activeProvider}
                  onChange={(e) => setActiveProvider(e.target.value as AIProvider)}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI ChatGPT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">Gemini API Key</label>
                <input 
                  type="password"
                  placeholder="Insira sua Gemini API Key..."
                  className="w-full p-1.5 text-[10px] border border-zinc-300 rounded bg-white"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase">OpenAI API Key</label>
                <input 
                  type="password"
                  placeholder="Insira sua OpenAI API Key..."
                  className="w-full p-1.5 text-[10px] border border-zinc-300 rounded bg-white"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleSaveKeys}
                  className="flex-1 bg-zinc-800 text-white text-[10px] py-1.5 rounded hover:bg-zinc-700 font-bold"
                >
                  Salvar
                </button>
                <button 
                  onClick={() => setShowKeyInput(false)}
                  className="flex-1 bg-zinc-200 text-zinc-600 text-[10px] py-1.5 rounded hover:bg-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-zinc-500 text-[10px] font-medium">
                  {activeProvider === 'gemini' ? 'Google Gemini' : 'OpenAI ChatGPT'}
                </p>
                <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-bold uppercase">Ativo</span>
              </div>
              <div className="pt-2 border-t border-zinc-200">
                <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Uso da Sessão</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${Math.min((usage / 50) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600">{usage} chamadas</span>
                </div>
                <p className="text-[8px] text-zinc-400 mt-1 italic">* O limite gratuito varia por provedor.</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-200">
          <h4 className="text-zinc-600 text-xs font-bold mb-2 flex items-center gap-2">
            <Info className="w-3 h-3" /> Dica
          </h4>
          <p className="text-zinc-500 text-[11px] leading-relaxed">
            Selecione um nó para ver sugestões inteligentes de causas baseadas no contexto.
          </p>
        </div>
      </div>
    </aside>
  );
};

const Flow = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Undo/Redo State
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  const { screenToFlowPosition, getNodes, fitView, toObject, setViewport } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [addChildMenu, setAddChildMenu] = useState<{ parentId: string, x: number, y: number } | null>(null);
  const [expandedSuggestionIdx, setExpandedSuggestionIdx] = useState<number | null>(null);
  const [canFetchSuggestions, setCanFetchSuggestions] = useState(false);
  const [suggestionHistory, setSuggestionHistory] = useState<{ label: string, suggestions: string[] }[]>([]);

  // Undo/Redo Logic
  const takeSnapshot = useCallback(() => {
    if (isUndoRedoAction) return;

    const currentSnapshot = { nodes: [...nodes], edges: [...edges] };
    
    // Only take snapshot if it's different from the last one
    if (historyIndex >= 0) {
      const lastSnapshot = history[historyIndex];
      if (JSON.stringify(lastSnapshot.nodes) === JSON.stringify(currentSnapshot.nodes) &&
          JSON.stringify(lastSnapshot.edges) === JSON.stringify(currentSnapshot.edges)) {
        return;
      }
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentSnapshot);
    
    // Limit history to 50 steps
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  }, [nodes, edges, history, historyIndex, isUndoRedoAction]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const prevIndex = historyIndex - 1;
      const snapshot = history[prevIndex];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHistoryIndex(prevIndex);
      setTimeout(() => setIsUndoRedoAction(false), 100);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const nextIndex = historyIndex + 1;
      const snapshot = history[nextIndex];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHistoryIndex(nextIndex);
      setTimeout(() => setIsUndoRedoAction(false), 100);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Take initial snapshot
  useEffect(() => {
    if (nodes.length > 0 && history.length === 0) {
      takeSnapshot();
    }
  }, [nodes.length, history.length, takeSnapshot]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Alignment Assistant
  const alignNodes = useCallback((direction: 'horizontal' | 'vertical') => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length < 2) return;

    takeSnapshot();

    const getCenter = (node: Node) => {
      // Use hardcoded widths for better alignment precision
      const isGate = node.type?.includes('Gate') || node.type?.includes('transfer');
      const width = isGate ? 60 : 200;
      const height = isGate ? 60 : 65;
      return {
        x: node.position.x + width / 2,
        y: node.position.y + height / 2,
        width,
        height
      };
    };

    if (direction === 'horizontal') {
      const centers = selectedNodes.map(getCenter);
      const avgCenterY = Math.round((centers.reduce((acc, c) => acc + c.y, 0) / selectedNodes.length) / 20) * 20;
      
      setNodes(nds => nds.map(n => {
        if (!n.selected) return n;
        const center = getCenter(n);
        return { ...n, position: { ...n.position, y: avgCenterY - center.height / 2 } };
      }));
    } else {
      const centers = selectedNodes.map(getCenter);
      const avgCenterX = Math.round((centers.reduce((acc, c) => acc + c.x, 0) / selectedNodes.length) / 20) * 20;
      
      setNodes(nds => nds.map(n => {
        if (!n.selected) return n;
        const center = getCenter(n);
        return { ...n, position: { ...n.position, x: avgCenterX - center.width / 2 } };
      }));
    }
  }, [nodes, setNodes, takeSnapshot]);

  const distributeNodes = useCallback((direction: 'horizontal' | 'vertical') => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length < 3) return;

    takeSnapshot();

    const getCenter = (node: Node) => {
      // Use hardcoded widths for better alignment precision
      const isGate = node.type?.includes('Gate') || node.type?.includes('transfer');
      const width = isGate ? 60 : 200;
      const height = isGate ? 60 : 65;
      return {
        x: node.position.x + width / 2,
        y: node.position.y + height / 2,
        width,
        height
      };
    };

    if (direction === 'horizontal') {
      const sorted = [...selectedNodes].map(n => ({ node: n, center: getCenter(n) }))
        .sort((a, b) => a.center.x - b.center.x);
      
      const minCenterX = sorted[0].center.x;
      const maxCenterX = sorted[sorted.length - 1].center.x;
      const spacing = Math.round(((maxCenterX - minCenterX) / (sorted.length - 1)) / 20) * 20;
      
      setNodes(nds => nds.map(n => {
        const found = sorted.find(s => s.node.id === n.id);
        if (!found) return n;
        const idx = sorted.indexOf(found);
        return { ...n, position: { ...n.position, x: (minCenterX + idx * spacing) - found.center.width / 2 } };
      }));
    } else {
      const sorted = [...selectedNodes].map(n => ({ node: n, center: getCenter(n) }))
        .sort((a, b) => a.center.y - b.center.y);
      
      const minCenterY = sorted[0].center.y;
      const maxCenterY = sorted[sorted.length - 1].center.y;
      const spacing = Math.round(((maxCenterY - minCenterY) / (sorted.length - 1)) / 20) * 20;
      
      setNodes(nds => nds.map(n => {
        const found = sorted.find(s => s.node.id === n.id);
        if (!found) return n;
        const idx = sorted.indexOf(found);
        return { ...n, position: { ...n.position, y: (minCenterY + idx * spacing) - found.center.height / 2 } };
      }));
    }
  }, [nodes, setNodes, takeSnapshot]);

  const getNodeContextPath = useCallback((nodeId: string): string[] => {
    const path: string[] = [];
    let currentNodeId = nodeId;
    const visited = new Set<string>();

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      const node = nodes.find(n => n.id === currentNodeId);
      if (node && node.data.label) {
        path.unshift(node.data.label as string);
      }

      // Find parent (incoming edge)
      const incomingEdge = edges.find(e => e.target === currentNodeId);
      if (incomingEdge) {
        currentNodeId = incomingEdge.source;
      } else {
        break;
      }
    }
    return path;
  }, [nodes, edges]);

  const onToggleLegend = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              showLegend: !node.data.showLegend,
            },
          };
        }
        return node;
      })
    );
    setTimeout(takeSnapshot, 50);
  }, [setNodes, takeSnapshot]);

  const addChildNode = useCallback((parentId: string, type: string, label?: string) => {
    const parentNode = getNodes().find((n) => n.id === parentId);
    if (!parentNode) return;

    const newNodeId = `${Date.now()}`;
    
    // Calculate centering offset
    const parentWidth = parentNode.measured?.width ?? (parentNode.type?.includes('Gate') || parentNode.type?.includes('transfer') ? 60 : 200);
    const childWidth = type.includes('Gate') || type.includes('transfer') ? 60 : 200;
    const xOffset = (parentWidth - childWidth) / 2;

    const newNode: Node = {
      id: newNodeId,
      type,
      position: { x: parentNode.position.x + xOffset, y: parentNode.position.y + 160 },
      data: { 
        label: label || 'Nova Causa',
        onOpenAddChildMenu,
        onToggleLegend,
      },
    };

    const newEdge: Edge = {
      id: `e-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: 'step',
    };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
    setAddChildMenu(null);
    setTimeout(takeSnapshot, 50);
  }, [getNodes, setNodes, setEdges, takeSnapshot]);

  const onOpenAddChildMenu = useCallback((event: React.MouseEvent, parentId: string) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setAddChildMenu({
      parentId,
      x: rect.right + 10,
      y: rect.top
    });
  }, []);

  const addSuggestedNode = useCallback((label: string, type: string) => {
    const newNodeId = `${Date.now()}`;
    
    // Position it in the center of the current view or near the selected node
    let position = { x: 500, y: 300 };
    if (selectedNode) {
      // Calculate centering offset
      const parentWidth = selectedNode.measured?.width ?? (selectedNode.type?.includes('Gate') || selectedNode.type?.includes('transfer') ? 60 : 200);
      const childWidth = type.includes('Gate') || type.includes('transfer') ? 60 : 200;
      const xOffset = (parentWidth - childWidth) / 2;
      
      position = { x: selectedNode.position.x + xOffset, y: selectedNode.position.y + 160 };
    }

    const newNode: Node = {
      id: newNodeId,
      type,
      position,
      data: { 
        label,
        onOpenAddChildMenu,
        onToggleLegend,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [selectedNode, setNodes, addChildNode]);

  // Initial setup
  useEffect(() => {
    const saved = localStorage.getItem('fta-project');
    if (saved) {
      const flow = JSON.parse(saved);
      if (flow) {
        // Re-attach callbacks to loaded nodes
        const nodesWithCallbacks = (flow.nodes || []).map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onOpenAddChildMenu,
            onToggleLegend,
          }
        }));
        setNodes(nodesWithCallbacks);
        setEdges(flow.edges || []);
        if (flow.viewport) {
          setViewport(flow.viewport);
        }
        return;
      }
    }

    const initialId = '1';
    setNodes([
      {
        id: initialId,
        type: 'topEvent',
        data: { 
          label: 'QUEDA DE ENERGIA NO CPD',
          onOpenAddChildMenu,
          onToggleLegend,
        },
        position: { x: 400, y: 50 },
      },
    ]);
  }, [setNodes, setEdges, setViewport]);

  const saveProject = useCallback(() => {
    const flow = toObject();
    localStorage.setItem('fta-project', JSON.stringify(flow));
    alert('Projeto salvo com sucesso!');
  }, [toObject]);

  // Update nodes with onAddChild and numbering
  useEffect(() => {
    const undevelopedNodes = nodes.filter(n => n.type === 'undevelopedEvent');
    const basicCauseNodes = nodes.filter(n => n.type === 'basicCause');

    setNodes((nds) => 
      nds.map((node) => {
        let index = -1;
        let totalCount = 0;

        if (node.type === 'undevelopedEvent') {
          index = undevelopedNodes.findIndex(n => n.id === node.id);
          totalCount = undevelopedNodes.length;
        } else if (node.type === 'basicCause') {
          index = basicCauseNodes.findIndex(n => n.id === node.id);
          totalCount = basicCauseNodes.length;
        }

        return {
          ...node,
          data: {
            ...node.data,
            index,
            totalCount,
            onOpenAddChildMenu: (e: React.MouseEvent, id: string) => onOpenAddChildMenu(e, id)
          }
        };
      })
    );
  }, [onOpenAddChildMenu, nodes.length]); // Only re-run when nodes count changes to avoid infinite loop

  // Fetch dynamic suggestions when a node is selected and user confirms
  const fetchSuggestions = useCallback(async () => {
    if (!selectedNode || !selectedNode.data.label || selectedNode.type?.includes('Gate')) return;
    
    const label = selectedNode.data.label as string;
    const contextPath = getNodeContextPath(selectedNode.id);
    
    // Check if we already have this in history
    const cached = suggestionHistory.find(h => h.label === label);
    if (cached) {
      setDynamicSuggestions(cached.suggestions);
      setCanFetchSuggestions(true);
      return;
    }

    setIsLoadingSuggestions(true);
    setCanFetchSuggestions(true);
    
    try {
      const suggestions = await getFTASuggestions(label, selectedNode.type as string, contextPath);
      setDynamicSuggestions(suggestions);
      // Add to history if not empty
      if (suggestions.length > 0) {
        setSuggestionHistory(prev => {
          const newHistory = [{ label, suggestions }, ...prev.filter(h => h.label !== label)];
          return newHistory.slice(0, 10);
        });
      }
    } catch (error) {
      console.error("Failed to fetch suggestions", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [selectedNode, suggestionHistory, getNodeContextPath]);

  // Auto-load from history when selection changes
  useEffect(() => {
    if (selectedNode && selectedNode.data.label) {
      const label = selectedNode.data.label as string;
      const cached = suggestionHistory.find(h => h.label === label);
      if (cached) {
        setDynamicSuggestions(cached.suggestions);
        setCanFetchSuggestions(true);
      } else {
        setDynamicSuggestions([]);
        setCanFetchSuggestions(false);
      }
    } else {
      setDynamicSuggestions([]);
      setCanFetchSuggestions(false);
    }
    setExpandedSuggestionIdx(null);
  }, [selectedNode?.id]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'step' }, eds)),
    [setEdges]
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setEditValue(node.data.label as string || '');
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const deleteEdge = useCallback(() => {
    if (selectedEdge) {
      takeSnapshot();
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }, [selectedEdge, setEdges, takeSnapshot]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Snap to grid
      position.x = Math.round(position.x / 20) * 20;
      position.y = Math.round(position.y / 20) * 20;

      const newNodeId = `${Date.now()}`;
      let defaultLabel = 'Nova Causa';
      if (type.includes('Gate')) defaultLabel = '';
      else if (type === 'transferIn' || type === 'transferOut') defaultLabel = 'A';
      else if (type === 'annotation') defaultLabel = 'Nova Anotação';

      const newNode: Node = {
        id: newNodeId,
        type,
        position,
        data: { 
          label: defaultLabel,
          onOpenAddChildMenu,
          onToggleLegend,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setTimeout(takeSnapshot, 50);
    },
    [screenToFlowPosition, setNodes, addChildNode, takeSnapshot]
  );

  const exportImage = async (format: 'png' | 'jpeg') => {
    if (!reactFlowWrapper.current) return;
    
    const filter = (node: HTMLElement) => {
      const exclusionClasses = [
        'react-flow__panel', 
        'react-flow__controls', 
        'react-flow__minimap', 
        'react-flow__attribution',
        'export-ignore'
      ];
      return !exclusionClasses.some(cls => node.classList?.contains && node.classList.contains(cls));
    };

    try {
      // Ensure we capture the full content by fitting view first if needed
      // or just capture the current view as requested
      const options = { 
        backgroundColor: '#ffffff', 
        quality: 1, 
        filter,
        style: {
          transform: 'none' // Reset transform for the capture if needed, but React Flow handles this better usually
        }
      };
      
      const dataUrl = format === 'png' 
        ? await toPng(reactFlowWrapper.current, options)
        : await toJpeg(reactFlowWrapper.current, options);
      
      const link = document.createElement('a');
      link.download = `fta-export-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const exportPDF = async () => {
    if (!reactFlowWrapper.current) return;
    
    const filter = (node: HTMLElement) => {
      const exclusionClasses = [
        'react-flow__panel', 
        'react-flow__controls', 
        'react-flow__minimap', 
        'react-flow__attribution',
        'export-ignore'
      ];
      return !exclusionClasses.some(cls => node.classList?.contains && node.classList.contains(cls));
    };

    try {
      const dataUrl = await toPng(reactFlowWrapper.current, { backgroundColor: '#ffffff', quality: 1, filter });
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fta-report-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Export failed', err);
    }
  };

  const applySuggestion = (suggestion: typeof COMMON_EQUIPMENT_FAILURES[0]) => {
    const topId = `top-${Date.now()}`;
    const newNodes: Node[] = [
      {
        id: topId,
        type: 'topEvent',
        position: { x: 400, y: 50 },
        data: { label: suggestion.event.toUpperCase() },
      }
    ];
    const newEdges: Edge[] = [];

    suggestion.causes.forEach((cause, index) => {
      const causeId = `cause-${topId}-${index}`;
      newNodes.push({
        id: causeId,
        type: 'immediateCause',
        position: { x: 200 + (index * 200), y: 250 },
        data: { label: cause },
      });
      newEdges.push({
        id: `e-${topId}-${causeId}`,
        source: topId,
        target: causeId,
        type: 'step',
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setShowSuggestions(false);
    setTimeout(() => fitView(), 100);
  };

  const updateNodeLabel = () => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: editValue,
              },
            };
          }
          return node;
        })
      );
      setSelectedNode(null);
    }
  };

  const deleteSelected = useCallback(() => {
    if (selectedNode) {
      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges, takeSnapshot]);

  // Keyboard support for deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't delete if user is typing in an input or textarea
      const isInput = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode) {
          deleteSelected();
        } else if (selectedEdge) {
          deleteEdge();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, deleteSelected, deleteEdge]);

  return (
    <div className="flex-1 h-full flex relative">
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          snapToGrid={true}
          snapGrid={[20, 20]}
          onNodeDragStop={takeSnapshot}
        >
          {showGrid && <Background color="#e2e8f0" variant="lines" gap={20} />}
          <Controls />
          <MiniMap 
            style={{ backgroundColor: '#fff' }} 
            nodeColor={(n) => {
              if (n.type === 'topEvent') return '#dc2626';
              if (n.type === 'immediateCause') return '#1e3a8a';
              if (n.type === 'intermediateCause') return '#064e3b';
              if (n.type === 'undevelopedEvent') return '#ec4899';
              if (n.type === 'basicCause') return '#facc15';
              if (n.type === 'contributingFactor') return '#0369a1';
              return '#d2d2a0';
            }}
          />
          
          <Panel position="top-right" className="flex gap-2">
            <div className="flex bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden mr-2">
              <button 
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 hover:bg-zinc-50 disabled:opacity-30 transition-colors border-r border-zinc-100"
                title="Desfazer (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4 text-zinc-600" />
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 hover:bg-zinc-50 disabled:opacity-30 transition-colors"
                title="Refazer (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4 text-zinc-600" />
              </button>
            </div>

            <div className="flex bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden mr-2">
              <button 
                onClick={() => alignNodes('horizontal')}
                className="p-2 hover:bg-zinc-50 transition-colors border-r border-zinc-100"
                title="Alinhar Horizontalmente"
              >
                <AlignCenter className="w-4 h-4 text-zinc-600 rotate-90" />
              </button>
              <button 
                onClick={() => alignNodes('vertical')}
                className="p-2 hover:bg-zinc-50 transition-colors border-r border-zinc-100"
                title="Alinhar Verticalmente"
              >
                <AlignCenter className="w-4 h-4 text-zinc-600" />
              </button>
              <button 
                onClick={() => distributeNodes('horizontal')}
                className="p-2 hover:bg-zinc-50 transition-colors border-r border-zinc-100"
                title="Distribuir Horizontalmente"
              >
                <AlignJustify className="w-4 h-4 text-zinc-600 rotate-90" />
              </button>
              <button 
                onClick={() => distributeNodes('vertical')}
                className="p-2 hover:bg-zinc-50 transition-colors"
                title="Distribuir Verticalmente"
              >
                <AlignJustify className="w-4 h-4 text-zinc-600" />
              </button>
            </div>

            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "px-4 py-2 rounded-lg border flex items-center gap-2 text-sm transition-colors shadow-sm",
                showGrid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-zinc-700 border-zinc-200"
              )}
              title={showGrid ? "Ocultar Grade" : "Mostrar Grade"}
            >
              <Grid className="w-4 h-4" />
            </button>

            <div className="relative group/export">
              <button className="bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-lg border border-zinc-200 shadow-sm flex items-center gap-2 text-sm transition-colors">
                <Download className="w-4 h-4" /> Exportar
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-50 overflow-hidden">
                <button onClick={exportPDF} className="w-full px-4 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-50 flex items-center gap-3 transition-colors">
                  <FileDown className="w-4 h-4 text-red-500" /> PDF Documento
                </button>
                <button onClick={() => exportImage('png')} className="w-full px-4 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-50 flex items-center gap-3 transition-colors border-t border-zinc-100">
                  <ImageIcon className="w-4 h-4 text-blue-500" /> Imagem PNG
                </button>
                <button onClick={() => exportImage('jpeg')} className="w-full px-4 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-50 flex items-center gap-3 transition-colors border-t border-zinc-100">
                  <ImageIcon className="w-4 h-4 text-emerald-500" /> Imagem JPG
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSuggestions(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm"
            >
              <Lightbulb className="w-4 h-4" /> Modelos
            </button>
            
            <button 
              onClick={saveProject}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Salvar
            </button>
          </Panel>

          {selectedEdge && (
            <Panel position="bottom-center" className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xl mb-8">
              <button 
                onClick={deleteEdge}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" /> REMOVER LINHA
              </button>
            </Panel>
          )}

          {selectedNode && !selectedNode.type?.includes('Gate') && (
            <Panel position="bottom-center" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xl w-[400px] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Editar Elemento</h3>
                  <button 
                    onClick={deleteSelected}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-24"
                  placeholder={
                    selectedNode.type === 'annotation' 
                      ? "Digite seu texto aqui..." 
                      : selectedNode.type?.includes('transfer')
                      ? "Identificador (ex: A, B, 1...)"
                      : "Descreva a causa ou evento..."
                  }
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={updateNodeLabel}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </Panel>
          )}

          {selectedNode && selectedNode.type?.includes('Gate') && (
            <Panel position="bottom-center" className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xl mb-8">
              <button 
                onClick={deleteSelected}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" /> REMOVER PORTÃO
              </button>
            </Panel>
          )}

          {addChildMenu && (
            <div 
              className="fixed z-[100] bg-white border border-zinc-200 rounded-xl shadow-2xl py-2 w-56 animate-in fade-in zoom-in-95 duration-200 export-ignore"
              style={{ left: addChildMenu.x, top: addChildMenu.y }}
            >
              <div className="px-4 py-2 border-b border-zinc-100 mb-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Adicionar Sub-nó</p>
              </div>
              {(() => {
                const parent = nodes.find(n => n.id === addChildMenu.parentId);
                if (!parent) return null;

                const options = [];
                if (parent.type === 'topEvent') {
                  options.push({ type: 'immediateCause', label: 'Causa Imediata', color: 'text-blue-700 hover:bg-blue-50' });
                } else if (parent.type === 'immediateCause') {
                  options.push({ type: 'intermediateCause', label: 'Causa Intermediária', color: 'text-green-700 hover:bg-green-50' });
                  options.push({ type: 'undevelopedEvent', label: 'Evento Descartado', color: 'text-pink-700 hover:bg-pink-50' });
                  options.push({ type: 'basicCause', label: 'Causa Básica', color: 'text-yellow-700 hover:bg-yellow-50' });
                  options.push({ type: 'contributingFactor', label: 'Fator Contribuinte', color: 'text-sky-700 hover:bg-sky-50' });
                } else if (parent.type === 'intermediateCause') {
                  options.push({ type: 'undevelopedEvent', label: 'Evento Descartado', color: 'text-pink-700 hover:bg-pink-50' });
                  options.push({ type: 'basicCause', label: 'Causa Básica', color: 'text-yellow-700 hover:bg-yellow-50' });
                  options.push({ type: 'contributingFactor', label: 'Fator Contribuinte', color: 'text-sky-700 hover:bg-sky-50' });
                } else if (parent.type === 'contributingFactor') {
                  options.push({ type: 'undevelopedEvent', label: 'Evento Descartado', color: 'text-pink-700 hover:bg-pink-50' });
                  options.push({ type: 'basicCause', label: 'Causa Básica', color: 'text-yellow-700 hover:bg-yellow-50' });
                }

                return options.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => addChildNode(addChildMenu.parentId, opt.type)}
                    className={cn("w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between group", opt.color)}
                  >
                    {opt.label}
                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ));
              })()}
              <div className="border-t border-zinc-100 mt-1 pt-1">
                <button
                  onClick={() => setAddChildMenu(null)}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </ReactFlow>
      </div>

      {/* Dynamic Suggestions Sidebar */}
      <aside className="w-80 bg-zinc-50 border-l border-zinc-200 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="space-y-2">
          <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Sugestões Inteligentes
          </h2>
          <p className="text-zinc-400 text-[10px]">Clique nas opções para adicionar ao canva</p>
        </div>

        {selectedNode ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
              <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Contexto Atual:</p>
              <p className="text-sm font-bold text-zinc-700 line-clamp-2">{selectedNode.data.label as string}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Causas Prováveis:</h3>
              
              {!canFetchSuggestions ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <Lightbulb className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">Deseja gerar sugestões inteligentes para este nó?</p>
                  <button
                    onClick={fetchSuggestions}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Gerar Sugestões
                  </button>
                </div>
              ) : isLoadingSuggestions ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-24 bg-zinc-200 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : dynamicSuggestions.length > 0 ? (
                dynamicSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden transition-all">
                    <button
                      onClick={() => setExpandedSuggestionIdx(expandedSuggestionIdx === idx ? null : idx)}
                      className={cn(
                        "w-full p-3 text-left flex items-center justify-between transition-colors",
                        expandedSuggestionIdx === idx ? "bg-emerald-50" : "hover:bg-zinc-50"
                      )}
                    >
                      <p className={cn(
                        "text-sm font-bold transition-colors",
                        expandedSuggestionIdx === idx ? "text-emerald-700" : "text-zinc-700"
                      )}>
                        {suggestion}
                      </p>
                      <ChevronRight className={cn(
                        "w-4 h-4 text-zinc-400 transition-transform",
                        expandedSuggestionIdx === idx ? "rotate-90 text-emerald-500" : ""
                      )} />
                    </button>
                    
                    {expandedSuggestionIdx === idx && (
                      <div className="p-2 grid grid-cols-1 gap-1 bg-white border-t border-zinc-100 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase px-2 mb-1">Adicionar como:</p>
                        <button
                          onClick={() => addSuggestedNode(suggestion, 'immediateCause')}
                          className="text-[10px] font-bold text-left px-2 py-2 rounded hover:bg-blue-50 text-blue-700 transition-colors flex items-center justify-between group"
                        >
                          Causa Imediata <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                          onClick={() => addSuggestedNode(suggestion, 'intermediateCause')}
                          className="text-[10px] font-bold text-left px-2 py-2 rounded hover:bg-green-50 text-green-700 transition-colors flex items-center justify-between group"
                        >
                          Causa Intermediária <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                          onClick={() => addSuggestedNode(suggestion, 'undevelopedEvent')}
                          className="text-[10px] font-bold text-left px-2 py-2 rounded hover:bg-pink-50 text-pink-700 transition-colors flex items-center justify-between group"
                        >
                          Evento Descartado <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                          onClick={() => addSuggestedNode(suggestion, 'basicCause')}
                          className="text-[10px] font-bold text-left px-2 py-2 rounded hover:bg-yellow-50 text-yellow-700 transition-colors flex items-center justify-between group"
                        >
                          Causa Básica <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button
                          onClick={() => addSuggestedNode(suggestion, 'contributingFactor')}
                          className="text-[10px] font-bold text-left px-2 py-2 rounded hover:bg-sky-50 text-sky-700 transition-colors flex items-center justify-between group"
                        >
                          Fator Contribuinte <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-zinc-400 text-xs italic">Nenhuma sugestão encontrada.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
            <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 font-medium">Selecione um nó para ver sugestões de causas.</p>
          </div>
        )}

        {/* Suggestion History */}
        {suggestionHistory.length > 0 && (
          <div className="mt-auto pt-6 border-t border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" /> Histórico Recente
              </h3>
              <button 
                onClick={() => setSuggestionHistory([])}
                className="text-[9px] text-zinc-400 hover:text-red-500 font-bold uppercase"
              >
                Limpar
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {suggestionHistory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Only allow clicking if it matches current selection to avoid confusion
                    // or if no node is selected, we could potentially select one, but let's keep it simple
                    if (selectedNode && selectedNode.data.label === item.label) {
                      setDynamicSuggestions(item.suggestions);
                      setCanFetchSuggestions(true);
                    } else {
                      // If different node, just show the suggestions but don't "link" them to the current node's fetch state
                      setDynamicSuggestions(item.suggestions);
                      setCanFetchSuggestions(true);
                    }
                  }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                >
                  <p className="text-[11px] font-bold text-zinc-700 truncate group-hover:text-emerald-700">{item.label}</p>
                  <p className="text-[9px] text-zinc-400 truncate">{item.suggestions.length} sugestões salvas</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {showSuggestions && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-3 text-zinc-800">
                  <Lightbulb className="w-6 h-6 text-amber-500" /> 
                  Modelos de Equipamentos
                </h2>
                <p className="text-zinc-500 text-sm mt-1">Selecione um cenário padrão para iniciar sua análise</p>
              </div>
              <button 
                onClick={() => setShowSuggestions(false)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {COMMON_EQUIPMENT_FAILURES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => applySuggestion(item)}
                  className="w-full group bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-200 p-4 rounded-2xl text-left transition-all flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-zinc-700 group-hover:text-emerald-700 transition-colors">{item.event}</h3>
                    <p className="text-zinc-500 text-xs mt-1">Causas: {item.causes.slice(0, 3).join(', ')}...</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-emerald-400 transition-all transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Header = ({ onOpenHelp }: { onOpenHelp: () => void }) => {
  const { toObject, setNodes, setEdges, setViewport } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSave = useCallback(() => {
    const flow = toObject();
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `fta-project-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [toObject]);

  const onOpen = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const flow = JSON.parse(e.target?.result as string);
        if (flow) {
          const { nodes = [], edges = [], viewport } = flow;
          setNodes(nodes);
          setEdges(edges);
          if (viewport) {
            setViewport(viewport);
          }
        }
      } catch (err) {
        console.error('Failed to parse project file', err);
        alert('Erro ao abrir o arquivo. Verifique se é um projeto FTA válido.');
      }
    };
    reader.readAsText(file);
    // Reset input value to allow opening the same file again
    event.target.value = '';
  }, [setNodes, setEdges, setViewport]);

  return (
    <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-800">FTA Maintenance Pro</h1>
          <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Análise Inteligente de Árvore de Falhas</p>
        </div>
      </div>
      
      <nav className="flex items-center gap-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={onFileChange} 
        />
        <button 
          onClick={onOpen}
          className="text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200"
        >
          <FolderOpen className="w-4 h-4" /> Abrir Projeto
        </button>
        <button 
          onClick={onSave}
          className="text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg shadow-sm"
        >
          <Save className="w-4 h-4" /> Salvar Projeto
        </button>
        <div className="h-6 w-px bg-zinc-200 mx-2" />
        <button 
          onClick={onOpenHelp}
          className="text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <HelpCircle className="w-4 h-4" /> Ajuda
        </button>
      </nav>
    </header>
  );
};

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3 text-zinc-800">
              <HelpCircle className="w-6 h-6 text-emerald-600" /> 
              Guia de Configuração de API
            </h2>
            <p className="text-zinc-500 text-sm mt-1">Como obter e configurar suas chaves de Inteligência Artificial</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">1</div>
              Google Gemini (Recomendado)
            </h3>
            <div className="pl-10 space-y-3 text-zinc-600 text-sm leading-relaxed">
              <p>O Gemini oferece um nível gratuito generoso e é o provedor padrão desta aplicação.</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Acesse o <strong><a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-emerald-600 hover:underline">Google AI Studio</a></strong>.</li>
                <li>Faça login com sua conta Google.</li>
                <li>Clique no botão <strong>"Create API key"</strong>.</li>
                <li>Selecione um projeto (ou crie um novo) e clique em <strong>"Create API key in existing project"</strong>.</li>
                <li>Copie a chave gerada.</li>
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">2</div>
              OpenAI ChatGPT (Alternativo)
            </h3>
            <div className="pl-10 space-y-3 text-zinc-600 text-sm leading-relaxed">
              <p>Você também pode usar o GPT-3.5 ou GPT-4 da OpenAI.</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Acesse a <strong><a href="https://platform.openai.com/api-keys" target="_blank" className="text-emerald-600 hover:underline">Plataforma OpenAI</a></strong>.</li>
                <li>Crie uma conta ou faça login.</li>
                <li>No menu lateral, vá em <strong>"API Keys"</strong>.</li>
                <li>Clique em <strong>"+ Create new secret key"</strong>.</li>
                <li>Dê um nome e clique em <strong>"Create secret key"</strong>.</li>
                <li><strong>Importante:</strong> Copie a chave imediatamente, pois ela não será exibida novamente.</li>
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">3</div>
              Como Adicionar na Aplicação
            </h3>
            <div className="pl-10 space-y-3 text-zinc-600 text-sm leading-relaxed">
              <ol className="list-decimal pl-4 space-y-2">
                <li>Na barra lateral esquerda, clique no ícone de engrenagem (<Settings2 className="w-3 h-3 inline" />) na seção <strong>Inteligência Artificial</strong>.</li>
                <li>Selecione o <strong>Provedor Ativo</strong> que deseja utilizar.</li>
                <li>Cole sua chave no campo correspondente (Gemini ou OpenAI).</li>
                <li>Clique em <strong>"Salvar"</strong>. A página irá recarregar para aplicar as novas configurações.</li>
              </ol>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mt-4">
                <p className="text-amber-800 text-xs font-bold flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3" /> Nota de Segurança
                </p>
                <p className="text-amber-700 text-[11px]">Sua chave é salva apenas no seu navegador (localStorage). Ela nunca é enviada para nossos servidores, exceto para realizar as consultas de IA diretamente aos provedores.</p>
              </div>
            </div>
          </section>
        </div>
        
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-zinc-700 transition-all shadow-lg"
          >
            Entendi, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="w-full h-screen flex bg-white text-zinc-900 font-sans overflow-hidden">
      <ReactFlowProvider>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header onOpenHelp={() => setIsHelpOpen(true)} />
          
          <main className="flex-1 relative bg-white">
            <Flow />
          </main>
        </div>
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </ReactFlowProvider>
    </div>
  );
}
