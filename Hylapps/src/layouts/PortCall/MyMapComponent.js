import React from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer } from 'react-leaflet';
import MapWithMarkers from './MapWithMarkers';
import MapWithPorts from './MapWithPorts';
import MapWithFullscreen from './MapWithFullscreen';
import 'leaflet/dist/leaflet.css';

const MyMapComponent = ({ vessels,  center, selectedVessel , ports, selectedPort, onVesselClick  }) => (

  

  <MapContainer
    center={center}
    zoom={1}
    minZoom={1.25}
    maxZoom={15}
    maxBounds={[[85, -180], [-85, 180]]}
    maxBoundsViscosity={8}
    style={{ height: '500px', width: '100%', backgroundColor: 'rgba(170,211,223,255)' }}
  >
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" noWrap />

    <MapWithMarkers vessels={vessels} selectedVessel={selectedVessel} onVesselClick={onVesselClick}/>
    <MapWithPorts ports={ports} selectedPort={selectedPort} />
    
    <MapWithFullscreen />
  </MapContainer>
);

MyMapComponent.propTypes = {
  vessels: PropTypes.array.isRequired,
  zoom: PropTypes.number.isRequired,
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  selectedVessel: PropTypes.array,
  ports: PropTypes.array.isRequired,
  selectedPort:  PropTypes.object.isRequired,
   onVesselClick: PropTypes.func.isRequired,
};

export default MyMapComponent;