import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const ffmpeg = new FFmpeg()
let loadPromise = null

async function ensureFfmpegLoaded(onProgress) {
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'

    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100))
      })
    }

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
  })()

  return loadPromise
}

/**
 * Convert a WebM recording into an X-ready MP4 (H.264 / yuv420p).
 */
export async function convertVideoForX(webmBlob, onProgress) {
  await ensureFfmpegLoaded(onProgress)

  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob))
  await ffmpeg.exec([
    '-i',
    'input.webm',
    '-an',
    '-c:v',
    'libx264',
    '-profile:v',
    'high',
    '-level',
    '4.0',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-preset',
    'fast',
    '-crf',
    '23',
    'output.mp4',
  ])

  const data = await ffmpeg.readFile('output.mp4')

  await ffmpeg.deleteFile('input.webm')
  await ffmpeg.deleteFile('output.mp4')

  return new Blob([data.buffer], { type: 'video/mp4' })
}