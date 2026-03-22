function ActiveMarkersPanel({ markerList, selectedMarkerId, focusMarker }) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">Marcadores Activos</h2>
      {markerList.length === 0 ? (
        <p className="text-sm text-slate-500">Aun no hay marcadores en el mapa.</p>
      ) : (
        <ul className="max-h-[510px] space-y-2 overflow-y-auto pr-1">
          {markerList.map((item) => (
            <li key={`active-${item.markerId}`}>
              <button
                type="button"
                onClick={() => focusMarker(item.markerId)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedMarkerId === item.markerId
                    ? 'border-ocean-500 bg-ocean-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="font-semibold text-slate-800">{item.nombreCliente}</p>
                <p className="text-xs text-slate-500">Nº de pedido: {item.numeroPedido ?? 'Pendiente de guardar'}</p>
                <p className="text-xs text-slate-500">{item.direccion}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default ActiveMarkersPanel;
