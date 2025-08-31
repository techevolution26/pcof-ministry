// src/components/CogMaintenance.tsx
'use client'

import React from 'react'

export default function CogMaintenance({ size = 160 }: { size?: number }) {
    const s = size
    const center = s / 2

    // render gear teeth as repeated rects rotated around (0,0)
    function renderTeeth(
        count: number,
        radius: number,
        toothWidth: number,
        toothDepth: number,
        fill: string
    ) {
        return Array.from({ length: count }).map((_, i) => {
            const angle = (360 / count) * i
            // rect is centered horizontally on x, placed above origin by radius+toothDepth
            const x = -toothWidth / 2
            const y = -(radius + toothDepth)
            return (
                <rect
                    key={i}
                    x={x}
                    y={y}
                    width={toothWidth}
                    height={toothDepth}
                    rx={toothWidth * 0.15}
                    fill={fill}
                    transform={`rotate(${angle})`}
                />
            )
        })
    }

    // Gear configs (sizes scale with overall size)
    const large = {
        radius: s * 0.22,
        teeth: 16,
        toothW: s * 0.06,
        toothD: s * 0.04,
        color: '#0ea5e9', // Sky-500
        dur: '3.6s',
    }

    const small = {
        radius: s * 0.12,
        teeth: 12,
        toothW: s * 0.045,
        toothD: s * 0.035,
        color: '#0369a1', // Sky-700
        dur: '2.2s',
    }

    return (
        <div aria-hidden="false" role="img" aria-label="Maintenance animation: rotating wheel cogs" className="flex items-center justify-center">
            <svg
                width={s}
                height={s}
                viewBox={`0 0 ${s} ${s}`}
                xmlns="http://www.w3.org/2000/svg"
                className="block"
            >
                {/* Background circle with subtle green gradient */}
                <circle cx={center} cy={center} r={s * 0.48} fill="url(#greenGradient)" opacity="0.1" />

                {/* Large wheel gear (clockwise) centered */}
                <g transform={`translate(${center}, ${center})`}>
                    <g>
                        {/* teeth */}
                        {renderTeeth(large.teeth, large.radius, large.toothW, large.toothD, large.color)}
                        {/* outer rim */}
                        <circle cx={0} cy={0} r={large.radius} fill={large.color} opacity="0.95" />
                        {/* hub */}
                        <circle cx={0} cy={0} r={large.radius * 0.42} fill="white" opacity="0.92" />
                        {/* rotation animation around center */}
                        <animateTransform
                            attributeName="transform"
                            attributeType="XML"
                            type="rotate"
                            from="0 0 0"
                            to="360 0 0"
                            dur={large.dur}
                            repeatCount="indefinite"
                        />
                    </g>
                </g>

                {/* Small wheel gear (counter-clockwise), positioned bottom-right so teeth mesh visually */}
                <g transform={`translate(${center + s * 0.18}, ${center + s * 0.18})`}>
                    <g>
                        {renderTeeth(small.teeth, small.radius, small.toothW, small.toothD, small.color)}
                        <circle cx={0} cy={0} r={small.radius} fill={small.color} opacity="0.95" />
                        <circle cx={0} cy={0} r={small.radius * 0.45} fill="white" opacity="0.92" />
                        <animateTransform
                            attributeName="transform"
                            attributeType="XML"
                            type="rotate"
                            from="0 0 0"
                            to="-360 0 0"
                            dur={small.dur}
                            repeatCount="indefinite"
                        />
                    </g>
                </g>

                {/* Subtle ring for polish */}
                <circle cx={center} cy={center} r={s * 0.46} fill="none" stroke="#e6f6ff" strokeWidth={s * 0.02} />

                {/* Gradient definition */}
                <defs>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#86efac" /> {/* Green-300 */}
                        <stop offset="100%" stopColor="#4ade80" /> {/* Green-400 */}
                    </linearGradient>
                </defs>
            </svg>
        </div>
    )
}