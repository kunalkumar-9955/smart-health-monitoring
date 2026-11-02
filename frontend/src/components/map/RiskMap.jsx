import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useAppStore } from '../../store';
import 'leaflet/dist/leaflet.css';

const riskColors = {
  HIGH: '#ef4444',
  MODERATE: '#f59e0b',
  LOW: '#22c55e',
};

const statusColors = {
  contaminated: '#ef4444',
  moderate: '#f59e0b',
  safe: '#22c55e',
};

export default function RiskMap({ villages = [], height = '400px' }) {
  const { theme } = useAppStore();

  const center = [22.5, 80.0]; // Center of India
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-700/30">
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
        >
          {villages.map((village) => {
            const color = riskColors[village.riskLevel] || '#22c55e';
            const radius = Math.max(8, Math.min(25, (village.riskScore || 5) * 0.8));

            return (
              <CircleMarker
                key={village._id || village.name}
                center={[village.location?.lat || 20, village.location?.lng || 78]}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <h3 className="font-bold text-slate-900 text-base mb-2">📍 {village.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">District:</span>
                        <span className="font-medium">{village.district || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Risk Level:</span>
                        <span className={`font-bold ${village.riskLevel === 'HIGH' ? 'text-red-600' : village.riskLevel === 'MODERATE' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {village.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Risk Score:</span>
                        <span className="font-medium">{village.riskScore || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Cases:</span>
                        <span className="font-medium text-red-600">{village.totalCases || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Water:</span>
                        <span className={`font-medium capitalize ${
                          village.waterStatus === 'contaminated' ? 'text-red-600' :
                          village.waterStatus === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {village.waterStatus || 'safe'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Population:</span>
                        <span className="font-medium">{village.population?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
