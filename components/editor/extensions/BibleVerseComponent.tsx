import React from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewRendererProps } from '@tiptap/react'

// ⚡ React.memo로 불필요한 re-render 방지
const BibleVerseComponent = React.memo((props: NodeViewRendererProps) => {
  const { reference, verseText } = props.node.attrs
  
  // ⚠️ 내부 state 최소화 - node.attrs 직접 사용
  // useState 사용 자제, 필요시 매우 제한적으로만
  
  // ⚡ updateAttributes 사용 시 디바운싱 고려
  const handleUpdate = React.useCallback((newAttrs: any) => {
    // 빈번한 업데이트 방지
    props.updateAttributes(newAttrs)
  }, [props])
  
  // ⚠️ useEffect 최소화 - 꼭 필요한 경우만
  // cleanup 함수 필수
  React.useEffect(() => {
    // 초기 텍스트 설정 (verseText가 있고 현재 content가 비어있을 경우만)
    if (verseText && !props.node.textContent) {
      // 초기 텍스트 설정이 필요한 경우
      // 실제로는 이미 nodeInputRule에서 처리되므로 보통 필요없음
    }
    
    return () => {
      // cleanup 필수 - 현재는 특별한 cleanup 필요없음
    }
  }, []) // 의존성 최소화
  
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
// ⚡ memo 비교 함수로 최적화
(prevProps, nextProps) => {
  // attributes가 실제로 변경되었을 때만 re-render
  return (
    prevProps.node.attrs.reference === nextProps.node.attrs.reference &&
    prevProps.node.attrs.verseText === nextProps.node.attrs.verseText &&
    prevProps.selected === nextProps.selected
  )
})

BibleVerseComponent.displayName = 'BibleVerseComponent'

export default BibleVerseComponent