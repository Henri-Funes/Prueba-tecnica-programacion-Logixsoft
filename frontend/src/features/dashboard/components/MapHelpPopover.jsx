function MapHelpPopover({
  showMapHelp,
  isMapHelpClosing,
  mapHelpPanelRef,
  mapHelpButtonRef,
  toggleMapHelp
}) {
  return (
    <div className="relative z-[1200]">
      <button
        type="button"
        aria-label="Mostrar ayuda del mapa"
        aria-expanded={showMapHelp}
        onClick={toggleMapHelp}
        ref={mapHelpButtonRef}
        className="group relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-ocean-300 bg-white text-xs font-bold text-ocean-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-ocean-50 focus:outline-none focus:ring-2 focus:ring-ocean-400"
      >
        <span className="absolute -inset-1 animate-pulse rounded-full bg-ocean-200/50 opacity-70" />
        <span className="relative z-10">?</span>
      </button>

      {showMapHelp || isMapHelpClosing ? (
        <div
          ref={mapHelpPanelRef}
          className={`pointer-events-auto absolute left-full top-1/2 z-[1200] ml-2 w-[330px] -translate-y-1/2 rounded-xl border border-ocean-200 bg-ocean-50 px-3 py-2 text-sm text-ocean-900 shadow-lg transition-all duration-200 ${
            isMapHelpClosing ? 'translate-x-1 opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <p className="font-semibold">Guia rapida del mapa</p>
          <p>Arrastre los marcadores para cambiar el punto de entrega.</p>
          <p>Seleccione una fecha en historial para ver los pedidos de ese dia.</p>
          <p>Use "Limpiar pedidos" para limpiar solo la vista actual.</p>
        </div>
      ) : null}
    </div>
  );
}

export default MapHelpPopover;
