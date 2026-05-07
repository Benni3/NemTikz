export type WaveValue = 'low' | 'high' | 'unknown'

export type WaveRegionKind = 'delay' | 'unknown' | 'highlight'

export type WaveRegion = {
  id: string
  signalId: string
  kind: WaveRegionKind
  startTime: number
  endTime: number
  label?: string
  color?: string
  height?: number
}

export type WavePoint = {
  time: number
  value: WaveValue
  hardness?: number
  label?: string
  delay?: string
}

export type WaveSignal = {
  id: string
  name: string
  kind: 'clock' | 'input'
  points: WavePoint[]
  period?: number
  duty?: number
}

export type WaveformFile = {
  title: string
  duration: number
  signals: WaveSignal[]
  regions: WaveRegion[]
}

export function makeDefaultWaveform(): WaveformFile {
  const clkId = crypto.randomUUID()

  return {
    title: 'Timing Diagram',
    duration: 10,
    regions: [],
    signals: [
      {
        id: clkId,
        name: 'Clk',
        kind: 'clock',
        period: 2,
        duty: 0.5,
        points: [],
      },
    ],
  }
}

export function normalizeWaveformFile(raw: Partial<WaveformFile>): WaveformFile {
  return {
    title: raw.title ?? 'Timing Diagram',
    duration: raw.duration ?? 10,
    signals: raw.signals ?? [],
    regions: raw.regions ?? [],
  }
}

export function clampTime(time: number, duration: number) {
  return Math.max(0, Math.min(duration, time))
}

export function sortPoints(points: WavePoint[]) {
  return [...points].sort((a, b) => a.time - b.time)
}

export function generateClockPoints(
  duration: number,
  period = 2,
  duty = 0.5
): WavePoint[] {
  const safePeriod = Math.max(0.1, period)
  const safeDuty = Math.max(0.01, Math.min(0.99, duty))

  const points: WavePoint[] = []
  let t = 0

  points.push({ time: 0, value: 'low', hardness: 10 })

  while (t < duration) {
    const riseTime = clampTime(t + safePeriod * (1 - safeDuty), duration)
    const fallTime = clampTime(t + safePeriod, duration)

    points.push({ time: riseTime, value: 'high', hardness: 10 })
    points.push({ time: fallTime, value: 'low', hardness: 10 })

    t += safePeriod
  }

  return sortPoints(
    points.filter(
      (point, index, arr) =>
        point.time <= duration &&
        (index === 0 || point.time !== arr[index - 1]?.time)
    )
  )
}

function escapeTikzText(value: string) {
  return value
    .replaceAll('\\', '\\textbackslash{}')
    .replaceAll('_', '\\_')
    .replaceAll('&', '\\&')
    .replaceAll('%', '\\%')
    .replaceAll('#', '\\#')
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
}

function yHigh(baseY: number) {
  return baseY + 0.28
}

function yLow(baseY: number) {
  return baseY - 0.28
}

function yFor(value: WaveValue, baseY: number) {
  if (value === 'high') return yHigh(baseY)
  if (value === 'low') return yLow(baseY)
  return baseY
}

function drawUnknownSegment(lines: string[], x1: number, x2: number, baseY: number) {
  const high = yHigh(baseY)
  const low = yLow(baseY)

  lines.push(`\\draw[dashed] (${x1},${high}) -- (${x2},${high});`)
  lines.push(`\\draw[dashed] (${x1},${low}) -- (${x2},${low});`)
  lines.push(`\\draw[dashed] (${x1},${high}) -- (${x1},${low});`)
  lines.push(`\\draw[dashed] (${x2},${high}) -- (${x2},${low});`)
}

export function exportWaveformTikz(file: WaveformFile): string {
  const xScale = 0.8
  const yGap = 1.3

  const lines: string[] = [
    '\\begin{tikzpicture}[x=1cm,y=1cm,line cap=round,line join=round]',
    '\\tikzset{wave delay/.style={fill=yellow!20,draw=none}, wave unknown/.style={fill=gray!20,draw=none}}',
  ]

  file.signals.forEach((signal, signalIndex) => {
    const baseY = -signalIndex * yGap
    const regions = file.regions.filter((region) => region.signalId === signal.id)

    for (const region of regions) {
      const x1 = region.startTime * xScale
      const x2 = region.endTime * xScale

      const regionHeight = (region.height ?? 44) / 40
      const centerY = (yHigh(baseY) + yLow(baseY)) / 2
      const y1 = centerY - regionHeight / 2
      const y2 = centerY + regionHeight / 2

      const style =
        region.kind === 'unknown'
          ? 'wave unknown'
          : region.kind === 'delay'
            ? 'wave delay'
            : 'fill=blue!10,draw=none'

      lines.push(`\\fill[${style}] (${x1},${y1}) rectangle (${x2},${y2});`)

      if (region.label) {
        lines.push(
          `\\node[font=\\scriptsize] at (${(x1 + x2) / 2},${centerY}) {${escapeTikzText(region.label)}};`
        )
      }
    }

    const points =
      signal.kind === 'clock'
        ? generateClockPoints(file.duration, signal.period, signal.duty)
        : sortPoints(signal.points)

    lines.push(`\\node[left] at (-0.25,${baseY}) {${escapeTikzText(signal.name)}};`)

    if (points.length < 2) {
      lines.push(`\\draw (0,${yLow(baseY)}) -- (${file.duration * xScale},${yLow(baseY)});`)
      return
    }

const path: string[] = []

for (let i = 0; i < points.length - 1; i += 1) {
  const a = points[i]
  const b = points[i + 1]

  const x1 = a.time * xScale
  const x2 = b.time * xScale
  const y1 = yFor(a.value, baseY)
  const y2 = yFor(b.value, baseY)

  if (i === 0) {
    path.push(`(${x1},${y1})`)
  }

  if (a.value === 'unknown' || b.value === 'unknown') {
    lines.push(`\\draw[dashed] (${x1},${yHigh(baseY)}) -- (${x2},${yHigh(baseY)});`)
    lines.push(`\\draw[dashed] (${x1},${yLow(baseY)}) -- (${x2},${yLow(baseY)});`)
    continue
  }

  if (a.value === b.value) {
    path.push(`-- (${x2},${y1})`)
  } else {
    const hardness = b.hardness ?? 10

    if (hardness >= 8) {
      path.push(`-- (${x2},${y1})`)
      path.push(`-- (${x2},${y2})`)
    } else {
      const bend = 0.1 * (10 - hardness)

      path.push(`-- (${x2 - bend},${y1})`)
      path.push(
        `.. controls (${x2},${y1}) and (${x2},${y2}) .. (${x2 + bend},${y2})`
      )
    }
  }

  if (b.label) {
    lines.push(`\\node[above,font=\\scriptsize] at (${x2},${y2}) {${escapeTikzText(b.label)}};`)
  }

  if (b.delay) {
    lines.push(`\\node[below,font=\\scriptsize] at (${x2},${y1}) {${escapeTikzText(b.delay)}};`)
  }
}

if (path.length > 1) {
  lines.push(`\\draw ${path.join(' ')};`)
}
  })

  lines.push('\\end{tikzpicture}')
  return lines.join('\n')
}