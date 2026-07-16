type ScrollMetrics = Pick<HTMLElement, 'scrollTop' | 'scrollHeight' | 'clientHeight'>;

const EDGE_TOLERANCE_PX = 1;

export const shouldContainWheel = (element: ScrollMetrics, deltaY: number) => {
    if (deltaY === 0) return false;
    if (element.scrollHeight <= element.clientHeight) return true;
    if (deltaY < 0) return element.scrollTop <= EDGE_TOLERANCE_PX;
    return element.scrollTop + element.clientHeight >= element.scrollHeight - EDGE_TOLERANCE_PX;
};
