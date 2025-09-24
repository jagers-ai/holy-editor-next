import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewRendererProps } from '@tiptap/react'

// ⚡ React.memo로 불필요한 re-render 방지
const BibleVerseComponent = React.memo((props: NodeViewRendererProps) => {
  const { reference } = props.node.attrs
  
  // ⚠️ 내부 state 최소화 - node.attrs 직접 사용
  // useState 사용 자제, 필요시 매우 제한적으로만
  // updateAttributes는 성경구절에서 불필요 (정적 데이터)
  
  // 📌 content는 이제 InputRule에서 생성 시 이미 설정됨
  // useEffect 불필요 - 노드 생성 시 content가 이미 포함되어 있음
  
  return (
    <NodeViewWrapper className="bible-verse-wrapper block">
      <div className="h-3 my-1 cursor-text" onMouseDown={(e)=>{const pos=getBeforePos(); if(pos!==null){e.preventDefault(); insertParagraphAt(pos)}}}></div>
      <div className="bg-gray-200 rounded-lg px-4 py-3 my-2 max-w-full" 
           style={{ backgroundColor: 'rgb(229, 231, 235)' }}>
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
      <div className="h-3 my-1 cursor-text" onMouseDown={(e)=>{const pos=getAfterPos(); if(pos!==null){e.preventDefault(); insertParagraphAt(pos)}}}></div>
    </NodeViewWrapper>
  )
})

BibleVerseComponent.displayName = 'BibleVerseComponent'

export default BibleVerseComponent