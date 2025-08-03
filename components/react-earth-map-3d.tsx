"use client"
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react"
import type React from "react"

// Add custom element type for gmp-map-3d
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gmp-map-3d": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        mode?: string
        center?: string
        heading?: string
        tilt?: string
        range?: string
        defaultUiDisabled?: string
      }
    }
  }
}

import { Loader } from "@googlemaps/js-api-loader"

// Configuration - replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

export interface EarthMap3DRef {
  viewLocation: (locationQuery: string) => Promise<void>
  showDirections: (originQuery: string, destinationQuery: string) => Promise<void>
  flyToLocation: (lat: number, lng: number, range?: number, tilt?: number) => void
  clearMap: () => void
}

interface EarthMap3DProps {
  initialCenter?: { lat: number; lng: number; altitude: number }
  initialHeading?: number
  initialTilt?: number
  initialRange?: number
  className?: string
  style?: React.CSSProperties
}

const EarthMap3D = forwardRef<EarthMap3DRef, EarthMap3DProps>(
  (
    {
      initialCenter = { lat: 0, lng: 0, altitude: 0 },
      initialHeading = 0,
      initialTilt = 45,
      initialRange = 20000000,
      className = "",
      style = { height: "100vh", width: "100%" },
    },
    ref,
  ) => {
    const mapContainerRef = useRef<HTMLElement>(null)
    const [mapInitialized, setMapInitialized] = useState(false)
    const [mapError, setMapError] = useState("")

    // Google Maps instances
    const mapRef = useRef<any>(null)
    const geocoderRef = useRef<any>(null)
    const directionsServiceRef = useRef<any>(null)
    const Map3DElementRef = useRef<any>(null)
    const Marker3DElementRef = useRef<any>(null)
    const Polyline3DElementRef = useRef<any>(null)

    // Current map elements
    const markerRef = useRef<any>(null)
    const routePolylineRef = useRef<any>(null)
    const originMarkerRef = useRef<any>(null)
    const destinationMarkerRef = useRef<any>(null)

    const clearMapElements = () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.remove()
        routePolylineRef.current = null
      }
      if (originMarkerRef.current) {
        originMarkerRef.current.remove()
        originMarkerRef.current = null
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove()
        destinationMarkerRef.current = null
      }
    }

    const flyToLocation = (lat: number, lng: number, range = 2000, tilt = 45) => {
      if (!mapInitialized || !mapRef.current) return

      const cameraOptions = {
        center: { lat, lng, altitude: 0 },
        heading: initialHeading,
        tilt,
        range,
      }
      ;(mapRef.current as any).flyCameraTo({
        endCamera: cameraOptions,
        durationMillis: 1500,
      })
    }

    const viewLocation = async (locationQuery: string) => {
      if (!mapInitialized || !mapRef.current || !geocoderRef.current || !Marker3DElementRef.current) {
        console.warn("Map not ready for location viewing")
        return
      }

      clearMapElements()

      geocoderRef.current.geocode({ address: locationQuery }, (results: any, status: string) => {
        if (status === "OK" && results && results[0] && mapRef.current) {
          const location = results[0].geometry.location
          flyToLocation(location.lat(), location.lng())

          // Create and add a 3D marker
          markerRef.current = new Marker3DElementRef.current()
          markerRef.current.position = {
            lat: location.lat(),
            lng: location.lng(),
            altitude: 0,
          }

          const label = locationQuery.length > 30 ? locationQuery.substring(0, 27) + "..." : locationQuery
          markerRef.current.label = label
          ;(mapRef.current as any).appendChild(markerRef.current)
        } else {
          console.error(`Geocode failed for "${locationQuery}". Status: ${status}`)
        }
      })
    }

    const showDirections = async (originQuery: string, destinationQuery: string) => {
      if (
        !mapInitialized ||
        !mapRef.current ||
        !directionsServiceRef.current ||
        !Marker3DElementRef.current ||
        !Polyline3DElementRef.current
      ) {
        console.warn("Map not ready for directions")
        return
      }

      clearMapElements()

      directionsServiceRef.current.route(
        {
          origin: originQuery,
          destination: destinationQuery,
          travelMode: (window as any).google.maps.TravelMode.DRIVING,
        },
        (response: any, status: string) => {
          if (status === "OK" && response && response.routes && response.routes.length > 0) {
            const route = response.routes[0]

            // Draw the route polyline
            if (route.overview_path && Polyline3DElementRef.current) {
              const pathCoordinates = route.overview_path.map((p: any) => ({
                lat: p.lat(),
                lng: p.lng(),
                altitude: 5,
              }))

              routePolylineRef.current = new Polyline3DElementRef.current()
              routePolylineRef.current.coordinates = pathCoordinates
              routePolylineRef.current.strokeColor = "blue"
              routePolylineRef.current.strokeWidth = 10
              ;(mapRef.current as any).appendChild(routePolylineRef.current)
            }

            // Add origin marker (green)
            if (route.legs && route.legs[0] && route.legs[0].start_location && Marker3DElementRef.current) {
              const originLocation = route.legs[0].start_location
              originMarkerRef.current = new Marker3DElementRef.current()
              originMarkerRef.current.position = {
                lat: originLocation.lat(),
                lng: originLocation.lng(),
                altitude: 0,
              }
              originMarkerRef.current.label = "Start"
              originMarkerRef.current.style = { color: { r: 0, g: 128, b: 0, a: 1 } }
              ;(mapRef.current as any).appendChild(originMarkerRef.current)
            }

            // Add destination marker (red)
            if (route.legs && route.legs[0] && route.legs[0].end_location && Marker3DElementRef.current) {
              const destinationLocation = route.legs[0].end_location
              destinationMarkerRef.current = new Marker3DElementRef.current()
              destinationMarkerRef.current.position = {
                lat: destinationLocation.lat(),
                lng: destinationLocation.lng(),
                altitude: 0,
              }
              destinationMarkerRef.current.label = "End"
              destinationMarkerRef.current.style = { color: { r: 255, g: 0, b: 0, a: 1 } }
              ;(mapRef.current as any).appendChild(destinationMarkerRef.current)
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
              flyToLocation(center.lat(), center.lng(), range, 45)
            }
          } else {
            console.error(`Directions request failed. Status: ${status}`)
          }
        },
      )
    }

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      viewLocation,
      showDirections,
      flyToLocation,
      clearMap: clearMapElements,
    }))

    const loadMap = async () => {
      if (!GOOGLE_MAPS_API_KEY) {
        setMapError(
          "Google Maps API Key is not configured. Please set the NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.",
        )
        return
      }

      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "beta",
        libraries: ["geocoding", "routes", "geometry"],
      })

      try {
        await loader.load()

        const maps3dLibrary = await (window as any).google.maps.importLibrary("maps3d")
        Map3DElementRef.current = maps3dLibrary.Map3DElement
        Marker3DElementRef.current = maps3dLibrary.Marker3DElement
        Polyline3DElementRef.current = maps3dLibrary.Polyline3DElement

        if ((window as any).google && (window as any).google.maps) {
          directionsServiceRef.current = new (window as any).google.maps.DirectionsService()
          geocoderRef.current = new (window as any).google.maps.Geocoder()
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
      if (!mapContainerRef.current || !Map3DElementRef.current) {
        console.error("Map container or Map3DElement class not ready.")
        return
      }

      mapRef.current = mapContainerRef.current
    }

    useEffect(() => {
      loadMap()
    }, [])

    const initialCenterString = `${initialCenter.lat},${initialCenter.lng},${initialCenter.altitude}`

    return (
      <div className={`earth-map-container ${className}`} style={style}>
        {mapError ? (
          <div className="p-5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center m-5">{mapError}</div>
        ) : null}

        <gmp-map-3d
          ref={mapContainerRef}
          style={{ height: "100%", width: "100%" }}
          mode="hybrid"
          center={initialCenterString}
          heading={initialHeading.toString()}
          tilt={initialTilt.toString()}
          range={initialRange.toString()}
          defaultUiDisabled="true"
        />
      </div>
    )
  },
)

EarthMap3D.displayName = "EarthMap3D"

export default EarthMap3D
