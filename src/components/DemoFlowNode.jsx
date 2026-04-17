import { Handle, Position } from '@xyflow/react';

const HANDLE_COLORS = {
  node: '#9ecaff',
  text: '#e8deff',
  file: '#9ecaff',
  bool: '#00e475',
};

function getHandleColor(type) {
  return HANDLE_COLORS[type] || HANDLE_COLORS.node;
}

export default function DemoFlowNode({ data, id }) {
  const inputs = data?.inputs ?? [];
  const outputs = data?.outputs ?? [];
  const schemaType = (data?.schemaType ?? 'agent').toLowerCase();
  const typeLabel = data?.definitionId?.replace(/^(control_|agent_|tool_|provide_)/, '') || schemaType;

  return (
    <div
      className="rounded-2xl min-w-[180px] shadow-xl"
      style={{
        background: '#252d45',
        border: '1.5px solid rgba(208, 188, 255, 0.35)',
      }}
      data-schema={schemaType}
    >
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-2xl"
        style={{
          background: 'rgba(130, 82, 236, 0.2)',
          borderBottom: '1px solid rgba(208, 188, 255, 0.2)',
        }}
      >
        <span className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: '#d0bcff' }}>
          {typeLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex flex-col gap-2">
          {inputs.map((slot, i) => (
            <div key={`in-${i}`} className="relative h-3 flex items-center">
              <Handle
                type="target"
                position={Position.Left}
                id={`input-${i}`}
                className="w-3 h-3 rounded-full border-2"
                style={{ background: getHandleColor(slot.type), borderColor: '#1e2740' }}
              />
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: '#f0eaff' }}>
            {data?.label || id}
          </div>
          {data?.body && (
            <div className="text-xs mt-1 truncate max-w-[140px]" style={{ color: '#a8a0b8' }}>
              {data.body.substring(0, 40)}...
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {outputs.map((slot, i) => (
            <div key={`out-${i}`} className="relative h-3 flex items-center justify-end">
              <Handle
                type="source"
                position={Position.Right}
                id={`output-${i}`}
                className="w-3 h-3 rounded-full border-2"
                style={{ background: getHandleColor(slot.type), borderColor: '#1e2740' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
