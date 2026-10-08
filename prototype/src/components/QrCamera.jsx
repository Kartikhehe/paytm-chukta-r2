import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import Icon from './Icon.jsx'

/** Live camera QR reader (getUserMedia + jsQR). Calls onResult(text) once. Torch button where the camera supports it. */
export default function QrCamera({ onResult, hint }) {
  const video = useRef(null)
  const track = useRef(null)
  const [err, setErr] = useState('')
  const [torch, setTorch] = useState(null) // null = unsupported
  const done = useRef(false)
  const cb = useRef(onResult)
  cb.current = onResult

  useEffect(() => {
    let stream, raf, timer
    let alive = true
    done.current = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const tick = () => {
      const v = video.current
      if (!done.current && v && v.readyState >= 2 && v.videoWidth) {
        const k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight))
        canvas.width = Math.round(v.videoWidth * k)
        canvas.height = Math.round(v.videoHeight * k)
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const r = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
        if (r?.data) {
          done.current = true
          navigator.vibrate?.(60)
          cb.current(r.data)
          return
        }
      }
      timer = setTimeout(() => { raf = requestAnimationFrame(tick) }, 120)
    }

    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErr('Is browser mein camera nahi khul sakta (HTTPS chahiye). Photo upload use karein.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return }
        track.current = stream.getVideoTracks()[0]
        if (track.current?.getCapabilities?.().torch) setTorch(false)
        if (video.current) {
          video.current.srcObject = stream
          await video.current.play().catch(() => {})
          tick()
        }
      } catch (e) {
        setErr(e?.name === 'NotAllowedError'
          ? 'Camera permission nahi mili. Browser settings mein allow karein, ya photo upload karein.'
          : 'Camera nahi khula: ' + (e?.message || e))
      }
    })()

    return () => {
      alive = false
      done.current = true
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const flip = async () => {
    try { await track.current.applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(!torch) } catch { setTorch(null) }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0B1424]">
      {err ? (
        <div className="grid aspect-[3/4] place-items-center p-6 text-center text-[14px] text-white/85">
          <div><Icon name="camera" size={36} className="mx-auto mb-3 text-white/50" />{err}</div>
        </div>
      ) : (
        <>
          <video ref={video} playsInline muted className="block aspect-[3/4] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative aspect-square w-[68%] rounded-3xl shadow-[0_0_0_9999px_rgba(11,20,36,.55)]">
              {['left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl',
                'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-3xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-3xl'].map((c) => (
                <span key={c} className={`absolute h-10 w-10 border-cyan ${c}`} />
              ))}
              <span className="absolute inset-x-4 h-0.5 animate-scan rounded-full bg-cyan shadow-[0_0_12px_2px_rgba(0,186,242,.8)]" />
            </div>
          </div>
          <div className="absolute inset-x-0 top-0 p-4 text-center text-[13.5px] font-semibold text-white">{hint || 'QR ko frame ke andar laayein'}</div>
          {torch !== null && (
            <button onClick={flip} aria-label="Torch"
              className={`absolute bottom-4 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full ${torch ? 'bg-white text-navy' : 'bg-white/15 text-white'}`}>
              <Icon name="flash" size={22} />
            </button>
          )}
        </>
      )}
    </div>
  )
}
