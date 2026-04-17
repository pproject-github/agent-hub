import { useState, useEffect } from 'react';
import { ReactFlow, Background, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import yaml from 'js-yaml';
import DemoFlowNode from './DemoFlowNode.jsx';

const nodeTypes = { demoFlowNode: DemoFlowNode };

function deserializeFlowYaml(flowYamlContent) {
  if (!flowYamlContent?.trim()) return { nodes: [], edges: [] };

  try {
    const raw = yaml.load(flowYamlContent);
    const instances = raw?.instances || {};
    const edgesRaw = Array.isArray(raw?.edges) ? raw.edges : [];
    const nodePositions = raw?.ui?.nodePositions || {};

    const nodes = Object.keys(instances).map((id) => {
      const inst = instances[id];
      const position = nodePositions[id] || { x: 0, y: 0 };
      const definitionId = inst?.definitionId || id;

      return {
        id,
        type: 'demoFlowNode',
        position,
        data: {
          label: inst?.label || id,
          definitionId,
          schemaType: definitionId.startsWith('control_') ? 'control' : 'agent',
          body: inst?.body || '',
          inputs: inst?.input || [],
          outputs: inst?.output || [],
        },
      };
    });

    const edges = edgesRaw
      .filter((e) => e?.source && e?.target)
      .map((e, i) => ({
        id: `e-${e.source}-${e.target}-${i}`,
        source: String(e.source),
        target: String(e.target),
        sourceHandle: e.sourceHandle || 'output-0',
        targetHandle: e.targetHandle || 'input-0',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#d0bcff' },
        style: { stroke: '#d0bcff', strokeWidth: 2 },
        type: 'default',
      }));

    return { nodes, edges };
  } catch (err) {
    console.error('Failed to parse flow YAML:', err);
    return { nodes: [], edges: [] };
  }
}

export default function FlowViewer({ flowData }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const { nodes: n, edges: e } = deserializeFlowYaml(flowData);
    setNodes(n);
    setEdges(e);
  }, [flowData]);

  if (nodes.length === 0) return null;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.3}
      maxZoom={1.5}
      defaultEdgeOptions={{ type: 'smoothstep' }}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#3d4560" gap={20} size={1.5} />
    </ReactFlow>
  );
}
