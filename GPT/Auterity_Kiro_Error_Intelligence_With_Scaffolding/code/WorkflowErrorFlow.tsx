
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'

const nodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 0, y: 50 }
  },
  {
    id: '2',
    data: { label: <span style={{ color: 'red' }}>Step 2 (Error)</span> },
    position: { x: 200, y: 150 }
  },
  {
    id: '3',
    data: { label: 'Step 3' },
    position: { x: 400, y: 250 }
  }
]

const edges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' }
]

export default function WorkflowErrorFlow() {
  return (
    <div style={{ height: 400 }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
