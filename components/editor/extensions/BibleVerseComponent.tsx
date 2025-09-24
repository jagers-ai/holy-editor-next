import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import type { NodeViewRendererProps } from '@tiptap/react'

// ⚡ React.memo로 불필요한 re-render 방지
const BibleVerseComponent = React.memo((props: NodeViewRendererProps) => {
  const { reference } = props.node.attrs
  
  // ⚠️ 내부 state 최소화 - node.attrs 직접 사용
  // useState 사용 자제, 필요시 매우 제한적으로만
  // updateAttributes는 성경구절에서 불필요 (정적 데이터)
  
  // 📌 content는 이제 InputRule에서 생성 시 이미 설정됨
  // useEffect 불필요 - 노드 생성 시 content가 이미 포함되어 있음
  
  const insertParagraphAt = (pos: number) => {
    const { state, view } = props.editor
    const paragraph = state.schema.nodes.paragraph
    if (!paragraph) return
    const tr = state.tr.insert(pos, paragraph.create())
    const resolved = tr.doc.resolve(pos + 1)
    const sel = TextSelection.near(resolved)
    view.dispatch(tr.setSelection(sel).scrollIntoView())
    view.focus()
  }

  const getBeforePos = (): number | null => {
    try {
      return typeof props.getPos === 'function' ? (props.getPos() as number) : null
    } catch {
      return null
    }
  }

  const getAfterPos = (): number | null => {
    try {
      const base = typeof props.getPos === 'function' ? (props.getPos() as number) : null
      return base !== null ? base + props.node.nodeSize : null
    } catch {
      return null
    }
  }

  return (
    <NodeViewWrapper className="bible-verse-wrapper block">
      <div className="h-px my-0 cursor-text bg-transparent select-none" onMouseDown={(e)=>{const pos=getBeforePos(); if(pos!==null){e.preventDefault(); insertParagraphAt(pos)}}}></div>
      <div className="bg-gray-200 rounded-md px-2 py-1 my-0 max-w-full">
        {/* 참조 표시 - 상단으로 이동 */}
        {reference && (
          <div className="text-sm font-bold text-gray-800 mb-2" 
               style={{ color: 'rgb(31, 41, 55)', fontWeight: 'bold' }}>
            {reference}
          </div>
        )}
        
        {/* NodeViewContent로 편집 가능 영역 - 이미 content가 있음 */}
        <NodeViewContent 
          className="text-black leading-relaxed block min-h-[1.5rem]"
          as="div"
          style={{ color: 'black', fontStyle: 'normal', whiteSpace: 'pre-wrap' }}
        >
          {/* 노드 생성 시 이미 content가 설정되어 있음 */}
        </NodeViewContent>
      </div>
      <div className="h-px my-0 cursor-text bg-transparent select-none" onMouseDown={(e)=>{const pos=getAfterPos(); if(pos!==null){e.preventDefault(); insertParagraphAt(pos)}}}></div>
    </NodeViewWrapper>
  )
})

BibleVerseComponent.displayName = 'BibleVerseComponent'

export default BibleVerseComponent
