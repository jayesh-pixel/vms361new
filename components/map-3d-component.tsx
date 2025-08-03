"use client"
import { useEffect, useRef, useState } from "react"
import type React from "react"

import { Loader } from "@googlemaps/js-api-loader"

// Configuration - replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAm_rgt4RYjdG_RHpgcerB2uaDgQzfRcJc"

interface Map3DComponentProps {
  center?: { lat: number; lng: number; altitude?: number }
  heading?: number
  tilt?: number
  range?: number
  className?: string
  style?: React.CSSProperties
}

const Map3DComponent: React.FC<Map3DComponentProps> = ({
  center = { lat: 0, lng: 0, altitude: 0 },
  heading = 0,
  tilt = 45,
  range = 20000000,
  className = "",
  style = { height: "100vh", width: "100%" },
}) => {
  const mapRef = useRef<HTMLElement>(null)
  const [mapError, setMapError] = useState<string>("")
  const [mapInitialized, setMapInitialized] = useState<boolean>(false)

  // References to Google Maps 3D elements
  const mapInstance = useRef<any>(null)
  const geocoder = useRef<any>(null)
  const directionsService = useRef<any>(null)
  const Map3DElement = useRef<any>(null)
  const Marker3DElement = useRef<any>(null)
  const Polyline3DElement = useRef<any>(null)

  // Current map elements
  const currentMarker = useRef<any>(null)
  const currentPolyline = useRef<any>(null)
  const originMarker = useRef<any>(null)
  const destinationMarker = useRef<any>(null)

  useEffect(() => {
    loadMap()
  }, [])

  const loadMap = async () => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "AIzaSyAm_rgt4RYjdG_RHpgcerB2uaDgQzfRcJc") {
      setMapError("Google Maps API Key is not configured. Please set your API key in the component.")
      return
    }

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "beta", // Using 'beta' for Photorealistic 3D Maps features
      libraries: ["geocoding", "routes", "geometry"], // Request necessary libraries
    })

    try {
      await loader.load()

      // Import 3D map specific library elements
      const maps3dLibrary = await (window as any).google.maps.importLibrary("maps3d")
      Map3DElement.current = maps3dLibrary.Map3DElement
      Marker3DElement.current = maps3dLibrary.Marker3DElement
      Polyline3DElement.current = maps3dLibrary.Polyline3DElement

      if ((window as any).google && (window as any).google.maps) {
        // Initialize services
        directionsService.current = new (window as any).google.maps.DirectionsService()
        geocoder.current = new (window as any).google.maps.Geocoder()
      }

      initializeMap()
      setMapInitialized(true)
      setMapError("")
    } catch (error) {
      console.error("Error loading Google Maps API:", error)
      setMapError("Could not load Google Maps. Check console for details and ensure API key is correct.")
      setMapInitialized(false)
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !Map3DElement.current) {
      console.error("Map container or Map3DElement class not ready.")
      return
    }

    mapInstance.current = mapRef.current
  }

  const clearMapElements = () => {
    if (currentMarker.current) {
      currentMarker.current.remove()
      currentMarker.current = null
    }
    if (currentPolyline.current) {
      currentPolyline.current.remove()
      currentPolyline.current = null
    }
    if (originMarker.current) {
      originMarker.current.remove()
      originMarker.current = null
    }
    if (destinationMarker.current) {
      destinationMarker.current.remove()
      destinationMarker.current = null
    }
  }

  const flyToLocation = (lat: number, lng: number, customRange?: number) => {
    if (!mapInstance.current) return

    const cameraOptions = {
      center: { lat, lng, altitude: 0 },
      heading: heading,
      tilt: tilt,
      range: customRange || range,
    }
    ;(mapInstance.current as any).flyCameraTo({
      endCamera: cameraOptions,
      durationMillis: 1500,
    })
  }

  const viewLocation = async (locationQuery: string) => {
    if (!mapInitialized || !mapInstance.current || !geocoder.current || !Marker3DElement.current) {
      console.warn("Map not ready for location viewing")
      return
    }

    clearMapElements()

    geocoder.current.geocode({ address: locationQuery }, (results: any, status: string) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location

        flyToLocation(location.lat(), location.lng(), 2000)

        // Create and add a 3D marker
        currentMarker.current = new Marker3DElement.current()
        currentMarker.current.position = {
          lat: location.lat(),
          lng: location.lng(),
          altitude: 0,
        }

        const label = locationQuery.length > 30 ? locationQuery.substring(0, 27) + "..." : locationQuery
        currentMarker.current.label = label
        ;(mapInstance.current as any).appendChild(currentMarker.current)
      } else {
        console.error(`Geocode failed for "${locationQuery}". Status: ${status}`)
      }
    })
  }

  const showDirections = async (originQuery: string, destinationQuery: string) => {
    if (
      !mapInitialized ||
      !mapInstance.current ||
      !directionsService.current ||
      !Marker3DElement.current ||
      !Polyline3DElement.current
    ) {
      console.warn("Map not ready for directions")
      return
    }

    clearMapElements()

    directionsService.current.route(
      {
        origin: originQuery,
        destination: destinationQuery,
        travelMode: (window as any).google.maps.TravelMode.DRIVING,
      },
      (response: any, status: string) => {
        if (status === "OK" && response && response.routes && response.routes.length > 0) {
          const route = response.routes[0]

          // Draw the route polyline
          if (route.overview_path && Polyline3DElement.current) {
            const pathCoordinates = route.overview_path.map((p: any) => ({
              lat: p.lat(),
              lng: p.lng(),
              altitude: 5,
            }))

            currentPolyline.current = new Polyline3DElement.current()
            currentPolyline.current.coordinates = pathCoordinates
            currentPolyline.current.strokeColor = "blue"
            currentPolyline.current.strokeWidth = 10
            ;(mapInstance.current as any).appendChild(currentPolyline.current)
          }

          // Add origin marker
          if (route.legs && route.legs[0] && route.legs[0].start_location) {
            const originLocation = route.legs[0].start_location
            originMarker.current = new Marker3DElement.current()
            originMarker.current.position = {
              lat: originLocation.lat(),
              lng: originLocation.lng(),
              altitude: 0,
            }
            originMarker.current.label = "Origin"
            originMarker.current.style = { color: { r: 0, g: 128, b: 0, a: 1 } }
            ;(mapInstance.current as any).appendChild(originMarker.current)
          }

          // Add destination marker
          if (route.legs && route.legs[0] && route.legs[0].end_location) {
            const destinationLocation = route.legs[0].end_location
            destinationMarker.current = new Marker3DElement.current()
            destinationMarker.current.position = {
              lat: destinationLocation.lat(),
              lng: destinationLocation.lng(),
              altitude: 0,
            }
            destinationMarker.current.label = "Destination"
            destinationMarker.current.style = { color: { r: 255, g: 0, b: 0, a: 1 } }
            ;(mapInstance.current as any).appendChild(destinationMarker.current)
          }

          // Fit camera to route bounds
          if (route.bounds) {
            const bounds = route.bounds
            const center = bounds.getCenter()
            let range = 10000

            if ((window as any).google.maps.geometry && (window as any).google.maps.geometry.spherical) {
              const spherical = (window as any).google.maps.geometry.spherical
              const ne = bounds.getNorthEast()
              const sw = bounds.getSouthWest()
              const diagonalDistance = spherical.computeDistanceBetween(ne, sw)
              range = diagonalDistance * 1.7
            }

            range = Math.max(range, 2000)
            flyToLocation(center.lat(), center.lng(), range)
          }
        } else {
          console.error(`Directions request failed. Status: ${status}`)
        }
      },
    )
  }

  // Expose methods for external use
  const mapMethods = {
    viewLocation,
    showDirections,
    flyToLocation,
    clearMapElements,
  }

  // Make methods available to parent component
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).map3DMethods = mapMethods
    }
  }, [mapInitialized])

  const initialCenter = `${center.lat},${center.lng},${center.altitude || 0}`

  return (
    <div className={`map-container ${className}`} style={style}>
      {mapError ? (
        <div
          className="map-error"
          style={{
            padding: "20px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c33",
            textAlign: "center",
          }}
        >
          {mapError}
        </div>
      ) : (
        <gmp-map-3d
          ref={mapRef}
          style={{ height: "100%", width: "100%" }}
          mode="hybrid"
          center={initialCenter}
          heading={heading.toString()}
          tilt={tilt.toString()}
          range={range.toString()}
          defaultUiDisabled="true"
        />
      )}
    </div>
  )
}

export default Map3DComponent
