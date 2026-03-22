import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { createOrder, getOrders, reverseGeocode, updateOrder } from '../services/api';
import { EL_SALVADOR_BOUNDARY_LNG_LAT } from '../data/el-salvador-boundary';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const cancelledIcon = L.divIcon({
  className: 'cancelled-marker',
  html: '<div class="h-8 w-8 rounded-full border-2 border-red-700 bg-red-100 text-center text-xl font-extrabold leading-7 text-red-700">x</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const deliveredIcon = L.divIcon({
  className: 'delivered-marker',
  html: '<div class="h-8 w-8 rounded-full border-2 border-emerald-700 bg-emerald-100 text-center text-lg font-extrabold leading-7 text-emerald-700">✓</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const SANTA_ANA_CENTER = [13.9942, -89.5597];
const EL_SALVADOR_LAND_POLYGON = EL_SALVADOR_BOUNDARY_LNG_LAT.map(([lng, lat]) => ({
  lat,
  lng
}));

const EL_SALVADOR_LAND_BOUNDS = EL_SALVADOR_LAND_POLYGON.reduce(
  (acc, point) => ({
    latMin: Math.min(acc.latMin, point.lat),
    latMax: Math.max(acc.latMax, point.lat),
    lngMin: Math.min(acc.lngMin, point.lng),
    lngMax: Math.max(acc.lngMax, point.lng)
  }),
  { latMin: Infinity, latMax: -Infinity, lngMin: Infinity, lngMax: -Infinity }
);

const EL_SALVADOR_MAX_BOUNDS = [
  [EL_SALVADOR_LAND_BOUNDS.latMin, EL_SALVADOR_LAND_BOUNDS.lngMin],
  [EL_SALVADOR_LAND_BOUNDS.latMax, EL_SALVADOR_LAND_BOUNDS.lngMax]
];

const WAIT_DELIVER_MS = 1700;

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function isPointInsideElSalvadorLand(lat, lng) {
  let inside = false;

  for (
    let i = 0, j = EL_SALVADOR_LAND_POLYGON.length - 1;
    i < EL_SALVADOR_LAND_POLYGON.length;
    j = i++
  ) {
    const xi = EL_SALVADOR_LAND_POLYGON[i].lng;
    const yi = EL_SALVADOR_LAND_POLYGON[i].lat;
    const xj = EL_SALVADOR_LAND_POLYGON[j].lng;
    const yj = EL_SALVADOR_LAND_POLYGON[j].lat;

    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function getRandomPointInsideElSalvadorLand() {
  const maxAttempts = 300;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const lat = Number(randomInRange(EL_SALVADOR_LAND_BOUNDS.latMin, EL_SALVADOR_LAND_BOUNDS.latMax).toFixed(6));
    const lng = Number(randomInRange(EL_SALVADOR_LAND_BOUNDS.lngMin, EL_SALVADOR_LAND_BOUNDS.lngMax).toFixed(6));

    if (isPointInsideElSalvadorLand(lat, lng)) {
      return { lat, lng };
    }
  }

  return { lat: SANTA_ANA_CENTER[0], lng: SANTA_ANA_CENTER[1] };
}

function mapOrderToMarker(order) {
  return {
    markerId: `db-${order.id}`,
    id: Number(order.id),
    numeroPedido: Number(order.numero_pedido),
    nombreCliente: order.nombre_cliente,
    latitud: Number(order.latitud),
    longitud: Number(order.longitud),
    direccion: order.direccion || 'Direccion no definida',
    estado: order.estado,
    isPersisted: true,
    isDirty: false,
    loadingAddress: false,
    saving: false,
    processingDelivery: false,
    createdAt: order.created_at
  };
}

function getDateKeyFromIso(isoDate) {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey) {
  const [year, month, day] = dateKey.split('-');
  return `${day}-${month}-${year}`;
}

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 14, { animate: true });
    }
  }, [map, position]);

  return null;
}

function Dashboard() {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const selectedMarker = markers.find((item) => item.markerId === selectedMarkerId) || null;
  const hasUnsavedChanges = markers.some((item) => item.isDirty || !item.isPersisted);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const data = await getOrders(token);
        if (cancelled) {
          return;
        }

        const loadedMarkers = data.map(mapOrderToMarker);
        setMarkers(loadedMarkers);

        const persisted = loadedMarkers.filter((item) => item.isPersisted);
        if (persisted.length > 0) {
          const firstDate = getDateKeyFromIso(persisted[0].createdAt);
          setSelectedHistoryDate(firstDate);
        }

        if (loadedMarkers.length > 0) {
          setSelectedMarkerId(loadedMarkers[0].markerId);
        }
      } catch (err) {
        setError(err.message);
      }
    }

    if (token) {
      loadOrders();
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function statusLabel(status) {
    if (status === 'pendiente') return 'Pendiente';
    if (status === 'en_proceso') return 'En curso';
    if (status === 'entregado') return 'Entregado';
    if (status === 'cancelado') return 'Cancelado';
    return status;
  }

  function focusMarker(markerId) {
    setSelectedMarkerId(markerId);
  }

  function applyMarkerPatch(markerId, patch) {
    setMarkers((prev) => prev.map((item) => (item.markerId === markerId ? { ...item, ...patch } : item)));
  }

  async function reverseAddressForMarker(markerId, lat, lng) {
    applyMarkerPatch(markerId, { loadingAddress: true });
    setMapError('');

    try {
      const address = await reverseGeocode(lat, lng);
      applyMarkerPatch(markerId, {
        latitud: lat,
        longitud: lng,
        direccion: address,
        loadingAddress: false,
        isDirty: true
      });
    } catch (err) {
      setMapError(err.message);
      applyMarkerPatch(markerId, {
        loadingAddress: false,
        isDirty: true,
        latitud: lat,
        longitud: lng
      });
    }
  }

  async function handleSimularPedido() {
    const { lat, lng } = getRandomPointInsideElSalvadorLand();
    const markerId = `temp-${Date.now()}`;
    const nombreCliente = user?.nombre || user?.email || `Pedido ${markers.length + 1}`;

    const newMarker = {
      markerId,
      id: null,
      numeroPedido: null,
      nombreCliente,
      latitud: lat,
      longitud: lng,
      direccion: 'Buscando direccion...',
      estado: 'pendiente',
      isPersisted: false,
      isDirty: true,
      loadingAddress: true,
      saving: false,
      processingDelivery: false,
      createdAt: new Date().toISOString()
    };

    setMarkers((prev) => [newMarker, ...prev]);
    setSelectedMarkerId(markerId);
    setSelectedHistoryDate(null);

    await reverseAddressForMarker(markerId, lat, lng);
  }

  async function handleMarkerDragEnd(markerId, event) {
    const marker = event.target;
    const { lat, lng } = marker.getLatLng();
    const safeLat = Number(lat.toFixed(6));
    const safeLng = Number(lng.toFixed(6));

    if (!isPointInsideElSalvadorLand(safeLat, safeLng)) {
      const current = markers.find((item) => item.markerId === markerId);
      if (current) {
        marker.setLatLng([current.latitud, current.longitud]);
      }
      setMapError('El marcador debe permanecer dentro del territorio continental de El Salvador.');
      return;
    }

    await reverseAddressForMarker(markerId, safeLat, safeLng);
  }

  async function handleSaveOrUpdate() {
    if (!selectedMarker || selectedMarker.saving || selectedMarker.processingDelivery) {
      return;
    }

    if (!selectedMarker.isPersisted) {
      const confirmed = window.confirm(
        'Al guardar, este pedido pasara a estado EN CURSO y se agregara al historial. Deseas continuar?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setError('');
      applyMarkerPatch(selectedMarker.markerId, { saving: true });

      if (!selectedMarker.isPersisted) {
        const parsedLat = Number(selectedMarker.latitud);
        const parsedLng = Number(selectedMarker.longitud);

        if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
          throw new Error('No se encontraron coordenadas validas del marcador.');
        }

        if (!selectedMarker.direccion || selectedMarker.direccion === 'Buscando direccion...') {
          throw new Error('La direccion aun no esta lista. Espera unos segundos e intenta de nuevo.');
        }

        const created = await createOrder(token, {
          latitud: parsedLat,
          longitud: parsedLng,
          direccion: selectedMarker.direccion,
          estado: 'en_proceso'
        });

        const markerFromDb = mapOrderToMarker(created);
        const newMarkerId = `db-${created.id}`;

        setMarkers((prev) =>
          prev.map((item) =>
            item.markerId === selectedMarker.markerId
              ? {
                  ...markerFromDb,
                  markerId: newMarkerId
                }
              : item
          )
        );
        setSelectedMarkerId(newMarkerId);
        return;
      }

      const parsedLat = Number(selectedMarker.latitud);
      const parsedLng = Number(selectedMarker.longitud);

      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
        throw new Error('No se encontraron coordenadas validas del marcador.');
      }

      const updated = await updateOrder(token, selectedMarker.id, {
        latitud: parsedLat,
        longitud: parsedLng,
        direccion: selectedMarker.direccion,
        estado: selectedMarker.estado
      });

      applyMarkerPatch(selectedMarker.markerId, {
        ...mapOrderToMarker(updated),
        markerId: selectedMarker.markerId,
        isDirty: false,
        saving: false
      });
    } catch (err) {
      setError(err.message);
      applyMarkerPatch(selectedMarker.markerId, { saving: false });
    }
  }

  async function handleMarkDelivered() {
    if (!selectedMarker || !['pendiente', 'en_proceso'].includes(selectedMarker.estado)) {
      return;
    }

    applyMarkerPatch(selectedMarker.markerId, { processingDelivery: true });

    await new Promise((resolve) => setTimeout(resolve, WAIT_DELIVER_MS));

    applyMarkerPatch(selectedMarker.markerId, {
      estado: 'entregado',
      processingDelivery: false,
      isDirty: true
    });
  }

  function handleCancelOrder() {
    if (!selectedMarker) {
      return;
    }

    if (selectedMarker.estado === 'entregado') {
      setError('Un pedido entregado no se puede cancelar.');
      return;
    }

    if (!selectedMarker.isPersisted) {
      setMarkers((prev) => {
        const filtered = prev.filter((item) => item.markerId !== selectedMarker.markerId);
        setSelectedMarkerId(filtered[0]?.markerId || null);
        return filtered;
      });
      return;
    }

    applyMarkerPatch(selectedMarker.markerId, {
      estado: 'cancelado',
      isDirty: true
    });
  }

  function handleClearFrontendOrders() {
    const hasItems = markers.length > 0;
    if (!hasItems) {
      return;
    }

    const confirmed = window.confirm(
      'Esto limpiara todos los pedidos cargados en pantalla (solo frontend). Deseas continuar?'
    );

    if (!confirmed) {
      return;
    }

    setMarkers([]);
    setSelectedMarkerId(null);
    setSelectedHistoryDate(null);
    setError('');
    setMapError('');
  }

  function handleLogout() {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Se perderan los cambios realizados. Desea continuar?');
      if (!confirmed) {
        return;
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const selectedPosition = selectedMarker ? [selectedMarker.latitud, selectedMarker.longitud] : null;

  const markerList = useMemo(() => {
    if (!selectedHistoryDate) {
      return markers;
    }

    return markers.filter(
      (item) => item.isPersisted && getDateKeyFromIso(item.createdAt) === selectedHistoryDate
    );
  }, [markers, selectedHistoryDate]);

  const historyByDate = useMemo(() => {
    const persisted = markers.filter((item) => item.isPersisted);
    const groupedMap = new Map();

    persisted.forEach((item) => {
      const dateKey = getDateKeyFromIso(item.createdAt);
      const existing = groupedMap.get(dateKey) || [];
      existing.push(item);
      groupedMap.set(dateKey, existing);
    });

    return Array.from(groupedMap.entries())
      .map(([dateKey, items]) => ({
        dateKey,
        dateLabel: formatDateLabel(dateKey),
        count: items.length,
        items: items.sort((a, b) => (a.numeroPedido || 0) - (b.numeroPedido || 0))
      }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  }, [markers]);

  const selectedHistoryGroup =
    historyByDate.find((group) => group.dateKey === selectedHistoryDate) || null;

  function handleSelectHistoryDate(dateKey) {
    setSelectedHistoryDate(dateKey);

    const group = historyByDate.find((item) => item.dateKey === dateKey);
    if (group?.items?.length) {
      setSelectedMarkerId(group.items[0].markerId);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-ocean-50 to-slate-200 p-4 text-slate-900 md:p-8">
      <section className="mx-auto w-full max-w-[1300px] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl shadow-slate-300/60 backdrop-blur-sm md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ocean-700">Dashboard de Pedidos</h1>
            <p className="text-sm text-slate-500">
              Sesion activa: {user ? `${user.email} (${user.rol})` : 'usuario'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Cerrar sesion
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[290px_minmax(0,1fr)_280px]">
          <aside className="space-y-4">
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

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">Historial del Usuario</h2>
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
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Mapa de Santa Ana y El Salvador</h2>
                <p className="text-sm text-slate-500">
                  Simula varios pedidos y arrastra los marcadores para ajustar la direccion de entrega.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimularPedido}
                className="rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700"
              >
                Simular Pedido
              </button>
            </div>

            <MapContainer
              center={SANTA_ANA_CENTER}
              zoom={14}
              scrollWheelZoom
              maxBounds={EL_SALVADOR_MAX_BOUNDS}
              maxBoundsViscosity={1.0}
              minZoom={8}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {selectedPosition ? <RecenterMap position={selectedPosition} /> : null}

              {markerList.map((item) => {
                const draggable = item.estado === 'pendiente' || item.estado === 'en_proceso';
                const icon =
                  item.estado === 'cancelado'
                    ? cancelledIcon
                    : item.estado === 'entregado'
                      ? deliveredIcon
                      : undefined;

                return (
                  <Marker
                    key={item.markerId}
                    position={[item.latitud, item.longitud]}
                    draggable={draggable}
                    {...(icon ? { icon } : {})}
                    eventHandlers={{
                      click: () => focusMarker(item.markerId),
                      dragend: (event) => handleMarkerDragEnd(item.markerId, event)
                    }}
                  >
                    <Popup>
                      <p className="m-0 text-sm font-semibold">{item.nombreCliente}</p>
                      <p className="m-0 text-xs">Estado: {statusLabel(item.estado)}</p>
                      <p className="m-0 text-xs">{item.loadingAddress ? 'Actualizando direccion...' : item.direccion}</p>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleClearFrontendOrders}
                disabled={markers.length === 0}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpiar pedidos
              </button>
            </div>
          </section>

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
                      <p className="text-xs text-slate-500">
                        Nº de pedido: {item.numeroPedido ?? 'Pendiente de guardar'}
                      </p>
                      <p className="text-xs text-slate-500">{item.direccion}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {mapError ? <p className="mt-2 text-sm text-red-600">{mapError}</p> : null}
      </section>
    </main>
  );
}

export default Dashboard;
