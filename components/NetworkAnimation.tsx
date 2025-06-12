"use client"

import { useEffect, useRef } from "react"

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface NetworkAnimationProps {
  numPoints?: number
  connectionDistance?: number
  className?: string
}

export function NetworkAnimation({ 
  numPoints = 50, 
  connectionDistance = 180,
  className = ""
}: NetworkAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const pointsRef = useRef<Point[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const initPoints = () => {
      pointsRef.current = []
      for (let i = 0; i < numPoints; i++) {
        pointsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5, // Reduced speed for smoother movement
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
        })
      }
    }

    const updatePoints = () => {
      pointsRef.current.forEach((point) => {
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        // Keep points within bounds
        point.x = Math.max(0, Math.min(canvas.width, point.x))
        point.y = Math.max(0, Math.min(canvas.height, point.y))
      })
    }

    const drawConnections = () => {
      for (let i = 0; i < pointsRef.current.length; i++) {
        for (let j = i + 1; j < pointsRef.current.length; j++) {
          const pointA = pointsRef.current[i]
          const pointB = pointsRef.current[j]
          
          const distance = Math.sqrt(
            Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)
          )

          if (distance < connectionDistance) {
            const opacity = 1 - (distance / connectionDistance)
            ctx.strokeStyle = `rgba(255, 72, 79, ${opacity * 0.25})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pointA.x, pointA.y)
            ctx.lineTo(pointB.x, pointB.y)
            ctx.stroke()
          }
        }
      }
    }

    const drawPoints = () => {
      pointsRef.current.forEach((point) => {
        ctx.fillStyle = "rgba(255, 72, 79, 0.7)"
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
        ctx.fill()

        // Add glow effect
        ctx.shadowColor = "rgba(255, 72, 79, 0.5)"
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.radius * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      updatePoints()
      drawConnections()
      drawPoints()
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Initialize
    resizeCanvas()
    initPoints()
    animate()

    // Handle resize
    const handleResize = () => {
      resizeCanvas()
      initPoints()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [numPoints, connectionDistance])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        background: "transparent",
      }}
    />
  )
} 