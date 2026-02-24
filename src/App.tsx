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
  FolderOpen
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

import { getFTASuggestions } from './services/geminiService';

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
  const [customKey, setCustomKey] = useState(localStorage.getItem('custom_gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSaveKey = () => {
    if (customKey) {
      localStorage.setItem('custom_gemini_api_key', customKey);
    } else {
      localStorage.removeItem('custom_gemini_api_key');
    }
    setShowKeyInput(false);
    window.location.reload(); // Reload to apply new key
  };

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
            <div className="space-y-2">
              <input 
                type="password"
                placeholder="Insira sua Gemini API Key..."
                className="w-full p-2 text-[10px] border border-zinc-300 rounded bg-white"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveKey}
                  className="flex-1 bg-zinc-800 text-white text-[10px] py-1 rounded hover:bg-zinc-700 font-bold"
                >
                  Salvar
                </button>
                <button 
                  onClick={() => setShowKeyInput(false)}
                  className="flex-1 bg-zinc-200 text-zinc-600 text-[10px] py-1 rounded hover:bg-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 text-[10px] leading-relaxed">
              {customKey 
                ? "Usando sua chave de API personalizada." 
                : "Usando a chave de API padrão do sistema (Gratuita)."}
            </p>
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

  const addChildNode = useCallback((parentId: string, type: string, label?: string) => {
    const parentNode = getNodes().find((n) => n.id === parentId);
    if (!parentNode) return;

    const newNodeId = `${Date.now()}`;
    
    const newNode: Node = {
      id: newNodeId,
      type,
      position: { x: parentNode.position.x, y: parentNode.position.y + 150 },
      data: { 
        label: label || 'Nova Causa',
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
  }, [getNodes, setNodes, setEdges]);

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
      position = { x: selectedNode.position.x + 200, y: selectedNode.position.y };
    }

    const newNode: Node = {
      id: newNodeId,
      type,
      position,
      data: { 
        label,
        onAddChild: () => addChildNode(newNodeId)
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
        setNodes(flow.nodes || []);
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
          onAddChild: () => addChildNode(initialId)
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
  useEffect(() => {
    if (canFetchSuggestions && selectedNode && selectedNode.data.label && !selectedNode.type?.includes('Gate')) {
      setIsLoadingSuggestions(true);
      getFTASuggestions(selectedNode.data.label as string, selectedNode.type as string)
        .then(suggestions => {
          setDynamicSuggestions(suggestions);
          setIsLoadingSuggestions(false);
        });
    } else {
      setDynamicSuggestions([]);
    }
  }, [canFetchSuggestions, selectedNode]);

  // Reset confirmation when selection changes
  useEffect(() => {
    setCanFetchSuggestions(false);
    setDynamicSuggestions([]);
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
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }, [selectedEdge, setEdges]);

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
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, addChildNode]
  );

  const exportImage = async (format: 'png' | 'jpeg') => {
    if (!reactFlowWrapper.current) return;
    
    // Hide UI elements during export
    const controls = document.querySelector('.react-flow__controls') as HTMLElement;
    const minimap = document.querySelector('.react-flow__minimap') as HTMLElement;
    if (controls) controls.style.display = 'none';
    if (minimap) minimap.style.display = 'none';

    try {
      const dataUrl = format === 'png' 
        ? await toPng(reactFlowWrapper.current, { backgroundColor: '#ffffff', quality: 1 })
        : await toJpeg(reactFlowWrapper.current, { backgroundColor: '#ffffff', quality: 1 });
      
      const link = document.createElement('a');
      link.download = `fta-export-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      if (controls) controls.style.display = 'flex';
      if (minimap) minimap.style.display = 'block';
    }
  };

  const exportPDF = async () => {
    if (!reactFlowWrapper.current) return;
    
    try {
      const dataUrl = await toPng(reactFlowWrapper.current, { backgroundColor: '#ffffff', quality: 1 });
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
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

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
    <div className="flex-1 h-full flex relative" ref={reactFlowWrapper}>
      <div className="flex-1 relative">
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
              className="fixed z-[100] bg-white border border-zinc-200 rounded-xl shadow-2xl py-2 w-56 animate-in fade-in zoom-in-95 duration-200"
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
                    onClick={() => setCanFetchSuggestions(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Gerar Sugestões
                  </button>
                </div>
              ) : isLoadingSuggestions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
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

export default function App() {
  return (
    <div className="w-full h-screen flex bg-white text-zinc-900 font-sans overflow-hidden">
      <ReactFlowProvider>
        <Sidebar />
        <div className="flex-1 flex flex-col">
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
            
            <nav className="flex items-center gap-6">
              <button className="text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" /> Projetos
              </button>
              <button className="text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium">
                <Settings2 className="w-4 h-4" /> Configurações
              </button>
              <button className="text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-2 text-sm font-medium">
                <HelpCircle className="w-4 h-4" /> Ajuda
              </button>
            </nav>
          </header>
          
          <main className="flex-1 relative bg-white">
            <Flow />
          </main>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
