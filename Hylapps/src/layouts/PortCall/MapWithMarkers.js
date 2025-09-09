import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

// Helper to create custom vessel icon
const createCustomIcon = (heading, width, height, iconType) => {
  const iconUrls = {
    small: './ship-popup.png',
    medium: './ship-popup.png',
    large: './ship-popup.png',
    'extra-large': '/BERTH-ICON.PNG',
  };

  const iconUrl = iconUrls[iconType] || iconUrls.small;

  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="transform: rotate(${heading}deg); width: ${width}px; height: ${height}px;">
             <img src="${iconUrl}" style="width: 100%; height: 100%;" />
           </div>`,
    iconSize: [width, height],
  });
};

// Helper to create a simple point icon
const createPointIcon = (width, height) =>
  L.divIcon({
    className: 'point-icon',
    html: `<div style="width: ${width}px; height: ${height}px; background-color: red; border-radius: 50%;"></div>`,
    iconSize: [width, height],
  });

// Helper to determine icon parameters based on zoom level
const getIconForZoom = (zoom) => {
  if (zoom > 23) return { width: 50, height: 120, type: 'extra-large' };
  if (zoom > 20) return { width: 60, height: 80, type: 'extra-large' };
  if (zoom > 17.75) return { width: 60, height: 120, type: 'large' };
  if (zoom > 16.75) return { width: 45, height: 120, type: 'large' };
  if (zoom > 16) return { width: 35, height: 120, type: 'large' };
  if (zoom > 15.75) return { width: 25, height: 70, type: 'large' };
  if (zoom > 14.75) return { width: 15, height: 40, type: 'large' };
  if (zoom > 13.75) return { width: 10, height: 35, type: 'large' };
  if (zoom > 12.75) return { width: 10, height: 35, type: 'large' };
  if (zoom > 11.5) return { width: 9, height: 25, type: 'large' };
  if (zoom > 10.75) return { width: 8, height: 15, type: 'large' };
  if (zoom > 9.75) return { width: 8, height: 15, type: 'large' };
  if (zoom > 8.75) return { width: 8, height: 14, type: 'large' };
  if (zoom > 7) return { width: 8, height: 8, type: 'large' };
  if (zoom > 6) return { width: 8, height: 8, type: 'large' };
  if (zoom > 4) return { width: 8, height: 8, type: 'point' };
  if (zoom > 2) return { width: 7, height: 7, type: 'point' };
  return { width: 6, height: 6, type: 'point' };
};

// Helper to generate popup content HTML
const generatePopupContent = (vessel) => {
  const heading = vessel.heading !== undefined ? `${vessel.heading}°` : '-';
  const speed = vessel.speed !== undefined ? `${vessel.speed} kn` : '-';
  const destination = vessel.destination || '-';
  const eta = vessel.eta || '-';

  // Check if any ISM contact info is present
  const hasISMInfo = vessel.ISM_Manager || vessel.ISM_Manager_Number ||
                     vessel.Commercial_Manager || vessel.Commercial_Manager_Telephone ||
                     vessel.Ship_Contact || vessel.Email;

  // If no ISM info, show message, otherwise show nothing for ISM block
  const ismMessage = hasISMInfo ? '' : `
    <div style="
      margin-top: 8px; 
      font-style: italic; 
      color: #888; 
      border-top: 1px solid #ccc; 
      padding-top: 6px;
    ">
      No ISM contact information available
    </div>`;

  return `
    <div style="
      font-family: Arial, sans-serif; 
      font-size: 13px; 
      color: #222; 
      min-width: 200px;
      line-height: 1.4;
    ">
      <div style="border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px;">
        <strong style="font-size: 15px; color: #0056b3;">
          ${vessel.name || 'Unknown Vessel'} 
          <span style="font-weight: normal; font-size: 12px; color: #555; margin-left: 8px;">(IMO: ${vessel.imo || 'N/A'})</span>
        </strong>
      </div>
      <div><strong>Heading:</strong> ${heading}</div>
      <div><strong>Speed:</strong> ${speed}</div>
      <div><strong>Destination:</strong> ${destination}</div>
      <div><strong>ETA:</strong> ${eta}</div>

      ${ismMessage}
    </div>`;
};





const MapWithMarkers = ({ vessels, selectedVessel, onVesselClick  }) => {
  const map = useMap();
  const markerClusterGroupRef = useRef(null);
  const markersRef = useRef({});
  const prevVesselsRef = useRef([]);
  const prevSelectedVesselRef = useRef(null);

  // Update marker icons based on the current zoom level
  const updateIconsForZoom = useCallback(() => {
    if (!map) return;
    const currentZoom = map.getZoom();
    const { width, height, type } = getIconForZoom(currentZoom);

    Object.values(markersRef.current).forEach((marker) => {
      const vessel = marker.options.vesselData;
      const isSelected = selectedVessel && vessel.name === selectedVessel.name;
      const newIcon =
        isSelected
          ? createCustomIcon(vessel.heading, width, height, type)
          : type === 'point'
          ? createPointIcon(width, height)
          : createCustomIcon(vessel.heading, width, height, type);

      marker.setIcon(newIcon);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [map, selectedVessel]);

  // Fly to selected vessel and open a popup on selection change
  const flyToVessel = useCallback(() => {
    if (selectedVessel && selectedVessel !== prevSelectedVesselRef.current) {
      const { width, height, type } = getIconForZoom(map.getZoom());
      const customIcon = createCustomIcon(selectedVessel.heading, width, height, type);

      // Create a temporary marker for the selected vessel
      const tempMarker = L.marker(
        [selectedVessel.lat, selectedVessel.lng],
        { icon: customIcon }
      )
        .addTo(map)
        .bindPopup(generatePopupContent(selectedVessel))
        .openPopup();

      map.flyTo([selectedVessel.lat, selectedVessel.lng], 8, {
        animate: true,
        duration: 1,
      });

      // Keep the popup open even if it is closed manually
      tempMarker.on('popupclose', () => {
        tempMarker.openPopup();
      });

      prevSelectedVesselRef.current = selectedVessel;
    }
  }, [map, selectedVessel]);

  useEffect(() => {
    if (!map) return;

    // Initialize the marker cluster group only once
    if (!markerClusterGroupRef.current) {
      markerClusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 30,
      });
      map.addLayer(markerClusterGroupRef.current);
    }

    // Update markers if vessel data has changed
    if (JSON.stringify(vessels) !== JSON.stringify(prevVesselsRef.current)) {
      // Clear previous markers
      markerClusterGroupRef.current.clearLayers();
      markersRef.current = {};

      vessels.forEach((vessel) => {
        const key = vessel.name || `${vessel.lat}-${vessel.lng}`;
        // Create a marker only if it doesn't already exist
        if (!markersRef.current[key]) {
          const { width, height, type } = getIconForZoom(map.getZoom());
          const icon =
            type === 'point'
              ? createPointIcon(width, height)
              : createCustomIcon(vessel.heading, width, height, type);

          const marker = L.marker([vessel.lat, vessel.lng], {
            icon,
            vesselData: vessel,
          });

          marker.bindPopup(generatePopupContent(vessel));

           // Tooltip on hover showing vessel name
          marker.bindTooltip(
            `${vessel.name || 'No name'} (${vessel.imo || 'No IMO'})`,
            {
              permanent: false,
              direction: 'top',
              offset: [0, -10],
              opacity: 0.9,
            }
          );


             marker.on('click', () => {
      if (onVesselClick) onVesselClick(vessel);
    });


          markerClusterGroupRef.current.addLayer(marker);
          markersRef.current[key] = marker;
        }
      });

      // Save the current vessels data for future comparisons
      prevVesselsRef.current = vessels;
    }

    // Fly to selected vessel if applicable
    flyToVessel();

    // Listen for zoom changes to update icons
    map.on('zoomend', updateIconsForZoom);
    return () => {
      map.off('zoomend', updateIconsForZoom);
    };
  }, [map, vessels, selectedVessel, updateIconsForZoom, flyToVessel]);

  return null;
};

MapWithMarkers.propTypes = {
  vessels: PropTypes.array.isRequired,
  selectedVessel: PropTypes.array,
    onVesselClick: PropTypes.func,
};

export default MapWithMarkers;
