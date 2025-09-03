import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewRendererProps } from '@tiptap/react'

// ⚡ React.memo로 불필요한 re-render 방지
const BibleVerseComponent = React.memo((props: NodeViewRendererProps) => {
  const { reference, verseText } = props.node.attrs
  
  // ⚠️ 내부 state 최소화 - node.attrs 직접 사용
  // useState 사용 자제, 필요시 매우 제한적으로만
  // updateAttributes는 성경구절에서 불필요 (정적 데이터)
  
  // ⚠️ useEffect 불필요 - 성경구절은 정적 데이터이므로 초기화 불필요
  
  return (
    <NodeViewWrapper className="bible-verse-wrapper inline-block">
      <div className="bg-slate-700 rounded-lg px-4 py-3 my-2 inline-block">
        {/* NodeViewContent로 편집 가능 영역 */}
        <NodeViewContent 
          className="text-white italic leading-relaxed block"
          as="div"
        >
          {/* 초기 텍스트는 node content로 자동 처리됨 */}
        </NodeViewContent>
        
        {/* 참조 표시 */}
        {reference && (
          <div className="text-xs text-gray-400 mt-2 not-italic">
            {reference}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}, 
// ⚡ memo 비교 함수로 최적화 - 성경구절 attrs는 불변이므로 선택 상태만 체크
(prevProps, nextProps) => {
  return prevProps.selected === nextProps.selected
})

BibleVerseComponent.displayName = 'BibleVerseComponent'

export default BibleVerseComponent