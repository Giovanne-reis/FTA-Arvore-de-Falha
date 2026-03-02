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
  BackgroundVariant,
  getNodesBounds,
  getViewportForBounds,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import dagre from 'dagre';
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
  Bold,
  Italic,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Hand,
  MousePointer,
  Search,
  LayoutTemplate,
  Sun,
  Moon
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

import { getFTASuggestions, getLocalUsage, AIProvider, analyzeFullFTA } from './services/geminiService';
import Markdown from 'react-markdown';

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

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 120;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

const Sidebar = ({ isDarkMode }: { isDarkMode: boolean }) => {
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
    <aside className={cn(
      "w-72 border-r p-6 flex flex-col gap-6 overflow-y-auto transition-colors",
      isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
    )}>
      <div className="space-y-2">
        <h2 className={cn(
          "text-xs font-bold uppercase tracking-widest flex items-center gap-2",
          isDarkMode ? "text-zinc-400" : "text-zinc-500"
        )}>
          <Layers className="w-4 h-4" /> Elementos da Árvore
        </h2>
        <p className={cn("text-[10px]", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>Arraste para o canvas para adicionar</p>
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

        <div className={cn("pt-4 border-t space-y-2", isDarkMode ? "border-white/20" : "border-zinc-200")}>
          <h3 className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>Portões Lógicos</h3>
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

        <div className={cn("pt-4 border-t space-y-2", isDarkMode ? "border-white/20" : "border-zinc-200")}>
          <h3 className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>Transferência</h3>
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

        <div className={cn("pt-4 border-t space-y-2", isDarkMode ? "border-white/20" : "border-zinc-200")}>
          <h3 className={cn("text-xs font-bold uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>Anotação</h3>
          <div
            className={cn(
              "p-3 rounded-lg cursor-grab active:cursor-grabbing font-medium text-xs text-center border-2 border-dashed transition-all",
              isDarkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700" : "bg-white text-zinc-600 border-zinc-300 shadow-sm hover:bg-zinc-50"
            )}
            onDragStart={(event) => onDragStart(event, 'annotation')}
            draggable
          >
            CAIXA DE TEXTO
          </div>
        </div>
      </div>

      <div className={cn("mt-auto pt-6 border-t space-y-4", isDarkMode ? "border-white/20" : "border-zinc-200")}>
        <div className={cn("p-4 rounded-xl border", isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200")}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={cn("text-xs font-bold flex items-center gap-2", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>
              <Zap className="w-3 h-3 text-amber-500" /> Inteligência Artificial
            </h4>
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={cn("transition-colors", isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600")}
            >
              <Settings2 className="w-3 h-3" />
            </button>
          </div>
          
          {showKeyInput ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className={cn("text-[9px] font-bold uppercase", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>Provedor Ativo</label>
                <select 
                  className={cn("w-full p-1.5 text-[10px] border rounded", isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-300" : "bg-white border-zinc-300 text-zinc-700")}
                  value={activeProvider}
                  onChange={(e) => setActiveProvider(e.target.value as AIProvider)}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI ChatGPT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={cn("text-[9px] font-bold uppercase", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>Gemini API Key</label>
                <input 
                  type="password"
                  placeholder="Insira sua Gemini API Key..."
                  className={cn("w-full p-1.5 text-[10px] border rounded", isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-300" : "bg-white border-zinc-300 text-zinc-700")}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className={cn("text-[9px] font-bold uppercase", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>OpenAI API Key</label>
                <input 
                  type="password"
                  placeholder="Insira sua OpenAI API Key..."
                  className={cn("w-full p-1.5 text-[10px] border rounded", isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-300" : "bg-white border-zinc-300 text-zinc-700")}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleSaveKeys}
                  className={cn("flex-1 text-[10px] py-1.5 rounded font-bold transition-colors", isDarkMode ? "bg-zinc-700 text-white hover:bg-zinc-600" : "bg-zinc-800 text-white hover:bg-zinc-700")}
                >
                  Salvar
                </button>
                <button 
                  onClick={() => setShowKeyInput(false)}
                  className={cn("flex-1 text-[10px] py-1.5 rounded transition-colors", isDarkMode ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300")}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={cn("text-[10px] font-medium", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                  {activeProvider === 'gemini' ? 'Google Gemini' : 'OpenAI ChatGPT'}
                </p>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", isDarkMode ? "bg-zinc-700 text-zinc-300" : "bg-zinc-200 text-zinc-600")}>Ativo</span>
              </div>
              <div className={cn("pt-2 border-t", isDarkMode ? "border-zinc-700" : "border-zinc-200")}>
                <p className={cn("text-[9px] font-bold uppercase mb-1", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>Uso da Sessão</p>
                <div className="flex items-center gap-2">
                  <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", isDarkMode ? "bg-zinc-900" : "bg-zinc-200")}>
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${Math.min((usage / 50) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={cn("text-[10px] font-bold", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>{usage} chamadas</span>
                </div>
                <p className={cn("text-[8px] mt-1 italic", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>* O limite gratuito varia por provedor.</p>
              </div>
            </div>
          )}
        </div>

        <div className={cn("p-4 rounded-xl border", isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200")}>
          <h4 className={cn("text-xs font-bold mb-2 flex items-center gap-2", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>
            <Info className="w-3 h-3" /> Dica
          </h4>
          <p className={cn("text-[11px] leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
            Selecione um nó para ver sugestões inteligentes de causas baseadas no contexto.
          </p>
        </div>
      </div>
    </aside>
  );
};

export const Flow = ({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (val: boolean) => void }) => {
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (type: 'bold' | 'italic') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editValue;
    const selectedText = text.substring(start, end);
    
    let formattedText = '';
    if (type === 'bold') {
      formattedText = `**${selectedText}**`;
    } else {
      formattedText = `*${selectedText}*`;
    }
    
    const newValue = text.substring(0, start) + formattedText + text.substring(end);
    setEditValue(newValue);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + (type === 'bold' ? 2 : 1), end + (type === 'bold' ? 2 : 1));
    }, 0);
  };
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzingFull, setIsAnalyzingFull] = useState(false);
  const [fullAnalysisResult, setFullAnalysisResult] = useState<string | null>(null);
  const [showFullAnalysisModal, setShowFullAnalysisModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const savedAnalysis = localStorage.getItem('last_full_analysis');
    if (savedAnalysis) {
      setFullAnalysisResult(savedAnalysis);
    }
  }, []);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('pan');
  const [addChildMenu, setAddChildMenu] = useState<{ parentId: string, x: number, y: number } | null>(null);
  const [expandedSuggestionIdx, setExpandedSuggestionIdx] = useState<number | null>(null);
  const [canFetchSuggestions, setCanFetchSuggestions] = useState(false);
  const [suggestionHistory, setSuggestionHistory] = useState<{ label: string, suggestions: string[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
  const [copiedEdges, setCopiedEdges] = useState<Edge[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Undo/Redo Logic
  const takeSnapshot = useCallback(() => {
    if (isUndoRedoAction) return;

    const currentSnapshot = { 
      nodes: nodes.map(n => ({ ...n })), 
      edges: edges.map(e => ({ ...e })) 
    };
    
    // Only take snapshot if it's different from the last one
    if (historyIndex >= 0) {
      const lastSnapshot = history[historyIndex];
      // Simple check for changes
      if (lastSnapshot.nodes.length === currentSnapshot.nodes.length &&
          lastSnapshot.edges.length === currentSnapshot.edges.length &&
          JSON.stringify(lastSnapshot.nodes) === JSON.stringify(currentSnapshot.nodes) &&
          JSON.stringify(lastSnapshot.edges) === JSON.stringify(currentSnapshot.edges)) {
        return;
      }
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentSnapshot);
    
    // Limit history to 50 steps
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
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
      if (flow && flow.nodes && flow.nodes.length > 0) {
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

    // Start with empty canvas
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges, setViewport]);

  const newProject = useCallback(() => {
    if (window.confirm('Tem certeza que deseja iniciar um novo projeto? Todo o progresso não salvo será perdido.')) {
      setNodes([]);
      setEdges([]);
      setHistory([]);
      setHistoryIndex(-1);
      setSelectedNode(null);
      setSelectedEdge(null);
      setFullAnalysisResult(null);
      localStorage.removeItem('fta-project');
      localStorage.removeItem('last_full_analysis');
      setTimeout(() => {
        fitView();
        takeSnapshot(); // Take a snapshot of the empty state
      }, 100);
    }
  }, [setNodes, setEdges, takeSnapshot, setHistory, setHistoryIndex, fitView]);

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
    (params: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, type: 'step' }, eds));
    },
    [setEdges, takeSnapshot]
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

  const deleteSelectedElements = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      takeSnapshot();
      setNodes((nds) => nds.filter((node) => !node.selected));
      setEdges((eds) => eds.filter((edge) => !edge.selected));
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [nodes, edges, setNodes, setEdges, takeSnapshot]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchIndex(-1);
      return;
    }

    const matches = nodes
      .filter(n => (n.data.label as string)?.toLowerCase().includes(query.toLowerCase()))
      .map(n => n.id);

    setSearchResults(matches);
    
    if (matches.length > 0) {
      setSearchIndex(0);
      const foundNode = nodes.find(n => n.id === matches[0]);
      if (foundNode) {
        setViewport({ 
          x: -foundNode.position.x + window.innerWidth / 2, 
          y: -foundNode.position.y + window.innerHeight / 2, 
          zoom: 1 
        }, { duration: 800 });
        setNodes(nds => nds.map(n => ({ ...n, selected: n.id === foundNode.id })));
      }
    } else {
      setSearchIndex(-1);
    }
  };

  const goToNextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (searchIndex + 1) % searchResults.length;
    setSearchIndex(nextIndex);
    
    const nodeId = searchResults[nextIndex];
    const foundNode = nodes.find(n => n.id === nodeId);
    
    if (foundNode) {
      setViewport({ 
        x: -foundNode.position.x + window.innerWidth / 2, 
        y: -foundNode.position.y + window.innerHeight / 2, 
        zoom: 1 
      }, { duration: 800 });
      setNodes(nds => nds.map(n => ({ ...n, selected: n.id === foundNode.id })));
    }
  }, [searchResults, searchIndex, nodes, setViewport, setNodes]);

  const goToPrevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(prevIndex);
    
    const nodeId = searchResults[prevIndex];
    const foundNode = nodes.find(n => n.id === nodeId);
    
    if (foundNode) {
      setViewport({ 
        x: -foundNode.position.x + window.innerWidth / 2, 
        y: -foundNode.position.y + window.innerHeight / 2, 
        zoom: 1 
      }, { duration: 800 });
      setNodes(nds => nds.map(n => ({ ...n, selected: n.id === foundNode.id })));
    }
  }, [searchResults, searchIndex, nodes, setViewport, setNodes]);
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isInput = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      
      // Global shortcuts
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isInput) {
        if (event.key === 'Enter' && event.target === searchInputRef.current) {
          event.preventDefault();
          goToNextSearchResult();
        }
        return;
      }

      const isMod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      // Move nodes with arrows
      const selectedNodes = nodes.filter(n => n.selected);
      if (selectedNodes.length > 0 && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        const step = event.shiftKey ? 40 : 10;
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
        
        setNodes(nds => nds.map(node => {
          if (node.selected) {
            return {
              ...node,
              position: { x: node.position.x + dx, y: node.position.y + dy }
            };
          }
          return node;
        }));
        return;
      }

      // Copy/Paste
      if (isMod && key === 'c') {
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          setCopiedNodes(selected);
          const selectedEdgeIds = edges.filter(e => 
            selected.some(n => n.id === e.source) && selected.some(n => n.id === e.target)
          );
          setCopiedEdges(selectedEdgeIds);
        }
      }

      if (isMod && key === 'v') {
        if (copiedNodes.length > 0) {
          takeSnapshot();
          const idMap: Record<string, string> = {};
          const newNodes = copiedNodes.map(node => {
            const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            idMap[node.id] = newId;
            return {
              ...node,
              id: newId,
              selected: true,
              position: { x: node.position.x + 40, y: node.position.y + 40 }
            };
          });

          const newEdges = copiedEdges.map(edge => ({
            ...edge,
            id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: idMap[edge.source],
            target: idMap[edge.target],
            selected: true
          }));

          setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNodes));
          setEdges(eds => eds.map(e => ({ ...e, selected: false })).concat(newEdges));
        }
      }

      // Enter to edit
      if (key === 'enter' && selectedNodes.length === 1) {
        const node = selectedNodes[0];
        if (!node.type?.includes('Gate')) {
          setSelectedNode(node);
          setEditValue(node.data.label as string || '');
        }
      }

      // Delete
      if (key === 'delete' || key === 'backspace') {
        if (selectedNodes.length > 0) {
          deleteSelectedElements();
        } else if (selectedEdge) {
          deleteEdge();
        }
      }

      // Undo/Redo
      if (isMod && key === 'z') {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isMod && key === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, copiedNodes, copiedEdges, undo, redo, takeSnapshot, setNodes, setEdges, deleteSelectedElements, deleteEdge, selectedEdge, goToNextSearchResult]);

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
      let defaultLabel = 'NOVA CAUSA';
      
      // Map node types to their sidebar labels
      const typeLabels: Record<string, string> = {
        topEvent: 'EVENTO DE TOPO',
        immediateCause: 'CAUSA IMEDIATA',
        intermediateCause: 'CAUSA INTERMEDIÁRIA',
        undevelopedEvent: 'EVENTO DESCARTADO',
        basicCause: 'CAUSA BÁSICA',
        contributingFactor: 'FATOR CONTRIBUINTE',
        annotation: 'CAIXA DE TEXTO'
      };

      if (type.includes('Gate')) defaultLabel = '';
      else if (type === 'transferIn' || type === 'transferOut') defaultLabel = 'A';
      else if (typeLabels[type]) defaultLabel = typeLabels[type];

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
    
    const nodes = getNodes();
    if (nodes.length === 0) return;

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
      const bounds = getNodesBounds(nodes);
      const padding = 150; // Increased padding
      const width = bounds.width + padding * 2;
      const height = bounds.height + padding * 2;
      
      // Calculate viewport to fit all nodes with a bit more margin
      const viewport = getViewportForBounds(bounds, width, height, 0.01, 2, 0.1);

      const options = { 
        backgroundColor: '#ffffff', 
        quality: 1, 
        pixelRatio: 2, // Slightly lower pixel ratio to avoid memory issues on huge trees
        filter,
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
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
    
    const nodes = getNodes();
    if (nodes.length === 0) return;

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
      const bounds = getNodesBounds(nodes);
      const padding = 150; // Increased padding
      const width = bounds.width + padding * 2;
      const height = bounds.height + padding * 2;
      
      const viewport = getViewportForBounds(bounds, width, height, 0.01, 2, 0.1);

      const dataUrl = await toPng(reactFlowWrapper.current, { 
        backgroundColor: '#ffffff', 
        quality: 1, 
        pixelRatio: 2,
        filter,
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }
      });
      
      const pdf = new jsPDF('l', 'mm', [width * 0.264583, height * 0.264583]); // Convert px to mm
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fta-report-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF Export failed', err);
    }
  };

  const onLayout = useCallback(
    (direction: string) => {
      takeSnapshot();
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      setTimeout(() => fitView(), 50);
    },
    [nodes, edges, takeSnapshot, setNodes, setEdges, fitView]
  );

  const copyToClipboard = async () => {
    if (!fullAnalysisResult) return;
    try {
      await navigator.clipboard.writeText(fullAnalysisResult);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  const handleFullAnalysis = async () => {
    if (nodes.length === 0) return;
    
    // If we already have a result, just show it
    if (fullAnalysisResult) {
      setShowFullAnalysisModal(true);
      return;
    }

    // Otherwise, trigger a new one
    await triggerNewAnalysis();
  };

  const triggerNewAnalysis = async () => {
    if (nodes.length === 0) return;
    setIsAnalyzingFull(true);
    setShowFullAnalysisModal(true);
    setFullAnalysisResult(null);
    
    try {
      const result = await analyzeFullFTA(nodes, edges);
      setFullAnalysisResult(result);
      localStorage.setItem('last_full_analysis', result);
    } catch (error: any) {
      setFullAnalysisResult(`### Erro na Análise\n\nNão foi possível completar a análise da árvore: ${error.message}`);
    } finally {
      setIsAnalyzingFull(false);
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

  return (
    <div className={cn("flex-1 h-full flex relative", isDarkMode ? "dark bg-zinc-950" : "bg-white")}>
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
          panOnDrag={interactionMode === 'pan'}
          selectionOnDrag={interactionMode === 'select'}
          selectionMode={SelectionMode.Partial}
          panOnScroll={true}
          minZoom={0.01}
          maxZoom={4}
          colorMode={isDarkMode ? 'dark' : 'light'}
          className={cn(
            interactionMode === 'pan' ? 'mode-pan' : 'mode-select',
            isDarkMode ? 'bg-zinc-900' : 'bg-white'
          )}
        >
          {showGrid && <Background color={isDarkMode ? "#334155" : "#e2e8f0"} variant={BackgroundVariant.Lines} gap={20} />}
          <Controls />
          {showMiniMap && (
            <MiniMap 
              style={{ backgroundColor: isDarkMode ? '#18181b' : '#fff' }} 
              nodeColor={(n) => {
                if (n.type === 'topEvent') return '#dc2626';
                if (n.type === 'immediateCause') return '#1e3a8a';
                if (n.type === 'intermediateCause') return '#064e3b';
                if (n.type === 'undevelopedEvent') return '#ec4899';
                if (n.type === 'basicCause') return '#facc15';
                if (n.type === 'contributingFactor') return '#0369a1';
                return '#d2d2a0';
              }}
              maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(240, 242, 245, 0.6)'}
            />
          )}
          
          <Panel position="top-left" className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className={cn(
                "border rounded-xl shadow-lg p-1 flex items-center gap-2 w-64 transition-colors",
                isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <div className={cn("pl-3", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar na árvore... (Ctrl+F)"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={cn(
                    "w-full bg-transparent border-none outline-none text-sm py-2 placeholder:text-zinc-400 transition-colors",
                    isDarkMode ? "text-zinc-200" : "text-zinc-700"
                  )}
                />
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setSearchIndex(-1);
                    }}
                    className={cn("p-1 rounded-lg mr-1 transition-colors", isDarkMode ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {searchQuery && searchResults.length > 0 && (
                <div className={cn(
                  "backdrop-blur-sm border rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between w-64 transition-colors",
                  isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-200"
                )}>
                  <span className={cn("text-[10px] font-bold uppercase tracking-tight", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>
                    {searchIndex + 1} de {searchResults.length} encontrados
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={goToPrevSearchResult}
                      className={cn("p-1 rounded transition-colors", isDarkMode ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400")}
                      title="Anterior"
                    >
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    </button>
                    <button 
                      onClick={goToNextSearchResult}
                      className={cn("p-1 rounded transition-colors", isDarkMode ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400")}
                      title="Próximo (Enter)"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <div className={cn(
                  "backdrop-blur-sm border rounded-lg shadow-sm px-3 py-1.5 w-64 transition-colors",
                  isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-200"
                )}>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                    Nenhum item encontrado
                  </span>
                </div>
              )}
            </div>

            <div className={cn(
              "border rounded-xl shadow-lg p-1 flex flex-col gap-1 w-fit transition-colors",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>Auto-Layout</p>
              <button 
                onClick={() => onLayout('TB')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                  isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-50 text-zinc-600"
                )}
                title="Organizar Verticalmente"
              >
                <LayoutTemplate className="w-4 h-4 text-indigo-500" />
                <span>Vertical</span>
              </button>
              <button 
                onClick={() => onLayout('LR')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                  isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-50 text-zinc-600"
                )}
                title="Organizar Horizontalmente"
              >
                <LayoutTemplate className="w-4 h-4 text-emerald-500 rotate-[-90deg]" />
                <span>Horizontal</span>
              </button>
            </div>
          </Panel>

          <Panel position="top-right" className="flex gap-2">
            <div className={cn(
              "flex border rounded-lg shadow-sm overflow-hidden mr-2 transition-colors",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <button 
                onClick={() => setInteractionMode('pan')}
                className={cn(
                  "p-2 transition-colors border-r",
                  isDarkMode ? "border-zinc-800" : "border-zinc-100",
                  interactionMode === 'pan' 
                    ? (isDarkMode ? "bg-indigo-900/40 text-indigo-400" : "bg-indigo-50 text-indigo-600") 
                    : (isDarkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-50 text-zinc-600")
                )}
                title="Modo Movimentar (Mão)"
              >
                <Hand className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setInteractionMode('select')}
                className={cn(
                  "p-2 transition-colors",
                  interactionMode === 'select' 
                    ? (isDarkMode ? "bg-indigo-900/40 text-indigo-400" : "bg-indigo-50 text-indigo-600") 
                    : (isDarkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-50 text-zinc-600")
                )}
                title="Modo Selecionar (Seta)"
              >
                <MousePointer className="w-4 h-4" />
              </button>
            </div>

            <div className={cn(
              "flex border rounded-lg shadow-sm overflow-hidden mr-2 transition-colors",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <button 
                onClick={undo}
                disabled={historyIndex <= 0}
                className={cn(
                  "p-2 disabled:opacity-30 transition-colors border-r",
                  isDarkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-100 hover:bg-zinc-50"
                )}
                title="Desfazer (Ctrl+Z)"
              >
                <Undo2 className={cn("w-4 h-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")} />
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={cn(
                  "p-2 disabled:opacity-30 transition-colors",
                  isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-50"
                )}
                title="Refazer (Ctrl+Y)"
              >
                <Redo2 className={cn("w-4 h-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")} />
              </button>
            </div>

            <div className={cn(
              "flex border rounded-lg shadow-sm overflow-hidden mr-2 transition-colors",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <button 
                onClick={() => alignNodes('horizontal')}
                className={cn(
                  "p-2 transition-colors border-r",
                  isDarkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-100 hover:bg-zinc-50"
                )}
                title="Alinhar Horizontalmente"
              >
                <AlignCenter className={cn("w-4 h-4 rotate-90", isDarkMode ? "text-zinc-400" : "text-zinc-600")} />
              </button>
              <button 
                onClick={() => alignNodes('vertical')}
                className={cn(
                  "p-2 transition-colors border-r",
                  isDarkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-100 hover:bg-zinc-50"
                )}
                title="Alinhar Verticalmente"
              >
                <AlignCenter className={cn("w-4 h-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")} />
              </button>
              <button 
                onClick={() => distributeNodes('horizontal')}
                className={cn(
                  "p-2 transition-colors border-r",
                  isDarkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-100 hover:bg-zinc-50"
                )}
                title="Distribuir Horizontalmente"
              >
                <AlignJustify className={cn("w-4 h-4 rotate-90", isDarkMode ? "text-zinc-400" : "text-zinc-600")} />
              </button>
              <button 
                onClick={() => distributeNodes('vertical')}
                className={cn(
                  "p-2 transition-colors",
                  isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-50"
                )}
                title="Distribuir Verticalmente"
              >
                <AlignJustify className={cn("w-4 h-4", isDarkMode ? "text-zinc-400" : "text-zinc-600")} />
              </button>
            </div>

            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "px-4 py-2 rounded-lg border flex items-center gap-2 text-sm transition-colors shadow-sm",
                showGrid 
                  ? (isDarkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200") 
                  : (isDarkMode ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50")
              )}
              title={showGrid ? "Ocultar Grade" : "Mostrar Grade"}
            >
              <Grid className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowMiniMap(!showMiniMap)}
              className={cn(
                "px-4 py-2 rounded-lg border flex items-center gap-2 text-sm transition-colors shadow-sm",
                showMiniMap 
                  ? (isDarkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200") 
                  : (isDarkMode ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50")
              )}
              title={showMiniMap ? "Ocultar Mini Mapa" : "Mostrar Mini Mapa"}
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "p-2 rounded-lg border transition-colors shadow-sm",
                isDarkMode ? "bg-zinc-800 text-yellow-400 border-zinc-700 hover:bg-zinc-700" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
              )}
              title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="relative group/export">
              <button className={cn(
                "px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2 text-sm transition-colors",
                isDarkMode ? "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
              )}>
                <Download className="w-4 h-4" /> Exportar
              </button>
              <div className={cn(
                "absolute right-0 top-full mt-2 w-48 border rounded-xl shadow-xl opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-50 overflow-hidden",
                isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <button onClick={exportPDF} className={cn(
                  "w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors",
                  isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-50"
                )}>
                  <FileDown className="w-4 h-4 text-red-500" /> PDF Documento
                </button>
                <button onClick={() => exportImage('png')} className={cn(
                  "w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors border-t",
                  isDarkMode ? "text-zinc-400 hover:bg-zinc-800 border-zinc-800" : "text-zinc-600 hover:bg-zinc-50 border-zinc-100"
                )}>
                  <ImageIcon className="w-4 h-4 text-blue-500" /> Imagem PNG
                </button>
                <button onClick={() => exportImage('jpeg')} className={cn(
                  "w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors border-t",
                  isDarkMode ? "text-zinc-400 hover:bg-zinc-800 border-zinc-800" : "text-zinc-600 hover:bg-zinc-50 border-zinc-100"
                )}>
                  <ImageIcon className="w-4 h-4 text-emerald-500" /> Imagem JPG
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleFullAnalysis}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm",
                isDarkMode ? "bg-indigo-700 hover:bg-indigo-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
              title="Análise Completa com IA"
            >
              <Zap className="w-4 h-4" /> Analisar Árvore
            </button>

            <button 
              onClick={() => setShowSuggestions(true)}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm",
                isDarkMode ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              <Lightbulb className="w-4 h-4" /> Modelos
            </button>
            
            <button 
              onClick={newProject}
              className={cn(
                "px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2 text-sm transition-colors",
                isDarkMode ? "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
              )}
              title="Iniciar Novo Projeto"
            >
              <Plus className="w-4 h-4" /> Novo Projeto
            </button>

            <button 
              onClick={saveProject}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm",
                isDarkMode ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              <Save className="w-4 h-4" /> Salvar
            </button>
          </Panel>

          {((nodes.filter(n => n.selected).length + edges.filter(e => e.selected).length) > 1) && (
            <Panel position="bottom-center" className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xl mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {nodes.filter(n => n.selected).length + edges.filter(e => e.selected).length} itens selecionados
              </span>
              <div className="w-px h-4 bg-zinc-200" />
              <button 
                onClick={deleteSelectedElements}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" /> APAGAR SELEÇÃO
              </button>
            </Panel>
          )}

          {selectedEdge && nodes.filter(n => n.selected).length === 0 && edges.filter(e => e.selected).length === 1 && (
            <Panel position="bottom-center" className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xl mb-8">
              <button 
                onClick={deleteEdge}
                className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
              >
                <Trash2 className="w-4 h-4" /> REMOVER LINHA
              </button>
            </Panel>
          )}

          {selectedNode && !selectedNode.type?.includes('Gate') && nodes.filter(n => n.selected).length === 1 && (
            <Panel position="bottom-center" className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xl w-[400px] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Editar Elemento</h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => applyFormatting('bold')}
                      className={cn(
                        "p-1.5 rounded hover:bg-zinc-100 transition-colors",
                        isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
                      )}
                      title="Negrito"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => applyFormatting('italic')}
                      className={cn(
                        "p-1.5 rounded hover:bg-zinc-100 transition-colors",
                        isDarkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
                      )}
                      title="Itálico"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-zinc-200 mx-1" />
                    <button 
                      onClick={deleteSelected}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
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

      {/* Full Analysis Modal */}
      {showFullAnalysisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={cn(
            "w-full max-w-3xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border",
            isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <div className={cn(
              "p-6 border-b flex items-center justify-between",
              isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className={cn("font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Auditoria Técnica de FTA</h2>
                  <p className={cn("text-xs", isDarkMode ? "text-zinc-500" : "text-zinc-500")}>Análise profunda gerada por Inteligência Artificial</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFullAnalysisModal(false)}
                className={cn("p-2 rounded-xl transition-colors", isDarkMode ? "hover:bg-zinc-700 text-zinc-500" : "hover:bg-zinc-200 text-zinc-400")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {isAnalyzingFull ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 py-12">
                  <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="text-center">
                    <p className={cn("font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Analisando sua Árvore de Falhas...</p>
                    <p className={cn("text-sm", isDarkMode ? "text-zinc-500" : "text-zinc-500")}>Isso pode levar alguns segundos dependendo da complexidade.</p>
                  </div>
                </div>
              ) : fullAnalysisResult ? (
                <div className={cn("prose prose-sm max-w-none markdown-body", isDarkMode ? "prose-invert" : "prose-zinc")}>
                  <Markdown>{fullAnalysisResult}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-4 py-12">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className={cn("font-bold", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>Nenhuma análise disponível</p>
                    <p className={cn("text-sm", isDarkMode ? "text-zinc-500" : "text-zinc-500")}>Clique no botão abaixo para gerar uma auditoria completa.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className={cn(
              "p-6 border-t flex justify-between items-center",
              isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
            )}>
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  disabled={!fullAnalysisResult || isAnalyzingFull}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border rounded-xl font-bold text-sm transition-colors disabled:opacity-50",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  {isCopied ? (
                    <><Check className="w-4 h-4 text-emerald-500" /> Copiado!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copiar</>
                  )}
                </button>
                <button 
                  onClick={triggerNewAnalysis}
                  disabled={isAnalyzingFull}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <History className="w-4 h-4" /> {fullAnalysisResult ? 'Gerar Nova Análise' : 'Gerar Análise'}
                </button>
              </div>
              <button 
                onClick={() => setShowFullAnalysisModal(false)}
                className={cn(
                  "px-6 py-2 rounded-xl font-bold text-sm transition-colors",
                  isDarkMode ? "bg-zinc-100 text-zinc-900 hover:bg-white" : "bg-zinc-900 text-white hover:bg-zinc-800"
                )}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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

const Header = ({ isDarkMode, toggleDarkMode, onOpenHelp }: { isDarkMode: boolean, toggleDarkMode: () => void, onOpenHelp: () => void }) => {
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
    <header className={cn(
      "h-16 border-b flex items-center justify-between px-8 backdrop-blur-md z-10 transition-colors",
      isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-200"
    )}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={cn("text-lg font-bold tracking-tight", isDarkMode ? "text-zinc-100" : "text-zinc-800")}>FTA Maintenance Pro</h1>
          <p className={cn("text-[10px] uppercase tracking-widest font-bold", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>Análise Inteligente de Árvore de Falhas</p>
        </div>
      </div>
      
      <nav className="flex items-center gap-4">
        <button 
          onClick={toggleDarkMode}
          className={cn(
            "p-2 rounded-lg border transition-colors shadow-sm",
            isDarkMode ? "bg-zinc-800 text-yellow-400 border-zinc-700 hover:bg-zinc-700" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
          )}
          title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={onFileChange} 
        />
        <button 
          onClick={onOpen}
          className={cn(
            "transition-colors flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border",
            isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-emerald-600"
          )}
        >
          <FolderOpen className="w-4 h-4" /> Abrir Projeto
        </button>
        <button 
          onClick={onSave}
          className="text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg shadow-sm"
        >
          <Save className="w-4 h-4" /> Salvar Projeto
        </button>
        <div className={cn("h-6 w-px mx-2", isDarkMode ? "bg-zinc-800" : "bg-zinc-200")} />
        <button 
          onClick={onOpenHelp}
          className={cn("transition-colors flex items-center gap-2 text-sm font-medium", isDarkMode ? "text-zinc-400 hover:text-emerald-400" : "text-zinc-500 hover:text-emerald-600")}
        >
          <HelpCircle className="w-4 h-4" /> Ajuda
        </button>
      </nav>
    </header>
  );
};

const HelpModal = ({ isOpen, onClose, isDarkMode }: { isOpen: boolean, onClose: () => void, isDarkMode: boolean }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className={cn(
        "w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 rounded-3xl shadow-2xl border",
        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className={cn(
          "p-6 border-b flex items-center justify-between",
          isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
        )}>
          <div>
            <h2 className={cn("text-xl font-bold flex items-center gap-3", isDarkMode ? "text-zinc-100" : "text-zinc-800")}>
              <HelpCircle className="w-6 h-6 text-emerald-600" /> 
              Guia de Configuração de API
            </h2>
            <p className={cn("text-sm mt-1", isDarkMode ? "text-zinc-500" : "text-zinc-500")}>Como obter e configurar suas chaves de Inteligência Artificial</p>
          </div>
          <button 
            onClick={onClose}
            className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-zinc-700 text-zinc-500" : "hover:bg-zinc-200 text-zinc-400")}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="space-y-4">
            <h3 className={cn("text-lg font-bold flex items-center gap-2", isDarkMode ? "text-zinc-200" : "text-zinc-800")}>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">1</div>
              Google Gemini (Recomendado)
            </h3>
            <div className={cn("pl-10 space-y-3 text-sm leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
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
            <h3 className={cn("text-lg font-bold flex items-center gap-2", isDarkMode ? "text-zinc-200" : "text-zinc-800")}>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">2</div>
              OpenAI ChatGPT (Alternativo)
            </h3>
            <div className={cn("pl-10 space-y-3 text-sm leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
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
            <h3 className={cn("text-lg font-bold flex items-center gap-2", isDarkMode ? "text-zinc-200" : "text-zinc-800")}>
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">3</div>
              Como Adicionar na Aplicação
            </h3>
            <div className={cn("pl-10 space-y-3 text-sm leading-relaxed", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Na barra lateral esquerda, clique no ícone de engrenagem (<Settings2 className="w-3 h-3 inline" />) na seção <strong>Inteligência Artificial</strong>.</li>
                <li>Selecione o <strong>Provedor Ativo</strong> que deseja utilizar.</li>
                <li>Cole sua chave no campo correspondente (Gemini ou OpenAI).</li>
                <li>Clique em <strong>"Salvar"</strong>. A página irá recarregar para aplicar as novas configurações.</li>
              </ol>
              <div className={cn(
                "p-4 rounded-xl mt-4 border",
                isDarkMode ? "bg-amber-900/10 border-amber-900/20" : "bg-amber-50 border-amber-100"
              )}>
                <p className={cn("text-xs font-bold flex items-center gap-2 mb-1", isDarkMode ? "text-amber-400" : "text-amber-800")}>
                  <AlertTriangle className="w-3 h-3" /> Nota de Segurança
                </p>
                <p className={cn("text-[11px]", isDarkMode ? "text-amber-500/80" : "text-amber-700")}>Sua chave é salva apenas no seu navegador (localStorage). Ela nunca é enviada para nossos servidores, exceto para realizar as consultas de IA diretamente aos provedores.</p>
              </div>
            </div>
          </section>
        </div>
        
        <div className={cn(
          "p-6 border-t flex justify-center",
          isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
        )}>
          <button 
            onClick={onClose}
            className={cn(
              "px-8 py-2 rounded-xl font-bold transition-all shadow-lg",
              isDarkMode ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-zinc-800 text-white hover:bg-zinc-700"
            )}
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('fta-dark-mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('fta-dark-mode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={cn(
      "w-full h-screen flex font-sans overflow-hidden transition-colors",
      isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"
    )}>
      <ReactFlowProvider>
        <Sidebar isDarkMode={isDarkMode} />
        <div className="flex-1 flex flex-col">
          <Header 
            isDarkMode={isDarkMode} 
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
            onOpenHelp={() => setIsHelpOpen(true)} 
          />
          
          <main className={cn("flex-1 relative transition-colors", isDarkMode ? "bg-zinc-900" : "bg-white")}>
            <Flow isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </main>
        </div>
        <HelpModal isDarkMode={isDarkMode} isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </ReactFlowProvider>
    </div>
  );
}
