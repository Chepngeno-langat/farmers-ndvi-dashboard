"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Eye,
  EyeOff,
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NDVIViewerProps {
  projectId: string
}

function s3PathToHttpUrl(s3Path: string) {
  if (!s3Path.startsWith("s3://")) return s3Path
  const parts = s3Path.replace("s3://", "").split("/")
  const bucket = parts.shift()
  const key = parts.join("/")
  return `https://${bucket}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`
}

function extractImageKey(url: string) {
  const parts = url.split(".amazonaws.com/")
  return parts.length > 1 ? parts[1] : url
}


export default function NDVIViewer({ projectId }: NDVIViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [showOriginal, setShowOriginal] = useState(false)
  const [colorMap, setColorMap] = useState("viridis")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [ndviImages, setNdviImages] = useState<any[]>([])

  const currentImage = ndviImages.length > 0 ? ndviImages[currentImageIndex] : null

  useEffect(() => {
    const fetchNDVI = async () => {
      try {
        const res = await fetch(`http://localhost:8000/projects/${projectId}/ndvi`)
        const data = await res.json()
  
        // ✅ Fetch AI insights
        const aiRes = await fetch("http://localhost:8000/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coordinates: { latitude: 0, longitude: 0 }, // 🛠 replace if you have coords
            image_key: data.length > 0 ? extractImageKey(data[0].url) : "",
            user_id: "demo_user",
          }),
        })
        const aiData = await aiRes.json()
        console.log("Fetched AI Data:", aiData)
  
        // ✅ If MARS returned new NDVI image
        const aiNdviPath = aiData?.ndvi_result?.save_path
        let updatedData = data
  
        if (aiNdviPath) {
          const ai_ndvi_url = s3PathToHttpUrl(aiNdviPath)
  
          // Update the first NDVI entry
          updatedData = data.map((item, index) => {
            if (index === 0) {
              return { ...item, url: ai_ndvi_url }
            }
            return item
          })
        }
  
        setNdviImages(updatedData)
      } catch (err) {
        console.error("Failed to fetch NDVI images or AI insights:", err)
      }
    }
  
    fetchNDVI()
  }, [projectId])
  
  

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % ndviImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + ndviImages.length) % ndviImages.length)
  }

  const refreshAnalysis = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowOriginal(!showOriginal)}>
            {showOriginal ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View NDVI
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                View Original
              </>
            )}
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(50, zoom - 10))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refreshAnalysis} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Analysis
              </>
            )}
          </Button>

          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Color Map:</span>
          </div>
          <Select value={colorMap} onValueChange={setColorMap}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select colormap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viridis">Viridis</SelectItem>
              <SelectItem value="plasma">Plasma</SelectItem>
              <SelectItem value="inferno">Inferno</SelectItem>
              <SelectItem value="magma">Magma</SelectItem>
              <SelectItem value="cividis">Cividis</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Maximize className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Nav */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="sm" onClick={prevImage} className="flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {currentImage ? (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-medium">{currentImage.date}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              Image {currentImageIndex + 1} of {ndviImages.length}
            </span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No image selected</div>
        )}

        <Button variant="ghost" size="sm" onClick={nextImage} className="flex items-center">
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Image Viewer */}
      <div className="relative border rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
        <div
          className="relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transition: "transform 0.2s ease-in-out",
          }}
        >
          {currentImage ? (
            <img
              src={showOriginal ? currentImage.originalUrl : currentImage.url}
              alt={showOriginal ? "Original TIFF" : "NDVI Visualization"}
              className="max-w-full h-auto"
              style={{
                filter:
                  !showOriginal && colorMap === "inferno"
                    ? "hue-rotate(60deg)"
                    : colorMap === "plasma"
                      ? "hue-rotate(120deg)"
                      : colorMap === "magma"
                        ? "hue-rotate(180deg)"
                        : colorMap === "cividis"
                          ? "hue-rotate(240deg)"
                          : "none",
              }}
            />
          ) : (
            <img
              src="/placeholder.svg"
              alt="No NDVI data"
              className="max-w-full h-auto opacity-50"
            />
          )}

          {/* ✅ MISSING CLOSING TAG FIXED HERE */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50"
            onClick={prevImage}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50"
            onClick={nextImage}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Zoom Control */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Zoom Level</span>
          <span>{zoom}%</span>
        </div>
        <Slider value={[zoom]} min={50} max={200} step={5} onValueChange={(value) => setZoom(value[0])} />
      </div>

      {/* Tabs: Timeline, Stats, Comparison */}
      {/* 🔥 Keep this part as-is, or we can refactor it later if needed */}
    </div>
  )
}
