"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { MapPin, Users, Clock, MoreHorizontal, Plus, Settings } from "lucide-react"
import type { Ship } from "@/lib/types"

interface ShipCardsProps {
  ships: Ship[]
  onAddShip: () => void
  onShipSelect: (ship: Ship) => void
  onManageShip: (ship: Ship) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "at_sea":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "in_port":
      return "bg-green-100 text-green-800 border-green-200"
    case "anchored":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "maintenance":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "emergency":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "at_sea":
      return "At Sea"
    case "in_port":
      return "In Port"
    case "anchored":
      return "Anchored"
    case "maintenance":
      return "Maintenance"
    case "emergency":
      return "Emergency"
    default:
      return status
  }
}

export function ShipCards({ ships, onAddShip, onShipSelect, onManageShip }: ShipCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Fleet Overview</h3>
          <p className="text-sm text-slate-600">All ships in your fleet</p>
        </div>
        <Button 
          onClick={onAddShip}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ship
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4 p-1">
          {ships.map((ship) => (
            <Card 
              key={ship.id} 
              className="w-80 flex-shrink-0 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onShipSelect(ship)}
                  >
                    <h4 className="font-semibold text-slate-900 truncate">{ship.name}</h4>
                    <p className="text-sm text-slate-600">IMO: {ship.imo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(ship.status)}`}
                    >
                      {getStatusText(ship.status)}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2 text-xs"
                      onClick={() => onManageShip(ship)}
                      title="Manage Ship"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>

                {/* Ship details */}
                <div 
                  className="space-y-2 text-sm cursor-pointer"
                  onClick={() => onShipSelect(ship)}
                >
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {ship.location.port || `${ship.location.lat.toFixed(2)}, ${ship.location.lng.toFixed(2)}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>{ship.crew.length} crew members</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>Updated {new Date(ship.location.lastUpdate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Ship specs */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Type:</span>
                      <span className="ml-1 font-medium capitalize">{ship.type.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Flag:</span>
                      <span className="ml-1 font-medium">{ship.flag}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">DWT:</span>
                      <span className="ml-1 font-medium">{ship.specifications.deadweight.toLocaleString()}t</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Built:</span>
                      <span className="ml-1 font-medium">{ship.specifications.yearBuilt}</span>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div 
                  className="mt-3 flex gap-2"
                  onClick={() => onShipSelect(ship)}
                >
                  {ship.tasks.filter(t => t.status === 'pending').length > 0 && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      {ship.tasks.filter(t => t.status === 'pending').length} tasks
                    </Badge>
                  )}
                  {ship.requisitions.filter(r => r.status === 'pending').length > 0 && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      {ship.requisitions.filter(r => r.status === 'pending').length} requests
                    </Badge>
                  )}
                </div>

                {/* Manage Button */}
                <div className="mt-4 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-200 text-blue-700 hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      onManageShip(ship)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Ship
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
