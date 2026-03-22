function SelectedOrderPanel({
  selectedMarker,
  statusLabel,
  handleMarkDelivered,
  handleSaveOrUpdate,
  handleCancelOrder
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">Pedido Seleccionado</h2>
      {selectedMarker ? (
        <>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Estado:</span> {statusLabel(selectedMarker.estado)}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Direccion:</span>{' '}
            {selectedMarker.loadingAddress ? 'Consultando Nominatim...' : selectedMarker.direccion}
          </p>

          {['pendiente', 'en_proceso'].includes(selectedMarker.estado) ? (
            <button
              type="button"
              onClick={handleMarkDelivered}
              disabled={selectedMarker.processingDelivery}
              className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {selectedMarker.processingDelivery ? 'Procesando entrega...' : 'Marcar como Entregado'}
            </button>
          ) : null}

          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleSaveOrUpdate}
              disabled={
                selectedMarker.saving ||
                selectedMarker.processingDelivery ||
                (selectedMarker.isPersisted && !selectedMarker.isDirty)
              }
              className="rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {selectedMarker.saving
                ? 'Guardando...'
                : selectedMarker.isPersisted && selectedMarker.isDirty
                  ? 'Actualizar'
                  : selectedMarker.isPersisted
                    ? 'Guardado'
                    : 'Guardar Pedido'}
            </button>

            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={selectedMarker.estado === 'entregado'}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Selecciona o simula un pedido para empezar.</p>
      )}
    </div>
  );
}

export default SelectedOrderPanel;
