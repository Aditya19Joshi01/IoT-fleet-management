import React, { useEffect, useRef } from 'react';
import { FeatureGroup, Circle } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

export default function GeofenceEditor({ geofences, onCreated, onDeleted }) {
    const featureGroupRef = useRef();

    const _onCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'circle') {
            const { lat, lng } = layer.getLatLng();
            const radius = layer.getRadius();

            // Prompt for name (simple for PoC)
            const name = prompt("Enter geofence name:");
            if (name) {
                onCreated({
                    name,
                    latitude: lat,
                    longitude: lng,
                    radius_meters: radius,
                    vehicle_id: "all" // Global for now, or select specific
                });
            } else {
                featureGroupRef.current.removeLayer(layer);
            }
        }
    };

    const _onDeleted = (e) => {
        const { layers } = e;
        layers.eachLayer((layer) => {
            // Find ID from layer (we need to map existing geofences to layers)
            // For now, this is tricky without ID mapping.
            // Let's rely on external delete buttons for existing ones, 
            // and this is just for drawing new ones.
            // But wait, we want to see existing ones.
        });
    };

    return (
        <FeatureGroup ref={featureGroupRef}>
            <EditControl
                position="topright"
                onCreated={_onCreated}
                onDeleted={_onDeleted}
                draw={{
                    rectangle: false,
                    polygon: false,
                    polyline: false,
                    circlemarker: false,
                    marker: false,
                    circle: true
                }}
            />
            {geofences.map(g => (
                <Circle
                    key={g.id}
                    center={[g.latitude, g.longitude]}
                    radius={g.radius_meters}
                    pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
                />
            ))}
        </FeatureGroup>
    );
}
