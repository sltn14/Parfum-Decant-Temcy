import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.4 + 0.05,
      hue: Math.random() > 0.75 ? 'gold' : Math.random() > 0.5 ? 'red' : 'white',
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseOffset: Math.random() * Math.PI * 2
    }))

    // Geometric shapes
    const shapes = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 120 + 60,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.003,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      type: ['diamond', 'triangle', 'hexagon', 'circle', 'square'][i],
      opacity: Math.random() * 0.06 + 0.02
    }))

    // Blobs (aurora-like)
    const blobs = Array.from({ length: 3 }, (_, i) => ({
      x: [0.2, 0.7, 0.5][i] * window.innerWidth,
      y: [0.3, 0.6, 0.1][i] * window.innerHeight,
      radius: [300, 250, 200][i],
      color: [
        'rgba(200,16,46,',
        'rgba(124,58,237,',
        'rgba(201,168,76,'
      ][i],
      speed: [0.0008, 0.0012, 0.001][i],
      offset: [0, Math.PI / 2, Math.PI][i]
    }))

    const drawShape = (shape) => {
      ctx.save()
      ctx.translate(shape.x, shape.y)
      ctx.rotate(shape.rotation)
      ctx.strokeStyle = `rgba(200,16,46,${shape.opacity})`
      ctx.lineWidth = 0.8
      ctx.beginPath()

      if (shape.type === 'diamond') {
        const s = shape.size / 2
        ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0)
        ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0)
        ctx.closePath()
      } else if (shape.type === 'triangle') {
        const s = shape.size / 2
        ctx.moveTo(0, -s)
        ctx.lineTo(s * 0.866, s * 0.5)
        ctx.lineTo(-s * 0.866, s * 0.5)
        ctx.closePath()
      } else if (shape.type === 'hexagon') {
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const x = shape.size / 2 * Math.cos(angle)
          const y = shape.size / 2 * Math.sin(angle)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.closePath()
      } else if (shape.type === 'circle') {
        ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2)
      } else {
        const s = shape.size / 2
        ctx.rect(-s, -s, shape.size, shape.size)
      }
      ctx.stroke()
      ctx.restore()
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.005

      // Draw aurora blobs
      blobs.forEach(blob => {
        const x = blob.x + Math.sin(time * blob.speed * 1000 + blob.offset) * 80
        const y = blob.y + Math.cos(time * blob.speed * 800 + blob.offset) * 60

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.radius)
        gradient.addColorStop(0, blob.color + '0.12)')
        gradient.addColorStop(0.5, blob.color + '0.05)')
        gradient.addColorStop(1, blob.color + '0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, blob.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw geometric shapes
      shapes.forEach(shape => {
        shape.rotation += shape.rotSpeed
        shape.x += shape.vx
        shape.y += shape.vy
        if (shape.x < -200 || shape.x > canvas.width + 200) shape.vx *= -1
        if (shape.y < -200 || shape.y > canvas.height + 200) shape.vy *= -1
        drawShape(shape)
      })

      // Draw particle connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(200,16,46,${0.06 * (1 - dist / 100)})`
            ctx.lineWidth = 0.4
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })

      // Draw particles
      particles.forEach(p => {
        const pulse = Math.sin(time * 50 * p.pulseSpeed + p.pulseOffset) * 0.3 + 0.7
        const color = p.hue === 'red'
          ? `rgba(200,16,46,${p.opacity * pulse})`
          : p.hue === 'gold'
            ? `rgba(201,168,76,${p.opacity * pulse})`
            : `rgba(240,237,232,${p.opacity * pulse})`

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      // Scanline effect (subtle)
      const scanY = (time * 30) % (canvas.height * 2)
      const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
      scanGrad.addColorStop(0, 'rgba(200,16,46,0)')
      scanGrad.addColorStop(0.5, 'rgba(200,16,46,0.015)')
      scanGrad.addColorStop(1, 'rgba(200,16,46,0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 60, canvas.width, 120)

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
      opacity: 0.8
    }} />
  )
}