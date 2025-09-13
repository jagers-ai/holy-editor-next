export function bindUserInteraction(dom: HTMLElement, onInteract: () => void) {
  const mark = () => onInteract();
  dom.addEventListener('keydown', mark);
  dom.addEventListener('paste', mark);
  dom.addEventListener('drop', mark);
  dom.addEventListener('compositionend', mark);
  dom.addEventListener('input', mark);
  return () => {
    dom.removeEventListener('keydown', mark);
    dom.removeEventListener('paste', mark);
    dom.removeEventListener('drop', mark);
    dom.removeEventListener('compositionend', mark);
    dom.removeEventListener('input', mark);
  };
}

