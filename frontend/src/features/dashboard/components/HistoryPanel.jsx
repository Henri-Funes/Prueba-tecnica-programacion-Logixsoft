function HistoryPanel({
  historyByDate,
  selectedHistoryDate,
  handleSelectHistoryDate,
  showAllHistory,
  handleToggleShowAllHistory,
  persistedCount,
  selectedHistoryGroup,
  selectedMarkerId,
  focusMarker
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Historial del Usuario</h2>
        <button
          type="button"
          onClick={handleToggleShowAllHistory}
          disabled={historyByDate.length === 0}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {showAllHistory ? `Vista por fecha (${persistedCount})` : `Ver todo el historial (${persistedCount})`}
        </button>
      </div>

      {historyByDate.length === 0 ? (
        <p className="text-sm text-slate-500">Aun no hay pedidos.</p>
      ) : (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {historyByDate.map((group) => (
            <li key={group.dateKey}>
              <button
                type="button"
                onClick={() => handleSelectHistoryDate(group.dateKey)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedHistoryDate === group.dateKey
                    ? 'border-ocean-500 bg-ocean-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="font-semibold text-slate-800">Pedidos del dia {group.dateLabel}</p>
                <p className="text-xs text-slate-500">
                  {group.count} pedido{group.count === 1 ? '' : 's'}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedHistoryGroup ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Registros del dia {selectedHistoryGroup.dateLabel}
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {selectedHistoryGroup.items.map((item) => (
              <li key={`history-item-${item.markerId}`}>
                <button
                  type="button"
                  onClick={() => focusMarker(item.markerId)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                    selectedMarkerId === item.markerId
                      ? 'border-ocean-500 bg-ocean-50'
                      : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                >
                  <p className="font-semibold text-slate-700">Nº de pedido {item.numeroPedido}</p>
                  <p className="text-slate-500">{item.direccion}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default HistoryPanel;
