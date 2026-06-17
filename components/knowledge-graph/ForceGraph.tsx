'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Node {
  id: string;
  label: string;
  type: string;
  district?: string;
  isDemo?: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  snippet?: string;
}

interface ForceGraphProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edge: Edge | null) => void;
}

interface SimNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isDemo?: boolean;
}

export function ForceGraph({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onSelectEdge
}: ForceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isDemo, setIsDemo] = useState(false);

  // Keep simulation nodes persistent across renders to avoid shaking/jumping
  const simNodesRef = useRef<SimNode[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const dragNodeRef = useRef<SimNode | null>(null);
  const hoverNodeRef = useRef<SimNode | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Panning drag states
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync incoming nodes with persistent simulation nodes
  useEffect(() => {
    const existingNodes = new Map(simNodesRef.current.map(n => [n.id, n]));
    const newSimNodes: SimNode[] = [];
    let isDemoGraph = false;

    nodes.forEach(n => {
      if (n.isDemo) isDemoGraph = true;

      const radius = n.type === 'Document' ? 18 : 12;
      if (existingNodes.has(n.id)) {
        // Keep position, update metadata
        const existing = existingNodes.get(n.id)!;
        newSimNodes.push({
          ...existing,
          label: n.label,
          type: n.type,
          radius
        });
      } else {
        // Create new node with randomized coordinates near center
        const canvas = canvasRef.current;
        const startX = canvas ? canvas.width / 2 : 250;
        const startY = canvas ? canvas.height / 2 : 250;
        newSimNodes.push({
          id: n.id,
          label: n.label,
          type: n.type,
          x: startX + (Math.random() - 0.5) * 150,
          y: startY + (Math.random() - 0.5) * 150,
          vx: 0,
          vy: 0,
          radius,
          isDemo: n.isDemo
        });
      }
    });

    simNodesRef.current = newSimNodes;
    setIsDemo(isDemoGraph);
  }, [nodes]);

  // Center Graph position
  const handleRecenter = () => {
    setPanX(0);
    setPanY(0);
    setZoom(1.0);
    
    // Smoothly drag nodes toward center
    const canvas = canvasRef.current;
    if (canvas) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      simNodesRef.current.forEach(n => {
        n.x = centerX + (Math.random() - 0.5) * 100;
        n.y = centerY + (Math.random() - 0.5) * 100;
        n.vx = 0;
        n.vy = 0;
      });
    }
  };

  // Node Color Mapper
  const getNodeColor = (type: string, isSelected: boolean) => {
    const baseColors: Record<string, string> = {
      person: '#FF6B6B',      // neon red
      place: '#4ECDC4',       // neon teal
      event: '#45B7D1',       // neon blue
      organization: '#58D68D',// neon green
      date: '#F5B041',        // neon orange
      artifact: '#AF7AC5',    // neon violet
      district: '#A569BD',    // purple
      Document: '#5DADE2',    // sky blue
    };
    const color = baseColors[type] || '#95A5A6';
    return isSelected ? '#FFFFFF' : color;
  };

  // Main Force Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const tick = () => {
      // 1. Resize canvas if needed
      if (containerRef.current && (canvas.width !== containerRef.current.clientWidth || canvas.height !== containerRef.current.clientHeight)) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const center_x = width / 2;
      const center_y = height / 2;

      const simNodes = simNodesRef.current;

      // 2. Physics Simulation Loop (Attraction, Repulsion, Center Gravity)
      // A. Coulomb Repulsion between all nodes
      for (let i = 0; i < simNodes.length; i++) {
        const nodeA = simNodes[i];
        for (let j = i + 1; j < simNodes.length; j++) {
          const nodeB = simNodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1.0;
          
          // Min distance threshold to avoid super repulsion
          const min_dist = 85;
          if (dist < min_dist) {
            const force = (min_dist - dist) * 0.08;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            if (nodeA !== dragNodeRef.current) {
              nodeA.vx -= fx;
              nodeA.vy -= fy;
            }
            if (nodeB !== dragNodeRef.current) {
              nodeB.vx += fx;
              nodeB.vy += fy;
            }
          }
        }
      }

      // B. Hooke Attraction along edges
      edges.forEach(edge => {
        const src = simNodes.find(n => n.id === edge.source);
        const tgt = simNodes.find(n => n.id === edge.target);
        if (!src || !tgt) return;

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1.0;
        
        const rest_len = 110;
        if (dist > rest_len) {
          const force = (dist - rest_len) * 0.02 * (edge.strength || 0.8);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (src !== dragNodeRef.current) {
            src.vx += fx;
            src.vy += fy;
          }
          if (tgt !== dragNodeRef.current) {
            tgt.vx -= fx;
            tgt.vy -= fy;
          }
        }
      });

      // C. Center gravity pulls nodes back
      simNodes.forEach(node => {
        if (node === dragNodeRef.current) return;
        const dx = center_x - node.x;
        const dy = center_y - node.y;
        node.vx += dx * 0.003;
        node.vy += dy * 0.003;

        // Apply velocity limits (damping)
        node.vx *= 0.82;
        node.vy *= 0.82;

        // Update positions
        node.x += node.vx;
        node.y += node.vy;
      });

      // 3. Drawing Loop
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      
      // Apply Zoom & Pan matrix transforms
      ctx.translate(panX + center_x, panY + center_y);
      ctx.scale(zoom, zoom);
      ctx.translate(-center_x, -center_y);

      // A. Draw Edges (Translucent Glowing lines)
      edges.forEach(edge => {
        const src = simNodes.find(n => n.id === edge.source);
        const tgt = simNodes.find(n => n.id === edge.target);
        if (!src || !tgt) return;

        const isHighlighted = selectedNodeId === src.id || selectedNodeId === tgt.id;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        
        ctx.strokeStyle = isHighlighted ? 'rgba(255, 255, 255, 0.45)' : 'rgba(148, 163, 184, 0.12)';
        ctx.lineWidth = isHighlighted ? 1.8 : 1.0;
        
        if (isHighlighted) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#38bdf8';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      });

      // B. Draw Nodes (Glowing circles with labels)
      simNodes.forEach(node => {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoverNodeRef.current?.id === node.id;
        const color = getNodeColor(node.type, isSelected);

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        
        // Draw glowing rings
        ctx.fillStyle = color;
        ctx.shadowBlur = isSelected || isHovered ? 12 : 5;
        ctx.shadowColor = color;
        ctx.fill();

        // Draw inner dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.4, 0, 2 * Math.PI);
        ctx.fillStyle = '#0f172a'; // dark center
        ctx.shadowBlur = 0;
        ctx.fill();

        // Draw node selection outline halo
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Write labels
        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.font = isSelected ? 'bold 10px monospace' : '9px sans-serif';
        ctx.textAlign = 'center';
        
        // Label offset below node
        ctx.fillText(node.label, node.x, node.y + node.radius + 13);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [edges, panX, panY, zoom, selectedNodeId]);

  // Translate Screen coordinates to Canvas space (accounting for Zoom/Pan)
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const center_x = canvas.width / 2;
    const center_y = canvas.height / 2;

    // Apply inverse transform matrix to screen coordinates
    const canvasX = (clientX - panX - center_x) / zoom + center_x;
    const canvasY = (clientY - panY - center_y) / zoom + center_y;

    return { x: canvasX, y: canvasY };
  };

  // Handle Mouse Down (click/pan/drag triggers)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasMousePos(e);
    
    // Check if clicked near any node
    const clickedNode = simNodesRef.current.find(node => {
      const dx = node.x - pos.x;
      const dy = node.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 8;
    });

    if (clickedNode) {
      isDraggingRef.current = true;
      dragNodeRef.current = clickedNode;
      clickedNode.vx = 0;
      clickedNode.vy = 0;
    } else {
      // Panning trigger
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  // Handle Mouse Move (drag coordinates update)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasMousePos(e);
    mousePosRef.current = pos;

    if (isDraggingRef.current && dragNodeRef.current) {
      dragNodeRef.current.x = pos.x;
      dragNodeRef.current.y = pos.y;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      setPanX(e.clientX - panStartRef.current.x);
      setPanY(e.clientY - panStartRef.current.y);
    } else {
      // Hover detection
      const hovered = simNodesRef.current.find(node => {
        const dx = node.x - pos.x;
        const dy = node.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= node.radius + 8;
      });
      hoverNodeRef.current = hovered || null;
    }
  };

  // Handle Mouse Up (selection clicks)
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && dragNodeRef.current) {
      onSelectNode(dragNodeRef.current.id);
      
      // Check if this drag concluded near any other node to select relations edge
      onSelectEdge(null); // clear edge on node drag
    } else if (isPanningRef.current) {
      isPanningRef.current = false;
    } else {
      // Regular canvas click (deselect or edge select check)
      const pos = getCanvasMousePos(e);

      // Deselect if clicked empty area
      onSelectNode(null);
      onSelectEdge(null);

      // Check if clicked near an edge path
      edges.forEach(edge => {
        const src = simNodesRef.current.find(n => n.id === edge.source);
        const tgt = simNodesRef.current.find(n => n.id === edge.target);
        if (!src || !tgt) return;

        // Math checking: distance from point (pos.x, pos.y) to line segment (src, tgt)
        const A = pos.x - src.x;
        const B = pos.y - src.y;
        const C = tgt.x - src.x;
        const D = tgt.y - src.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;
        if (param < 0) {
          xx = src.x;
          yy = src.y;
        } else if (param > 1) {
          xx = tgt.x;
          yy = tgt.y;
        } else {
          xx = src.x + param * C;
          yy = src.y + param * D;
        }

        const dx = pos.x - xx;
        const dy = pos.y - yy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 6) {
          onSelectEdge(edge);
        }
      });
    }

    isDraggingRef.current = false;
    dragNodeRef.current = null;
  };

  // Wheel Zoom Control
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 0.08;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + zoomFactor, 2.5));
    } else {
      setZoom(prev => Math.max(prev - zoomFactor, 0.4));
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] bg-slate-950/70 border border-slate-900 rounded-xl overflow-hidden shadow-inner">
      {/* Visual Demo Watermark banner (Safeguard 9) */}
      {isDemo && (
        <div className="absolute top-3 left-3 bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 z-10 select-none animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>VIRTUAL DEMO DATA DISPLAY</span>
        </div>
      )}

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10 select-none">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.5))}
          className="h-8 w-8 bg-slate-900/90 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.4))}
          className="h-8 w-8 bg-slate-900/90 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRecenter}
          className="h-8 w-8 bg-slate-900/90 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
          title="Recenter"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
