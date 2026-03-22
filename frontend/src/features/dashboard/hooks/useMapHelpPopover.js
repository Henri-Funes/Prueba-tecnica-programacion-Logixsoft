import { useCallback, useEffect, useRef, useState } from 'react';

export function useMapHelpPopover() {
  const [showMapHelp, setShowMapHelp] = useState(false);
  const [isMapHelpClosing, setIsMapHelpClosing] = useState(false);
  const mapHelpPanelRef = useRef(null);
  const mapHelpButtonRef = useRef(null);
  const mapHelpCloseTimerRef = useRef(null);

  const closeMapHelp = useCallback(() => {
    if (!showMapHelp || isMapHelpClosing) {
      return;
    }

    setIsMapHelpClosing(true);

    if (mapHelpCloseTimerRef.current) {
      clearTimeout(mapHelpCloseTimerRef.current);
    }

    mapHelpCloseTimerRef.current = setTimeout(() => {
      setShowMapHelp(false);
      setIsMapHelpClosing(false);
      mapHelpCloseTimerRef.current = null;
    }, 180);
  }, [isMapHelpClosing, showMapHelp]);

  const toggleMapHelp = useCallback(() => {
    if (showMapHelp) {
      closeMapHelp();
      return;
    }

    if (mapHelpCloseTimerRef.current) {
      clearTimeout(mapHelpCloseTimerRef.current);
      mapHelpCloseTimerRef.current = null;
    }

    setIsMapHelpClosing(false);
    setShowMapHelp(true);
  }, [closeMapHelp, showMapHelp]);

  useEffect(() => {
    function handleOutsideHelpClick(event) {
      if (!showMapHelp) {
        return;
      }

      const target = event.target;
      const clickedHelpPanel = mapHelpPanelRef.current?.contains(target);
      const clickedHelpButton = mapHelpButtonRef.current?.contains(target);

      if (!clickedHelpPanel && !clickedHelpButton) {
        closeMapHelp();
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape' && showMapHelp) {
        closeMapHelp();
      }
    }

    document.addEventListener('mousedown', handleOutsideHelpClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideHelpClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeMapHelp, showMapHelp]);

  useEffect(
    () => () => {
      if (mapHelpCloseTimerRef.current) {
        clearTimeout(mapHelpCloseTimerRef.current);
      }
    },
    []
  );

  return {
    showMapHelp,
    isMapHelpClosing,
    mapHelpPanelRef,
    mapHelpButtonRef,
    toggleMapHelp
  };
}
