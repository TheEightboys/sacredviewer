import { useAdminStore } from '../../store/useAdminStore'

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  suffix?: string
}

function SliderInput({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  suffix = '',
}: SliderInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <label className="text-slate-400">{label}</label>
        <span className="font-mono text-white">
          {value.toFixed(2)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  )
}

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
}

function NumberInput({ label, value, onChange, step = 0.1 }: NumberInputProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-6 text-center text-sm text-slate-400">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded bg-slate-700 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}

export function ModelControls() {
  const { config, setScale, setPosition, setRotation, resetToDefault } = useAdminStore()

  const handlePositionChange = (axis: 0 | 1 | 2, value: number) => {
    const newPosition: [number, number, number] = [...config.position]
    newPosition[axis] = value
    setPosition(newPosition)
  }

  const handleRotationChange = (axis: 0 | 1 | 2, value: number) => {
    const newRotation: [number, number, number] = [...config.rotation]
    newRotation[axis] = value
    setRotation(newRotation)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Model Transform
      </h3>

      {/* Scale */}
      <div className="space-y-3">
        <SliderInput
          label="Scale"
          value={config.scale}
          min={0.1}
          max={5}
          step={0.1}
          onChange={setScale}
        />
      </div>

      {/* Position */}
      <div className="space-y-2">
        <p className="text-sm text-slate-400">Position</p>
        <div className="grid grid-cols-3 gap-2">
          <NumberInput
            label="X"
            value={config.position[0]}
            onChange={(v) => handlePositionChange(0, v)}
          />
          <NumberInput
            label="Y"
            value={config.position[1]}
            onChange={(v) => handlePositionChange(1, v)}
          />
          <NumberInput
            label="Z"
            value={config.position[2]}
            onChange={(v) => handlePositionChange(2, v)}
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Rotation</p>
        <SliderInput
          label="X"
          value={config.rotation[0]}
          min={0}
          max={360}
          step={1}
          onChange={(v) => handleRotationChange(0, v)}
          suffix="°"
        />
        <SliderInput
          label="Y"
          value={config.rotation[1]}
          min={0}
          max={360}
          step={1}
          onChange={(v) => handleRotationChange(1, v)}
          suffix="°"
        />
        <SliderInput
          label="Z"
          value={config.rotation[2]}
          min={0}
          max={360}
          step={1}
          onChange={(v) => handleRotationChange(2, v)}
          suffix="°"
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={resetToDefault}
        className="w-full rounded-lg bg-slate-700 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
      >
        Reset to Default
      </button>
    </div>
  )
}
